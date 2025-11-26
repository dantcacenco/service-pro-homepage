import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Bill.com configuration
const BILLCOM_API_URL = 'https://api.bill.com/api/v2';

async function getBillcomSession() {
  const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY;
  const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME;
  const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
  const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;
  
  if (!BILLCOM_DEV_KEY || !BILLCOM_USERNAME || !BILLCOM_PASSWORD || !BILLCOM_ORG_ID) {
    throw new Error('Missing Bill.com configuration');
  }
  
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
    throw new Error(loginData.response_message || 'Login failed');
  }
  
  return loginData.response_data.sessionId;
}
async function getInvoiceFromBillcom(sessionId: string, invoiceId: string) {
  const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY!;
  
  const response = await fetch(`${BILLCOM_API_URL}/Crud/Read/Invoice.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      devKey: BILLCOM_DEV_KEY,
      sessionId: sessionId,
      id: invoiceId
    })
  });

  const data = await response.json();
  if (data.response_status !== 0) {
    throw new Error(data.response_message || 'Failed to read invoice');
  }
  
  return data.response_data;
}

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Configuration error: Missing Supabase environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Get all invoices from our database that have Bill.com IDs
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, billcom_invoice_id, amount, amount_paid, amount_due, payment_status')
      .not('billcom_invoice_id', 'is', null);

    if (error) throw error;

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invoices to sync',
        totalInvoices: 0,
        updated: 0
      });
    }
    // Get Bill.com session
    const sessionId = await getBillcomSession();
    
    let updated = 0;
    const updates = [];
    
    // Sync each invoice
    for (const invoice of invoices) {
      try {
        const billcomInvoice = await getInvoiceFromBillcom(sessionId, invoice.billcom_invoice_id);
        
        // Parse amounts
        const totalAmount = parseFloat(billcomInvoice.amount || '0');
        const amountDue = parseFloat(billcomInvoice.amountDue || totalAmount.toString());
        const amountPaid = totalAmount - amountDue;
        
        // Map payment status
        const statusMap: Record<string, string> = {
          '0': 'UNPAID',
          '1': 'SENT',
          '2': 'PARTIALLY_PAID',
          '3': 'PAID',
          '4': 'CLOSED'
        };
        const paymentStatus = statusMap[billcomInvoice.paymentStatus] || 'UNPAID';
        
        // Check if update is needed
        const needsUpdate = 
          invoice.amount_paid !== amountPaid ||
          invoice.amount_due !== amountDue ||
          invoice.payment_status !== paymentStatus;
        
        if (needsUpdate) {
          // Update in database
          const { error: updateError } = await supabase
            .from('invoices')
            .update({
              amount_paid: amountPaid,
              amount_due: amountDue,
              payment_status: paymentStatus,
              billcom_last_sync: new Date().toISOString()
            })
            .eq('id', invoice.id);
          
          if (!updateError) {
            updated++;
            updates.push({
              invoiceId: invoice.id,
              billcomId: invoice.billcom_invoice_id,
              paymentStatus,
              amountPaid,
              amountDue
            });
          }
        }
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.billcom_invoice_id}:`, error);
      }
    }
    // Log out from Bill.com
    const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY!;
    await fetch(`${BILLCOM_API_URL}/Logout.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId
      })
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updated} of ${invoices.length} invoices`,
      totalInvoices: invoices.length,
      updated,
      synced: updated,
      updates
    });
    
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to sync invoices'
    }, { status: 500 });
  }
}