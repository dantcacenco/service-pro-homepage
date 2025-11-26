/**
 * Stage-Based Workflow System - Auto-Completion
 *
 * Automatically completes steps when external events occur
 * (e.g., proposal approved, invoice paid, etc.)
 */

import { createClient } from '@/lib/supabase/server';
import { StepStatus } from './definitions';
import { completeMultipleSteps } from './transitions';

// ============================================================================
// Proposal-Based Auto-Completion
// ============================================================================

/**
 * Auto-complete steps based on proposal data
 * Called when proposal is updated or job is created from proposal
 */
export async function autoCompleteFromProposal(
  jobId: string,
  proposalId: string
): Promise<{ success: boolean; steps_completed: string[] }> {
  const supabase = await createClient();
  const stepsCompleted: string[] = [];

  try {
    // Fetch proposal data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(
        'id, status, approved_at, billcom_deposit_invoice_id, deposit_paid_at, billcom_roughin_invoice_id, progress_paid_at, billcom_final_invoice_id, final_paid_at'
      )
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return { success: false, steps_completed: [] };
    }

    // Fetch current job stage_steps
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { success: false, steps_completed: [] };
    }

    const stageSteps = job.stage_steps || {};
    const updatedSteps: Record<string, StepStatus> = { ...stageSteps };

    // Auto-complete based on proposal data
    if (proposal.status === 'approved' && proposal.approved_at) {
      if (!updatedSteps['proposal_approved']?.completed) {
        updatedSteps['proposal_approved'] = {
          completed: true,
          completed_at: proposal.approved_at,
          notes: 'Auto-completed from proposal approval',
        };
        stepsCompleted.push('proposal_approved');
      }
    }

    if (proposal.billcom_deposit_invoice_id) {
      if (!updatedSteps['deposit_invoice_sent']?.completed) {
        updatedSteps['deposit_invoice_sent'] = {
          completed: true,
          completed_at: new Date().toISOString(),
          notes: `Auto-completed from Bill.com deposit invoice (${proposal.billcom_deposit_invoice_id})`,
        };
        stepsCompleted.push('deposit_invoice_sent');
      }
    }

    if (proposal.deposit_paid_at) {
      if (!updatedSteps['deposit_invoice_paid']?.completed) {
        updatedSteps['deposit_invoice_paid'] = {
          completed: true,
          completed_at: proposal.deposit_paid_at,
          notes: 'Auto-completed from proposal deposit payment',
        };
        stepsCompleted.push('deposit_invoice_paid');
      }
    }

    if (proposal.billcom_roughin_invoice_id) {
      if (!updatedSteps['rough_in_invoice_sent']?.completed) {
        updatedSteps['rough_in_invoice_sent'] = {
          completed: true,
          completed_at: new Date().toISOString(),
          notes: `Auto-completed from Bill.com rough-in invoice (${proposal.billcom_roughin_invoice_id})`,
        };
        stepsCompleted.push('rough_in_invoice_sent');
      }
    }

    if (proposal.progress_paid_at) {
      if (!updatedSteps['rough_in_invoice_paid']?.completed) {
        updatedSteps['rough_in_invoice_paid'] = {
          completed: true,
          completed_at: proposal.progress_paid_at,
          notes: 'Auto-completed from proposal progress payment',
        };
        stepsCompleted.push('rough_in_invoice_paid');
      }
    }

    if (proposal.billcom_final_invoice_id) {
      if (!updatedSteps['final_invoice_sent']?.completed) {
        updatedSteps['final_invoice_sent'] = {
          completed: true,
          completed_at: new Date().toISOString(),
          notes: `Auto-completed from Bill.com final invoice (${proposal.billcom_final_invoice_id})`,
        };
        stepsCompleted.push('final_invoice_sent');
      }
    }

    if (proposal.final_paid_at) {
      if (!updatedSteps['final_invoice_paid']?.completed) {
        updatedSteps['final_invoice_paid'] = {
          completed: true,
          completed_at: proposal.final_paid_at,
          notes: 'Auto-completed from proposal final payment',
        };
        stepsCompleted.push('final_invoice_paid');
      }
    }

    // Update job with completed steps
    if (stepsCompleted.length > 0) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          stage_steps: updatedSteps,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        return { success: false, steps_completed: [] };
      }
    }

    return {
      success: true,
      steps_completed: stepsCompleted,
    };
  } catch (error) {
    console.error('Error auto-completing from proposal:', error);
    return { success: false, steps_completed: [] };
  }
}

// ============================================================================
// Job Data-Based Auto-Completion
// ============================================================================

/**
 * Auto-complete steps based on job data
 * Called when job is created or updated
 */
export async function autoCompleteFromJobData(jobId: string): Promise<{
  success: boolean;
  steps_completed: string[];
}> {
  const supabase = await createClient();
  const stepsCompleted: string[] = [];

  try {
    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps, scheduled_date, assigned_to')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { success: false, steps_completed: [] };
    }

    const stageSteps = job.stage_steps || {};
    const updatedSteps: Record<string, StepStatus> = { ...stageSteps };

    // Auto-complete based on job data
    if (job.scheduled_date) {
      if (!updatedSteps['job_scheduled']?.completed) {
        updatedSteps['job_scheduled'] = {
          completed: true,
          completed_at: new Date().toISOString(),
          notes: 'Auto-completed from scheduled date',
        };
        stepsCompleted.push('job_scheduled');
      }
    }

    if (job.assigned_to) {
      if (!updatedSteps['technician_assigned']?.completed) {
        updatedSteps['technician_assigned'] = {
          completed: true,
          completed_at: new Date().toISOString(),
          notes: 'Auto-completed from technician assignment',
        };
        stepsCompleted.push('technician_assigned');
      }
    }

    // Update job with completed steps
    if (stepsCompleted.length > 0) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          stage_steps: updatedSteps,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        return { success: false, steps_completed: [] };
      }
    }

    return {
      success: true,
      steps_completed: stepsCompleted,
    };
  } catch (error) {
    console.error('Error auto-completing from job data:', error);
    return { success: false, steps_completed: [] };
  }
}

// ============================================================================
// Initial Stage Setup
// ============================================================================

/**
 * Initialize stage data for a newly created job
 * Sets appropriate initial stage and completes any relevant steps
 */
export async function initializeJobStage(
  jobId: string,
  hasProposal: boolean = false
): Promise<{ success: boolean; initial_stage: string }> {
  const supabase = await createClient();

  try {
    // Determine initial stage
    const initialStage = hasProposal ? 'beginning' : 'beginning';
    const initialSteps: Record<string, StepStatus> = {};

    // If created from proposal, run auto-completion
    if (hasProposal) {
      // Fetch proposal ID
      const { data: job } = await supabase
        .from('jobs')
        .select('proposal_id')
        .eq('id', jobId)
        .single();

      if (job?.proposal_id) {
        await autoCompleteFromProposal(jobId, job.proposal_id);
      }
    }

    // Auto-complete from job data (scheduled_date, assigned_to)
    await autoCompleteFromJobData(jobId);

    return {
      success: true,
      initial_stage: initialStage,
    };
  } catch (error) {
    console.error('Error initializing job stage:', error);
    return {
      success: false,
      initial_stage: 'beginning',
    };
  }
}

// ============================================================================
// Invoice Payment Webhooks
// ============================================================================

/**
 * Handle deposit payment webhook
 * Auto-completes deposit payment step
 */
export async function handleDepositPayment(
  jobId: string,
  paidAt: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('stage_steps')
      .eq('id', jobId)
      .single();

    if (!job) return { success: false };

    const stageSteps = job.stage_steps || {};
    const updatedSteps = {
      ...stageSteps,
      deposit_invoice_paid: {
        completed: true,
        completed_at: paidAt,
        notes: 'Auto-completed from payment webhook',
      },
    };

    await supabase
      .from('jobs')
      .update({
        stage_steps: updatedSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Handle progress payment webhook
 * Auto-completes rough-in payment step
 */
export async function handleProgressPayment(
  jobId: string,
  paidAt: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('stage_steps')
      .eq('id', jobId)
      .single();

    if (!job) return { success: false };

    const stageSteps = job.stage_steps || {};
    const updatedSteps = {
      ...stageSteps,
      rough_in_invoice_paid: {
        completed: true,
        completed_at: paidAt,
        notes: 'Auto-completed from payment webhook',
      },
    };

    await supabase
      .from('jobs')
      .update({
        stage_steps: updatedSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Handle final payment webhook
 * Auto-completes final payment step
 */
export async function handleFinalPayment(
  jobId: string,
  paidAt: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('stage_steps')
      .eq('id', jobId)
      .single();

    if (!job) return { success: false };

    const stageSteps = job.stage_steps || {};
    const updatedSteps = {
      ...stageSteps,
      final_invoice_paid: {
        completed: true,
        completed_at: paidAt,
        notes: 'Auto-completed from payment webhook',
      },
    };

    await supabase
      .from('jobs')
      .update({
        stage_steps: updatedSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ============================================================================
// Scheduled Auto-Completion Check
// ============================================================================

/**
 * Check and auto-complete steps for all active jobs
 * Can be run on a schedule (daily/hourly) to catch any missed events
 */
export async function runAutoCompletionCheck(): Promise<{
  success: boolean;
  jobs_updated: number;
  total_steps_completed: number;
}> {
  const supabase = await createClient();
  let jobsUpdated = 0;
  let totalStepsCompleted = 0;

  try {
    // Fetch all active jobs (not completed or archived)
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, proposal_id, stage')
      .in('stage', ['beginning', 'rough_in', 'trim_out', 'closing'])
      .order('created_at', { ascending: false });

    if (error || !jobs) {
      return { success: false, jobs_updated: 0, total_steps_completed: 0 };
    }

    // Process each job
    for (const job of jobs) {
      let stepsCompleted = 0;

      // Auto-complete from job data
      const jobDataResult = await autoCompleteFromJobData(job.id);
      if (jobDataResult.success) {
        stepsCompleted += jobDataResult.steps_completed.length;
      }

      // Auto-complete from proposal if exists
      if (job.proposal_id) {
        const proposalResult = await autoCompleteFromProposal(job.id, job.proposal_id);
        if (proposalResult.success) {
          stepsCompleted += proposalResult.steps_completed.length;
        }
      }

      if (stepsCompleted > 0) {
        jobsUpdated++;
        totalStepsCompleted += stepsCompleted;
      }
    }

    return {
      success: true,
      jobs_updated: jobsUpdated,
      total_steps_completed: totalStepsCompleted,
    };
  } catch (error) {
    console.error('Error running auto-completion check:', error);
    return { success: false, jobs_updated: 0, total_steps_completed: 0 };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Sync proposal updates to job stages
 * Call this whenever a proposal is updated
 */
export async function syncProposalToJobStages(proposalId: string): Promise<{
  success: boolean;
  steps_completed: string[];
}> {
  const supabase = await createClient();

  try {
    // Find job associated with proposal
    const { data: job, error } = await supabase
      .from('jobs')
      .select('id')
      .eq('proposal_id', proposalId)
      .single();

    if (error || !job) {
      return { success: false, steps_completed: [] };
    }

    // Run auto-completion
    return await autoCompleteFromProposal(job.id, proposalId);
  } catch (error) {
    return { success: false, steps_completed: [] };
  }
}

/**
 * Check if job is ready to advance to next stage
 * Returns true if all required steps are complete
 */
export async function isReadyToAdvanceStage(jobId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (!job) return false;

    // Import here to avoid circular dependency
    const { areRequiredStepsComplete } = await import('./definitions');
    return areRequiredStepsComplete(job.stage, job.stage_steps || {});
  } catch (error) {
    return false;
  }
}
