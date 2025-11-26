import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check Jobs Table Status
 *
 * GET /api/test/check-jobs
 *
 * Returns counts and sample of jobs in database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Count total jobs
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({
        error: 'Failed to count jobs',
        details: countError.message
      }, { status: 500 });
    }

    // Get sample jobs (10 most recent)
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, job_number, stage, status, created_at, proposal_id, stage_steps')
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      return NextResponse.json({
        error: 'Failed to fetch jobs',
        details: jobsError.message
      }, { status: 500 });
    }

    // Count by stage
    const { data: allJobs } = await supabase
      .from('jobs')
      .select('stage');

    const stageCounts: Record<string, number> = {};
    allJobs?.forEach(job => {
      const stage = job.stage || 'null';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      total_jobs: totalCount || 0,
      stage_counts: stageCounts,
      sample_jobs: jobs?.map(j => ({
        id: j.id,
        job_number: j.job_number,
        stage: j.stage,
        status: j.status,
        has_proposal: !!j.proposal_id,
        has_stage_steps: !!j.stage_steps && Object.keys(j.stage_steps).length > 0,
        created_at: j.created_at
      }))
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
