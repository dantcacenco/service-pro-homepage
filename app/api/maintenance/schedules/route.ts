import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/maintenance/schedules - List maintenance schedules
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contract_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('maintenance_schedules')
      .select(`
        *,
        warranty_contracts!warranty_contract_id (
          contract_number,
          contract_type
        ),
        customers!customer_id (
          name,
          email,
          phone
        ),
        profiles!technician_id (
          full_name
        )
      `)
      .order('due_date', { ascending: true })

    if (contractId) {
      query = query.eq('warranty_contract_id', contractId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching maintenance schedules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/maintenance/schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/maintenance/schedules - Create maintenance schedule
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Generate schedule number if not provided
    if (!body.schedule_number) {
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })

      const scheduleNum = String((count || 0) + 1).padStart(3, '0')
      body.schedule_number = `M-${year}-${scheduleNum}-${body.visit_number || 1}`
    }

    const { data, error } = await supabase
      .from('maintenance_schedules')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating maintenance schedule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/maintenance/schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
