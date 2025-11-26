/**
 * Tax Calculation - Inclusions Management Endpoint
 *
 * POST /api/reports/tax-calculation/inclusions
 * Add customer to inclusion list (include-only mode)
 * Body: { billcomCustomerId, customerName, customerAddress, inclusionReason }
 *
 * GET /api/reports/tax-calculation/inclusions
 * List all included customers
 *
 * DELETE /api/reports/tax-calculation/inclusions?id=<inclusionId>
 * Remove customer from inclusion list
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[TAX INCLUSIONS API] Fetching inclusions list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX INCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX INCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX INCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage inclusions' },
        { status: 403 }
      )
    }

    // Fetch all inclusions
    const { data: inclusions, error: inclusionsError } = await supabase
      .from('tax_customer_inclusions')
      .select('*')
      .order('created_at', { ascending: false })

    if (inclusionsError) {
      console.error('[TAX INCLUSIONS API] Failed to fetch inclusions:', inclusionsError)
      return NextResponse.json(
        { error: 'Failed to fetch inclusions' },
        { status: 500 }
      )
    }

    console.log('[TAX INCLUSIONS API] ✓ Fetched', inclusions?.length || 0, 'inclusions')

    return NextResponse.json({
      success: true,
      inclusions: inclusions || [],
      totalInclusions: inclusions?.length || 0
    })

  } catch (error: any) {
    console.error('[TAX INCLUSIONS API] Fatal error:', error)
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
    console.log('[TAX INCLUSIONS API] Adding customer to inclusion list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX INCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX INCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX INCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage inclusions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { billcomCustomerId, customerName, customerAddress, inclusionReason, customerId } = body

    if (!customerName) {
      console.error('[TAX INCLUSIONS API] Missing required fields:', body)
      return NextResponse.json(
        { error: 'Missing required field: customerName' },
        { status: 400 }
      )
    }

    console.log('[TAX INCLUSIONS API] Adding inclusion:', {
      billcomCustomerId,
      customerName,
      inclusionReason
    })

    // Check if customer is already included
    let existingQuery = supabase
      .from('tax_customer_inclusions')
      .select('id')

    if (billcomCustomerId) {
      existingQuery = existingQuery.eq('billcom_customer_id', billcomCustomerId)
    } else {
      existingQuery = existingQuery.eq('customer_name', customerName)
    }

    const { data: existing } = await existingQuery.single()

    if (existing) {
      console.warn('[TAX INCLUSIONS API] Customer already included:', customerName)
      return NextResponse.json(
        { error: 'Customer is already in inclusion list' },
        { status: 409 }
      )
    }

    // Insert inclusion
    const { data: inclusion, error: insertError } = await supabase
      .from('tax_customer_inclusions')
      .insert({
        customer_id: customerId || null,
        billcom_customer_id: billcomCustomerId || null,
        customer_name: customerName,
        customer_address: customerAddress || null,
        inclusion_reason: inclusionReason || null,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[TAX INCLUSIONS API] Failed to insert inclusion:', insertError)
      return NextResponse.json(
        { error: 'Failed to add inclusion' },
        { status: 500 }
      )
    }

    console.log('[TAX INCLUSIONS API] ✓ Inclusion added:', inclusion.id)

    return NextResponse.json({
      success: true,
      inclusion: inclusion,
      message: `Customer "${customerName}" added to inclusion list`
    })

  } catch (error: any) {
    console.error('[TAX INCLUSIONS API] Fatal error:', error)
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
    console.log('[TAX INCLUSIONS API] Removing customer from inclusion list')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX INCLUSIONS API] Authentication failed:', authError)
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
      console.error('[TAX INCLUSIONS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX INCLUSIONS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can manage inclusions' },
        { status: 403 }
      )
    }

    // Get inclusion ID from query params
    const { searchParams } = new URL(request.url)
    const inclusionId = searchParams.get('id')

    if (!inclusionId) {
      console.error('[TAX INCLUSIONS API] Missing inclusion ID')
      return NextResponse.json(
        { error: 'Missing query parameter: id' },
        { status: 400 }
      )
    }

    console.log('[TAX INCLUSIONS API] Deleting inclusion:', inclusionId)

    // Delete inclusion
    const { error: deleteError } = await supabase
      .from('tax_customer_inclusions')
      .delete()
      .eq('id', inclusionId)

    if (deleteError) {
      console.error('[TAX INCLUSIONS API] Failed to delete inclusion:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete inclusion' },
        { status: 500 }
      )
    }

    console.log('[TAX INCLUSIONS API] ✓ Inclusion deleted:', inclusionId)

    return NextResponse.json({
      success: true,
      message: 'Inclusion removed successfully'
    })

  } catch (error: any) {
    console.error('[TAX INCLUSIONS API] Fatal error:', error)
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
