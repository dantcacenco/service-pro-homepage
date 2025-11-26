import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Using Node.js runtime for webhook processing
// Note: When Bill.com provides webhook signature verification details,
// we can implement signature verification using Node.js crypto module

export async function POST(request: NextRequest) {
  console.log('=== Bill.com Webhook Received ===');
  
  try {
    // Get raw body for logging and potential signature verification
    const rawBody = await request.text();
    console.log('Raw webhook body:', rawBody);
    
    // Parse JSON body
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    console.log('Parsed webhook data:', JSON.stringify(body, null, 2));
    
    // Check for signature header if Bill.com provides one
    const signature = request.headers.get('x-billcom-signature') || 
                     request.headers.get('x-bill-signature') ||
                     request.headers.get('authorization');
    
    if (signature) {
      console.log('Webhook signature found:', signature);
      // TODO: Implement signature verification when Bill.com provides documentation
      // For now, we're logging it for analysis
    }
    
    // Initialize Supabase client
    const supabase = createAdminClient();
    
    // Extract common fields from different possible webhook structures
    const webhookData = {
      event_type: body.event_type || body.eventType || body.type || 'unknown',
      invoice_id: body.invoiceId || body.invoice_id || body.invoice?.id || body.data?.invoice?.id,
      payment_id: body.paymentId || body.payment_id || body.payment?.id || body.data?.payment?.id,
      amount: body.amount || body.data?.amount || body.payment?.amount || body.data?.payment?.amount,
      status: body.status || body.data?.status || body.invoice?.status || body.data?.invoice?.status,
      customer_id: body.customerId || body.customer_id || body.data?.customer?.id,
      timestamp: body.timestamp || body.created_at || new Date().toISOString(),
    };
    
    console.log('Extracted webhook data:', webhookData);
    
    // Store in database for analysis
    const { data: logEntry, error: logError } = await supabase
      .from('billcom_payment_log')
      .insert({
        raw_webhook_data: body,
        billcom_invoice_id: webhookData.invoice_id,
        billcom_payment_id: webhookData.payment_id,
        amount_paid: webhookData.amount ? parseFloat(webhookData.amount.toString()) : null,
        payment_method: body.payment_method || body.data?.payment_method,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (logError) {
      console.error('Error logging webhook to database:', logError);
      // Don't fail the webhook, just log the error
    } else {
      console.log('Webhook logged to database with ID:', logEntry?.id);
    }
    
    // Handle specific event types
    const eventType = webhookData.event_type.toLowerCase();
    console.log(`Processing event type: ${eventType}`);
    
    switch(eventType) {
      case 'invoice.paid':
      case 'invoice_paid':
      case 'payment.succeeded':
      case 'payment_succeeded':
        console.log('Payment/Invoice paid event detected');
        await handleInvoicePaid(body, supabase);
        break;
        
      case 'payment.created':
      case 'payment_created':
        console.log('Payment created event detected');
        await handlePaymentCreated(body, supabase);
        break;
        
      case 'invoice.updated':
      case 'invoice_updated':
        console.log('Invoice updated event detected');
        await handleInvoiceUpdated(body, supabase);
        break;
        
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    // Return success response
    return NextResponse.json({ 
      received: true,
      event_type: webhookData.event_type,
      logged_id: logEntry?.id || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle invoice paid event
async function handleInvoicePaid(webhookData: any, supabase: any) {
  console.log('=== Handling Invoice Paid Event ===');
  
  try {
    // Extract invoice ID
    const billcomInvoiceId = webhookData.invoiceId || 
                            webhookData.invoice_id || 
                            webhookData.invoice?.id ||
                            webhookData.data?.invoice?.id;
    
    if (!billcomInvoiceId) {
      console.error('No invoice ID found in webhook data');
      return;
    }
    
    console.log('Processing payment for Bill.com invoice:', billcomInvoiceId);
    
    // Find the proposal with this Bill.com invoice ID
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .or(
        `billcom_deposit_invoice_id.eq.${billcomInvoiceId},` +
        `billcom_roughin_invoice_id.eq.${billcomInvoiceId},` +
        `billcom_final_invoice_id.eq.${billcomInvoiceId}`
      )
      .single();
    
    if (proposalError || !proposal) {
      console.log('No proposal found for Bill.com invoice:', billcomInvoiceId);
      return;
    }
    
    console.log('Found proposal:', proposal.id, 'Number:', proposal.proposal_number);
    
    // Determine which payment stage this is
    let paymentStage: string;
    let statusColumn: string;
    let paidAtColumn: string;
    
    if (proposal.billcom_deposit_invoice_id === billcomInvoiceId) {
      paymentStage = 'deposit';
      statusColumn = 'billcom_deposit_status';
      paidAtColumn = 'deposit_paid_at';
    } else if (proposal.billcom_roughin_invoice_id === billcomInvoiceId) {
      paymentStage = 'rough_in';
      statusColumn = 'billcom_roughin_status';
      paidAtColumn = 'progress_paid_at';
    } else if (proposal.billcom_final_invoice_id === billcomInvoiceId) {
      paymentStage = 'final';
      statusColumn = 'billcom_final_status';
      paidAtColumn = 'final_paid_at';
    } else {
      console.error('Could not determine payment stage for invoice');
      return;
    }
    
    console.log(`Payment stage identified: ${paymentStage}`);
    
    // Extract payment amount
    const amount = webhookData.amount || 
                  webhookData.data?.amount || 
                  webhookData.payment?.amount ||
                  webhookData.data?.payment?.amount;
    
    const amountPaid = amount ? parseFloat(amount.toString()) : 0;
    console.log(`Amount paid: $${amountPaid}`);
    
    // Update the proposal with payment information
    const proposalUpdates: any = {
      [statusColumn]: 'PAID',
      [paidAtColumn]: new Date().toISOString(),
      billcom_last_sync_at: new Date().toISOString(),
      total_paid: (proposal.total_paid || 0) + amountPaid
    };
    
    // Update payment_stage based on what's been paid
    if (paymentStage === 'deposit') {
      proposalUpdates.payment_stage = 'deposit_paid';
      proposalUpdates.current_payment_stage = 'rough_in';
    } else if (paymentStage === 'rough_in') {
      proposalUpdates.payment_stage = 'rough_in_paid';
      proposalUpdates.current_payment_stage = 'final';
    } else if (paymentStage === 'final') {
      proposalUpdates.payment_stage = 'paid_in_full';
      proposalUpdates.current_payment_stage = 'complete';
    }
    
    console.log('Updating proposal with:', proposalUpdates);
    
    const { error: updateError } = await supabase
      .from('proposals')
      .update(proposalUpdates)
      .eq('id', proposal.id);
    
    if (updateError) {
      console.error('Error updating proposal:', updateError);
    } else {
      console.log('Proposal updated successfully');
    }
    
    // Update related job if exists
    if (proposal.job_id) {
      const jobUpdates = {
        payment_status: proposalUpdates.payment_stage,
        updated_at: new Date().toISOString()
      };
      
      const { error: jobError } = await supabase
        .from('jobs')
        .update(jobUpdates)
        .eq('id', proposal.job_id);
      
      if (jobError) {
        console.error('Error updating job:', jobError);
      } else {
        console.log('Job payment status updated');
      }
    }
    
    // Log the payment in billcom_payment_log
    await supabase.from('billcom_payment_log').insert({
      proposal_id: proposal.id,
      billcom_invoice_id: billcomInvoiceId,
      payment_stage: paymentStage,
      amount_paid: amountPaid,
      payment_date: new Date().toISOString(),
      billcom_payment_id: webhookData.payment_id || webhookData.data?.payment?.id,
      payment_method: webhookData.payment_method || webhookData.data?.payment_method || 'bill.com',
      raw_webhook_data: webhookData
    });
    
    console.log(`Payment processed successfully for ${paymentStage} stage`);
    
  } catch (error) {
    console.error('Error handling invoice paid event:', error);
  }
}

// Handle payment created event
async function handlePaymentCreated(webhookData: any, supabase: any) {
  console.log('=== Handling Payment Created Event ===');
  // This might be fired when a payment is initiated but not yet completed
  // Log it for now, implement specific logic if needed
  console.log('Payment created data:', JSON.stringify(webhookData, null, 2));
}

// Handle invoice updated event
async function handleInvoiceUpdated(webhookData: any, supabase: any) {
  console.log('=== Handling Invoice Updated Event ===');
  
  try {
    const billcomInvoiceId = webhookData.invoiceId || 
                            webhookData.invoice_id || 
                            webhookData.invoice?.id ||
                            webhookData.data?.invoice?.id;
    
    const status = webhookData.status || 
                   webhookData.data?.status || 
                   webhookData.invoice?.status ||
                   webhookData.data?.invoice?.status;
    
    if (!billcomInvoiceId) {
      console.log('No invoice ID in update event');
      return;
    }
    
    console.log(`Invoice ${billcomInvoiceId} updated to status: ${status}`);
    
    // Find and update the proposal
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .or(
        `billcom_deposit_invoice_id.eq.${billcomInvoiceId},` +
        `billcom_roughin_invoice_id.eq.${billcomInvoiceId},` +
        `billcom_final_invoice_id.eq.${billcomInvoiceId}`
      )
      .single();
    
    if (proposal) {
      // Determine which status column to update
      let statusColumn: string;
      
      if (proposal.billcom_deposit_invoice_id === billcomInvoiceId) {
        statusColumn = 'billcom_deposit_status';
      } else if (proposal.billcom_roughin_invoice_id === billcomInvoiceId) {
        statusColumn = 'billcom_roughin_status';
      } else if (proposal.billcom_final_invoice_id === billcomInvoiceId) {
        statusColumn = 'billcom_final_status';
      } else {
        return;
      }
      
      await supabase
        .from('proposals')
        .update({
          [statusColumn]: status?.toUpperCase() || 'UPDATED',
          billcom_last_sync_at: new Date().toISOString()
        })
        .eq('id', proposal.id);
      
      console.log(`Updated proposal ${proposal.id} with new invoice status`);
    }
    
  } catch (error) {
    console.error('Error handling invoice updated event:', error);
  }
}

// Also export GET for testing the endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/billcom-test/webhook',
    message: 'Bill.com webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}