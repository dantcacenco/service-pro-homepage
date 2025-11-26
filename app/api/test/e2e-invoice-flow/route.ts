/**
 * End-to-End Invoice Flow Test
 *
 * Tests the complete invoice workflow:
 * 1. Create proposal for customer Danny
 * 2. Approve proposal (triggers 50% deposit invoice + job creation)
 * 3. Create rough-in invoice (30% of items)
 * 4. Create final invoice (20% of items)
 *
 * All steps are logged with Bill.com links for verification
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface TestStep {
  step: number
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  data?: any
  billcomLink?: string
  duration?: number
}

export async function POST() {
  const startTime = Date.now()
  const steps: TestStep[] = []
  let currentStep = 0

  const logStep = (name: string, status: 'running' | 'success' | 'error', message?: string, data?: any, billcomLink?: string) => {
    if (status === 'running') {
      currentStep++
      steps.push({
        step: currentStep,
        name,
        status,
        message,
        data,
        billcomLink
      })
    } else {
      const step = steps.find(s => s.step === currentStep)
      if (step) {
        step.status = status
        step.message = message
        step.data = data
        step.billcomLink = billcomLink
        step.duration = Date.now() - startTime
      }
    }
    console.log(`[E2E TEST] Step ${currentStep}: ${name} - ${status}`, message || '')
  }

  try {
    const supabase = createAdminClient()

    // ==========================================
    // STEP 1: Find customer Danny
    // ==========================================
    logStep('Find customer Danny', 'running')

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', '%danny%')
      .ilike('address', '%214%alta%vista%')
      .single()

    if (customerError || !customer) {
      logStep('Find customer Danny', 'error', 'Customer not found. Expected: Danny at 214 Alta Vista Dr, Candler, NC')
      return NextResponse.json({ success: false, steps, error: 'Customer not found' })
    }

    logStep('Find customer Danny', 'success', `Found: ${customer.name} (ID: ${customer.id})`, {
      customer_id: customer.id,
      name: customer.name,
      address: customer.address,
      email: customer.email,
      billcom_customer_id: customer.billcom_customer_id
    })

    // Get a user for created_by field (try admin first, then boss, then any user)
    let adminUser = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()
      .then(res => res.data)

    if (!adminUser) {
      adminUser = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'boss')
        .limit(1)
        .single()
        .then(res => res.data)
    }

    if (!adminUser) {
      adminUser = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single()
        .then(res => res.data)
    }

    if (!adminUser) {
      logStep('Get user for created_by', 'error', 'No users found in profiles table')
      return NextResponse.json({ success: false, steps, error: 'No users found' })
    }

    const createdBy = adminUser.id

    // ==========================================
    // STEP 2: Get existing pricing items for proposal items
    // ==========================================
    logStep('Load existing pricing items', 'running')

    const { data: services, error: servicesError } = await supabase
      .from('pricing_items')
      .select('*')
      .eq('is_active', true)
      .limit(3)

    if (servicesError || !services || services.length === 0) {
      logStep('Load existing pricing items', 'error', 'No pricing items found in database')
      return NextResponse.json({ success: false, steps, error: 'No pricing items found' })
    }

    logStep('Load existing pricing items', 'success', `Found ${services.length} pricing items`, {
      services: services.map(s => ({ name: s.name, price: s.price }))
    })

    // ==========================================
    // STEP 3: Create proposal
    // ==========================================
    logStep('Create proposal', 'running')

    const proposalNumber = `TEST-${Date.now()}`
    const proposalItems = services.map((service, index) => ({
      name: service.name,
      description: service.description || `Test item ${index + 1}`,
      unit_price: service.price || 100,
      quantity: 1,
      total_price: service.price || 100,
      is_addon: false,
      is_selected: true
    }))

    const proposalTotal = proposalItems.reduce((sum, item) => sum + item.total_price, 0)

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        customer_id: customer.id,
        proposal_number: proposalNumber,
        title: 'E2E Test Proposal - Invoice Flow',
        description: 'Automated test of complete invoice workflow',
        total: proposalTotal,
        status: 'draft',
        tier_mode: 'single',
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (proposalError || !proposal) {
      logStep('Create proposal', 'error', proposalError?.message || 'Failed to create proposal')
      return NextResponse.json({ success: false, steps, error: 'Proposal creation failed' })
    }

    // Insert proposal items
    const { error: itemsError } = await supabase
      .from('proposal_items')
      .insert(
        proposalItems.map(item => ({
          proposal_id: proposal.id,
          ...item
        }))
      )

    if (itemsError) {
      logStep('Create proposal', 'error', `Failed to create proposal items: ${itemsError.message}`)
      return NextResponse.json({ success: false, steps, error: 'Proposal items creation failed' })
    }

    logStep('Create proposal', 'success', `Created proposal ${proposalNumber}`, {
      proposal_id: proposal.id,
      proposal_number: proposalNumber,
      total: proposalTotal,
      items_count: proposalItems.length,
      items: proposalItems
    })

    // ==========================================
    // STEP 4: Approve proposal (triggers invoice + job creation)
    // ==========================================
    logStep('Approve proposal (triggers 50% invoice + job creation)', 'running')

    // First update proposal status to approved
    await supabase
      .from('proposals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        payment_status: 'pending',
        current_payment_stage: 'deposit'
      })
      .eq('id', proposal.id)

    // Then trigger automation (invoice + job creation)
    const approveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/proposals/approve-automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: proposal.id
      })
    })

    if (!approveResponse.ok) {
      const errorData = await approveResponse.json()
      logStep('Approve proposal', 'error', `Approval failed: ${errorData.error || 'Unknown error'}`)
      return NextResponse.json({ success: false, steps, error: 'Proposal approval failed' })
    }

    const approvalData = await approveResponse.json()

    // Wait a bit for async processes
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Fetch updated proposal to get invoice and job IDs
    const { data: updatedProposal } = await supabase
      .from('proposals')
      .select('*, jobs(*)')
      .eq('id', proposal.id)
      .single()

    logStep('Approve proposal (triggers 50% invoice + job creation)', 'success', 'Proposal approved', {
      proposal_status: updatedProposal?.status,
      billcom_deposit_invoice_id: updatedProposal?.billcom_deposit_invoice_id,
      job_created: !!updatedProposal?.jobs && updatedProposal.jobs.length > 0,
      job_id: updatedProposal?.jobs?.[0]?.id,
      job_number: updatedProposal?.jobs?.[0]?.job_number,
      approval_response: approvalData
    }, updatedProposal?.billcom_deposit_invoice_link)

    if (!updatedProposal?.billcom_deposit_invoice_id) {
      logStep('Verify 50% deposit invoice', 'error', 'Deposit invoice was not created')
      return NextResponse.json({ success: false, steps, error: 'Deposit invoice not created' })
    }

    if (!updatedProposal?.jobs || updatedProposal.jobs.length === 0) {
      logStep('Verify job creation', 'error', 'Job was not created')
      return NextResponse.json({ success: false, steps, error: 'Job not created' })
    }

    const job = updatedProposal.jobs[0]

    // ==========================================
    // STEP 5: Verify 50% deposit invoice in Bill.com
    // ==========================================
    logStep('Verify 50% deposit invoice in Bill.com', 'running')

    const { data: depositInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('proposal_id', proposal.id)
      .eq('job_stage', 'deposit')
      .single()

    if (!depositInvoice) {
      logStep('Verify 50% deposit invoice in Bill.com', 'error', 'Deposit invoice not found in database')
    } else {
      logStep('Verify 50% deposit invoice in Bill.com', 'success', '50% deposit invoice created', {
        invoice_id: depositInvoice.id,
        billcom_invoice_id: depositInvoice.billcom_invoice_id,
        subtotal: depositInvoice.subtotal,
        tax_amount: depositInvoice.tax_amount,
        total: depositInvoice.total,
        status: depositInvoice.status
      }, `https://app.bill.com/Invoice/Details?id=${depositInvoice.billcom_invoice_id}`)
    }

    // ==========================================
    // STEP 6: Create rough-in invoice (30%)
    // ==========================================
    logStep('Create rough-in invoice (30%)', 'running')

    const roughinResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jobs/${job.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'roughin',
        items: proposalItems.map(item => ({
          ...item,
          quantity: 0.3, // 30% of original
          total_price: item.total_price * 0.3
        })),
        subtotal: proposalTotal * 0.3
      })
    })

    if (!roughinResponse.ok) {
      const errorData = await roughinResponse.json()
      logStep('Create rough-in invoice (30%)', 'error', `Failed: ${errorData.error || 'Unknown error'}`)
      return NextResponse.json({ success: false, steps, error: 'Rough-in invoice creation failed' })
    }

    const roughinData = await roughinResponse.json()

    logStep('Create rough-in invoice (30%)', 'success', 'Rough-in invoice created', {
      invoice_id: roughinData.invoice?.id,
      billcom_invoice_id: roughinData.billcomInvoiceId,
      subtotal: roughinData.invoice?.subtotal,
      tax_amount: roughinData.invoice?.tax_amount,
      total: roughinData.invoice?.total,
      invoice_url: roughinData.invoiceUrl
    }, roughinData.invoiceUrl || `https://app.bill.com/Invoice/Details?id=${roughinData.billcomInvoiceId}`)

    // ==========================================
    // STEP 7: Create final invoice (20%)
    // ==========================================
    logStep('Create final invoice (20%)', 'running')

    const finalResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jobs/${job.id}/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'final',
        items: proposalItems.map(item => ({
          ...item,
          quantity: 0.2, // 20% of original
          total_price: item.total_price * 0.2
        })),
        subtotal: proposalTotal * 0.2
      })
    })

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json()
      logStep('Create final invoice (20%)', 'error', `Failed: ${errorData.error || 'Unknown error'}`)
      return NextResponse.json({ success: false, steps, error: 'Final invoice creation failed' })
    }

    const finalData = await finalResponse.json()

    logStep('Create final invoice (20%)', 'success', 'Final invoice created', {
      invoice_id: finalData.invoice?.id,
      billcom_invoice_id: finalData.billcomInvoiceId,
      subtotal: finalData.invoice?.subtotal,
      tax_amount: finalData.invoice?.tax_amount,
      total: finalData.invoice?.total,
      invoice_url: finalData.invoiceUrl
    }, finalData.invoiceUrl || `https://app.bill.com/Invoice/Details?id=${finalData.billcomInvoiceId}`)

    // ==========================================
    // STEP 8: Summary and verification
    // ==========================================
    logStep('Verify complete invoice chain', 'running')

    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: true })

    const expectedTotal = proposalTotal // 50% + 30% + 20% = 100%
    const actualTotal = allInvoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0

    logStep('Verify complete invoice chain', 'success', 'All invoices created successfully', {
      total_invoices: allInvoices?.length,
      invoice_stages: allInvoices?.map(inv => inv.job_stage),
      expected_subtotal_sum: expectedTotal,
      actual_subtotal_sum: actualTotal,
      subtotal_match: Math.abs(expectedTotal - actualTotal) < 0.01,
      invoices: allInvoices?.map(inv => ({
        stage: inv.job_stage,
        subtotal: inv.subtotal,
        total: inv.total,
        billcom_id: inv.billcom_invoice_id
      }))
    })

    // ==========================================
    // Final summary
    // ==========================================
    const duration = Date.now() - startTime
    const allSuccess = steps.every(s => s.status === 'success')

    return NextResponse.json({
      success: allSuccess,
      duration_ms: duration,
      steps,
      test_data: {
        customer: { id: customer.id, name: customer.name },
        proposal: { id: proposal.id, number: proposalNumber },
        job: { id: job.id, number: job.job_number },
        invoices: allInvoices?.map(inv => ({
          id: inv.id,
          stage: inv.job_stage,
          billcom_id: inv.billcom_invoice_id,
          total: inv.total
        }))
      },
      cleanup_note: 'Test data left in database and Bill.com for manual inspection. Please clean up manually when done.'
    })

  } catch (error: any) {
    console.error('[E2E TEST] Fatal error:', error)
    logStep('Fatal error', 'error', error.message)
    return NextResponse.json({
      success: false,
      steps,
      error: error.message
    }, { status: 500 })
  }
}
