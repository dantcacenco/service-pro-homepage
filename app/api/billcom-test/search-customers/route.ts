// Unified customer search - searches both Supabase and Bill.com
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Shared search logic
async function performSearch(query: string, source: string = 'both') {
  console.log(`🔍 Searching for customers: "${query}" in ${source}`);

  const results: any = {
    local: [],
    billcom: [],
    merged: []
  };

  try {
    // Search local database if requested
    if (source === 'local' || source === 'both') {
      const supabase = await createClient();
      const { data: localCustomers } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(20);
      
      results.local = (localCustomers || []).map(c => ({
        ...c,
        source: 'local',
        synced: !!c.billcom_id
      }));
    }

    // Search Bill.com if requested
    if (source === 'billcom' || source === 'both') {
      const config = {
        devKey: process.env.BILLCOM_DEV_KEY,
        username: process.env.BILLCOM_USERNAME,
        password: process.env.BILLCOM_PASSWORD,
        orgId: process.env.BILLCOM_ORG_ID,
        apiUrl: 'https://api.bill.com/api/v2',
      };

      // Authenticate with Bill.com
      const loginUrl = `${config.apiUrl}/Login.json`;
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
      
      if (authData.response_status === 0) {
        const sessionId = authData.response_data.sessionId;
        const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';
        
        // Fetch ALL Bill.com customers for searching
        let allBillcomCustomers: any[] = [];
        let start = 0;
        const batchSize = 100;
        let hasMore = true;
        
        while (hasMore && allBillcomCustomers.length < 500) { // Limit to 500 for performance
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
            allBillcomCustomers = [...allBillcomCustomers, ...customers];
            
            if (customers.length < batchSize) {
              hasMore = false;
            } else {
              start += batchSize;
            }
          } else {
            hasMore = false;
          }
        }

        // Filter Bill.com customers based on search query
        const queryLower = query.toLowerCase();
        const filteredBillcom = allBillcomCustomers.filter(c => 
          c.isActive === '1' && (
            c.name?.toLowerCase().includes(queryLower) ||
            c.email?.toLowerCase().includes(queryLower) ||
            c.phone?.includes(query)
          )
        ).slice(0, 20); // Limit results

        results.billcom = filteredBillcom.map(c => {
          // Build full address from Bill.com address components
          const addressParts = [
            c.billAddress1,
            c.billAddress2,
            c.billAddressCity,
            c.billAddressState,
            c.billAddressZip
          ].filter(part => part && part.trim() !== '');
          
          const fullAddress = addressParts.join(', ');
          
          return {
            id: c.id,
            billcom_id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: fullAddress, // Use full formatted address
            source: 'billcom',
            synced: false // We'll check this below
          };
        });
      }
    }

    // Merge and deduplicate results
    if (source === 'both') {
      const supabase = await createClient();
      
      // Create a map of Bill.com IDs to local customers
      const { data: syncedCustomers } = await supabase
        .from('customers')
        .select('id, billcom_id, name, email')
        .not('billcom_id', 'is', null);
      
      const billcomIdMap = new Map(
        (syncedCustomers || []).map(c => [c.billcom_id, c])
      );

      // Mark Bill.com customers as synced if they have local records
      results.billcom = results.billcom.map((bc: any) => {
        const localRecord = billcomIdMap.get(bc.billcom_id);
        return {
          ...bc,
          synced: !!localRecord,
          local_id: localRecord?.id
        };
      });

      // Merge results, avoiding duplicates
      const emailMap = new Map();
      
      // Add local customers first
      results.local.forEach((c: any) => {
        emailMap.set(c.email?.toLowerCase() || '', {
          ...c,
          sources: ['local']
        });
      });

      // Add or merge Bill.com customers
      results.billcom.forEach((c: any) => {
        const key = c.email?.toLowerCase() || '';
        if (key && emailMap.has(key)) {
          const existing = emailMap.get(key);
          existing.sources.push('billcom');
          existing.billcom_id = c.billcom_id;
          existing.synced = true;
        } else if (key) {
          emailMap.set(key, {
            ...c,
            sources: ['billcom']
          });
        }
      });

      results.merged = Array.from(emailMap.values());
    }

    return {
      success: true,
      query,
      source,
      local: results.local,
      billcom: results.billcom,
      results: source === 'both' ? results.merged : 
               source === 'local' ? results.local : 
               results.billcom,
      counts: {
        local: results.local.length,
        billcom: results.billcom.length,
        merged: results.merged.length
      }
    };

  } catch (error: any) {
    console.error('Search error:', error);
    throw error;
  }
}

// GET handler (for URL params)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const source = searchParams.get('source') || 'both';
    
    const result = await performSearch(query, source);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET search error:', error);
    return NextResponse.json({
      error: 'Search failed',
      message: error.message
    }, { status: 500 });
  }
}

// POST handler (for request body)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || '';
    const source = body.source || 'both';
    
    const result = await performSearch(query, source);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST search error:', error);
    return NextResponse.json({
      error: 'Search failed',
      message: error.message
    }, { status: 500 });
  }
}
