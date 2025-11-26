/**
 * ConnectTeam Incremental Sync API
 *
 * DISABLED - ConnectTeam API requires premium subscription
 *
 * This endpoint has been disabled because the ConnectTeam subscription
 * does not include API access. To re-enable:
 * 1. Upgrade ConnectTeam subscription to include API access
 * 2. Uncomment the sync logic below
 *
 * POST /api/connecteam/sync-notes
 */

import { NextRequest, NextResponse } from 'next/server';
// DISABLED - ConnectTeam requires premium subscription
// import { syncSubmissions } from '@/lib/connecteam/sync-service';
// import {
//   syncConnectTeamNotesToJobs,
//   getLastSyncTimestamp,
//   updateLastSyncTimestamp,
// } from '@/lib/connecteam/notes-sync';

export async function POST(request: NextRequest) {
  console.log('🚫 [SYNC API] ConnectTeam sync-notes endpoint called - DISABLED (requires premium subscription)');

  return NextResponse.json({
    success: false,
    disabled: true,
    error: 'ConnectTeam sync is disabled',
    message: 'ConnectTeam API requires a premium subscription. Please upgrade your ConnectTeam plan to enable API access and sync functionality.',
    timestamp: new Date().toISOString(),
  }, { status: 503 });
}

// GET endpoint to check sync status
export async function GET() {
  return NextResponse.json({
    disabled: true,
    message: 'ConnectTeam API requires premium subscription',
    last_sync_at: null,
    next_sync_recommended: null,
  }, { status: 503 });
}

/* DISABLED - Original code below requires premium ConnectTeam subscription

export async function POST_ORIGINAL(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify authentication (CRON_SECRET or admin user)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Valid cron request
      console.log('✅ [SYNC API] Authenticated via CRON_SECRET');
    } else {
      // TODO: Add admin user auth check if needed
      return NextResponse.json(
        { error: 'Unauthorized - CRON_SECRET required' },
        { status: 401 }
      );
    }

    // 2. Get last sync timestamp
    const lastSyncAt = await getLastSyncTimestamp();
    console.log(`📅 [SYNC API] Last sync: ${lastSyncAt.toISOString()}`);

    // 3. Sync ConnectTeam submissions (existing logic)
    console.log('🔄 [SYNC API] Step 1: Syncing ConnectTeam submissions...');
    const submissionsResult = await syncSubmissions(lastSyncAt);

    console.log('✅ [SYNC API] Submissions sync complete:', {
      synced: submissionsResult.synced,
      created: submissionsResult.created,
      updated: submissionsResult.updated,
      errors: submissionsResult.errors.length,
    });

    // 4. Extract notes and materials to jobs
    console.log('📋 [SYNC API] Step 2: Extracting notes/materials to jobs...');
    const notesResult = await syncConnectTeamNotesToJobs(lastSyncAt);

    console.log('✅ [SYNC API] Notes sync complete:', {
      submissions_processed: notesResult.submissions_processed,
      jobs_matched: notesResult.jobs_matched,
      jobs_created: notesResult.jobs_created,
      notes_added: notesResult.notes_added,
      notes_updated: notesResult.notes_updated,
      materials_added: notesResult.materials_added,
      errors: notesResult.errors.length,
    });

    // 5. Update sync state timestamp
    const duration = Date.now() - startTime;
    const totalItems = submissionsResult.synced + notesResult.submissions_processed;
    const allErrors = [...submissionsResult.errors, ...notesResult.errors];

    await updateLastSyncTimestamp(
      totalItems,
      duration,
      allErrors.length > 0 ? allErrors.join('; ') : undefined
    );

    console.log(`🎉 [SYNC API] Complete! Duration: ${duration}ms`);

    // 6. Return results
    return NextResponse.json(
      {
        success: submissionsResult.success && notesResult.success,
        duration_ms: duration,
        submissions: {
          synced: submissionsResult.synced,
          created: submissionsResult.created,
          updated: submissionsResult.updated,
          photos_created: submissionsResult.photosCreated,
          materials_created: submissionsResult.materialsCreated,
          jobs_matched: submissionsResult.jobsMatched,
          errors: submissionsResult.errors,
        },
        notes: {
          submissions_processed: notesResult.submissions_processed,
          jobs_matched: notesResult.jobs_matched,
          jobs_created: notesResult.jobs_created,
          notes_added: notesResult.notes_added,
          notes_updated: notesResult.notes_updated,
          materials_added: notesResult.materials_added,
          errors: notesResult.errors,
        },
        last_sync_at: lastSyncAt.toISOString(),
        next_sync_after: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [SYNC API] Fatal error:', error);

    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update sync state with error
    await updateLastSyncTimestamp(0, duration, errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET_ORIGINAL() {
  try {
    const lastSyncAt = await getLastSyncTimestamp();

    return NextResponse.json({
      last_sync_at: lastSyncAt.toISOString(),
      next_sync_recommended: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
END OF DISABLED CODE */
