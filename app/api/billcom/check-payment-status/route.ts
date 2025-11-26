import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Bill.com API Configuration
const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get proposal ID from request body
    const { proposalId } = await request.json();
    
    if (!proposalId) {
      return NextResponse.json(
        { error: 'Proposal ID required' },
        { status: 400 }
      );
    }

    console.log(`Checking payment status for proposal ${proposalId}`);

    // Get the proposal with Bill.com invoice ID
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('Error fetching proposal:', proposalError);
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (!proposal.billcom_invoice_id) {
      console.log('No Bill.com invoice ID found for proposal');
      return NextResponse.json({
        status: 'no_invoice',
        message: 'No Bill.com invoice created for this proposal'
      });
    }

    // Login to Bill.com first
    console.log('Logging in to Bill.com...');
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
      console.error('Bill.com login failed:', loginData.response_message);
      return NextResponse.json(
        { error: 'Failed to authenticate with Bill.com' },
        { status: 500 }
      );
    }

    const sessionId = loginData.response_data.sessionId;

    // Get invoice details from Bill.com using Crud/Read endpoint
    const invoiceResponse = await fetch(`${BILLCOM_API_URL}/Crud/Read/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: {
            entity: 'Invoice',
            id: proposal.billcom_invoice_id
          }
        })
      })
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error('Bill.com API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch invoice from Bill.com' },
        { status: 500 }
      );
    }

    const invoiceData = await invoiceResponse.json();
    console.log('Bill.com invoice data:', invoiceData);

    if (invoiceData.response_status !== 0) {
      console.error('Bill.com API error:', invoiceData.response_message);
      return NextResponse.json(
        { error: invoiceData.response_message || 'Bill.com API error' },
        { status: 500 }
      );
    }

    const invoice = invoiceData.response_data;
    
    // Calculate amount paid from amount and amountDue
    const totalAmount = parseFloat(invoice.amount || '0');
    const amountDue = parseFloat(invoice.amountDue || totalAmount.toString());
    const amountPaid = totalAmount - amountDue;
    const paymentPercentage = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

    // Parse payment status from Bill.com
    const paymentStatusMap: Record<string, string> = {
      '0': 'UNPAID',
      '1': 'SENT',
      '2': 'PARTIALLY_PAID',
      '3': 'PAID',
      '4': 'CLOSED'
    };
    
    let invoiceStatus = paymentStatusMap[invoice.paymentStatus] || invoice.paymentStatus || 'OPEN';

    // Determine payment stage based on percentage
    let paymentStage = 'pending';
    
    if (paymentPercentage >= 100 || invoice.paymentStatus === '3' || invoice.paymentStatus === '4') {
      paymentStage = 'paid_in_full';
      invoiceStatus = 'PAID';
    } else if (paymentPercentage >= 80) {
      paymentStage = 'final_payment_due';
    } else if (paymentPercentage >= 50) {
      paymentStage = 'roughin_payment_due';
    } else if (paymentPercentage > 0) {
      paymentStage = 'partial_payment';
    } else {
      paymentStage = 'deposit_due';
    }

    console.log(`Payment status: ${amountPaid}/${totalAmount} (${paymentPercentage.toFixed(2)}%) - Stage: ${paymentStage}`);

    // Update proposal with latest payment information
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        billcom_amount_paid: amountPaid,
        billcom_invoice_status: invoiceStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update proposal' },
        { status: 500 }
      );
    }

    // Log the check
    await supabase.from('billcom_polling_log').insert({
      type: 'manual_payment_check',
      proposal_id: proposalId,
      invoice_id: proposal.billcom_invoice_id,
      details: {
        totalAmount,
        amountPaid,
        paymentPercentage,
        paymentStage,
        invoiceStatus
      }
    });

    return NextResponse.json({
      success: true,
      totalAmount,
      amountPaid,
      paymentPercentage,
      paymentStage,
      invoiceStatus,
      message: `Payment status updated: ${paymentStage}`
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/monitoring
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const proposalId = searchParams.get('proposalId');
  
  if (!proposalId) {
    return NextResponse.json({
      error: 'proposalId query parameter required',
      example: '/api/billcom/check-payment-status?proposalId=123'
    }, { status: 400 });
  }

  // Call the POST handler with the proposalId
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ proposalId })
  });
  
  return POST(postRequest);
}