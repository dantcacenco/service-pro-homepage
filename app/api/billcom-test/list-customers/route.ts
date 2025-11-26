// Enhanced Bill.com List Customers - Fetches ALL customers with pagination
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('👥 Fetching ALL Bill.com Customers...');
  
  const { searchParams } = new URL(request.url);
  const fetchAll = searchParams.get('all') === 'true';
  const maxToFetch = parseInt(searchParams.get('limit') || '1000');

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Authenticate
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

    if (authData.response_status !== 0) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionData = authData.response_data;
    const sessionId = sessionData.sessionId;
    const apiEndpoint = sessionData.apiEndPoint || 'https://api.bill.com/api/v2';

    console.log('Session obtained, fetching customers...');

    // Step 2: Fetch customers with pagination
    let allCustomers: any[] = [];
    let start = 0;
    const batchSize = 100; // Bill.com max per request
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore && (fetchAll || totalFetched < maxToFetch)) {
      const listUrl = `${apiEndpoint}/List/Customer.json`;
      console.log(`Fetching batch: start=${start}, max=${batchSize}`);

      const formData = new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          start: start,
          max: batchSize
        })
      });

      const response = await fetch(listUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (data.response_status !== 0) {
        console.error('Error fetching customers:', data);
        break;
      }

      const customers = data.response_data || [];
      
      if (customers.length === 0) {
        hasMore = false;
      } else {
        allCustomers = [...allCustomers, ...customers];
        totalFetched += customers.length;
        start += batchSize;
        
        // If we got less than batchSize, we're at the end
        if (customers.length < batchSize) {
          hasMore = false;
        }
        
        // Stop if we've reached our limit (unless fetching all)
        if (!fetchAll && totalFetched >= maxToFetch) {
          hasMore = false;
        }
      }
    }

    console.log(`Total customers fetched: ${allCustomers.length}`);
    
    // Process and deduplicate customers
    const customerMap = new Map();
    const duplicates: any[] = [];
    
    allCustomers.forEach(cust => {
      const key = `${cust.email?.toLowerCase()}_${cust.name?.toLowerCase()}`;
      
      if (customerMap.has(key)) {
        duplicates.push({
          original: customerMap.get(key),
          duplicate: cust
        });
      } else {
        customerMap.set(key, cust);
      }
    });

    // Return detailed customer information
    const customerSummary = Array.from(customerMap.values()).map((cust: any) => ({
      id: cust.id,
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      address1: cust.address1,
      isActive: cust.isActive,
      balance: cust.balance,
      createdTime: cust.createdTime,
      lastUpdatedTime: cust.lastUpdatedTime,
    }));

    return NextResponse.json({
      success: true,
      customers: customerSummary,
      count: customerSummary.length,
      totalFetched: allCustomers.length,
      duplicatesFound: duplicates.length,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      message: `Found ${customerSummary.length} unique customers (${allCustomers.length} total, ${duplicates.length} duplicates)`,
      pagination: {
        fetchedAll: !hasMore || fetchAll,
        batchesFetched: Math.ceil(totalFetched / batchSize)
      }
    });

  } catch (error: any) {
    console.error('List customers error:', error);
    return NextResponse.json({
      error: 'Failed to list customers',
      details: error.message,
    }, { status: 500 });
  }
}
