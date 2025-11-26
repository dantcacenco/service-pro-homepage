// API endpoint to import all customers from Bill.com
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET;
const SYSTEM_USER_ID = 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'; // Fallback system user for automated imports

export async function POST(request: Request) {
  console.log('🚀 Starting Bill.com customer import...');

  const stats = {
    total_fetched: 0,
    new_imports: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    error_details: [] as any[]
  };

  try {
    // Check for CRON_SECRET authentication (for GitHub Actions)
    const authHeader = request.headers.get('authorization');
    const isCronRequest = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    let supabase;
    let userId: string;

    if (isCronRequest) {
      // Use service role for cron requests
      console.log('🤖 Authenticated via CRON_SECRET (GitHub Actions)');
      supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      userId = SYSTEM_USER_ID;
    } else {
      // Regular user authentication
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
      console.log('👤 Authenticated as user:', user.email);
    }

    // Step 1: Authenticate with Bill.com
    const config = {
      devKey: process.env.BILLCOM_DEV_KEY,
      username: process.env.BILLCOM_USERNAME,
      password: process.env.BILLCOM_PASSWORD,
      orgId: process.env.BILLCOM_ORG_ID,
      apiUrl: 'https://api.bill.com/api/v2',
    };

    console.log('🔐 Authenticating with Bill.com...');
    const loginResponse = await fetch(`${config.apiUrl}/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        userName: config.username!,
        password: config.password!,
        devKey: config.devKey!,
        orgId: config.orgId!,
      }).toString(),
    });

    const loginData = await loginResponse.json();
    if (loginData.response_status !== 0) {
      throw new Error(`Bill.com authentication failed: ${loginData.response_message}`);
    }

    const sessionId = loginData.response_data.sessionId;
    const apiEndpoint = loginData.response_data.apiEndPoint || config.apiUrl;
    console.log('✅ Bill.com authentication successful');

    // Step 2: Fetch ALL customers from Bill.com
    console.log('📥 Fetching all customers from Bill.com...');
    let allBillcomCustomers: any[] = [];
    let start = 0;
    const batchSize = 100;
    let hasMore = true;

    while (hasMore && allBillcomCustomers.length < 999) {
      const listUrl = `${apiEndpoint}/List/Customer.json`;
      const response = await fetch(listUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            start: start,
            max: batchSize
          })
        }).toString(),
      });

      const data = await response.json();
      
      if (data.response_status === 0 && data.response_data) {
        const customers = data.response_data || [];
        
        // Log first customer to see structure
        if (customers.length > 0 && start === 0) {
          console.log('\n🔍 Sample Bill.com customer data structure:');
          console.log(JSON.stringify(customers[0], null, 2));
        }
        
        allBillcomCustomers = [...allBillcomCustomers, ...customers];
        
        console.log(`📦 Fetched batch: ${customers.length} customers (total: ${allBillcomCustomers.length})`);
        
        if (customers.length < batchSize) {
          hasMore = false;
        } else {
          start += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    stats.total_fetched = allBillcomCustomers.length;
    console.log(`✅ Total customers fetched from Bill.com: ${stats.total_fetched}`);

    // Step 3: Get existing customers from local database
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, email, billcom_id');

    const billcomIdMap = new Map(
      (existingCustomers || []).filter(c => c.billcom_id).map(c => [c.billcom_id, c])
    );
    const emailMap = new Map(
      (existingCustomers || []).filter(c => c.email).map(c => [c.email?.toLowerCase(), c])
    );

    console.log(`📊 Found ${existingCustomers?.length || 0} existing customers in local database`);

    // Step 4: Process each Bill.com customer
    for (const billcomCustomer of allBillcomCustomers) {
      // Skip inactive customers
      if (billcomCustomer.isActive !== '1') {
        stats.skipped++;
        continue;
      }

      // Skip customers without email
      if (!billcomCustomer.email) {
        stats.skipped++;
        continue;
      }

      try {
        // Build full address from Bill.com address components
        console.log(`\n📍 Processing customer: ${billcomCustomer.name}`);
        console.log('   Raw Bill.com data:', {
          billAddress1: billcomCustomer.billAddress1,
          billAddress2: billcomCustomer.billAddress2,
          billAddressCity: billcomCustomer.billAddressCity,
          billAddressState: billcomCustomer.billAddressState,
          billAddressZip: billcomCustomer.billAddressZip
        });
        
        const addressParts = [
          billcomCustomer.billAddress1,
          billcomCustomer.billAddress2,
          billcomCustomer.billAddressCity,
          billcomCustomer.billAddressState,
          billcomCustomer.billAddressZip
        ].filter(part => part && part.trim() !== '');
        
        const fullAddress = addressParts.join(', ');
        console.log(`   ✅ Built address: "${fullAddress}"`);
        
        const customerData = {
          name: billcomCustomer.name || 'Unknown',
          email: billcomCustomer.email.toLowerCase(),
          phone: billcomCustomer.phone || '',
          address: fullAddress,
          billcom_id: billcomCustomer.id,
          created_by: userId,
          billcom_sync_at: new Date().toISOString()
        };
        
        console.log('   Customer data to save:', customerData);

        // Check if customer already exists by billcom_id
        const existingByBillcomId = billcomIdMap.get(billcomCustomer.id);
        
        if (existingByBillcomId) {
          // Update existing customer
          console.log(`   🔄 Updating existing customer (by billcom_id)`);
          const { error } = await supabase
            .from('customers')
            .update({
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
              billcom_sync_at: customerData.billcom_sync_at
            })
            .eq('id', existingByBillcomId.id);

          if (error) {
            console.error(`   ❌ Update failed:`, error.message);
            stats.errors++;
            stats.error_details.push({
              customer: customerData.name,
              error: error.message
            });
          } else {
            console.log(`   ✅ Updated successfully`);
            stats.updated++;
          }
        } else {
          // Check if customer exists by email (to link them)
          const existingByEmail = emailMap.get(customerData.email);
          
          if (existingByEmail) {
            // Link existing customer to Bill.com ID
            console.log(`   🔗 Linking existing customer (by email)`);
            const { error } = await supabase
              .from('customers')
              .update({
                billcom_id: customerData.billcom_id,
                billcom_sync_at: customerData.billcom_sync_at,
                // Update other fields too in case they changed
                name: customerData.name,
                phone: customerData.phone,
                address: customerData.address
              })
              .eq('id', existingByEmail.id);

            if (error) {
              console.error(`   ❌ Link failed:`, error.message);
              stats.errors++;
              stats.error_details.push({
                customer: customerData.name,
                error: error.message
              });
            } else {
              console.log(`   ✅ Linked successfully`);
              stats.updated++;
            }
          } else {
            // Create new customer
            console.log(`   ➕ Creating new customer`);
            const { error } = await supabase
              .from('customers')
              .insert(customerData);

            if (error) {
              console.error(`   ❌ Insert failed:`, error.message);
              stats.errors++;
              stats.error_details.push({
                customer: customerData.name,
                error: error.message
              });
            } else {
              console.log(`   ✅ Created successfully`);
              stats.new_imports++;
            }
          }
        }
      } catch (error: any) {
        stats.errors++;
        stats.error_details.push({
          customer: billcomCustomer.name,
          error: error.message
        });
      }
    }

    console.log('✅ Import complete!');
    console.log('📊 Statistics:');
    console.log(`   - Total fetched: ${stats.total_fetched}`);
    console.log(`   - New imports: ${stats.new_imports}`);
    console.log(`   - Updated: ${stats.updated}`);
    console.log(`   - Skipped: ${stats.skipped}`);
    console.log(`   - Errors: ${stats.errors}`);

    return NextResponse.json({
      success: true,
      message: 'Customer import completed',
      stats
    });

  } catch (error: any) {
    console.error('❌ Import failed:', error);
    return NextResponse.json({
      error: 'Import failed',
      message: error.message,
      stats
    }, { status: 500 });
  }
}
