// Diagnostic endpoint to see Bill.com customer data structure
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    // Fetch first 5 customers
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
    
    if (data.response_status === 0 && data.response_data) {
      const customers = data.response_data || [];
      
      return NextResponse.json({
        success: true,
        count: customers.length,
        sampleCustomer: customers[0] || null,
        allFieldNames: customers[0] ? Object.keys(customers[0]) : [],
        addressFields: customers[0] ? {
          address1: customers[0].address1,
          address2: customers[0].address2,
          addressCity: customers[0].addressCity,
          addressState: customers[0].addressState,
          addressZip: customers[0].addressZip,
          addressCountry: customers[0].addressCountry,
        } : null
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No customers returned from Bill.com'
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
