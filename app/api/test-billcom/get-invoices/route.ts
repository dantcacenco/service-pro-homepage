import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({
        success: false,
        error: 'Configuration error: Missing environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Fetch all invoices with related data
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        proposal:proposals!proposal_id (
          id,
          customer:customers!inner (
            name,
            email
          )
        )
      `)
      .not('billcom_invoice_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (error) throw error;
    
    // Get associated jobs separately if needed
    const proposalIds = invoices?.map(inv => inv.proposal_id).filter(Boolean) || [];
    let jobsMap: Record<string, any> = {};
    
    if (proposalIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, proposal_id')
        .in('proposal_id', proposalIds);
      
      jobs?.forEach(job => {
        jobsMap[job.proposal_id] = job;
      });
    }

    if (error) throw error;

    // Format the invoices data
    const formattedInvoices = invoices?.map((invoice: any) => ({
      id: invoice.id,
      billcom_invoice_id: invoice.billcom_invoice_id,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount || 0,
      amount_paid: invoice.amount_paid || 0,
      amount_due: invoice.amount_due || invoice.amount || 0,
      payment_status: invoice.payment_status || 'UNPAID',
      last_sync: invoice.billcom_last_sync,
      customer_name: invoice.proposal?.customer?.name || 'Unknown',
      job_id: jobsMap[invoice.proposal_id]?.id || null,
      created_at: invoice.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}