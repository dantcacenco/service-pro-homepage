import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autoCompleteFromProposal, autoCompleteFromJobData } from '@/lib/stages/auto-complete';

/**
 * Backfill Stage Progress for All Jobs
 *
 * Re-runs auto-completion logic for all active jobs to populate stage_steps
 * correctly based on proposal data and job data.
 *
 * POST /api/stages/backfill
 *
 * Optional body:
 * - job_id: string (optional) - Backfill a specific job instead of all jobs
 *
 * Returns:
 * - jobs_processed: number
 * - jobs_updated: number
 * - total_steps_completed: number
 * - errors: string[]
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const specificJobId = body.job_id;

    let jobsProcessed = 0;
    let jobsUpdated = 0;
    let totalStepsCompleted = 0;
    const errors: string[] = [];

    // Fetch jobs to process
    let query = supabase
      .from('jobs')
      .select('id, proposal_id, stage, job_number')
      .in('stage', ['beginning', 'rough_in', 'trim_out', 'closing'])
      .order('created_at', { ascending: false });

    if (specificJobId) {
      query = query.eq('id', specificJobId);
    }

    const { data: jobs, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch jobs',
          details: fetchError.message
        },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs_processed: 0,
        jobs_updated: 0,
        total_steps_completed: 0,
        message: specificJobId
          ? 'Job not found or not in an active stage'
          : 'No active jobs to process'
      });
    }

    // Process each job
    for (const job of jobs) {
      jobsProcessed++;
      let jobStepsCompleted = 0;

      try {
        // Auto-complete from job data (scheduled_date, assigned_to)
        const jobDataResult = await autoCompleteFromJobData(job.id);
        if (jobDataResult.success) {
          jobStepsCompleted += jobDataResult.steps_completed.length;
        }

        // Auto-complete from proposal if exists
        if (job.proposal_id) {
          const proposalResult = await autoCompleteFromProposal(job.id, job.proposal_id);
          if (proposalResult.success) {
            jobStepsCompleted += proposalResult.steps_completed.length;
          }
        }

        if (jobStepsCompleted > 0) {
          jobsUpdated++;
          totalStepsCompleted += jobStepsCompleted;
          console.log(`[Backfill] ✅ Job ${job.job_number}: ${jobStepsCompleted} steps completed`);
        } else {
          console.log(`[Backfill] ⏭️  Job ${job.job_number}: No steps to complete`);
        }

      } catch (error) {
        const errorMsg = `Job ${job.job_number} (${job.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[Backfill] ❌ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      jobs_processed: jobsProcessed,
      jobs_updated: jobsUpdated,
      total_steps_completed: totalStepsCompleted,
      errors: errors.length > 0 ? errors : undefined,
      message: specificJobId
        ? `Backfilled job ${specificJobId}`
        : `Backfilled ${jobsProcessed} active jobs`
    });

  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for status check
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Count jobs in each stage
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('stage')
      .in('stage', ['beginning', 'rough_in', 'trim_out', 'closing']);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch job counts' },
        { status: 500 }
      );
    }

    const stageCounts = {
      beginning: 0,
      rough_in: 0,
      trim_out: 0,
      closing: 0,
      total: jobs?.length || 0
    };

    jobs?.forEach(job => {
      if (job.stage in stageCounts) {
        stageCounts[job.stage as keyof typeof stageCounts]++;
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Backfill endpoint ready',
      active_jobs: stageCounts,
      instructions: {
        backfill_all: 'POST /api/stages/backfill with Authorization header',
        backfill_one: 'POST /api/stages/backfill with { job_id: "..." }',
        auth_required: 'Bearer <CRON_SECRET>'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
