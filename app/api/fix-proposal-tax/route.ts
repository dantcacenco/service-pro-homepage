// API route to fix tax rate for proposal 2313ada2-6d9b-4bd1-b8f4-b5ef5a18d138
// Temporary route - can be deleted after running once

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  try {
    const proposalId = '2313ada2-6d9b-4bd1-b8f4-b5ef5a18d138'

    // Step 1: Get current proposal data
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found', details: fetchError }, { status: 404 })
    }

    console.log('Current proposal:', {
      id: proposal.id,
      proposal_number: proposal.proposal_number,
      tax_rate: proposal.tax_rate,
      subtotal: proposal.subtotal,
      total: proposal.total
    })

    // Step 2: Calculate correct tax rate
    // For Buncombe County (Asheville): 2.25% county + 4.75% state = 7.00%
    const correctTaxRate = 0.07 // 7%
    const countyTaxRate = 0.0225 // 2.25% for Buncombe
    const stateTaxRate = 0.0475 // 4.75% NC

    // Step 3: Recalculate amounts
    const subtotal = parseFloat(proposal.subtotal || 0)
    const taxAmount = subtotal * correctTaxRate
    const countyTaxAmount = subtotal * countyTaxRate
    const stateTaxAmount = subtotal * stateTaxRate
    const newTotal = subtotal + taxAmount

    console.log('Recalculated values:', {
      subtotal,
      old_tax_rate: proposal.tax_rate,
      new_tax_rate: correctTaxRate,
      old_tax_amount: proposal.tax_amount,
      new_tax_amount: taxAmount,
      county_tax_amount: countyTaxAmount,
      state_tax_amount: stateTaxAmount,
      old_total: proposal.total,
      new_total: newTotal
    })

    // Step 4: Update the proposal
    const { data: updated, error: updateError } = await supabase
      .from('proposals')
      .update({
        tax_rate: correctTaxRate,
        tax_amount: taxAmount,
        total: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update', details: updateError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Tax rate fixed successfully',
      before: {
        tax_rate: proposal.tax_rate,
        tax_amount: proposal.tax_amount,
        total: proposal.total
      },
      after: {
        tax_rate: correctTaxRate,
        tax_amount: taxAmount,
        total: newTotal
      },
      updated: updated
    })

  } catch (error: any) {
    console.error('Error fixing tax:', error)
    return NextResponse.json({ error: 'Internal error', details: error.message }, { status: 500 })
  }
}

// GET route to check current values without updating
export async function GET() {
  const supabase = await createClient()

  try {
    const proposalId = '2313ada2-6d9b-4bd1-b8f4-b5ef5a18d138'

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('id, proposal_number, tax_rate, subtotal, tax_amount, total')
      .eq('id', proposalId)
      .single()

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const countyTaxPercent = ((proposal.tax_rate - 0.0475) * 100).toFixed(2)

    return NextResponse.json({
      current_values: proposal,
      breakdown: {
        total_tax_rate: `${(proposal.tax_rate * 100).toFixed(2)}%`,
        county_tax: `${countyTaxPercent}%`,
        state_tax: '4.75%',
        problem: parseFloat(countyTaxPercent) > 2.75 ? 'County tax exceeds NC maximum of 2.75%' : 'OK'
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
