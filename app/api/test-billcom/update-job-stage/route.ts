import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Configuration error: Missing environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { jobId, stage } = await request.json();
    
    if (!jobId || !stage) {
      return NextResponse.json({
        success: false,
        error: 'Missing jobId or stage'
      }, { status: 400 });
    }
    
    const now = new Date().toISOString();
    let updateData: any = {};
    
    switch (stage) {
      case 'start':
        updateData = {
          work_started: true,
          work_started_at: now,
          status: 'In Progress'
        };
        break;
        
      case 'roughin':
        updateData = {
          roughin_done: true,
          roughin_done_at: now,
          status: 'Rough-In Complete'
        };
        break;
        
      case 'final':
        updateData = {
          final_done: true,
          final_done_at: now,
          status: 'Final Complete'
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid stage'
        }, { status: 400 });
    }
    
    // Update the job
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) throw error;
    
    // If rough-in or final is marked complete, trigger invoice creation/update
    if (stage === 'roughin' || stage === 'final') {
      // Get the job's proposal to check for invoice
      const { data: job } = await supabase
        .from('jobs')
        .select(`
          proposal_id,
          proposals (
            id,
            total,
            customer_id,
            invoices (
              id,
              billcom_invoice_id
            )
          )
        `)
        .eq('id', jobId)
        .single();
      
      // Type assertion to handle the relationship
      const jobData = job as any;
      if (jobData?.proposals && !jobData.proposals?.invoices?.length) {
        // Create invoice if it doesn't exist
        // This would trigger the invoice creation workflow
        console.log('Should create invoice for proposal:', jobData.proposal_id);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Job ${stage} stage updated successfully`,
      data
    });
    
  } catch (error: any) {
    console.error('Update job stage error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update job stage'
    }, { status: 500 });
  }
}