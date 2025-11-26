import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/warranty/service-calls - List service calls
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
      .from('warranty_service_calls')
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
      .order('call_date', { ascending: false })

    if (contractId) {
      query = query.eq('warranty_contract_id', contractId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching service calls:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/warranty/service-calls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/warranty/service-calls - Create service call
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Generate call number if not provided
    if (!body.call_number) {
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('warranty_service_calls')
        .select('*', { count: 'exact', head: true })

      const callNum = String((count || 0) + 1).padStart(3, '0')
      body.call_number = `WS-${year}-${callNum}`
    }

    const { data, error } = await supabase
      .from('warranty_service_calls')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating service call:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/warranty/service-calls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
