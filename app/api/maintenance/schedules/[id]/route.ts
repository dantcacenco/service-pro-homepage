import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT /api/maintenance/schedules/[id]/complete - Mark maintenance as complete
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Update the schedule
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...body
    }

    const { data, error } = await supabase
      .from('maintenance_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error completing maintenance schedule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/maintenance/schedules/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
