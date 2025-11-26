// /app/api/test-billcom/connection/route.ts
// Test Bill.com API connection and credentials

import { NextRequest, NextResponse } from 'next/server';

const BILLCOM_API_URL = 'https://api.bill.com/api/v2';

export async function POST(request: NextRequest) {
  try {
    const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
    const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
    const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';
    const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';

    // Check environment variables
    const envStatus = {
      BILLCOM_DEV_KEY: !!BILLCOM_DEV_KEY,
      BILLCOM_USERNAME: !!BILLCOM_USERNAME,
      BILLCOM_PASSWORD: !!BILLCOM_PASSWORD,
      BILLCOM_ORG_ID: BILLCOM_ORG_ID || 'Not Set',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Not Set'
    };

    // Try to login to Bill.com
    console.log('[CONNECTION TEST] Attempting login...');
    
    const loginResponse = await fetch(`${BILLCOM_API_URL}/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        userName: BILLCOM_USERNAME,
        password: BILLCOM_PASSWORD,
        orgId: BILLCOM_ORG_ID
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.response_status === 0) {
      const sessionId = loginData.response_data.sessionId;
      const orgId = loginData.response_data.orgId;
      
      // Test a simple API call to verify the session works
      const testResponse = await fetch(`${BILLCOM_API_URL}/List/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          devKey: BILLCOM_DEV_KEY,
          sessionId: sessionId,
          data: JSON.stringify({
            start: 0,
            max: 1
          })
        })
      });

      const testData = await testResponse.json();
      const canListCustomers = testData.response_status === 0;

      return NextResponse.json({
        success: true,
        message: 'Connection successful! API credentials are valid.',
        environment: envStatus,
        data: {
          sessionId: sessionId.substring(0, 10) + '...',  // Partial for security
          orgId: orgId,
          apiUrl: BILLCOM_API_URL,
          canListCustomers: canListCustomers,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      throw new Error(loginData.response_message || 'Login failed');
    }

  } catch (error: any) {
    console.error('[CONNECTION TEST] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
      environment: {
        BILLCOM_DEV_KEY: !!process.env.BILLCOM_DEV_KEY,
        BILLCOM_USERNAME: !!process.env.BILLCOM_USERNAME,
        BILLCOM_PASSWORD: !!process.env.BILLCOM_PASSWORD,
        BILLCOM_ORG_ID: process.env.BILLCOM_ORG_ID || 'Not Set'
      }
    }, { status: 500 });
  }
}
