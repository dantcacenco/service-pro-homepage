// TEST ENDPOINT: See full Bill.com customer data structure
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🔍 Testing Bill.com customer data structure...');

  try {
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

    // Step 2: Fetch first 5 customers
    console.log('📥 Fetching customers from Bill.com...');
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
          start: 0,
          max: 5
        })
      }).toString(),
    });

    const data = await response.json();
    
    if (data.response_status !== 0) {
      throw new Error(`Failed to fetch customers: ${data.response_message}`);
    }

    const customers = data.response_data || [];
    
    console.log('✅ Fetched customers:', customers.length);

    // Return raw data so we can see ALL fields
    return NextResponse.json({
      success: true,
      totalCustomers: customers.length,
      sampleCustomers: customers,
      notes: [
        'Look at the address fields in the response',
        'Check for: address1, address2, addressCity, addressState, addressZip, addressCountry',
        'Or: mailingAddress, shippingAddress, etc.',
        'This will show us the exact field names Bill.com uses'
      ]
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
