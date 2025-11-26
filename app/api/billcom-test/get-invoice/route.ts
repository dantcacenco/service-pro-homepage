// Test Bill.com Get Invoice - FIXED with correct data parameter format
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🔍 Testing Bill.com Get Invoice...');
  
  const body = await request.json();
  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({
      error: 'Invoice ID is required',
      note: 'Please create an invoice first or use an existing invoice ID',
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

    console.log('Session obtained:', sessionId);

    // Step 2: Get invoice details - FIXED with data wrapper
    const getUrl = `${apiEndpoint}/Crud/Read/Invoice.json`;
    console.log('Getting invoice from:', getUrl);
    console.log('Invoice ID:', invoiceId);

    // FIXED: Use data parameter wrapper
    const formData = new URLSearchParams({
      devKey: config.devKey!,
      sessionId: sessionId,
      data: JSON.stringify({
        id: invoiceId
      })
    });

    const response = await fetch(getUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.response_status !== 0) {
      // If invoice not found, try to get one from the list
      console.log('Invoice not found, trying to get latest invoice...');
      
      const listResponse = await fetch(`${apiEndpoint}/List/Invoice.json`, {
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
            max: 1
          })
        }).toString(),
      });
      
      const listData = await listResponse.json();
      
      if (listData.response_status === 0 && listData.response_data?.length > 0) {
        const latestInvoice = listData.response_data[0];
        return NextResponse.json({
          success: false,
          error: `Invoice ${invoiceId} not found`,
          suggestion: `Try using this invoice ID instead: ${latestInvoice.id}`,
          latestInvoice: {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoiceNumber,
            amount: latestInvoice.amount,
          }
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: data.response_message || 'Failed to get invoice',
        details: data,
        invoiceId: invoiceId,
      }, { status: 400 });
    }

    const invoice = data.response_data;
    
    // Generate payment link for the invoice
    const paymentLink = `https://app02.us.bill.com/CustomerPayment/${invoice.id}`;
    
    return NextResponse.json({
      success: true,
      invoice: invoice,
      summary: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        amount: invoice.amount,
        amountDue: invoice.amountDue,
        paymentStatus: invoice.paymentStatus,
        dueDate: invoice.dueDate,
        invoiceDate: invoice.invoiceDate,
        description: invoice.description,
      },
      paymentLink: paymentLink,
      message: 'Invoice retrieved successfully',
    });

  } catch (error: any) {
    console.error('Get invoice error:', error);
    return NextResponse.json({
      error: 'Failed to get invoice',
      details: error.message,
    }, { status: 500 });
  }
}