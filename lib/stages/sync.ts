/**
 * Stage-Based Workflow System - Status Sync
 *
 * Handles bidirectional synchronization between old job status field
 * and new stage-based workflow system for backwards compatibility
 */

import { JobStage, StepStatus } from './definitions';

// ============================================================================
// Job Status Type (from database)
// ============================================================================

/**
 * All possible job statuses (14 statuses from phase 10 migration)
 */
export type JobStatus =
  // Planning Phase (4)
  | 'not_scheduled'
  | 'estimate'
  | 'scheduled'
  | 'ask_vadim'
  // Active Work Phase (3)
  | 'start_up'
  | 'working_on_it'
  | 'parts_needed'
  // Completion Phase (4)
  | 'done'
  | 'sent_invoice'
  | 'warranty'
  | 'warranty_no_charge'
  // Final States (3)
  | 'completed'
  | 'archived'
  | 'cancelled';

// ============================================================================
// Status → Stage Inference
// ============================================================================

/**
 * Infer stage from job status (for backwards compatibility)
 * Used when migrating existing jobs or when status is updated directly
 */
export function inferStageFromStatus(status: JobStatus): JobStage {
  // Completed/Archived jobs
  if (status === 'completed' || status === 'archived') {
    return 'completed';
  }

  // Closing stage - final invoicing and completion
  if (
    status === 'sent_invoice' ||
    status === 'warranty' ||
    status === 'warranty_no_charge'
  ) {
    return 'closing';
  }

  // Trim Out stage - finishing work (done = ready for startup)
  if (status === 'done') {
    return 'trim_out';
  }

  // Rough In stage - active installation work
  if (
    status === 'working_on_it' ||
    status === 'parts_needed' ||
    status === 'start_up'
  ) {
    return 'rough_in';
  }

  // Beginning stage - everything else (planning, scheduling, etc.)
  // Includes: not_scheduled, estimate, scheduled, ask_vadim, cancelled
  return 'beginning';
}

/**
 * Infer stage from status with step analysis
 * More sophisticated version that also considers completed steps
 */
export function inferStageFromStatusAndSteps(
  status: JobStatus,
  stageSteps: Record<string, StepStatus>
): JobStage {
  // Start with basic status inference
  const baseStage = inferStageFromStatus(status);

  // If stage_steps is empty, use base inference
  if (Object.keys(stageSteps).length === 0) {
    return baseStage;
  }

  // Check if we should be in a more advanced stage based on completed steps
  // For example, if status is 'working_on_it' but inspection_passed is complete,
  // we should be in trim_out stage

  // Check for closing stage indicators
  if (
    stageSteps['startup_complete']?.completed ||
    stageSteps['final_walkthrough']?.completed
  ) {
    return 'closing';
  }

  // Check for trim out stage indicators
  if (
    stageSteps['trim_out_started']?.completed ||
    stageSteps['startup_scheduled']?.completed
  ) {
    return 'trim_out';
  }

  // Check for rough in stage indicators
  if (
    stageSteps['rough_in_started']?.completed ||
    stageSteps['inspection_scheduled']?.completed
  ) {
    return 'rough_in';
  }

  // Check for beginning stage completion
  if (stageSteps['ready_to_start']?.completed) {
    return 'rough_in'; // Ready to move to rough in
  }

  return baseStage;
}

// ============================================================================
// Stage → Status Inference
// ============================================================================

/**
 * Infer appropriate status from stage and completed steps
 * Used when stage changes or steps are completed
 */
export function inferStatusFromStage(
  stage: JobStage,
  stageSteps: Record<string, StepStatus>,
  currentStatus?: JobStatus
): JobStatus {
  switch (stage) {
    case 'beginning':
      // Check progress through beginning stage
      if (stageSteps['ready_to_start']?.completed) {
        return 'scheduled'; // Ready to start work
      }
      if (stageSteps['job_scheduled']?.completed) {
        return 'scheduled';
      }
      if (stageSteps['proposal_approved']?.completed) {
        return 'scheduled';
      }
      // Still in planning
      return currentStatus === 'estimate' || currentStatus === 'ask_vadim'
        ? currentStatus
        : 'not_scheduled';

    case 'rough_in':
      // Check progress through rough in stage
      if (stageSteps['inspection_passed']?.completed) {
        return 'done'; // Ready to move to trim out
      }
      if (stageSteps['inspection_scheduled']?.completed) {
        return 'working_on_it';
      }
      if (stageSteps['parts_needed']?.completed === false) {
        return 'parts_needed'; // Waiting for parts
      }
      return 'working_on_it';

    case 'trim_out':
      // Check progress through trim out stage
      if (stageSteps['startup_pending']?.completed) {
        return 'done'; // Waiting for startup
      }
      if (stageSteps['startup_scheduled']?.completed) {
        return 'done';
      }
      if (stageSteps['trim_out_completed']?.completed) {
        return 'done';
      }
      return 'working_on_it';

    case 'closing':
      // Check progress through closing stage
      if (stageSteps['job_complete']?.completed) {
        return 'completed'; // Fully finished
      }
      if (stageSteps['customer_signed_off']?.completed) {
        return 'sent_invoice';
      }
      if (stageSteps['final_walkthrough']?.completed) {
        return 'sent_invoice';
      }
      if (stageSteps['startup_complete']?.completed) {
        return 'sent_invoice';
      }
      // Check if this is warranty work
      if (currentStatus === 'warranty' || currentStatus === 'warranty_no_charge') {
        return currentStatus;
      }
      return 'sent_invoice';

    case 'completed':
      return currentStatus === 'archived' ? 'archived' : 'completed';

    default:
      return 'not_scheduled';
  }
}

// ============================================================================
// Bidirectional Sync
// ============================================================================

/**
 * Sync status and stage fields bidirectionally
 * Call this whenever either status or stage changes
 */
export function syncStatusAndStage(
  currentStatus: JobStatus,
  currentStage: JobStage,
  stageSteps: Record<string, StepStatus>,
  changeTrigger: 'status' | 'stage'
): { status: JobStatus; stage: JobStage } {
  if (changeTrigger === 'status') {
    // Status was changed, update stage to match
    const inferredStage = inferStageFromStatusAndSteps(currentStatus, stageSteps);
    return {
      status: currentStatus,
      stage: inferredStage,
    };
  } else {
    // Stage was changed, update status to match
    const inferredStatus = inferStatusFromStage(currentStage, stageSteps, currentStatus);
    return {
      status: inferredStatus,
      stage: currentStage,
    };
  }
}

/**
 * Determine if status change should trigger stage change
 */
export function shouldStatusTriggerStageChange(
  oldStatus: JobStatus,
  newStatus: JobStatus,
  currentStage: JobStage
): boolean {
  const newStage = inferStageFromStatus(newStatus);
  return newStage !== currentStage;
}

/**
 * Determine if stage change should trigger status change
 */
export function shouldStageTriggerStatusChange(
  oldStage: JobStage,
  newStage: JobStage,
  currentStatus: JobStatus,
  stageSteps: Record<string, StepStatus>
): boolean {
  const newStatus = inferStatusFromStage(newStage, stageSteps, currentStatus);
  return newStatus !== currentStatus;
}

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Get default stage steps for a job being migrated
 * Attempts to infer which steps should be marked complete based on current state
 */
export function getDefaultStageStepsForMigration(
  status: JobStatus,
  stage: JobStage,
  hasProposal: boolean,
  hasScheduledDate: boolean,
  hasAssignedTech: boolean
): Record<string, StepStatus> {
  const steps: Record<string, StepStatus> = {};
  const now = new Date().toISOString();

  // Beginning stage steps
  if (stage === 'beginning' || stage === 'rough_in' || stage === 'trim_out' || stage === 'closing') {
    if (hasProposal) {
      steps['proposal_approved'] = { completed: true, completed_at: now };
    }
    if (hasScheduledDate) {
      steps['job_scheduled'] = { completed: true, completed_at: now };
    }
    if (hasAssignedTech) {
      steps['technician_assigned'] = { completed: true, completed_at: now };
    }
  }

  // Rough in stage steps
  if (stage === 'rough_in' || stage === 'trim_out' || stage === 'closing') {
    steps['rough_in_started'] = { completed: true, completed_at: now };
    if (status === 'working_on_it' || status === 'parts_needed') {
      // Currently in progress
    } else if (status === 'done') {
      steps['inspection_passed'] = { completed: true, completed_at: now };
    }
  }

  // Trim out stage steps
  if (stage === 'trim_out' || stage === 'closing') {
    steps['trim_out_started'] = { completed: true, completed_at: now };
    if (stage !== 'trim_out') {
      steps['trim_out_completed'] = { completed: true, completed_at: now };
    }
  }

  // Closing stage steps
  if (stage === 'closing') {
    steps['startup_complete'] = { completed: true, completed_at: now };
  }

  // Completed stage
  if (stage === 'completed') {
    steps['job_complete'] = { completed: true, completed_at: now };
  }

  return steps;
}

/**
 * Validate status-stage consistency
 * Returns array of warnings if status and stage don't align
 */
export function validateStatusStageConsistency(
  status: JobStatus,
  stage: JobStage,
  stageSteps: Record<string, StepStatus>
): string[] {
  const warnings: string[] = [];

  const expectedStage = inferStageFromStatusAndSteps(status, stageSteps);
  const expectedStatus = inferStatusFromStage(stage, stageSteps, status);

  if (expectedStage !== stage) {
    warnings.push(
      `Status "${status}" suggests stage "${expectedStage}" but job is in stage "${stage}"`
    );
  }

  if (expectedStatus !== status && Math.abs(getStageOrder(expectedStage) - getStageOrder(stage)) > 1) {
    warnings.push(
      `Stage "${stage}" suggests status "${expectedStatus}" but job has status "${status}"`
    );
  }

  return warnings;
}

/**
 * Helper to get stage order for comparison
 */
function getStageOrder(stage: JobStage): number {
  const order: Record<JobStage, number> = {
    beginning: 1,
    rough_in: 2,
    trim_out: 3,
    closing: 4,
    completed: 5,
  };
  return order[stage] || 0;
}

// ============================================================================
// Status Display Helpers
// ============================================================================

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    not_scheduled: 'Not Scheduled',
    estimate: 'Estimate',
    scheduled: 'Scheduled',
    ask_vadim: 'Ask Vadim',
    start_up: 'Start Up',
    working_on_it: 'Working On It',
    parts_needed: 'Parts Needed',
    done: 'Done',
    sent_invoice: 'Invoice Sent',
    warranty: 'Warranty',
    warranty_no_charge: 'Warranty (No Charge)',
    completed: 'Completed',
    archived: 'Archived',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: JobStatus): string {
  // Planning Phase
  if (['not_scheduled', 'estimate', 'ask_vadim'].includes(status)) {
    return 'gray';
  }
  // Scheduled
  if (status === 'scheduled') {
    return 'blue';
  }
  // Active Work
  if (['start_up', 'working_on_it'].includes(status)) {
    return 'yellow';
  }
  // Waiting
  if (status === 'parts_needed') {
    return 'orange';
  }
  // Completed Work
  if (['done', 'sent_invoice'].includes(status)) {
    return 'green';
  }
  // Warranty
  if (['warranty', 'warranty_no_charge'].includes(status)) {
    return 'purple';
  }
  // Final States
  if (['completed', 'archived'].includes(status)) {
    return 'gray';
  }
  // Cancelled
  if (status === 'cancelled') {
    return 'red';
  }
  return 'gray';
}
