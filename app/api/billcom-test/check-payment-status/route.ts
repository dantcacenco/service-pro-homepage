import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Helper to authenticate with Bill.com
async function authenticateBillcom() {
  const authUrl = `${process.env.BILLCOM_API_URL}/v3/Login.json`;
  
  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      data: {
        devKey: process.env.BILLCOM_DEV_KEY,
        userName: process.env.BILLCOM_USERNAME,
        password: process.env.BILLCOM_PASSWORD,
        orgId: process.env.BILLCOM_ORG_ID
      }
    })
  });
  
  const authData = await authResponse.json();
  
  if (!authData.response_data?.sessionId) {
    throw new Error('Failed to authenticate with Bill.com');
  }
  
  return authData.response_data.sessionId;
}

// Helper to get invoice details from Bill.com
async function getInvoiceFromBillcom(sessionId: string, billcomInvoiceId: string) {
  const url = `${process.env.BILLCOM_API_URL}/v3/GetInvoice.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      data: {
        sessionId: sessionId,
        id: billcomInvoiceId
      }
    })
  });
  
  const data = await response.json();
  return data.response_data;
}
// Helper to identify payment stage from amount
function identifyPaymentStage(proposal: any, paidAmount: number) {
  const tolerance = 5; // $5 tolerance for rounding
  
  if (Math.abs(paidAmount - proposal.deposit_amount) < tolerance) {
    return 'deposit';
  } else if (Math.abs(paidAmount - proposal.progress_payment_amount) < tolerance) {
    return 'rough_in';
  } else if (Math.abs(paidAmount - proposal.final_payment_amount) < tolerance) {
    return 'final';
  }
  
  // Handle partial or overpayments
  return 'partial';
}

export async function POST(request: NextRequest) {
  console.log('=== Checking Payment Status ===');
  
  try {
    const { billcomInvoiceId, proposalId } = await request.json();
    
    if (!billcomInvoiceId && !proposalId) {
      return NextResponse.json(
        { error: 'Either billcomInvoiceId or proposalId is required' },
        { status: 400 }
      );
    }
    
    const supabase = createAdminClient();
    // If we have proposalId, get all Bill.com invoice IDs
    let invoiceIdsToCheck: string[] = [];
    let proposal: any = null;
    
    if (proposalId) {
      const { data: prop, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();
      
      if (error || !prop) {
        return NextResponse.json(
          { error: 'Proposal not found' },
          { status: 404 }
        );
      }
      
      proposal = prop;
      
      // Collect all Bill.com invoice IDs
      if (prop.billcom_deposit_invoice_id) {
        invoiceIdsToCheck.push(prop.billcom_deposit_invoice_id);
      }
      if (prop.billcom_roughin_invoice_id) {
        invoiceIdsToCheck.push(prop.billcom_roughin_invoice_id);
      }
      if (prop.billcom_final_invoice_id) {
        invoiceIdsToCheck.push(prop.billcom_final_invoice_id);
      }
    } else {
      invoiceIdsToCheck = [billcomInvoiceId];
    }
    if (invoiceIdsToCheck.length === 0) {
      return NextResponse.json(
        { error: 'No Bill.com invoice IDs found' },
        { status: 404 }
      );
    }
    
    console.log('Checking invoice IDs:', invoiceIdsToCheck);
    
    // Authenticate with Bill.com
    let sessionId: string;
    try {
      sessionId = await authenticateBillcom();
      console.log('Authenticated with Bill.com');
    } catch (error) {
      console.error('Authentication failed:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Bill.com' },
        { status: 500 }
      );
    }
    
    // Check each invoice
    const results: any[] = [];
    const updates: any = {};
    
    for (const invoiceId of invoiceIdsToCheck) {
      try {
        console.log(`Checking invoice: ${invoiceId}`);
        const invoice = await getInvoiceFromBillcom(sessionId, invoiceId);
        
        const isPaid = invoice?.status === 'PAID' || 
                      invoice?.amountDue === 0 || 
                      invoice?.amountPaid >= invoice?.amount;
        const result = {
          invoiceId: invoiceId,
          status: invoice?.status || 'UNKNOWN',
          isPaid: isPaid,
          amount: invoice?.amount || 0,
          amountPaid: invoice?.amountPaid || 0,
          amountDue: invoice?.amountDue || 0,
          dueDate: invoice?.dueDate,
          paidDate: invoice?.paidDate || (isPaid ? new Date().toISOString() : null)
        };
        
        results.push(result);
        
        // If we have a proposal, update it based on payment status
        if (proposal && isPaid) {
          // Determine which payment stage this invoice represents
          if (proposal.billcom_deposit_invoice_id === invoiceId) {
            updates.billcom_deposit_status = 'PAID';
            updates.deposit_paid_at = result.paidDate;
            updates.payment_stage = 'deposit_paid';
            updates.current_payment_stage = 'rough_in';
          } else if (proposal.billcom_roughin_invoice_id === invoiceId) {
            updates.billcom_roughin_status = 'PAID';
            updates.progress_paid_at = result.paidDate;
            updates.payment_stage = 'rough_in_paid';
            updates.current_payment_stage = 'final';
          } else if (proposal.billcom_final_invoice_id === invoiceId) {
            updates.billcom_final_status = 'PAID';
            updates.final_paid_at = result.paidDate;
            updates.payment_stage = 'paid_in_full';
            updates.current_payment_stage = 'complete';
          }
          // Update total paid
          updates.total_paid = (proposal.total_paid || 0) + result.amountPaid;
          
          // Log payment in billcom_payment_log
          await supabase.from('billcom_payment_log').insert({
            proposal_id: proposal.id,
            billcom_invoice_id: invoiceId,
            payment_stage: proposal.billcom_deposit_invoice_id === invoiceId ? 'deposit' :
                          proposal.billcom_roughin_invoice_id === invoiceId ? 'rough_in' : 'final',
            amount_paid: result.amountPaid,
            payment_date: result.paidDate,
            payment_method: 'bill.com',
            raw_webhook_data: { source: 'manual_check', invoice: invoice }
          });
        }
        
      } catch (error) {
        console.error(`Error checking invoice ${invoiceId}:`, error);
        results.push({
          invoiceId: invoiceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Update proposal if we have updates
    if (proposal && Object.keys(updates).length > 0) {
      updates.billcom_last_sync_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id);
      
      if (updateError) {
        console.error('Error updating proposal:', updateError);
      } else {
        console.log('Proposal updated with payment status');
        
        // Also update job if exists
        if (proposal.job_id && updates.payment_stage) {
          await supabase
            .from('jobs')
            .update({
              payment_status: updates.payment_stage,
              updated_at: new Date().toISOString()
            })
            .eq('id', proposal.job_id);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      results: results,
      proposalUpdated: Object.keys(updates).length > 0,
      updates: updates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/billcom-test/check-payment-status',
    message: 'Payment status checker is ready',
    usage: 'POST with { billcomInvoiceId: string } or { proposalId: string }',
    timestamp: new Date().toISOString()
  });
}