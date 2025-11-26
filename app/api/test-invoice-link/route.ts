import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify invoice links and status
export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
    const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
    const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
    const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';
    const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';

    // Login to Bill.com
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
    if (loginData.response_status !== 0) {
      throw new Error(loginData.response_message || 'Bill.com login failed');
    }

    const sessionId = loginData.response_data.sessionId;

    // Read invoice details
    const readResponse = await fetch(`${BILLCOM_API_URL}/Invoice/Read.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId,
        id: invoiceId
      })
    });

    const readData = await readResponse.json();
    
    if (readData.response_status !== 0) {
      throw new Error(readData.response_message || 'Failed to read invoice');
    }

    const invoice = readData.response_data;
    
    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        status: invoice.status,
        paymentStatus: invoice.paymentStatus,
        sentDate: invoice.sentDate,
        amount: invoice.amount,
        amountDue: invoice.amountDue,
        isSent: invoice.isSent,
        sentPay: invoice.sentPay
      },
      links: {
        adminView: `https://app.bill.com/Invoice?id=${invoiceId}`,
        customerPay: `https://app.bill.com/PayInvoice?id=${invoiceId}`,
        recommended: invoice.sentPay ? 
          `https://app.bill.com/PayInvoice?id=${invoiceId}` : 
          'Invoice must be sent first'
      },
      sentStatus: invoice.isSent === '1' || invoice.sentPay ? 'SENT' : 'NOT_SENT',
      message: invoice.isSent === '1' || invoice.sentPay ? 
        'Invoice has been sent - payment link should work' : 
        'Invoice needs to be sent first for payment link to work'
    });

  } catch (error: any) {
    console.error('Error testing invoice:', error);
    return NextResponse.json({
      error: error.message || 'Failed to test invoice'
    }, { status: 500 });
  }
}