import { NextRequest, NextResponse } from 'next/server';

const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';

export async function POST(request: NextRequest) {
  try {
    const { max = 20 } = await request.json();
    
    console.log('[LIST] Starting to list all invoices...');

    // Step 1: Login
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
      throw new Error(`Login failed: ${loginData.response_message}`);
    }

    const sessionId = loginData.response_data.sessionId;
    console.log('[LIST] Logged in successfully');

    // Step 2: List invoices
    const listResponse = await fetch(`${BILLCOM_API_URL}/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId,
        data: JSON.stringify({
          start: 0,
          max: max
        })
      })
    });

    const listData = await listResponse.json();
    console.log('[LIST] List response status:', listData.response_status);

    if (listData.response_status !== 0) {
      throw new Error(`Failed to list invoices: ${listData.response_message}`);
    }

    const invoices = listData.response_data || [];
    
    // Format invoices for display
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      customerName: invoice.customerName || 'Unknown',
      amount: invoice.amount,
      amountDue: invoice.amountDue,
      status: getStatusLabel(invoice.paymentStatus),
      paymentStatus: invoice.paymentStatus,
      isSent: invoice.isSent,
      sentDate: invoice.sentDate,
      dueDate: invoice.dueDate,
      createdDate: invoice.createdDate,
      links: {
        adminView: `https://app.bill.com/Invoice?id=${invoice.id}`,
        guestPayment: `https://app02.us.bill.com/app/arp/guest/session/pay/${invoice.id}?paymentLinkSource=Email`,
        // Legacy URLs for testing (these don't work)
        oldPayInvoice: `https://app.bill.com/PayInvoice?id=${invoice.id}`,
        oldPay: `https://app.bill.com/Pay?id=${invoice.id}`,
        oldPayment: `https://app.bill.com/Payment?id=${invoice.id}`
      }
    }));

    return NextResponse.json({
      success: true,
      message: `Retrieved ${formattedInvoices.length} invoices`,
      invoices: formattedInvoices,
      data: {
        count: formattedInvoices.length,
        invoices: formattedInvoices,
        rawData: invoices // Include raw data for debugging
      }
    });

  } catch (error: any) {
    console.error('[LIST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list invoices',
      message: `Error: ${error.message}`
    }, { status: 500 });
  }
}

function getStatusLabel(status: string | number): string {
  const statusMap: Record<string, string> = {
    '0': 'UNPAID',
    '1': 'SENT',
    '2': 'PARTIALLY_PAID',
    '3': 'PAID',
    '4': 'CLOSED'
  };
  
  return statusMap[status?.toString()] || `STATUS_${status}`;
}
