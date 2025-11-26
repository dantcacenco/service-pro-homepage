// Enhanced sync customer with better error handling and logging
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { customerId } = body;

  console.log(`\n=== Starting customer sync for ID: ${customerId} ===`);

  if (!customerId) {
    return NextResponse.json({
      error: 'Customer ID is required'
    }, { status: 400 });
  }

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Get customer from Supabase
    const { data: customer, error: dbError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    if (dbError || !customer) {
      console.error('Customer not found in database:', dbError);
      return NextResponse.json({
        error: 'Customer not found in database'
      }, { status: 404 });
    }

    console.log(`Found customer: ${customer.name} (${customer.email})`);

    // Step 2: Check if already synced
    if (customer.billcom_id) {
      console.log(`Customer already synced with Bill.com ID: ${customer.billcom_id}`);
      return NextResponse.json({
        success: true,
        message: 'Customer already synced',
        billcomId: customer.billcom_id,
        action: 'existing',
        customer: customer
      });
    }

    // Step 3: Authenticate with Bill.com
    console.log('Authenticating with Bill.com...');
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    
    const authResponse = await fetch(loginUrl, {
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

    const authData = await authResponse.json();
    console.log('Auth response status:', authData.response_status);

    if (authData.response_status !== 0) {
      console.error('Authentication failed:', authData);
      return NextResponse.json({
        error: 'Bill.com authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionId = authData.response_data.sessionId;
    const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';
    console.log(`Session obtained. API endpoint: ${apiEndpoint}`);
    // Step 4: Check if customer exists in Bill.com by email
    console.log(`Checking if customer exists in Bill.com: ${customer.email}`);
    
    // Fetch ALL customers to ensure we don't miss any
    let allBillcomCustomers: any[] = [];
    let start = 0;
    const batchSize = 100;
    let hasMore = true;
    
    while (hasMore) {
      const listCustomersResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
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
      
      const listData = await listCustomersResponse.json();
      
      if (listData.response_status === 0 && listData.response_data) {
        const customers = listData.response_data || [];
        allBillcomCustomers = [...allBillcomCustomers, ...customers];
        console.log(`Fetched batch ${Math.floor(start/batchSize) + 1}: ${customers.length} customers`);
        
        if (customers.length < batchSize) {
          hasMore = false;
        } else {
          start += batchSize;
        }
      } else {
        console.error('Error fetching customers:', listData);
        hasMore = false;
      }
    }
    
    console.log(`Total Bill.com customers fetched: ${allBillcomCustomers.length}`);
    
    let billcomId = null;
    let action = '';
    
    // Look for exact match by email
    const existingCustomer = allBillcomCustomers.find((c: any) => 
      c.email?.toLowerCase() === customer.email.toLowerCase() && 
      c.isActive === '1'
    );
    
    if (existingCustomer) {
      billcomId = existingCustomer.id;
      action = 'found_existing';
      console.log(`Found existing Bill.com customer: ${existingCustomer.name} (${billcomId})`);
      console.log('Existing customer details:', JSON.stringify(existingCustomer, null, 2));
    }
    // Step 5: If not found, create in Bill.com
    if (!billcomId) {
      console.log(`Customer not found in Bill.com. Creating new customer: ${customer.name}`);
      
      const customerObj = {
        entity: 'Customer',
        isActive: '1',
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address1: customer.address || '',
      };

      console.log('Creating customer with data:', JSON.stringify(customerObj, null, 2));

      const createCustomerResponse = await fetch(`${apiEndpoint}/Crud/Create/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            obj: customerObj
          })
        }).toString(),
      });

      const customerData = await createCustomerResponse.json();
      console.log('Create customer response:', JSON.stringify(customerData, null, 2));
      
      if (customerData.response_status === 0 && customerData.response_data?.id) {
        billcomId = customerData.response_data.id;
        action = 'created_new';
        console.log(`✅ Successfully created Bill.com customer: ${customerData.response_data.name}`);
        console.log(`✅ New Bill.com ID: ${billcomId}`);
      } else {
        console.error('Failed to create customer:', customerData);
        
        // Check for specific error messages
        if (customerData.response_data?.error_message?.includes('already exists')) {
          // Try to find by name if email match failed
          const nameMatch = allBillcomCustomers.find((c: any) => 
            c.name?.toLowerCase() === customer.name.toLowerCase()
          );
          
          if (nameMatch) {
            console.log('Found customer by name match:', nameMatch);
            billcomId = nameMatch.id;
            action = 'found_by_name';
          } else {
            return NextResponse.json({
              error: 'Customer exists but could not be found',
              details: customerData,
            }, { status: 400 });
          }
        } else {
          return NextResponse.json({
            error: 'Failed to create customer in Bill.com',
            details: customerData,
            requestData: customerObj
          }, { status: 400 });
        }
      }
    }
    // Step 6: Update Supabase with Bill.com ID
    console.log(`Updating database with Bill.com ID: ${billcomId}`);
    
    if (!billcomId) {
      console.error('ERROR: No Bill.com ID to save!');
      return NextResponse.json({
        error: 'No Bill.com ID obtained',
        details: { customer, action }
      }, { status: 500 });
    }
    
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        billcom_id: billcomId,
        billcom_sync_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Failed to update customer with Bill.com ID:', updateError);
      return NextResponse.json({
        error: 'Failed to save Bill.com ID to database',
        details: updateError,
        billcomId: billcomId
      }, { status: 500 });
    }

    console.log(`✅ Database updated successfully`);
    console.log(`✅ Customer ${customer.name} is now synced with Bill.com ID: ${billcomId}`);

    // Step 7: Verify the customer exists in Bill.com (optional verification)
    if (action === 'created_new') {
      console.log('Verifying new customer in Bill.com...');
      
      const verifyResponse = await fetch(`${apiEndpoint}/Crud/Read/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            id: billcomId
          })
        }).toString(),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.response_status === 0) {
        console.log('✅ Verification successful - customer exists in Bill.com');
      } else {
        console.warn('⚠️ Could not verify customer in Bill.com:', verifyData);
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'found_existing' 
        ? 'Customer found in Bill.com and synced' 
        : action === 'created_new'
        ? 'Customer created in Bill.com and synced'
        : `Customer synced (${action})`,
      billcomId: billcomId,
      action: action,
      customer: {
        ...customer,
        billcom_id: billcomId
      },
      debug: {
        originalCustomerId: customerId,
        billcomId: billcomId,
        action: action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('=== Sync customer error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to sync customer',
      message: error.message,
      stack: error.stack,
      customerId: customerId
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  
  if (!customerId) {
    return NextResponse.json({
      error: 'Customer ID is required'
    }, { status: 400 });
  }

  const supabase = await createClient();
  
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name, email, billcom_id, billcom_sync_at')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    return NextResponse.json({
      error: 'Customer not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    synced: !!customer.billcom_id,
    billcomId: customer.billcom_id,
    syncedAt: customer.billcom_sync_at,
    customer: customer
  });
}