/**
 * Dashboard Activities Feed
 * Generates recent activity feed from proposals, jobs, and technician assignments
 */

import { formatCurrency } from '@/lib/utils'

interface Proposal {
  id: string
  proposal_number: string
  status: string
  created_at: string
  sent_at?: string
  approved_at?: string
  updated_at?: string
  deposit_amount?: number
  deposit_paid_at?: string
  progress_payment_amount?: number
  progress_paid_at?: string
  final_payment_amount?: number
  final_paid_at?: string
  customers?: { name: string; email: string }
}

interface Job {
  id: string
  job_number: string
  status: string
  created_at: string
  updated_at: string
  scheduled_date?: string
  customers?: { name: string }
}

interface TechAssignment {
  id: string
  created_at: string
  jobs?: { job_number: string }
  profiles?: { full_name: string; email: string }
}

export interface Activity {
  id: string
  activity_type: string
  description: string
  created_at: string
  timestamp: number
}

/**
 * Generate activities from proposals
 */
export function generateProposalActivities(proposals: Proposal[]): Activity[] {
  const activities: Activity[] = []
  
  for (const proposal of proposals.slice(0, 30)) {
    // Created
    activities.push({
      id: `${proposal.id}-created`,
      activity_type: 'proposal_created',
      description: `Proposal #${proposal.proposal_number} created for ${proposal.customers?.name || 'customer'}`,
      created_at: proposal.created_at,
      timestamp: new Date(proposal.created_at).getTime()
    })
    
    // Status-based activities
    if (proposal.status === 'sent' && proposal.sent_at) {
      activities.push({
        id: `${proposal.id}-sent`,
        activity_type: 'proposal_sent',
        description: `Proposal #${proposal.proposal_number} sent to ${proposal.customers?.email || 'customer'}`,
        created_at: proposal.sent_at,
        timestamp: new Date(proposal.sent_at).getTime()
      })
    }
    
    if (proposal.status === 'approved' && proposal.approved_at) {
      activities.push({
        id: `${proposal.id}-approved`,
        activity_type: 'proposal_approved',
        description: `Proposal #${proposal.proposal_number} approved by ${proposal.customers?.name || 'customer'}`,
        created_at: proposal.approved_at,
        timestamp: new Date(proposal.approved_at).getTime()
      })
    }
    
    if (proposal.status === 'rejected' && proposal.updated_at) {
      activities.push({
        id: `${proposal.id}-rejected`,
        activity_type: 'proposal_rejected',
        description: `Proposal #${proposal.proposal_number} rejected`,
        created_at: proposal.updated_at,
        timestamp: new Date(proposal.updated_at).getTime()
      })
    }
    
    // Payment activities
    if (proposal.deposit_paid_at) {
      activities.push({
        id: `${proposal.id}-deposit`,
        activity_type: 'payment_received',
        description: `💰 Deposit payment received for Proposal #${proposal.proposal_number} (${formatCurrency(proposal.deposit_amount || 0)})`,
        created_at: proposal.deposit_paid_at,
        timestamp: new Date(proposal.deposit_paid_at).getTime()
      })
    }
    
    if (proposal.progress_paid_at) {
      activities.push({
        id: `${proposal.id}-roughin`,
        activity_type: 'payment_received',
        description: `💰 Rough-in payment received for Proposal #${proposal.proposal_number} (${formatCurrency(proposal.progress_payment_amount || 0)})`,
        created_at: proposal.progress_paid_at,
        timestamp: new Date(proposal.progress_paid_at).getTime()
      })
    }
    
    if (proposal.final_paid_at) {
      activities.push({
        id: `${proposal.id}-final`,
        activity_type: 'payment_received',
        description: `💰 Final payment received for Proposal #${proposal.proposal_number} (${formatCurrency(proposal.final_payment_amount || 0)})`,
        created_at: proposal.final_paid_at,
        timestamp: new Date(proposal.final_paid_at).getTime()
      })
    }
  }
  
  return activities
}

/**
 * Generate activities from jobs
 */
export function generateJobActivities(jobs: Job[]): Activity[] {
  const activities: Activity[] = []
  
  for (const job of jobs) {
    // Job created
    activities.push({
      id: `${job.id}-created`,
      activity_type: 'job_created',
      description: `Job #${job.job_number} created for ${job.customers?.name || 'customer'}`,
      created_at: job.created_at,
      timestamp: new Date(job.created_at).getTime()
    })
    
    // Job status updates
    if (job.status === 'scheduled' && job.scheduled_date) {
      activities.push({
        id: `${job.id}-scheduled`,
        activity_type: 'job_scheduled',
        description: `Job #${job.job_number} scheduled for ${new Date(job.scheduled_date).toLocaleDateString()}`,
        created_at: job.updated_at,
        timestamp: new Date(job.updated_at).getTime()
      })
    }
    
    if (job.status === 'working_on_it') {
      activities.push({
        id: `${job.id}-started`,
        activity_type: 'job_started',
        description: `Job #${job.job_number} work started`,
        created_at: job.updated_at,
        timestamp: new Date(job.updated_at).getTime()
      })
    }
    
    if (job.status === 'done') {
      activities.push({
        id: `${job.id}-completed`,
        activity_type: 'job_completed',
        description: `Job #${job.job_number} completed`,
        created_at: job.updated_at,
        timestamp: new Date(job.updated_at).getTime()
      })
    }
  }
  
  return activities
}

/**
 * Generate activities from technician assignments
 */
export function generateTechAssignmentActivities(assignments: TechAssignment[]): Activity[] {
  return assignments.map(assignment => ({
    id: `tech-${assignment.id}`,
    activity_type: 'technician_assigned',
    description: `Technician ${assignment.profiles?.full_name || 'assigned'} to Job #${assignment.jobs?.job_number || 'unknown'}`,
    created_at: assignment.created_at,
    timestamp: new Date(assignment.created_at).getTime()
  }))
}

/**
 * Combine and filter activities from all sources
 * Returns the most recent 20 activities from the last 7 days
 */
export function combineActivities(
  proposalActivities: Activity[],
  jobActivities: Activity[],
  techActivities: Activity[]
): Activity[] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  return [...proposalActivities, ...jobActivities, ...techActivities]
    .filter(a => a.timestamp > sevenDaysAgo.getTime())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
}
