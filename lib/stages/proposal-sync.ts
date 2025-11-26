/**
 * Stage-Based Workflow System - Proposal Sync
 *
 * Orchestrates stage updates when proposal events occur
 * (approval, payment, status changes)
 */

import { createClient } from '@/lib/supabase/server'
import { autoCompleteFromProposal, handleDepositPayment, handleProgressPayment, handleFinalPayment } from './auto-complete'
import { advanceStageIfReady } from './transitions'

// ============================================================================
// Main Proposal Sync Function
// ============================================================================

/**
 * Sync proposal data to job stages
 * Called whenever a proposal is updated
 */
export async function syncProposalToJobStages(proposalId: string): Promise<{
  success: boolean
  job_id?: string
  steps_completed?: string[]
  stage_advanced?: boolean
  message?: string
}> {
  const supabase = await createClient()

  try {
    // Find job associated with this proposal
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('proposal_id', proposalId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        message: 'No job found for this proposal',
      }
    }

    // Auto-complete steps based on proposal data
    const result = await autoCompleteFromProposal(job.id, proposalId)

    if (!result.success) {
      return {
        success: false,
        job_id: job.id,
        message: 'Failed to auto-complete steps',
      }
    }

    // Check if job is ready to advance to next stage
    const advanceResult = await advanceStageIfReady(job.id)

    return {
      success: true,
      job_id: job.id,
      steps_completed: result.steps_completed,
      stage_advanced: advanceResult.success,
      message: `Completed ${result.steps_completed.length} steps${advanceResult.success ? ' and advanced stage' : ''}`,
    }
  } catch (error) {
    console.error('Error syncing proposal to job stages:', error)
    return {
      success: false,
      message: 'Internal error during sync',
    }
  }
}

// ============================================================================
// Proposal Approval Handler
// ============================================================================

/**
 * Handle proposal approval event
 * Auto-completes proposal_approved step and syncs job
 */
export async function handleProposalApproval(proposalId: string): Promise<{
  success: boolean
  message: string
}> {
  const supabase = await createClient()

  try {
    // Update proposal approved_at timestamp if not set
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, approved_at, status')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      return { success: false, message: 'Proposal not found' }
    }

    // Set approved_at if not already set
    if (!proposal.approved_at || proposal.status !== 'approved') {
      await supabase
        .from('proposals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
    }

    // Sync to job stages
    const syncResult = await syncProposalToJobStages(proposalId)

    return {
      success: syncResult.success,
      message: syncResult.message || 'Proposal approved and job updated',
    }
  } catch (error) {
    console.error('Error handling proposal approval:', error)
    return {
      success: false,
      message: 'Failed to process approval',
    }
  }
}

// ============================================================================
// Payment Handlers
// ============================================================================

/**
 * Handle deposit payment received
 */
export async function handleProposalDepositPayment(
  proposalId: string,
  paidAt: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    // Update proposal
    await supabase
      .from('proposals')
      .update({ deposit_paid_at: paidAt })
      .eq('id', proposalId)

    // Find and update job
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('proposal_id', proposalId)
      .single()

    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    // Auto-complete deposit payment step
    await handleDepositPayment(job.id, paidAt)

    // Check if ready to advance
    await advanceStageIfReady(job.id)

    return {
      success: true,
      message: 'Deposit payment recorded and job updated',
    }
  } catch (error) {
    console.error('Error handling deposit payment:', error)
    return { success: false, message: 'Failed to process payment' }
  }
}

/**
 * Handle progress/rough-in payment received
 */
export async function handleProposalProgressPayment(
  proposalId: string,
  paidAt: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    // Update proposal
    await supabase
      .from('proposals')
      .update({ progress_paid_at: paidAt })
      .eq('id', proposalId)

    // Find and update job
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('proposal_id', proposalId)
      .single()

    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    // Auto-complete progress payment step
    await handleProgressPayment(job.id, paidAt)

    // Check if ready to advance
    await advanceStageIfReady(job.id)

    return {
      success: true,
      message: 'Progress payment recorded and job updated',
    }
  } catch (error) {
    console.error('Error handling progress payment:', error)
    return { success: false, message: 'Failed to process payment' }
  }
}

/**
 * Handle final payment received
 */
export async function handleProposalFinalPayment(
  proposalId: string,
  paidAt: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    // Update proposal
    await supabase
      .from('proposals')
      .update({ final_paid_at: paidAt })
      .eq('id', proposalId)

    // Find and update job
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('proposal_id', proposalId)
      .single()

    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    // Auto-complete final payment step
    await handleFinalPayment(job.id, paidAt)

    // Check if ready to advance (should move to completed)
    await advanceStageIfReady(job.id)

    return {
      success: true,
      message: 'Final payment recorded and job updated',
    }
  } catch (error) {
    console.error('Error handling final payment:', error)
    return { success: false, message: 'Failed to process payment' }
  }
}

// ============================================================================
// Job Creation from Proposal
// ============================================================================

/**
 * Initialize job stages when created from approved proposal
 * Sets beginning stage and auto-completes relevant steps
 */
export async function initializeJobFromProposal(
  jobId: string,
  proposalId: string
): Promise<{ success: boolean; steps_completed: string[] }> {
  try {
    // Auto-complete steps from proposal data
    const result = await autoCompleteFromProposal(jobId, proposalId)

    // Note: Stage should already be set to 'beginning' by job creation API
    // This just ensures steps are marked complete

    return {
      success: result.success,
      steps_completed: result.steps_completed,
    }
  } catch (error) {
    console.error('Error initializing job from proposal:', error)
    return {
      success: false,
      steps_completed: [],
    }
  }
}
