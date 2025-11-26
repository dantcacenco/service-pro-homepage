import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * ConnectTeam Status Change Polling Endpoint
 *
 * Called by cron job every 5 minutes to check for status changes
 * Creates job notes when manager_status changes on submissions
 *
 * POST /api/connecteam/poll-status-changes
 *
 * Returns:
 * {
 *   success: true,
 *   checked: number,
 *   statusChanges: number,
 *   changes: Array<{ jobNumber, oldStatus, newStatus }>
 * }
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('[ConnectTeam Poll] Starting status change check');
  console.log('[ConnectTeam Poll] Time:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    const supabase = await createClient();

    // ========================================================================
    // Step 1: Fetch recent ConnectTeam submissions (last 24 hours)
    // ========================================================================

    console.log('[ConnectTeam Poll] Fetching submissions from last 24 hours...');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: submissions, error: fetchError } = await supabase
      .from('connecteam_form_submissions')
      .select('id, linked_job_id, manager_status, connecteam_submission_id, submission_timestamp, job_address')
      .gte('submission_timestamp', twentyFourHoursAgo)
      .order('submission_timestamp', { ascending: false });

    if (fetchError) {
      console.error('[ConnectTeam Poll] Error fetching submissions:', fetchError);
      throw fetchError;
    }

    console.log(`[ConnectTeam Poll] Found ${submissions?.length || 0} submissions to check`);

    if (!submissions || submissions.length === 0) {
      console.log('[ConnectTeam Poll] No submissions to check');
      return NextResponse.json({
        success: true,
        checked: 0,
        statusChanges: 0,
        changes: []
      });
    }

    // ========================================================================
    // Step 2: Check each submission for status changes
    // ========================================================================

    let statusChanges = 0;
    const changes: Array<{
      jobNumber: string;
      oldStatus: string;
      newStatus: string;
      submissionId: string;
      address: string;
    }> = [];

    for (const submission of submissions) {
      // Get the last recorded status for this submission
      const { data: lastCheck } = await supabase
        .from('connecteam_status_history')
        .select('status')
        .eq('submission_id', submission.id)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      const currentStatus = submission.manager_status;
      const previousStatus = lastCheck?.status;

      // Check if status changed
      const statusChanged = !lastCheck || previousStatus !== currentStatus;

      if (statusChanged) {
        console.log('[ConnectTeam Poll] Status change detected:');
        console.log(`[ConnectTeam Poll]   Submission ID: ${submission.id}`);
        console.log(`[ConnectTeam Poll]   Old status: "${previousStatus || 'none'}"`);
        console.log(`[ConnectTeam Poll]   New status: "${currentStatus || 'none'}"`);

        // Only create job note if:
        // 1. Submission is matched to a job
        // 2. New status exists
        // 3. Job is NOT complete/done
        if (submission.linked_job_id && currentStatus) {
          // Get job details including current job status
          const { data: job } = await supabase
            .from('jobs')
            .select('job_number, service_address, status')
            .eq('id', submission.linked_job_id)
            .single();

          const jobNumber = job?.job_number || 'Unknown';
          const jobAddress = job?.service_address || submission.job_address || 'Unknown';
          const jobStatus = job?.status;

          // Check if job is complete/done
          // Only "done" and "sent_invoice" are considered complete
          // All other statuses (warranty, estimate, parts_needed, etc.) show in Job Notes
          const isJobComplete = jobStatus === 'done' ||
                               jobStatus === 'sent_invoice';

          if (isJobComplete) {
            console.log(`[ConnectTeam Poll] ⚠️  Skipping job note (Job ${jobNumber} is complete: ${jobStatus})`);
          } else {
            // Create descriptive note text
            let noteText: string;
            if (previousStatus) {
              noteText = `ConnectTeam status changed: "${previousStatus}" → "${currentStatus}"`;
            } else {
              noteText = `ConnectTeam status set to: "${currentStatus}"`;
            }

            // Add location context
            noteText += `\nLocation: ${jobAddress}`;

            // Create job note (only for incomplete jobs)
            const { error: noteError } = await supabase
              .from('job_notes')
              .insert({
                job_id: submission.linked_job_id,
                note_text: noteText,
                status: 'undone',
                note_type: 'connecteam_status_change',
                created_at: new Date().toISOString()
              });

            if (noteError) {
              console.error('[ConnectTeam Poll] Error creating job note:', noteError);
            } else {
              console.log(`[ConnectTeam Poll] ✅ Created job note for Job ${jobNumber}`);
              statusChanges++;

              changes.push({
                jobNumber,
                oldStatus: previousStatus || 'none',
                newStatus: currentStatus,
                submissionId: submission.id,
                address: jobAddress
              });
            }
          }
        } else {
          console.log('[ConnectTeam Poll] ⚠️  Skipping job note (not linked to job or no status)');
        }

        // Record this check in history (even if no job note created)
        const { error: historyError } = await supabase
          .from('connecteam_status_history')
          .insert({
            submission_id: submission.id,
            status: currentStatus || null,
            checked_at: new Date().toISOString()
          });

        if (historyError) {
          console.error('[ConnectTeam Poll] Error recording history:', historyError);
        }
      }
    }

    // ========================================================================
    // Step 3: Cleanup old history records (keep last 30 days)
    // ========================================================================

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: cleanupError } = await supabase
      .from('connecteam_status_history')
      .delete()
      .lt('checked_at', thirtyDaysAgo);

    if (cleanupError) {
      console.error('[ConnectTeam Poll] Error cleaning up old history:', cleanupError);
    } else {
      console.log('[ConnectTeam Poll] Cleaned up history older than 30 days');
    }

    // ========================================================================
    // Summary
    // ========================================================================

    const duration = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log('[ConnectTeam Poll] Summary:');
    console.log(`[ConnectTeam Poll]   Checked: ${submissions.length} submissions`);
    console.log(`[ConnectTeam Poll]   Status changes: ${statusChanges}`);
    console.log(`[ConnectTeam Poll]   Duration: ${duration}ms`);
    console.log('='.repeat(60));

    if (changes.length > 0) {
      console.log('[ConnectTeam Poll] Changes detected:');
      changes.forEach(change => {
        console.log(`[ConnectTeam Poll]   - Job ${change.jobNumber}: "${change.oldStatus}" → "${change.newStatus}"`);
      });
    }

    return NextResponse.json({
      success: true,
      checked: submissions.length,
      statusChanges,
      changes,
      duration
    });

  } catch (error) {
    console.error('[ConnectTeam Poll] ❌ Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        checked: 0,
        statusChanges: 0
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
