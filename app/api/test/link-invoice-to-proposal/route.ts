import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Create a test proposal linked to an existing invoice
 * Used for testing webhooks
 */

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, customerEmail } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find any existing customer to use for test
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'No customers found in database. Please create a customer first.' },
        { status: 404 }
      );
    }

    const customer = customers[0];
    console.log(`Using customer: ${customer.name} (${customer.id})`);

    // Try to get created_by from multiple sources
    let createdBy = null;

    // Option 1: Get from profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    console.log('Profiles query:', { count: profiles?.length, error: profileError });

    if (profiles && profiles.length > 0) {
      createdBy = profiles[0].id;
      console.log(`Using created_by from profiles: ${createdBy}`);
    } else {
      // Option 2: Get from existing proposal
      console.log('No profiles found, trying to get created_by from existing proposal...');
      const { data: existingProposals } = await supabase
        .from('proposals')
        .select('created_by')
        .not('created_by', 'is', null)
        .limit(1);

      console.log('Existing proposals query:', { count: existingProposals?.length });

      if (existingProposals && existingProposals.length > 0) {
        createdBy = existingProposals[0].created_by;
        console.log(`Using created_by from existing proposal: ${createdBy}`);
      } else {
        // Option 3: Get from customer table
        console.log('No existing proposals, trying customer created_by...');
        if (customer.created_by) {
          createdBy = customer.created_by;
          console.log(`Using created_by from customer: ${createdBy}`);
        }
      }
    }

    if (!createdBy) {
      return NextResponse.json(
        {
          error: 'Could not find valid created_by value',
          details: 'No users in profiles table, no existing proposals, and customer has no created_by'
        },
        { status: 500 }
      );
    }

    // Create proposal with minimal required fields
    // NOTE: This is a test proposal for webhook testing only
    // Real proposals should be created through the proper proposal creation flow
    const proposalData = {
      customer_id: customer.id,
      proposal_number: `TEST-${Date.now()}`,
      title: 'Webhook Test Invoice - $1',
      description: 'Test proposal to verify Bill.com webhook integration',
      subtotal: 1.0,
      tax_amount: 0.0,
      total: 1.0,
      deposit_amount: 1.0,
      progress_payment_amount: 0,
      final_payment_amount: 0,
      current_payment_stage: 'deposit',
      payment_stage: 'pending',
      status: 'approved',
      tier_mode: 'single', // Prevent multi-tier errors
      billcom_deposit_invoice_id: invoiceId,
      billcom_deposit_status: 'SENT',
      customer_view_token: crypto.randomUUID(),
      created_by: createdBy,
      approved_at: new Date().toISOString(),
    };

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert(proposalData)
      .select()
      .single();

    if (proposalError) {
      return NextResponse.json(
        { error: 'Failed to create proposal', details: proposalError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        invoice_id: proposal.billcom_deposit_invoice_id,
        customer: customer.name,
        amount: proposal.total,
      },
      message: `Proposal created! Now mark invoice ${invoiceId} as paid in Bill.com to trigger webhook.`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Allow GET for easy browser testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const invoiceId = searchParams.get('invoiceId') || '00e02FERYSOAPZ2btpux';
  const customerEmail = searchParams.get('customerEmail') || 'dantcacenco@gmail.com';

  // Forward to POST handler
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ invoiceId, customerEmail }),
    })
  );
}
