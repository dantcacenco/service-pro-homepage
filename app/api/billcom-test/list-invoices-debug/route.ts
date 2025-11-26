// Test Bill.com List Invoices with detailed error logging
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('📋 Testing Bill.com List Invoices with Debug...');

  // First, authenticate to get a session
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

    const authText = await authResponse.text();
    const authData = JSON.parse(authText);

    if (authData.response_status !== 0) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionData = authData.response_data;
    const sessionId = sessionData.sessionId;
    const apiEndpoint = sessionData.apiEndPoint || 'https://api.bill.com/api/v2';

    console.log('Session obtained:', sessionId);
    console.log('API Endpoint:', apiEndpoint);
    console.log('OrgId:', sessionData.orgId);

    // Step 2: Try different List API calls to see what works
    const testCalls = [
      {
        name: 'List Invoices with start',
        endpoint: '/List/Invoice.json',
        params: {
          devKey: config.devKey!,
          sessionId: sessionId,
          start: '0',
          max: '5'
        }
      },
      {
        name: 'List Invoices without start',
        endpoint: '/List/Invoice.json',
        params: {
          devKey: config.devKey!,
          sessionId: sessionId,
          max: '5'
        }
      },
      {
        name: 'Get Session Info',
        endpoint: '/GetSessionInfo.json',
        params: {
          devKey: config.devKey!,
          sessionId: sessionId
        }
      }
    ];

    const results: any[] = [];

    for (const test of testCalls) {
      console.log(`\nTrying: ${test.name}`);
      const testUrl = `${apiEndpoint}${test.endpoint}`;
      console.log('URL:', testUrl);
      console.log('Params:', test.params);

      try {
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams(
            Object.entries(test.params).reduce((acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            }, {} as Record<string, string>)
          ).toString(),
        });

        const responseText = await response.text();
        console.log(`Response status: ${response.status}`);
        console.log(`Response length: ${responseText.length} bytes`);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Response data:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          data = { error: 'Invalid JSON', preview: responseText.substring(0, 200) };
        }

        results.push({
          test: test.name,
          success: data.response_status === 0,
          data: data
        });
      } catch (error: any) {
        console.error(`Error in ${test.name}:`, error);
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
    }

    // Find successful result
    const successfulInvoiceCall = results.find(r => r.test.includes('Invoice') && r.success);
    
    if (successfulInvoiceCall) {
      const invoices = successfulInvoiceCall.data.response_data || [];
      return NextResponse.json({
        success: true,
        invoices: invoices,
        count: invoices.length,
        message: invoices.length > 0 ? 'Invoices retrieved successfully' : 'No invoices found',
        allTestResults: results
      });
    }

    // If no successful invoice call, return the session info if that worked
    const sessionInfo = results.find(r => r.test === 'Get Session Info' && r.success);
    if (sessionInfo) {
      return NextResponse.json({
        success: false,
        error: 'Could not list invoices but session is valid',
        sessionInfo: sessionInfo.data,
        allTestResults: results
      }, { status: 400 });
    }

    // Return all test results for debugging
    return NextResponse.json({
      success: false,
      error: 'All API calls failed',
      testResults: results
    }, { status: 400 });

  } catch (error: any) {
    console.error('List invoices error:', error);
    return NextResponse.json({
      error: 'Failed to list invoices',
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
