import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/warranty/settings - Get warranty settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('warranty_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching warranty settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/warranty/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warranty/settings - Update warranty settings (admin only)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/boss
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'boss' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Update settings with user tracking
    const updateData = {
      ...body,
      updated_by: user.id
    }

    // Remove fields that shouldn't be updated
    delete updateData.id
    delete updateData.created_at

    const { data, error } = await supabase
      .from('warranty_settings')
      .update(updateData)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single()

    if (error) {
      console.error('Error updating warranty settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/warranty/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
