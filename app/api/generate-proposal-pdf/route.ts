import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateProposalPDF } from '@/lib/pdf/proposal-generator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('proposalId')
    const token = searchParams.get('token')

    if (!proposalId || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify token matches proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', proposalId)
      .eq('customer_view_token', token)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found or invalid token' },
        { status: 404 }
      )
    }

    // Get all proposal items
    const { data: allItems } = await supabase
      .from('proposal_items')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('sort_order', { ascending: true })

    // Get selected tier if multi-tier proposal
    const { data: selectedTier } = await supabase
      .from('proposal_tiers')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('is_selected', true)
      .single()

    // Filter by selected tier (or use all if single-tier)
    const proposalItems = selectedTier
      ? allItems?.filter(item => item.tier_id === selectedTier.id)
      : allItems

    // Prepare data for PDF generator
    const pdfData = {
      proposal_number: proposal.proposal_number,
      title: proposal.title || 'HVAC Service Proposal',
      description: proposal.description,
      subtotal: proposal.subtotal,
      tax_rate: proposal.tax_rate,
      tax_amount: proposal.tax_amount,
      total: proposal.total_with_tax || proposal.total,
      created_at: proposal.created_at,
      approved_at: proposal.approved_at, // Include approved date for PDF
      valid_until: proposal.valid_until,
      tier_mode: proposal.tier_mode, // Include tier mode for PDF
      selectedTier: selectedTier ? {
        tierName: selectedTier.tier_name,
        tierLevel: selectedTier.tier_level
      } : undefined, // Include selected tier info for PDF
      customers: {
        name: proposal.customers.name,
        email: proposal.customers.email,
        phone: proposal.customers.phone,
        address: proposal.customers.address
      },
      proposal_items: (proposalItems || []).map((item: any) => ({
        name: item.name || item.description,
        description: item.description,
        price: item.total_price,
        unit_price: item.unit_price,
        quantity: item.quantity || 1,
        is_addon: item.is_addon || false,
        is_selected: item.is_selected !== false,
        total_price: item.total_price // Include total_price for grouping in PDF
      }))
    }

    // Generate PDF
    const pdfBlob = await generateProposalPDF(pdfData)
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Proposal-${proposal.proposal_number}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
