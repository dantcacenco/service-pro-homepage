/**
 * Proposal Approval Automation API
 *
 * Thin orchestrator that handles proposal approval workflow:
 * 1. Creates Bill.com deposit invoice (50%)
 * 2. Creates or merges job
 * 3. Sends email notifications
 *
 * Refactored from 667-line monolith into modular components
 *
 * NOTE: Uses service role client to bypass RLS since this is called from
 * public customer view pages (accessed via token, not authenticated user)
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createDepositInvoice } from '@/lib/proposals/invoice-creator'
import { createOrMergeJob } from '@/lib/proposals/job-creator'
import { sendApprovalEmails } from '@/lib/proposals/email-notifier'

export async function POST(request: Request) {
  try {
    // Use service role client to bypass RLS (customers access via public token)
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const { proposalId } = await request.json()

    console.log('🚀 Starting proposal approval automation for:', proposalId)

    // Step 1: Fetch proposal with all related data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address,
          billcom_id
        ),
        proposal_items (
          id,
          name,
          description,
          quantity,
          unit_price,
          total_price,
          is_addon,
          is_selected,
          tier_id
        ),
        proposal_tiers (
          id,
          tier_level,
          tier_name,
          is_selected
        )
      `)
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      console.error('Proposal fetch error:', proposalError)
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Type cast for TypeScript - customers is an object, not an array
    const customer = proposal.customers as any

    console.log('📄 Proposal data:', {
      id: proposal.id,
      proposal_number: proposal.proposal_number,
      customer_id: proposal.customer_id,
      customer_name: customer?.name,
      customer_address: customer?.address,
      customer_email: customer?.email,
      customer_phone: customer?.phone
    })

    // Get selected tier for multi-tier proposals
    let selectedTier: any = null
    if (proposal.tier_mode === 'multi' && proposal.proposal_tiers) {
      selectedTier = (proposal.proposal_tiers as any[]).find(t => t.is_selected)
      console.log('Selected tier:', selectedTier?.tier_name || 'none')
    }

    // Step 2: Create deposit invoice FIRST (50%)
    console.log('📋 Step 1/3: Creating deposit invoice...')
    // Generate temporary job number for invoice (will be actual job number)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const { data: lastJob } = await supabase
      .from('jobs')
      .select('job_number')
      .like('job_number', `JOB-${today}-%`)
      .order('job_number', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastJob) {
      const match = lastJob.job_number.match(/JOB-\d{8}-(\d{3})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const jobNumber = `JOB-${today}-${nextNumber.toString().padStart(3, '0')}`
    console.log('Generated job number for invoice:', jobNumber)

    const invoiceResult = await createDepositInvoice(
      proposal,
      customer,
      selectedTier,
      proposalId,
      jobNumber // Pass job number for invoice numbering
    )

    if (invoiceResult.success) {
      console.log('✅ Invoice created:', invoiceResult.invoiceId)
      console.log('✅ Invoice link:', invoiceResult.invoiceLink)
    } else {
      console.error('❌ Invoice creation failed:', invoiceResult.error)
      // Don't proceed with job creation if invoice fails
      return NextResponse.json({
        success: false,
        error: `Invoice creation failed: ${invoiceResult.error}`,
        message: 'Proposal approved but invoice creation failed'
      }, { status: 500 })
    }

    // Step 3: Create or merge job AFTER invoice is successfully created
    console.log('🔨 Step 2/3: Creating or merging job...')
    const jobResult = await createOrMergeJob(
      proposal,
      customer,
      invoiceResult, // Pass the successful invoice result
      proposalId
    )

    if (jobResult.success) {
      console.log(`✅ Job ${jobResult.merged ? 'merged' : 'created'}:`, jobResult.jobNumber)
    } else {
      console.error('❌ Job creation failed:', jobResult.error)
      // Invoice was created but job failed - this is less critical
      console.warn('⚠️ Invoice exists but job creation failed - manual intervention needed')
    }

    // Step 4: Send email notifications
    console.log('📧 Step 3/3: Sending email notifications...')
    const emailResult = await sendApprovalEmails(
      proposal,
      customer,
      invoiceResult.invoiceLink,
      jobResult.jobNumber,
      proposalId,
      selectedTier
    )

    console.log('✅ Emails sent:', {
      customer: emailResult.customerEmailSent,
      business: emailResult.businessEmailSent
    })

    // Step 5: Return success response
    console.log('🎉 Approval automation completed successfully!')

    return NextResponse.json({
      success: true,
      job_id: jobResult.jobId,
      job_number: jobResult.jobNumber,
      invoice_id: invoiceResult.invoiceId,
      invoice_link: invoiceResult.invoiceLink,
      merged: jobResult.merged || false,
      emails_sent: emailResult.customerEmailSent && emailResult.businessEmailSent,
      message: 'Automation completed successfully'
    })

  } catch (error: any) {
    console.error('❌ Error in approval automation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Automation failed'
      },
      { status: 500 }
    )
  }
}