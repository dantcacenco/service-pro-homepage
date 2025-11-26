import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/warranty/contracts/[id] - Get contract details
export async function GET(
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

    const { data, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching warranty contract:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/warranty/contracts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warranty/contracts/[id] - Update contract
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

    // Remove fields that shouldn't be updated directly
    delete body.id
    delete body.created_at
    delete body.created_by
    delete body.net_profit // This is a computed column

    const { data, error } = await supabase
      .from('warranty_contracts')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating warranty contract:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/warranty/contracts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
