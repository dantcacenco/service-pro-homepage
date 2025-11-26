/**
 * Test Customer Creation - Debug placeholder customer issues
 *
 * GET /api/connecteam/test-customer
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const logs: string[] = []

  function log(message: string, data?: any) {
    console.log(message, data || '')
    logs.push(data ? `${message} ${JSON.stringify(data)}` : message)
  }

  try {
    log('[TEST] Checking for existing placeholder customer...')

    // Check if exists
    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('email', 'connecteam-import@placeholder.local')
      .maybeSingle()

    if (findError) {
      log('[TEST] Error finding customer:', findError)
    }

    if (existing) {
      log('[TEST] ✓ Placeholder customer already exists:', existing)
      return NextResponse.json({
        success: true,
        exists: true,
        customer: existing,
        logs
      })
    }

    log('[TEST] Placeholder customer does not exist, attempting to create...')

    // Try to create
    const nowISO = new Date().toISOString()
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: 'ConnectTeam Import (Pending)',
        email: 'connecteam-import@placeholder.local',
        phone: '',
        created_at: nowISO,
        updated_at: nowISO
      })
      .select('id, name, email')
      .single()

    if (createError) {
      log('[TEST] ✗ Failed to create customer:', createError)
      return NextResponse.json({
        success: false,
        exists: false,
        error: {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint
        },
        logs
      }, { status: 500 })
    }

    log('[TEST] ✓ Successfully created placeholder customer:', newCustomer)
    return NextResponse.json({
      success: true,
      exists: false,
      created: true,
      customer: newCustomer,
      logs
    })

  } catch (error: any) {
    log('[TEST] Exception:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      logs
    }, { status: 500 })
  }
}

/**
 * DELETE - Remove placeholder customer for testing
 */
export async function DELETE() {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('email', 'connecteam-import@placeholder.local')

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Placeholder customer deleted'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
