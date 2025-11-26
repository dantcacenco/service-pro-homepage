import { NextRequest, NextResponse } from 'next/server';
import { getBillcomClient } from '@/lib/billcom/client';

/**
 * Complete Webhook Test Flow
 *
 * Creates $1 test invoice, sends it, records payment, triggers webhook
 */

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log('=== Bill.com Webhook Test - Complete Flow ===');
    log('');

    // Step 1: Get Bill.com client
    log('Step 1: Initializing Bill.com client...');
    const billcom = await getBillcomClient();
    log('✅ Client initialized');
    log('');

    // Step 2: Find or create customer Danny
    log('Step 2: Finding customer Danny...');
    const danny = await billcom.createOrFindCustomer({
      name: 'Danny Test Customer',
      email: 'dantcacenco@gmail.com',
      address: '214 Alta Vista Dr, Candler, NC 28715',
    });

    log(`✅ Found customer: ${danny.name} (${danny.id})`);
    log(`   Email: ${danny.email}`);
    log('');

    // Step 3: Create $1 invoice
    log('Step 3: Creating $1 test invoice...');
    const invoiceNumber = `WH-${Date.now()}`; // Max 21 chars
    const today = new Date().toISOString().split('T')[0];

    const invoice = await billcom.createInvoice({
      customerId: danny.id,
      amount: 1.0,
      description: 'Webhook Integration Test Invoice',
      lineItems: [
        {
          description: 'Webhook Test - Pay this to trigger payment.updated event',
          amount: 1.0,
        },
      ],
      dueDate: today,
      invoiceNumber: invoiceNumber,
      sendEmail: false,
    });

    log(`✅ Invoice created: ${invoice.invoiceNumber}`);
    log(`   Invoice ID: ${invoice.id}`);
    log(`   Amount: $${invoice.totalAmount}`);
    log('');

    // Step 4: Send invoice via email
    log('Step 4: Sending invoice via email...');
    const sendResult = await billcom.sendInvoice(invoice.id, danny.email);

    if (sendResult.success) {
      log('✅ Invoice sent successfully!');
      log(`   Sent to: ${danny.email}`);
    } else {
      log(`⚠️  Invoice send status: ${sendResult.message}`);
    }
    log('');

    // Step 5: Instructions for payment
    log('Step 5: Payment instructions');
    log('   Option 1: Pay via email link sent to dantcacenco@gmail.com');
    log('   Option 2: Mark as paid manually in Bill.com dashboard');
    log('   Option 3: Wait for Bill.com to process (if auto-pay enabled)');
    log('');
    log('🎯 When paid, webhook will automatically fire!');
    log('');

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        amount: invoice.totalAmount,
      },
      customerEmail: danny.email,
      nextSteps: [
        '1. Check email: dantcacenco@gmail.com',
        '2. Pay the $1 invoice (or mark as paid in Bill.com)',
        '3. Watch Vercel logs: vercel logs my-dashboard-app --prod | grep webhook',
        '4. Verify webhook received the payment.updated event',
      ],
      logs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('');
    log(`❌ Test failed: ${errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logs,
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request);
}
