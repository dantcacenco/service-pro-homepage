/**
 * Tax Calculation - Status Endpoint
 *
 * GET /api/reports/tax-calculation/status/[runId]
 * Returns current progress of sync or calculation run
 * Used by progress bar (polling every 2 seconds)
 *
 * Returns:
 * - status: 'in_progress' | 'completed' | 'failed'
 * - currentStatus: Human-readable status message
 * - items_processed, total_items, percentage
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalculationStatus } from '@/lib/tax-reports/tax-calculator'
import { getSyncStatus } from '@/lib/tax-reports/billcom-sync'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    console.log('[TAX STATUS API] Fetching status for run:', runId)

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX STATUS API] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or boss
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[TAX STATUS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX STATUS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can view status' },
        { status: 403 }
      )
    }

    // Fetch run record to determine type
    const { data: run, error: runError } = await supabase
      .from('tax_calculation_runs')
      .select('run_type, status, current_status, total_items, items_processed, items_succeeded, items_failed, items_skipped, current_batch, total_batches, error_message')
      .eq('id', runId)
      .single()

    if (runError || !run) {
      console.error('[TAX STATUS API] Run not found:', runId, runError)
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get detailed status based on run type
    let detailedStatus
    if (run.run_type === 'calculate') {
      detailedStatus = await getCalculationStatus(runId)
    } else if (run.run_type === 'sync') {
      detailedStatus = await getSyncStatus(runId)
    }

    if (!detailedStatus) {
      console.error('[TAX STATUS API] Failed to fetch detailed status for run:', runId)
      return NextResponse.json(
        { error: 'Failed to fetch run status' },
        { status: 500 }
      )
    }

    // Calculate progress percentage
    const percentage = run.total_items > 0
      ? Math.round((run.items_processed / run.total_items) * 100)
      : 0

    console.log('[TAX STATUS API] ✓ Status fetched:', {
      runId,
      runType: run.run_type,
      status: run.status,
      percentage
    })

    // Return status
    return NextResponse.json({
      success: true,
      runId: runId,
      runType: run.run_type,
      status: run.status,
      currentStatus: run.current_status || 'Processing...',
      totalItems: run.total_items || 0,
      itemsProcessed: run.items_processed || 0,
      itemsSucceeded: run.items_succeeded || 0,
      itemsFailed: run.items_failed || 0,
      itemsSkipped: run.items_skipped || 0,
      currentBatch: run.current_batch || 0,
      totalBatches: run.total_batches || 0,
      percentage: percentage,
      errorMessage: run.error_message,
      detailedStatus: detailedStatus
    })

  } catch (error: any) {
    console.error('[TAX STATUS API] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
