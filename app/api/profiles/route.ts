/**
 * API Route: /api/profiles
 * GET - List all active user profiles for technician selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')

    if (error) {
      console.error('[API /profiles] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profiles: data
    })

  } catch (error: any) {
    console.error('[API /profiles] Exception:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}
