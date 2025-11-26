// Status synchronization utilities for jobs and proposals

export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent', 
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DEPOSIT_PAID: 'deposit paid',
  ROUGH_IN_PAID: 'rough-in paid',
  FINAL_PAID: 'final paid',
  COMPLETED: 'completed'
} as const

export const JOB_STATUSES = {
  // Planning Phase
  NOT_SCHEDULED: 'not_scheduled',
  ESTIMATE: 'estimate',
  SCHEDULED: 'scheduled',
  ASK_VADIM: 'ask_vadim',
  
  // Active Work Phase
  START_UP: 'start_up',
  WORKING_ON_IT: 'working_on_it',
  PARTS_NEEDED: 'parts_needed',
  
  // Completion Phase
  DONE: 'done',
  SENT_INVOICE: 'sent_invoice',
  WARRANTY: 'warranty',
  WARRANTY_NO_CHARGE: 'warranty_no_charge',
  
  // Final States
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled'
} as const

export const STATUS_LABELS: Record<string, string> = {
  not_scheduled: 'Not Scheduled',
  estimate: 'Estimate',
  scheduled: 'Scheduled',
  ask_vadim: 'Ask Vadim',
  start_up: 'Start Up',
  working_on_it: 'Working On It',
  parts_needed: 'Parts Needed',
  done: 'Done',
  sent_invoice: 'Sent Invoice',
  warranty: 'Warranty',
  warranty_no_charge: 'Warranty/No Charge',
  completed: 'Completed',
  archived: 'Archived',
  cancelled: 'Cancelled'
}

export const STATUS_COLORS: Record<string, string> = {
  not_scheduled: 'bg-gray-100 text-gray-800',
  estimate: 'bg-purple-100 text-purple-800',
  scheduled: 'bg-blue-100 text-blue-800',
  ask_vadim: 'bg-red-100 text-red-800 font-bold',
  start_up: 'bg-yellow-100 text-yellow-800',
  working_on_it: 'bg-yellow-200 text-yellow-900 font-semibold',
  parts_needed: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  sent_invoice: 'bg-green-200 text-green-900',
  warranty: 'bg-green-300 text-green-950',
  warranty_no_charge: 'bg-blue-200 text-blue-900',
  completed: 'bg-green-400 text-green-950 font-bold',
  archived: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-800'
}

/**
 * Maps proposal status to corresponding job status
 */
export function getJobStatusFromProposal(proposalStatus: string): string {
  switch (proposalStatus) {
    case PROPOSAL_STATUSES.APPROVED:
    case PROPOSAL_STATUSES.DEPOSIT_PAID:
      return JOB_STATUSES.SCHEDULED
    case PROPOSAL_STATUSES.ROUGH_IN_PAID:
    case PROPOSAL_STATUSES.FINAL_PAID:
      return JOB_STATUSES.WORKING_ON_IT
    case PROPOSAL_STATUSES.COMPLETED:
      return JOB_STATUSES.DONE
    case PROPOSAL_STATUSES.REJECTED:
      return JOB_STATUSES.CANCELLED
    default:
      return JOB_STATUSES.NOT_SCHEDULED
  }
}

/**
 * Maps job status to corresponding proposal status
 */
export function getProposalStatusFromJob(jobStatus: string): string {
  switch (jobStatus) {
    case JOB_STATUSES.ESTIMATE:
    case JOB_STATUSES.NOT_SCHEDULED:
      return PROPOSAL_STATUSES.DRAFT
    case JOB_STATUSES.SCHEDULED:
    case JOB_STATUSES.ASK_VADIM:
      return PROPOSAL_STATUSES.APPROVED
    case JOB_STATUSES.START_UP:
    case JOB_STATUSES.WORKING_ON_IT:
    case JOB_STATUSES.PARTS_NEEDED:
      return PROPOSAL_STATUSES.ROUGH_IN_PAID
    case JOB_STATUSES.DONE:
    case JOB_STATUSES.SENT_INVOICE:
      return PROPOSAL_STATUSES.FINAL_PAID
    case JOB_STATUSES.WARRANTY:
    case JOB_STATUSES.WARRANTY_NO_CHARGE:
    case JOB_STATUSES.COMPLETED:
    case JOB_STATUSES.ARCHIVED:
      return PROPOSAL_STATUSES.COMPLETED
    case JOB_STATUSES.CANCELLED:
      return PROPOSAL_STATUSES.REJECTED
    default:
      return PROPOSAL_STATUSES.DRAFT
  }
}

/**
 * Gets the display status that should be shown to users
 */
export function getUnifiedDisplayStatus(jobStatus: string, proposalStatus: string): string {
  // If there's a proposal, prioritize its payment statuses for better visibility
  if (proposalStatus) {
    // Payment-specific statuses from proposal take priority
    switch (proposalStatus) {
      case PROPOSAL_STATUSES.COMPLETED:
        return 'Completed'
      case PROPOSAL_STATUSES.FINAL_PAID:
        return 'Final Payment Complete'
      case PROPOSAL_STATUSES.ROUGH_IN_PAID:
        return 'Rough-In Paid'
      case PROPOSAL_STATUSES.DEPOSIT_PAID:
        return 'Deposit Paid'
      case PROPOSAL_STATUSES.APPROVED:
        return 'Approved'
      case PROPOSAL_STATUSES.REJECTED:
        return 'Rejected'
      case PROPOSAL_STATUSES.SENT:
        return 'Sent'
      case PROPOSAL_STATUSES.DRAFT:
        return 'Draft'
    }
  }
  
  // Use STATUS_LABELS for job status display
  return STATUS_LABELS[jobStatus] || jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1).replace('_', ' ')
}

/**
 * Synchronize job and proposal statuses bidirectionally
 */
export async function syncJobProposalStatus(
  supabase: any,
  jobId: string,
  proposalId: string,
  newStatus: string,
  updatedBy: 'job' | 'proposal'
) {
  try {
    if (updatedBy === 'job') {
      // Job status changed, update proposal accordingly
      const newProposalStatus = getProposalStatusFromJob(newStatus)
      
      await supabase
        .from('proposals')
        .update({ status: newProposalStatus })
        .eq('id', proposalId)
        
      console.log(`Synced proposal ${proposalId}: ${newProposalStatus} (from job: ${newStatus})`)
      
    } else {
      // Proposal status changed, update job accordingly  
      const newJobStatus = getJobStatusFromProposal(newStatus)
      
      await supabase
        .from('jobs')
        .update({ status: newJobStatus })
        .eq('id', jobId)
        
      console.log(`Synced job ${jobId}: ${newJobStatus} (from proposal: ${newStatus})`)
    }
  } catch (error) {
    console.error('Error syncing job/proposal status:', error)
    throw error
  }
}

