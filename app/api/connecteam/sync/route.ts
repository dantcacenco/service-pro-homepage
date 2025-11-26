import { NextRequest, NextResponse } from 'next/server';
// ConnectTeam sync is DISABLED - requires premium subscription
// import { syncEmployees, syncSubmissions, fullSync } from '@/lib/connecteam/sync-service';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/connecteam/sync
 *
 * DISABLED - ConnectTeam API requires premium subscription
 *
 * This endpoint has been disabled because ConnectTeam API access
 * requires a premium subscription plan. To re-enable:
 * 1. Upgrade ConnectTeam subscription to include API access
 * 2. Uncomment the sync service imports above
 * 3. Uncomment the sync logic below
 */
export async function POST(request: NextRequest) {
  console.log('🚫 [API] ConnectTeam sync endpoint called - DISABLED (requires premium subscription)');

  // Return error indicating sync is disabled
  return NextResponse.json({
    success: false,
    disabled: true,
    error: 'ConnectTeam sync is disabled',
    message: 'ConnectTeam API requires a premium subscription. Please upgrade your ConnectTeam plan to enable API access and sync functionality.',
    timestamp: new Date().toISOString(),
  }, { status: 503 }); // Service Unavailable

  /* DISABLED - Uncomment when premium subscription is active
  const supabase = createAdminClient();
  let syncLogId: string | null = null;

  try {
    const body = await request.json();
    console.log('📝 [API] Request body:', body);
    const { syncAll, employees, submissions, since, triggeredBy = 'manual' } = body;

    // Create sync log entry (admin client, no user context needed)
    const { data: syncLog, error: logError } = await supabase
      .from('connecteam_sync_log')
      .insert({
        sync_status: 'running',
        trigger_type: triggeredBy === 'automatic' ? 'scheduled' : 'manual',
        triggered_by: null // Admin sync doesn't have user context
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
    } else {
      syncLogId = syncLog.id;
      console.log('📊 [API] Created sync log:', syncLogId);
    }

    // Default to full sync if no options specified
    const shouldSyncAll = syncAll !== false && !employees && !submissions;
    console.log('🎯 [API] Sync mode:', { shouldSyncAll, employees, submissions });

    const startTime = Date.now();
    let result: any = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    // Full sync (employees + submissions)
    if (shouldSyncAll) {
      console.log('🚀 [API] Starting full sync...');
      const fullSyncResult = await fullSync();
      console.log('✅ [API] Full sync complete:', fullSyncResult);
      result = {
        ...result,
        success: fullSyncResult.success,
        employees: fullSyncResult.employees,
        submissions: fullSyncResult.submissions,
        duration: fullSyncResult.duration,
      };

      // Update sync log with results
      if (syncLogId) {
        await supabase
          .from('connecteam_sync_log')
          .update({
            sync_completed_at: new Date().toISOString(),
            sync_status: fullSyncResult.success ? 'completed' : 'partial',
            employees_synced: fullSyncResult.employees?.synced || 0,
            submissions_synced: fullSyncResult.submissions?.synced || 0,
            photos_synced: fullSyncResult.submissions?.photosCreated || 0,
            materials_synced: fullSyncResult.submissions?.materialsCreated || 0,
            jobs_matched: fullSyncResult.submissions?.jobsMatched || 0,
          })
          .eq('id', syncLogId);
      }
    } else {
      // Selective sync
      let employeesCount = 0;
      let submissionsCount = 0;
      
      if (employees) {
        console.log('👥 [API] Starting employee sync...');
        const employeesResult = await syncEmployees();
        console.log('✅ [API] Employee sync complete:', employeesResult);
        result.employees = employeesResult;
        result.success = result.success && employeesResult.success;
        employeesCount = employeesResult.synced || 0;
      }

      if (submissions) {
        console.log('📋 [API] Starting submission sync...');
        const sinceDate = since ? new Date(since) : undefined;
        const submissionsResult = await syncSubmissions(sinceDate);
        console.log('✅ [API] Submission sync complete:', submissionsResult);
        result.submissions = submissionsResult;
        result.success = result.success && submissionsResult.success;
        submissionsCount = submissionsResult.synced || 0;
      }

      result.duration = Date.now() - startTime;

      // Update sync log
      if (syncLogId) {
        await supabase
          .from('connecteam_sync_log')
          .update({
            sync_completed_at: new Date().toISOString(),
            sync_status: result.success ? 'completed' : 'partial',
            employees_synced: employeesCount,
            submissions_synced: submissionsCount,
          })
          .eq('id', syncLogId);
      }
    }

    console.log('🎉 [API] Sync endpoint returning result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [API] Sync error:', error);

    // Update sync log with error
    if (syncLogId) {
      await supabase
        .from('connecteam_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          sync_status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          error_details: error instanceof Error ? { stack: error.stack } : { error: String(error) }
        })
        .eq('id', syncLogId);
    }

    const errorResult = {
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    console.error('❌ [API] Returning error:', errorResult);
    return NextResponse.json(errorResult, { status: 500 });
  }
  END OF DISABLED CODE */
}
