import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/warranty/contracts - List all warranty contracts
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')

    let query = supabase
      .from('warranty_contracts')
      .select(`
        *,
        customers!customer_id (
          name,
          email,
          phone,
          address
        ),
        jobs!original_job_id (
          job_number,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching warranty contracts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/warranty/contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/warranty/contracts - Create a new warranty contract
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Generate contract number if not provided
    if (!body.contract_number) {
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('warranty_contracts')
        .select('*', { count: 'exact', head: true })

      const contractNum = String((count || 0) + 1).padStart(3, '0')
      body.contract_number = `WC-${year}-${contractNum}`
    }

    // Set created_by to current user
    body.created_by = user.id

    // Calculate next renewal date (1 year from start)
    if (body.start_date && !body.next_renewal_date) {
      const startDate = new Date(body.start_date)
      const nextRenewal = new Date(startDate)
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1)
      body.next_renewal_date = nextRenewal.toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('warranty_contracts')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating warranty contract:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/warranty/contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
