/**
 * ConnectTeam Notes Sync to Jobs
 *
 * Syncs notes and materials from ConnectTeam submissions to job JSONB arrays
 * for display in the Job Notes & Tasks dashboard widget
 *
 * Created: November 13, 2025
 * Updated: November 17, 2025 - Refactored to use shared processing module
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { processConnectTeamSubmissions, ConnectTeamSubmission } from './process-submissions';

// Using ProcessingResult from shared module
export type { ProcessingResult as NotesSyncResult } from './process-submissions';

/**
 * Sync ConnectTeam notes and materials to job JSONB arrays
 * Fetches submissions created after last sync timestamp
 * Now uses shared processing module for consistency with manual Excel imports
 */
export async function syncConnectTeamNotesToJobs(sinceTimestamp?: Date) {
  const supabase = createAdminClient();

  try {
    // 1. Get last sync timestamp if not provided
    let lastSyncAt = sinceTimestamp;

    if (!lastSyncAt) {
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('last_sync_at')
        .eq('sync_source', 'connecteam_submissions')
        .single();

      lastSyncAt = syncState?.last_sync_at ? new Date(syncState.last_sync_at) : new Date('1970-01-01');
    }

    console.log(`📋 [NOTES SYNC] Syncing notes from submissions after: ${lastSyncAt.toISOString()}`);

    // Calculate 2-week window for detecting edits
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    console.log(`📋 [NOTES SYNC] Checking for edited submissions since: ${twoWeeksAgo.toISOString()}`);

    // 2. Fetch submissions that are either:
    //    a) Created after last sync (new submissions), OR
    //    b) Updated in last 2 weeks (edited submissions)
    const { data: dbSubmissions, error: fetchError } = await supabase
      .from('connecteam_form_submissions')
      .select(`
        id,
        connecteam_submission_id,
        linked_job_id,
        job_location,
        job_type,
        additional_notes,
        parts_materials_needed,
        what_was_done,
        submission_timestamp,
        updated_at,
        employee_id,
        connecteam_employees (
          first_name,
          last_name
        )
      `)
      .not('linked_job_id', 'is', null) // Only submissions linked to jobs
      .or(`submission_timestamp.gt.${lastSyncAt.toISOString()},updated_at.gte.${twoWeeksAgo.toISOString()}`)
      .order('submission_timestamp', { ascending: true });

    if (fetchError) {
      return {
        success: false,
        submissions_processed: 0,
        jobs_matched: 0,
        jobs_created: 0,
        notes_added: 0,
        notes_updated: 0,
        materials_added: 0,
        errors: [`Failed to fetch submissions: ${fetchError.message}`]
      };
    }

    if (!dbSubmissions || dbSubmissions.length === 0) {
      console.log('📋 [NOTES SYNC] No new submissions to sync');
      return {
        success: true,
        submissions_processed: 0,
        jobs_matched: 0,
        jobs_created: 0,
        notes_added: 0,
        notes_updated: 0,
        materials_added: 0,
        errors: []
      };
    }

    console.log(`📋 [NOTES SYNC] Found ${dbSubmissions.length} submissions to sync`);

    // 3. Convert database submissions to standard format
    const submissions: ConnectTeamSubmission[] = dbSubmissions.map((sub: any) => {
      const employee = sub.connecteam_employees;
      const technicianName = employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : 'Unknown Technician';

      return {
        submission_id: sub.connecteam_submission_id,
        job_location: sub.job_location || '',
        job_type: sub.job_type,
        additional_notes: sub.additional_notes,
        parts_materials_needed: sub.parts_materials_needed,
        what_was_done: sub.what_was_done,
        submission_timestamp: sub.submission_timestamp,
        updated_at: sub.updated_at,
        technician_name: technicianName,
        linked_job_id: sub.linked_job_id // API sync provides this
      };
    });

    // 4. Process using shared module
    const result = await processConnectTeamSubmissions(submissions);

    console.log('✅ [NOTES SYNC] Complete:', {
      submissions_processed: result.submissions_processed,
      jobs_matched: result.jobs_matched,
      jobs_created: result.jobs_created,
      notes_added: result.notes_added,
      notes_updated: result.notes_updated,
      materials_added: result.materials_added,
      errors: result.errors.length
    });

    return result;
  } catch (error) {
    console.error('❌ [NOTES SYNC] Fatal error:', error);
    return {
      success: false,
      submissions_processed: 0,
      jobs_matched: 0,
      jobs_created: 0,
      notes_added: 0,
      notes_updated: 0,
      materials_added: 0,
      errors: [`Fatal error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

/**
 * Get last sync timestamp for ConnectTeam submissions
 */
export async function getLastSyncTimestamp(): Promise<Date> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('sync_state')
    .select('last_sync_at')
    .eq('sync_source', 'connecteam_submissions')
    .single();

  return data?.last_sync_at ? new Date(data.last_sync_at) : new Date('1970-01-01');
}

/**
 * Update last sync timestamp after successful sync
 */
export async function updateLastSyncTimestamp(
  itemsCount: number,
  durationMs: number,
  error?: string
): Promise<void> {
  const supabase = createAdminClient();

  // Use the helper function from the migration
  await supabase.rpc('update_sync_state', {
    p_sync_source: 'connecteam_submissions',
    p_items_count: itemsCount,
    p_duration_ms: durationMs,
    p_error: error || null,
  });
}
