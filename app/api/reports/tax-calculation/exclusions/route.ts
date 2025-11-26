/**
 * Tax Calculation - Exclusions Management Endpoint
 *
 * POST /api/reports/tax-calculation/exclusions
 * Add customer to exclusion list
 * Body: { billcomCustomerId, customerName, customerAddress, exclusionReason }
 *
 * GET /api/reports/tax-calculation/exclusions
 * List all excluded customers
 *
 * DELETE /api/reports/tax-calculation/exclusions?id=<exclusionId>
 * Remove customer from exclusion list
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[TAX EXCLUSIONS API] Fetching exclusions list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX EXCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX EXCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX EXCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage exclusions' },
        { status: 403 }
      )
    }

    // Fetch all exclusions
    const { data: exclusions, error: exclusionsError } = await supabase
      .from('tax_customer_exclusions')
      .select('*')
      .order('created_at', { ascending: false })

    if (exclusionsError) {
      console.error('[TAX EXCLUSIONS API] Failed to fetch exclusions:', exclusionsError)
      return NextResponse.json(
        { error: 'Failed to fetch exclusions' },
        { status: 500 }
      )
    }

    console.log('[TAX EXCLUSIONS API] ✓ Fetched', exclusions?.length || 0, 'exclusions')

    return NextResponse.json({
      success: true,
      exclusions: exclusions || [],
      totalExclusions: exclusions?.length || 0
    })

  } catch (error: any) {
    console.error('[TAX EXCLUSIONS API] Fatal error:', error)
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

export async function POST(request: NextRequest) {
  try {
    console.log('[TAX EXCLUSIONS API] Adding customer to exclusion list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX EXCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX EXCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX EXCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage exclusions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { billcomCustomerId, customerName, customerAddress, exclusionReason, customerId } = body

    if (!customerName || !exclusionReason) {
      console.error('[TAX EXCLUSIONS API] Missing required fields:', body)
      return NextResponse.json(
        { error: 'Missing required fields: customerName, exclusionReason' },
        { status: 400 }
      )
    }

    console.log('[TAX EXCLUSIONS API] Adding exclusion:', {
      billcomCustomerId,
      customerName,
      exclusionReason
    })

    // Check if customer is already excluded
    let existingQuery = supabase
      .from('tax_customer_exclusions')
      .select('id')

    if (billcomCustomerId) {
      existingQuery = existingQuery.eq('billcom_customer_id', billcomCustomerId)
    } else {
      existingQuery = existingQuery.eq('customer_name', customerName)
    }

    const { data: existing } = await existingQuery.single()

    if (existing) {
      console.warn('[TAX EXCLUSIONS API] Customer already excluded:', customerName)
      return NextResponse.json(
        { error: 'Customer is already excluded' },
        { status: 409 }
      )
    }

    // Insert exclusion
    const { data: exclusion, error: insertError } = await supabase
      .from('tax_customer_exclusions')
      .insert({
        customer_id: customerId || null,
        billcom_customer_id: billcomCustomerId || null,
        customer_name: customerName,
        customer_address: customerAddress || null,
        exclusion_reason: exclusionReason,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[TAX EXCLUSIONS API] Failed to insert exclusion:', insertError)
      return NextResponse.json(
        { error: 'Failed to add exclusion' },
        { status: 500 }
      )
    }

    console.log('[TAX EXCLUSIONS API] ✓ Exclusion added:', exclusion.id)

    return NextResponse.json({
      success: true,
      exclusion: exclusion,
      message: `Customer "${customerName}" added to exclusion list`
    })

  } catch (error: any) {
    console.error('[TAX EXCLUSIONS API] Fatal error:', error)
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

export async function DELETE(request: NextRequest) {
  try {
    console.log('[TAX EXCLUSIONS API] Removing customer from exclusion list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX EXCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX EXCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX EXCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage exclusions' },
        { status: 403 }
      )
    }

    // Get exclusion ID from query params
    const { searchParams } = new URL(request.url)
    const exclusionId = searchParams.get('id')

    if (!exclusionId) {
      console.error('[TAX EXCLUSIONS API] Missing exclusion ID')
      return NextResponse.json(
        { error: 'Missing query parameter: id' },
        { status: 400 }
      )
    }

    console.log('[TAX EXCLUSIONS API] Deleting exclusion:', exclusionId)

    // Delete exclusion
    const { error: deleteError } = await supabase
      .from('tax_customer_exclusions')
      .delete()
      .eq('id', exclusionId)

    if (deleteError) {
      console.error('[TAX EXCLUSIONS API] Failed to delete exclusion:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete exclusion' },
        { status: 500 }
      )
    }

    console.log('[TAX EXCLUSIONS API] ✓ Exclusion deleted:', exclusionId)

    return NextResponse.json({
      success: true,
      message: 'Exclusion removed successfully'
    })

  } catch (error: any) {
    console.error('[TAX EXCLUSIONS API] Fatal error:', error)
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
