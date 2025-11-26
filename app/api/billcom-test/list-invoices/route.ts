// Test Bill.com List Invoices - FIXED with correct data parameter format
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('📋 Testing Bill.com List Invoices...');

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

    // Step 2: List invoices with CORRECT data parameter format
    const listUrl = `${apiEndpoint}/List/Invoice.json`;
    console.log('Listing invoices from:', listUrl);

    // FIXED: Use data parameter with JSON object containing integers
    const formData = new URLSearchParams({
      devKey: config.devKey!,
      sessionId: sessionId,
      data: JSON.stringify({
        start: 0,    // MUST be integer, not string!
        max: 999     // MUST be integer, not string!
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

    const responseText = await response.text();
    console.log('Response status:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return NextResponse.json({
        error: 'Invalid response from Bill.com',
        responseText: responseText.substring(0, 500),
        status: response.status,
      }, { status: 500 });
    }

    if (data.response_status !== 0) {
      return NextResponse.json({
        error: data.response_message || 'Failed to list invoices',
        details: data,
      }, { status: 400 });
    }

    // Extract invoices from response_data
    const invoices = data.response_data || [];
    
    // Return summary of invoices with key fields
    const invoiceSummary = invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName || 'N/A',
      customerId: inv.customerId,
      amount: inv.amount,
      amountDue: inv.amountDue,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.paymentStatus,
      description: inv.description,
    }));

    return NextResponse.json({
      success: true,
      invoices: invoiceSummary,
      fullInvoices: invoices, // Include full data for debugging
      count: invoices.length,
      message: `Found ${invoices.length} invoices (expecting 868)`,
    });

  } catch (error: any) {
    console.error('List invoices error:', error);
    return NextResponse.json({
      error: 'Failed to list invoices',
      details: error.message,
    }, { status: 500 });
  }
}