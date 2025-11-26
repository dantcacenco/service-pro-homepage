// /app/api/test-billcom/create-invoice/route.ts
// Bill.com invoice creation with REAL synchronization

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';

async function getNextInvoiceNumber(sessionId: string) {
  console.log('[SYNC] Fetching all invoices from Bill.com to find highest number...');
  
  // ALWAYS check Bill.com for the actual highest invoice number
  const listResponse = await fetch(`${BILLCOM_API_URL}/List/Invoice.json`, {
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
        max: 999  // Get up to 999 invoices
      })
    })
  });

  const listData = await listResponse.json();
  console.log('[SYNC] List response status:', listData.response_status);
  
  if (listData.response_status !== 0) {
    console.error('[SYNC] Failed to get invoices from Bill.com');
    throw new Error('Could not sync with Bill.com invoice numbers');
  }
  // Parse all invoices and find the highest 4-digit number
  const invoices = listData.response_data || [];
  console.log(`[SYNC] Found ${invoices.length} invoices in Bill.com`);
  
  let highestNumber = 0;
  let found4Digit = false;
  
  for (const invoice of invoices) {
    const invoiceNum = invoice.invoiceNumber;
    // Only look at pure numeric invoice numbers (no prefixes)
    if (/^\d+$/.test(invoiceNum)) {
      const num = parseInt(invoiceNum, 10);
      if (num > highestNumber && num < 100000) { // Keep to reasonable range
        highestNumber = num;
        found4Digit = true;
      }
    }
  }
  
  if (!found4Digit) {
    console.log('[SYNC] No numeric invoices found, starting at 2041');
    highestNumber = 2040; // Default starting point
  }
  
  console.log(`[SYNC] Highest invoice number in Bill.com: ${highestNumber}`);
  const nextNumber = (highestNumber + 1).toString();
  console.log(`[SYNC] Next invoice will be: ${nextNumber}`);
  
  // Update our database to keep it in sync (for reference only)
  const supabase = await createClient();
  await supabase
    .from('app_settings')
    .upsert({
      key: 'last_billcom_invoice_number',
      value: nextNumber,
      updated_at: new Date().toISOString()
    });
  
  return nextNumber;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, customerEmail, amount, description, customerId } = body;

    console.log('[INVOICE] Starting synchronized invoice creation...');

    // Step 1: Login to Bill.com
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
    console.log('[INVOICE] Logged in to Bill.com');

    // Step 2: Get the next available number by checking Bill.com FIRST
    const invoiceNumber = await getNextInvoiceNumber(sessionId);
    console.log('[INVOICE] Will create invoice number:', invoiceNumber);

    // Step 3: Create Invoice with the synchronized number
    const invoiceData = {
      entity: 'Invoice',
      isActive: '1',
      customerId: customerId || '0cu02HZDIBGPKZ291gpb',
      invoiceNumber: invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Number(amount) || 150.00,
      description: description || `Invoice ${invoiceNumber}`,
      terms: 'Due upon receipt',
      invoiceLineItems: [
        {
          entity: 'InvoiceLineItem',
          amount: Number(amount) || 150.00,
          price: Number(amount) || 150.00,
          quantity: 1,
          description: description || 'Service',
          taxable: false
        }
      ]
    };

    console.log('[INVOICE] Sending invoice to Bill.com...');

    const invoiceResponse = await fetch(`${BILLCOM_API_URL}/Crud/Create/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId,
        data: JSON.stringify({ obj: invoiceData })
      })
    });

    const invoiceResult = await invoiceResponse.json();
    console.log('[INVOICE] Bill.com response status:', invoiceResult.response_status);

    if (invoiceResult.response_status === 0) {
      console.log('[INVOICE] Success! Created invoice:', invoiceResult.response_data.invoiceNumber);
      const createdInvoiceId = invoiceResult.response_data.id;
      
      // Step 4: Send the invoice to make payment link functional
      console.log('[INVOICE] Sending invoice to customer...');
      
      const sendInvoiceResponse = await fetch(`${BILLCOM_API_URL}/SendInvoice.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          devKey: BILLCOM_DEV_KEY,
          sessionId: sessionId,
          invoiceId: createdInvoiceId
        })
      });
      
      const sendResult = await sendInvoiceResponse.json();
      console.log('[INVOICE] Send response status:', sendResult.response_status);
      
      const wasSent = sendResult.response_status === 0;
      if (wasSent) {
        console.log('[INVOICE] Invoice sent successfully! Payment link is now active.');
      } else {
        console.warn('[INVOICE] Could not send invoice:', sendResult.response_message);
      }
      
      // Store invoice details if proposalId provided
      if (proposalId) {
        const supabase = await createClient();
        await supabase
          .from('proposals')
          .update({
            billcom_invoice_id: invoiceResult.response_data.id,
            billcom_invoice_status: invoiceResult.response_data.paymentStatus || 'Open',
            updated_at: new Date().toISOString()
          })
          .eq('id', proposalId);
      }

      return NextResponse.json({
        success: true,
        message: `Invoice ${invoiceNumber} created ${wasSent ? 'and sent' : ''} successfully`,
        data: {
          invoiceId: invoiceResult.response_data.id,
          invoiceNumber: invoiceResult.response_data.invoiceNumber,
          // Internal link for viewing in Bill.com (requires login)
          invoiceLink: `https://app.bill.com/Invoice?id=${invoiceResult.response_data.id}`,
          // Payment link - now functional if invoice was sent
          paymentLink: `https://app.bill.com/PayInvoice?id=${invoiceResult.response_data.id}`,
          amount: invoiceResult.response_data.amount,
          sent: wasSent,
          status: wasSent ? 'Sent - Payment link active' : 'Created - Not sent',
          note: wasSent 
            ? 'Invoice sent to customer. Payment link is active.' 
            : 'Invoice created but not sent. Payment link may not work.'
        }
      });
    } else {
      console.error('[INVOICE] Bill.com error:', JSON.stringify(invoiceResult, null, 2));
      throw new Error(invoiceResult.response_message || 'Invoice creation failed');
    }

  } catch (error: any) {
    console.error('[INVOICE] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Invoice creation failed',
      error: error.message
    }, { status: 500 });
  }
}