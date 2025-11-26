import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillcomInvoicesForProposal } from '@/lib/billcom/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get proposal ID from request body
    const { proposalId } = await request.json()
    
    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 })
    }

    // Verify user has access to this proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check if proposal is approved
    if (proposal.status !== 'approved') {
      return NextResponse.json(
        { error: 'Proposal must be approved before creating Bill.com invoices' },
        { status: 400 }
      )
    }

    // Create Bill.com invoices
    const result = await createBillcomInvoicesForProposal(proposalId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      invoices: result.invoices,
    })
  } catch (error) {
    console.error('Error in Bill.com create-invoices API:', error)
    return NextResponse.json(
      { error: 'Failed to create Bill.com invoices' },
      { status: 500 }
    )
  }
}
