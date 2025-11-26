/**
 * Tax Calculation - Sync Endpoint
 *
 * POST /api/reports/tax-calculation/sync
 * Triggers Bill.com invoice sync to local database
 * Returns run ID for progress tracking
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncInvoicesFromBillcom } from '@/lib/tax-reports/billcom-sync'

export async function POST(request: NextRequest) {
  try {
    console.log('[TAX SYNC API] Received sync request')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX SYNC API] Authentication failed:', authError)
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
      console.error('[TAX SYNC API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX SYNC API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can sync invoices' },
        { status: 403 }
      )
    }

    console.log('[TAX SYNC API] ✓ User authorized:', user.id, 'role:', profile.role)

    // Trigger Bill.com sync
    console.log('[TAX SYNC API] Starting Bill.com invoice sync...')
    const result = await syncInvoicesFromBillcom(user.id)

    if (!result.success) {
      console.error('[TAX SYNC API] Sync failed:', result.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          details: result.errors,
          runId: result.runId
        },
        { status: 500 }
      )
    }

    console.log('[TAX SYNC API] ✓ Sync completed successfully:', {
      runId: result.runId,
      totalInvoicesSynced: result.totalInvoicesSynced,
      durationMs: result.durationMs
    })

    // Return success with run ID for progress tracking
    return NextResponse.json({
      success: true,
      runId: result.runId,
      totalInvoicesSynced: result.totalInvoicesSynced,
      newInvoices: result.newInvoices,
      updatedInvoices: result.updatedInvoices,
      durationMs: result.durationMs,
      message: `Successfully synced ${result.totalInvoicesSynced} invoices from Bill.com`
    })

  } catch (error: any) {
    console.error('[TAX SYNC API] Fatal error:', error)
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
