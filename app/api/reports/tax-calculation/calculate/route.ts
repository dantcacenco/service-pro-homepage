/**
 * Tax Calculation - Calculate Endpoint
 *
 * POST /api/reports/tax-calculation/calculate
 * Triggers county tax calculation for invoices
 * Accepts optional filters (include/exclude customers)
 * Returns run ID for progress tracking
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCountyTaxes, FilterOptions } from '@/lib/tax-reports/tax-calculator'

export async function POST(request: NextRequest) {
  try {
    console.log('[TAX CALC API] Received calculation request')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX CALC API] Authentication failed:', authError)
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
      console.error('[TAX CALC API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX CALC API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can calculate taxes' },
        { status: 403 }
      )
    }

    console.log('[TAX CALC API] ✓ User authorized:', user.id, 'role:', profile.role)

    // Parse request body for filters
    let filters: FilterOptions | undefined
    try {
      const body = await request.json()
      if (body.includeMode || body.customerIds) {
        filters = {
          includeMode: body.includeMode || 'all',
          customerIds: body.customerIds || []
        }
        console.log('[TAX CALC API] Filters:', filters)
      }
    } catch (e) {
      // No body or invalid JSON - proceed without filters
      console.log('[TAX CALC API] No filters provided, processing all invoices')
    }

    // Trigger tax calculation
    console.log('[TAX CALC API] Starting county tax calculation...')
    const result = await calculateCountyTaxes(user.id, filters)

    if (!result.success) {
      console.error('[TAX CALC API] Calculation failed:', result.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Tax calculation failed',
          details: result.errors,
          runId: result.runId
        },
        { status: 500 }
      )
    }

    console.log('[TAX CALC API] ✓ Calculation completed successfully:', {
      runId: result.runId,
      processedInvoices: result.processedInvoices,
      countedInvoices: result.countedInvoices,
      skippedInvoices: result.skippedInvoices,
      failedInvoices: result.failedInvoices,
      durationMs: result.durationMs
    })

    // Return success with run ID for progress tracking
    return NextResponse.json({
      success: true,
      runId: result.runId,
      totalInvoices: result.totalInvoices,
      processedInvoices: result.processedInvoices,
      countedInvoices: result.countedInvoices,
      skippedInvoices: result.skippedInvoices,
      failedInvoices: result.failedInvoices,
      durationMs: result.durationMs,
      message: `Successfully calculated taxes for ${result.countedInvoices} invoices (${result.skippedInvoices} skipped, ${result.failedInvoices} failed)`
    })

  } catch (error: any) {
    console.error('[TAX CALC API] Fatal error:', error)
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
