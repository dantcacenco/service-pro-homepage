// /app/api/test-billcom/get-proposals/route.ts
// Get proposals from database for testing - FIXED version

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get proposals with customer information - EXACT same query as proposals page
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select(`
        *,
        customers!inner (
          id,
          name,
          email,
          phone,
          billcom_id
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[GET PROPOSALS] Supabase error:', error);
      throw error;
    }

    // Format proposals for the dropdown - handle the nested customers object correctly
    const formattedProposals = proposals?.map((proposal: any) => ({
      id: proposal.id,
      label: `${proposal.proposal_number} - ${proposal.title}`,
      status: proposal.status,
      customer: proposal.customers ? {
        id: proposal.customers.id,
        name: proposal.customers.name,
        email: proposal.customers.email,
        billcom_id: proposal.customers.billcom_id
      } : null,
      total: proposal.total,
      hasInvoice: !!proposal.billcom_invoice_id,
      invoiceNumber: proposal.billcom_invoice_number,
      invoiceStatus: proposal.billcom_invoice_status
    })) || [];

    return NextResponse.json({
      success: true,
      proposals: formattedProposals,
      count: formattedProposals.length
    });

  } catch (error: any) {
    console.error('[GET PROPOSALS] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch proposals',
      error: error.message,
      details: error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Alternative POST method if needed
  return GET(request);
}
