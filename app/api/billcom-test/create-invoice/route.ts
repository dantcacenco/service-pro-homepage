// Test Bill.com Create Invoice - Simplified for testing
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('📄 Testing Bill.com Create Invoice...');
  
  const body = await request.json();
  const { customerEmail, customerName, amount, description } = body;

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
    let authData;
    
    try {
      authData = JSON.parse(authText);
    } catch (e) {
      console.error('Failed to parse auth response:', authText.substring(0, 200));
      return NextResponse.json({
        error: 'Invalid authentication response',
        details: authText.substring(0, 500),
      }, { status: 500 });
    }

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
    console.log('OrgId:', sessionData.orgId);

    // Step 2: Verify session is valid
    const sessionInfoUrl = `${apiEndpoint}/GetSessionInfo.json`;
    const sessionInfoResponse = await fetch(sessionInfoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
      }).toString(),
    });

    const sessionInfo = await sessionInfoResponse.json();
    
    if (sessionInfo.response_status !== 0) {
      return NextResponse.json({
        error: 'Session validation failed',
        details: sessionInfo,
      }, { status: 400 });
    }

    // For now, return a mock success response
    // The actual invoice creation requires:
    // 1. Creating or finding a customer
    // 2. Creating the invoice with proper line items
    // 3. Bill.com may require additional setup in the account
    
    const mockInvoice = {
      id: 'TEST-' + Date.now(),
      invoiceNumber: 'INV-TEST-001',
      customerEmail: customerEmail,
      customerName: customerName,
      amount: amount,
      description: description,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Bill.com API connection verified - Invoice creation ready for implementation',
      invoice: mockInvoice,
      sessionInfo: {
        userName: sessionInfo.response_data.userName,
        organizationId: sessionInfo.response_data.organizationId,
      },
      note: 'This is a test response. Actual invoice creation will be implemented after confirming Bill.com account setup.',
    });

  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json({
      error: 'Failed to create invoice',
      details: error.message,
    }, { status: 500 });
  }
}
