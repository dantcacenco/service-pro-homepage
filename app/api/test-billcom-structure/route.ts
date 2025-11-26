import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing Bill.com API to see customer structure...');
    
    const config = {
      devKey: process.env.BILLCOM_DEV_KEY,
      username: process.env.BILLCOM_USERNAME,
      password: process.env.BILLCOM_PASSWORD,
      orgId: process.env.BILLCOM_ORG_ID,
      apiUrl: 'https://api.bill.com/api/v2',
    };

    // Authenticate
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
      throw new Error(`Authentication failed: ${loginData.response_message}`);
    }

    const sessionId = loginData.response_data.sessionId;
    const apiEndpoint = loginData.response_data.apiEndPoint || config.apiUrl;

    // Fetch just first 5 customers to inspect
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
      throw new Error('Failed to fetch customers');
    }

    const customers = data.response_data || [];
    
    // Return customer structure for inspection
    return NextResponse.json({
      success: true,
      message: 'Here are the first 5 Bill.com customers with their full data structure',
      totalCustomers: customers.length,
      customers: customers.map((c: any) => ({
        name: c.name,
        email: c.email,
        allFields: Object.keys(c), // List all available fields
        addressFields: {
          address1: c.address1,
          address2: c.address2,
          address3: c.address3,
          address4: c.address4,
          addressCity: c.addressCity,
          addressState: c.addressState,
          addressStateAbbr: c.addressStateAbbr,
          addressZip: c.addressZip,
          addressCountry: c.addressCountry,
        },
        fullRawData: c // Complete object
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 });
  }
}
