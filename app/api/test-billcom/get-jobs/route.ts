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
    // Fetch all jobs with customer info
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        proposal:proposals!proposal_id (
          id,
          customer:customers!inner (
            id,
            name,
            email
          ),
          invoices (
            id,
            billcom_invoice_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the jobs data
    const formattedJobs = jobs?.map((job: any) => ({
      id: job.id,
      customer_name: job.proposal?.customer?.name || job.customer_name || 'Unknown',
      status: job.status,
      work_started: job.work_started,
      roughin_done: job.roughin_done,
      final_done: job.final_done,
      work_started_at: job.work_started_at,
      roughin_done_at: job.roughin_done_at,
      final_done_at: job.final_done_at,
      proposal_id: job.proposal_id,
      invoice_id: job.proposal?.invoices?.[0]?.id,
      billcom_invoice_id: job.proposal?.invoices?.[0]?.billcom_invoice_id
    })) || [];

    return NextResponse.json({
      success: true,
      jobs: formattedJobs
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}