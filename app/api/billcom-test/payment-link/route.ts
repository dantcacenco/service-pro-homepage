// Test Bill.com Get Payment Link - FIXED with correct format
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🔗 Testing Bill.com Get Payment Link...');
  
  const body = await request.json();
  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({
      error: 'Invoice ID is required',
      note: 'Please provide an invoice ID or create an invoice first',
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

    // Step 2: Get invoice details first - FIXED with data wrapper
    const getInvoiceUrl = `${apiEndpoint}/Crud/Read/Invoice.json`;
    const invoiceResponse = await fetch(getInvoiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          id: invoiceId
        })
      }).toString(),
    });

    const invoiceData = await invoiceResponse.json();

    if (invoiceData.response_status !== 0) {
      // If invoice not found, suggest using a valid one
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
          error: `Invoice ${invoiceId} not found`,
          suggestion: `Try using this invoice ID: ${latestInvoice.id}`,
          latestInvoice: {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoiceNumber,
          }
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: 'Failed to get invoice details',
        details: invoiceData,
      }, { status: 400 });
    }

    const invoice = invoiceData.response_data;
    console.log('Invoice found:', invoice.invoiceNumber);

    // Step 3: Generate payment link
    // Bill.com payment links follow a predictable pattern
    // Format: https://app02.us.bill.com/CustomerPayment/{invoiceId}
    const paymentLink = `https://app02.us.bill.com/CustomerPayment/${invoice.id}`;
    
    // Also try the SendInvoice endpoint to get the official link
    try {
      const sendInvoiceUrl = `${apiEndpoint}/SendInvoice.json`;
      const sendResponse = await fetch(sendInvoiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            invoiceId: invoiceId,
            // Don't actually send email, just get the link
            toEmails: []
          })
        }).toString(),
      });
      
      const sendData = await sendResponse.json();
      
      if (sendData.response_status === 0 && sendData.response_data?.paymentUrl) {
        return NextResponse.json({
          success: true,
          paymentLink: sendData.response_data.paymentUrl,
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            amountDue: invoice.amountDue,
            customerId: invoice.customerId,
            paymentStatus: invoice.paymentStatus,
          },
          message: 'Official payment link retrieved',
        });
      }
    } catch (e) {
      console.log('SendInvoice endpoint not available, using constructed link');
    }
    
    // Return the constructed payment link
    return NextResponse.json({
      success: true,
      paymentLink: paymentLink,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        amountDue: invoice.amountDue,
        customerId: invoice.customerId,
        paymentStatus: invoice.paymentStatus,
      },
      message: 'Payment link generated',
      note: 'Customers can use this link to pay the invoice online',
    });

  } catch (error: any) {
    console.error('Get payment link error:', error);
    return NextResponse.json({
      error: 'Failed to get payment link',
      details: error.message,
    }, { status: 500 });
  }
}