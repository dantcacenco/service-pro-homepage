import { NextRequest, NextResponse } from 'next/server';

/**
 * Master Cron Job - Runs Every 5 Minutes
 *
 * This single cron job checks BOTH systems for changes:
 * 1. ConnectTeam - Status changes on form submissions
 * 2. Bill.com - Invoice status updates (optional for now)
 *
 * Triggered by GitHub Actions (every 5 minutes)
 * Schedule: every 5 minutes via GitHub Actions workflow
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.error('[Cron] Unauthorized access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('='.repeat(60));
  console.log('[Cron] Master sync started:', new Date().toISOString());
  console.log('='.repeat(60));

  const results: any = {
    timestamp: new Date().toISOString(),
    success: true,
    connecteam: null,
    billcom: null,
    errors: []
  };

  // ============================================================================
  // 1. ConnectTeam Status Changes - DISABLED (requires premium subscription)
  // ============================================================================

  console.log('\n[Cron] Step 1: ConnectTeam sync (DISABLED)');
  console.log('[Cron]    ConnectTeam API requires premium subscription');
  console.log('[Cron]    Skipping ConnectTeam sync until subscription is upgraded');

  results.connecteam = {
    skipped: true,
    disabled: true,
    reason: 'ConnectTeam API requires premium subscription. Upgrade plan to re-enable sync.'
  };

  /* DISABLED - ConnectTeam requires premium subscription
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-dashboard-app-tau.vercel.app';
    const connecteamUrl = `${baseUrl}/api/connecteam/poll-status-changes`;

    console.log(`[Cron] Calling: ${connecteamUrl}`);

    const connecteamResponse = await fetch(connecteamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (connecteamResponse.ok) {
      const connecteamData = await connecteamResponse.json();
      results.connecteam = connecteamData;

      console.log(`[Cron] ✅ ConnectTeam: Checked ${connecteamData.checked} submissions`);
      console.log(`[Cron]    Found ${connecteamData.statusChanges} status changes`);

      if (connecteamData.statusChanges > 0) {
        console.log('[Cron]    Status changes detected:');
        connecteamData.changes?.forEach((change: any) => {
          console.log(`[Cron]      - Job ${change.jobNumber}: "${change.oldStatus}" → "${change.newStatus}"`);
        });
      }
    } else {
      const errorText = await connecteamResponse.text();
      throw new Error(`ConnectTeam poll failed: ${errorText}`);
    }
  } catch (error) {
    console.error('[Cron] ❌ ConnectTeam check failed:', error);
    results.success = false;
    results.errors.push({
      system: 'connecteam',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  END OF DISABLED CODE */

  // ============================================================================
  // 2. Check Bill.com Updates (Optional - Can add later)
  // ============================================================================

  console.log('\n[Cron] Step 2: Bill.com check (skipped for now)');
  console.log('[Cron]    Bill.com v2 uses polling internally, no cron needed');

  results.billcom = {
    skipped: true,
    reason: 'Bill.com v2 API does not support webhooks. App uses manual sync.'
  };

  // ============================================================================
  // Summary
  // ============================================================================

  const duration = Date.now() - startTime;
  results.duration = duration;

  console.log('\n' + '='.repeat(60));
  console.log('[Cron] Master sync completed');
  console.log('='.repeat(60));
  console.log(`[Cron] Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`[Cron] Success: ${results.success ? '✅' : '❌'}`);
  console.log(`[Cron] ConnectTeam: ${results.connecteam ? '✅' : '❌'}`);
  console.log(`[Cron] Bill.com: Skipped`);

  if (results.errors.length > 0) {
    console.log(`[Cron] Errors: ${results.errors.length}`);
    results.errors.forEach((err: any) => {
      console.log(`[Cron]   - ${err.system}: ${err.error}`);
    });
  }

  console.log('='.repeat(60));

  // Return results
  return NextResponse.json(results, {
    status: results.success ? 200 : 500
  });
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}
