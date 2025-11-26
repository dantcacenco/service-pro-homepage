/**
 * Job Creator Module
 *
 * Handles job creation and merging for approved proposals
 * Includes address deduplication to prevent duplicate jobs at the same location
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { matchAddressToJob } from '@/lib/connecteam/address-matcher'
import { initializeJobStage } from '@/lib/stages/auto-complete'
import type { Proposal, ProposalCustomer, InvoiceCreationResult, JobCreationResult } from './types'

/**
 * Creates a new job or merges into existing job at the same address
 *
 * @param proposal - The proposal data
 * @param customer - The customer information
 * @param invoiceData - Invoice creation result (may be null if no address)
 * @param proposalId - The proposal ID
 * @returns Job creation result with job ID and number
 */
export async function createOrMergeJob(
  proposal: Proposal,
  customer: ProposalCustomer,
  invoiceData: InvoiceCreationResult,
  proposalId: string
): Promise<JobCreationResult> {
  // Check if job was already created
  if (proposal.job_id) {
    console.log('Job already exists for this proposal:', proposal.job_id)

    // Update existing job with invoice link if not already there
    if (invoiceData.invoiceLink) {
      await addInvoiceLinkToExistingJob(
        proposal.job_id,
        invoiceData.invoiceLink,
        invoiceData.dbInvoiceId,
        invoiceData.invoiceId
      )
    }

    return {
      success: true,
      jobId: proposal.job_id,
      merged: false
    }
  }

  if (proposal.job_auto_created) {
    console.log('Job was already auto-created for this proposal')
    return {
      success: true,
      merged: false
    }
  }

  // Create service role client
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('Processing job creation for proposal:', proposalId)

    // Build proposal link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fairairhc.service-pro.app'
    const proposalLink = `${baseUrl}/proposal/view/${proposal.customer_view_token}`

    // Prepare invoice link data for the job (if invoice was created)
    const invoiceLinkData = invoiceData.invoiceLink ? {
      url: invoiceData.invoiceLink,
      stage: 'deposit',
      quantity: 0.5,
      invoice_id: invoiceData.dbInvoiceId,
      billcom_invoice_id: invoiceData.invoiceId,
      created_at: new Date().toISOString()
    } : null

    // Check for existing jobs at the same address (address deduplication)
    const customerAddress = customer?.address || ''
    const existingJob = await findExistingJobByAddress(
      customerAddress,
      proposal.customer_id,
      serviceSupabase
    )

    if (existingJob) {
      // MERGE: Add this proposal and invoice to existing job
      return await mergeProposalIntoJob(
        existingJob,
        proposal,
        proposalLink,
        invoiceLinkData,
        proposalId,
        serviceSupabase
      )
    } else {
      // CREATE NEW: No existing job found
      return await createNewJob(
        proposal,
        customer,
        proposalLink,
        invoiceLinkData,
        customerAddress,
        proposalId,
        serviceSupabase
      )
    }

  } catch (jobError: any) {
    console.error('❌ Exception in job creation/merge:', jobError)
    return {
      success: false,
      error: jobError.message || 'Job creation failed'
    }
  }
}

/**
 * Finds existing job at the same address using fuzzy address matching
 */
async function findExistingJobByAddress(
  customerAddress: string,
  customerId: string,
  supabase: any
): Promise<any | null> {
  if (!customerAddress || customerAddress.trim() === '') {
    return null
  }

  console.log('Checking for existing jobs at address:', customerAddress)

  // Get active jobs for this customer
  const { data: customerJobs } = await supabase
    .from('jobs')
    .select('id, job_number, service_address, title, status, proposal_links, invoice_links, notes')
    .eq('customer_id', customerId)
    .not('status', 'in', '("cancelled", "archived")')
    .order('created_at', { ascending: false })

  if (!customerJobs || customerJobs.length === 0) {
    return null
  }

  // Use address matching to find duplicate
  const match = await matchAddressToJob(
    customerAddress,
    customerJobs as any[],
    { minScore: 0.9 }
  )

  if (match && match.confidence === 'high') {
    const existingJob = customerJobs.find((j: any) => j.id === match.jobId)
    console.log(`⚠️ Found existing job at same address:`)
    console.log(`  Job: ${existingJob?.job_number}`)
    console.log(`  Match confidence: ${match.confidence} (${(match.matchScore * 100).toFixed(1)}%)`)
    console.log(`  Will merge proposal and invoice into existing job`)
    return existingJob
  }

  return null
}

/**
 * Merges proposal and invoice into an existing job
 */
async function mergeProposalIntoJob(
  existingJob: any,
  proposal: Proposal,
  proposalLink: string,
  invoiceLinkData: any | null,
  proposalId: string,
  supabase: any
): Promise<JobCreationResult> {
  console.log('Merging proposal and invoice into existing job:', existingJob.job_number)

  // Add proposal link to existing array
  const updatedProposalLinks = [
    ...(existingJob.proposal_links || []),
    proposalLink
  ]

  // Add invoice link to existing array (avoid duplicates)
  const existingInvoiceLinks = existingJob.invoice_links || []
  const invoiceLinkExists = invoiceLinkData && existingInvoiceLinks.some((link: any) => link.url === invoiceLinkData.url)
  const updatedInvoiceLinks = (invoiceLinkData && !invoiceLinkExists)
    ? [...existingInvoiceLinks, invoiceLinkData]
    : existingInvoiceLinks

  // Combine titles
  const proposalTitle = proposal.title || `Proposal #${proposal.proposal_number}`
  const combinedTitle = existingJob.title
    ? `${existingJob.title} + ${proposalTitle}`
    : proposalTitle

  // Update existing job
  const { error: mergeError } = await supabase
    .from('jobs')
    .update({
      proposal_links: updatedProposalLinks,
      invoice_links: updatedInvoiceLinks,
      title: combinedTitle,
      status: 'not_scheduled', // Reset status for new work
      notes: existingJob.notes
        ? `${existingJob.notes}\n\n[${new Date().toISOString()}] Merged proposal #${proposal.proposal_number}${invoiceLinkData ? ' with deposit invoice' : ''} - ${proposalTitle}`
        : `Merged proposal #${proposal.proposal_number}${invoiceLinkData ? ' with deposit invoice' : ''} - ${proposalTitle}`
    })
    .eq('id', existingJob.id)

  if (mergeError) {
    console.error('Failed to merge proposal into job:', mergeError)
    throw new Error(`Failed to merge: ${mergeError.message}`)
  }

  console.log('✅ Proposal and invoice merged into existing job:', existingJob.job_number)
  console.log('✅ Updated proposal links count:', updatedProposalLinks.length)
  console.log('✅ Updated invoice links count:', updatedInvoiceLinks.length)
  if (invoiceLinkData) {
    console.log('✅ Invoice link added:', invoiceLinkData.url)
  }

  // Initialize/update job stages from proposal
  console.log('🎯 Updating job stages from merged proposal...')
  try {
    const stageResult = await initializeJobStage(existingJob.id, true)
    if (stageResult.success) {
      console.log('✅ Job stages updated:', stageResult.initial_stage)
    }
  } catch (stageError) {
    console.error('❌ Error updating job stages:', stageError)
  }

  // Update proposal to link to existing job
  await supabase
    .from('proposals')
    .update({
      job_auto_created: true,
      job_id: existingJob.id
    })
    .eq('id', proposalId)

  return {
    success: true,
    jobId: existingJob.id,
    jobNumber: existingJob.job_number,
    merged: true
  }
}

/**
 * Creates a new job for the proposal
 */
async function createNewJob(
  proposal: Proposal,
  customer: ProposalCustomer,
  proposalLink: string,
  invoiceLinkData: any | null,
  customerAddress: string,
  proposalId: string,
  supabase: any
): Promise<JobCreationResult> {
  console.log('No existing job found, creating new job with invoice link')

  // Get admin user for created_by
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'boss')
    .limit(1)
    .single()

  const createdBy = adminUser?.id || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'

  // Retry logic for job number generation (handles race conditions)
  const maxRetries = 3
  let newJob = null
  let jobError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate job number
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
      console.log(`Generated job number: ${jobNumber} (attempt ${attempt}/${maxRetries})`)

      // Create the job WITH invoice link from the start
      const result = await supabase
        .from('jobs')
        .insert({
          job_number: jobNumber,
          proposal_id: proposalId,
          customer_id: proposal.customer_id,
          title: proposal.title || `Job from Proposal #${proposal.proposal_number}`,
          job_type: 'installation',
          status: 'not_scheduled',
          scheduled_date: null, // No scheduled date yet
          service_address: customerAddress || null,
          notes: `Auto-created from approved proposal #${proposal.proposal_number}${!invoiceLinkData ? ' (invoice pending - no customer address)' : ''}`,
          created_by: createdBy,
          proposal_links: [proposalLink],
          invoice_links: invoiceLinkData ? [invoiceLinkData] : []
        })
        .select()
        .single()

      newJob = result.data
      jobError = result.error

      // Check for duplicate key error (race condition)
      if (jobError?.code === '23505' && attempt < maxRetries) {
        console.log(`⚠️ Job number ${jobNumber} already exists, retrying... (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        continue
      }

      // Success or non-retryable error
      break

    } catch (err) {
      console.error(`Exception on attempt ${attempt}:`, err)
      if (attempt === maxRetries) {
        jobError = err
      }
    }
  }

  if (!jobError && newJob) {
    const jobId = newJob.id
    console.log('✅ Job created successfully:', newJob.job_number, 'ID:', jobId)
    console.log('✅ Proposal link added:', proposalLink)
    if (invoiceLinkData) {
      console.log('✅ Invoice link added:', invoiceLinkData.url)
    } else {
      console.log('⚠️ No invoice link (customer needs address for invoice creation)')
    }
    console.log('✅ Status set to: not_scheduled')

    // Initialize job stages from proposal
    console.log('🎯 Initializing job stages from proposal...')
    try {
      const stageResult = await initializeJobStage(jobId, true)
      if (stageResult.success) {
        console.log('✅ Job stages initialized:', stageResult.initial_stage)
      } else {
        console.warn('⚠️ Job stage initialization failed')
      }
    } catch (stageError) {
      console.error('❌ Error initializing job stages:', stageError)
      // Don't fail job creation if stage init fails
    }

    // Mark proposal as having auto-created job
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        job_auto_created: true,
        job_id: jobId
      })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Failed to update proposal with job_id:', updateError)
    } else {
      console.log('✅ Proposal updated with job_id:', jobId)
    }

    return {
      success: true,
      jobId: jobId,
      jobNumber: newJob.job_number,
      merged: false
    }
  } else {
    console.error('❌ Failed to create job after retries:', jobError)
    console.error('Job error details:', JSON.stringify(jobError, null, 2))
    throw new Error(`Failed to create job: ${jobError?.message || 'Unknown error'}`)
  }
}

/**
 * Adds invoice link to an existing job (helper for when job already exists)
 */
async function addInvoiceLinkToExistingJob(
  jobId: string,
  invoiceLink: string,
  dbInvoiceId: string | null | undefined,
  billcomInvoiceId: string | null | undefined
): Promise<void> {
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: existingJob } = await serviceSupabase
    .from('jobs')
    .select('invoice_links')
    .eq('id', jobId)
    .single()

  if (existingJob) {
    const existingInvoiceLinks = existingJob.invoice_links || []
    const invoiceLinkExists = existingInvoiceLinks.some((link: any) => link.url === invoiceLink)

    if (!invoiceLinkExists) {
      const invoiceLinkData = {
        url: invoiceLink,
        stage: 'deposit',
        quantity: 0.5,
        invoice_id: dbInvoiceId,
        billcom_invoice_id: billcomInvoiceId,
        created_at: new Date().toISOString()
      }

      await serviceSupabase
        .from('jobs')
        .update({
          invoice_links: [...existingInvoiceLinks, invoiceLinkData]
        })
        .eq('id', jobId)

      console.log('✅ Added invoice link to existing job')
    }
  }
}
