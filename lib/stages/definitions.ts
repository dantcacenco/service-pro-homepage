/**
 * Stage-Based Workflow System - Definitions
 *
 * Defines the 4-stage workflow for HVAC job management:
 * 1. Beginning - Proposal to job creation
 * 2. Rough In - Initial installation and inspection
 * 3. Trim Out - Finishing work and startup
 * 4. Closing - Final invoicing and completion
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Job stage enum matching database enum
 */
export type JobStage = 'beginning' | 'rough_in' | 'trim_out' | 'closing' | 'completed';

/**
 * Individual step within a stage
 */
export interface StageStep {
  id: string;
  label: string;
  description: string;
  order: number;
  required: boolean; // If true, must be completed before moving to next stage
  autoCompletable: boolean; // If true, can be auto-completed by system events
}

/**
 * Step completion status stored in database
 */
export interface StepStatus {
  completed: boolean;
  completed_at?: string; // ISO timestamp
  completed_by?: string; // User ID who completed it
  notes?: string;
}

/**
 * Stage definition with metadata
 */
export interface StageDefinition {
  id: JobStage;
  name: string;
  description: string;
  order: number;
  color: string; // Tailwind color class
  steps: StageStep[];
}

/**
 * Stage history entry (audit trail)
 */
export interface StageHistoryEntry {
  stage: JobStage;
  entered_at: string; // ISO timestamp
  previous_stage?: JobStage;
  notes?: string;
  changed_by?: string; // User ID
}

/**
 * Complete stage data for a job
 */
export interface JobStageData {
  stage: JobStage;
  stage_steps: Record<string, StepStatus>; // JSONB object from database
  stage_history: StageHistoryEntry[]; // JSONB array from database
}

// ============================================================================
// Stage Definitions
// ============================================================================

/**
 * Stage 1: Beginning
 * From proposal approval through job scheduling and preparation
 */
const BEGINNING_STEPS: StageStep[] = [
  {
    id: 'proposal_approved',
    label: 'Proposal Approved',
    description: 'Customer has approved the proposal and signed agreement',
    order: 1,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.status = 'approved'
  },
  {
    id: 'deposit_invoice_sent',
    label: 'Deposit Invoice Sent',
    description: 'Deposit invoice has been sent to customer',
    order: 2,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.deposit_invoice_sent_at exists
  },
  {
    id: 'deposit_invoice_paid',
    label: 'Deposit Invoice Paid',
    description: 'Customer has paid the deposit invoice',
    order: 3,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.deposit_paid_at exists
  },
  {
    id: 'job_scheduled',
    label: 'Job Scheduled',
    description: 'Installation date has been scheduled with customer',
    order: 4,
    required: true,
    autoCompletable: false, // Manual scheduling required
  },
  {
    id: 'technician_assigned',
    label: 'Technician Assigned',
    description: 'Lead technician has been assigned to the job',
    order: 5,
    required: true,
    autoCompletable: false, // Manual assignment required
  },
  {
    id: 'materials_ordered',
    label: 'Materials Ordered',
    description: 'All necessary materials and equipment have been ordered',
    order: 6,
    required: false,
    autoCompletable: false, // Manual confirmation required
  },
  {
    id: 'ready_to_start',
    label: 'Ready to Start',
    description: 'All preparations complete, ready to begin installation',
    order: 7,
    required: true,
    autoCompletable: false, // Manual confirmation before starting
  },
];

/**
 * Stage 2: Rough In
 * Initial installation work and inspection
 */
const ROUGH_IN_STEPS: StageStep[] = [
  {
    id: 'rough_in_started',
    label: 'Rough In Started',
    description: 'Rough in work has begun on site',
    order: 1,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'rough_in_invoice_sent',
    label: 'Progress Invoice Sent',
    description: 'Progress payment invoice sent to customer',
    order: 2,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.progress_invoice_sent_at exists
  },
  {
    id: 'rough_in_invoice_paid',
    label: 'Progress Invoice Paid',
    description: 'Customer has paid the progress invoice',
    order: 3,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.progress_paid_at exists
  },
  {
    id: 'inspection_scheduled',
    label: 'Inspection Scheduled',
    description: 'City/county inspection has been scheduled',
    order: 4,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'inspection_passed',
    label: 'Inspection Passed',
    description: 'Rough in inspection passed successfully',
    order: 5,
    required: true,
    autoCompletable: false, // Manual confirmation after inspection
  },
];

/**
 * Stage 3: Trim Out
 * Finishing work, testing, and startup preparation
 */
const TRIM_OUT_STEPS: StageStep[] = [
  {
    id: 'trim_out_scheduled',
    label: 'Trim Out Scheduled',
    description: 'Return visit scheduled for trim out work',
    order: 1,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'trim_out_started',
    label: 'Trim Out Started',
    description: 'Finishing work has begun',
    order: 2,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'trim_out_completed',
    label: 'Trim Out Completed',
    description: 'All finishing work completed',
    order: 3,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'final_invoice_sent',
    label: 'Final Invoice Sent',
    description: 'Final payment invoice sent to customer',
    order: 4,
    required: true,
    autoCompletable: true, // Auto-completed when proposal.final_invoice_sent_at exists
  },
  {
    id: 'final_invoice_paid',
    label: 'Final Invoice Paid',
    description: 'Customer has paid the final invoice',
    order: 5,
    required: false, // Can proceed to startup even if payment pending
    autoCompletable: true, // Auto-completed when proposal.final_paid_at exists
  },
  {
    id: 'startup_scheduled',
    label: 'Startup Scheduled',
    description: 'System startup visit scheduled with customer',
    order: 6,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'startup_pending',
    label: 'Startup Pending',
    description: 'Ready for startup, waiting for scheduled date',
    order: 7,
    required: true,
    autoCompletable: false,
  },
];

/**
 * Stage 4: Closing
 * System startup, final walkthrough, and job completion
 */
const CLOSING_STEPS: StageStep[] = [
  {
    id: 'startup_complete',
    label: 'Startup Complete',
    description: 'System startup performed and operational',
    order: 1,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'final_walkthrough',
    label: 'Final Walkthrough',
    description: 'Final walkthrough completed with customer',
    order: 2,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'customer_signed_off',
    label: 'Customer Signed Off',
    description: 'Customer has signed off on completed work',
    order: 3,
    required: true,
    autoCompletable: false,
  },
  {
    id: 'job_complete',
    label: 'Job Complete',
    description: 'All work finished, ready to archive',
    order: 4,
    required: true,
    autoCompletable: false,
  },
];

// ============================================================================
// Stage Definitions Map
// ============================================================================

export const STAGE_DEFINITIONS: Record<JobStage, StageDefinition> = {
  beginning: {
    id: 'beginning',
    name: 'Beginning',
    description: 'Proposal approval through job preparation',
    order: 1,
    color: 'blue',
    steps: BEGINNING_STEPS,
  },
  rough_in: {
    id: 'rough_in',
    name: 'Rough In',
    description: 'Initial installation and inspection',
    order: 2,
    color: 'yellow',
    steps: ROUGH_IN_STEPS,
  },
  trim_out: {
    id: 'trim_out',
    name: 'Trim Out',
    description: 'Finishing work and startup preparation',
    order: 3,
    color: 'orange',
    steps: TRIM_OUT_STEPS,
  },
  closing: {
    id: 'closing',
    name: 'Closing',
    description: 'Final startup and completion',
    order: 4,
    color: 'green',
    steps: CLOSING_STEPS,
  },
  completed: {
    id: 'completed',
    name: 'Completed',
    description: 'Job finished and archived',
    order: 5,
    color: 'gray',
    steps: [],
  },
};

/**
 * Ordered array of all stages (for progression logic)
 */
export const STAGES_IN_ORDER: JobStage[] = [
  'beginning',
  'rough_in',
  'trim_out',
  'closing',
  'completed',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get stage definition by ID
 */
export function getStageDefinition(stage: JobStage): StageDefinition {
  return STAGE_DEFINITIONS[stage];
}

/**
 * Get all steps for a specific stage
 */
export function getStageSteps(stage: JobStage): StageStep[] {
  return STAGE_DEFINITIONS[stage].steps;
}

/**
 * Get a specific step definition
 */
export function getStepDefinition(stage: JobStage, stepId: string): StageStep | undefined {
  return STAGE_DEFINITIONS[stage].steps.find((step) => step.id === stepId);
}

/**
 * Get required steps for a stage
 */
export function getRequiredSteps(stage: JobStage): StageStep[] {
  return STAGE_DEFINITIONS[stage].steps.filter((step) => step.required);
}

/**
 * Get auto-completable steps for a stage
 */
export function getAutoCompletableSteps(stage: JobStage): StageStep[] {
  return STAGE_DEFINITIONS[stage].steps.filter((step) => step.autoCompletable);
}

/**
 * Get next stage in progression
 */
export function getNextStage(currentStage: JobStage): JobStage | null {
  const currentIndex = STAGES_IN_ORDER.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === STAGES_IN_ORDER.length - 1) {
    return null; // Already at last stage or invalid stage
  }
  return STAGES_IN_ORDER[currentIndex + 1];
}

/**
 * Get previous stage in progression
 */
export function getPreviousStage(currentStage: JobStage): JobStage | null {
  const currentIndex = STAGES_IN_ORDER.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null; // Already at first stage or invalid stage
  }
  return STAGES_IN_ORDER[currentIndex - 1];
}

/**
 * Check if stage A comes before stage B
 */
export function isStageEarlier(stageA: JobStage, stageB: JobStage): boolean {
  const indexA = STAGES_IN_ORDER.indexOf(stageA);
  const indexB = STAGES_IN_ORDER.indexOf(stageB);
  return indexA < indexB;
}

/**
 * Calculate completion percentage for a stage
 */
export function calculateStageProgress(
  stage: JobStage,
  stageSteps: Record<string, StepStatus>
): number {
  const steps = getStageSteps(stage);
  if (steps.length === 0) return 100; // Completed stage has no steps

  const completedCount = steps.filter((step) => {
    const status = stageSteps[step.id];
    return status?.completed === true;
  }).length;

  return Math.round((completedCount / steps.length) * 100);
}

/**
 * Check if all required steps are completed for a stage
 */
export function areRequiredStepsComplete(
  stage: JobStage,
  stageSteps: Record<string, StepStatus>
): boolean {
  const requiredSteps = getRequiredSteps(stage);

  return requiredSteps.every((step) => {
    const status = stageSteps[step.id];
    return status?.completed === true;
  });
}

/**
 * Get incomplete required steps for a stage
 */
export function getIncompleteRequiredSteps(
  stage: JobStage,
  stageSteps: Record<string, StepStatus>
): StageStep[] {
  const requiredSteps = getRequiredSteps(stage);

  return requiredSteps.filter((step) => {
    const status = stageSteps[step.id];
    return status?.completed !== true;
  });
}

/**
 * Initialize empty stage steps for a stage
 */
export function initializeStageSteps(stage: JobStage): Record<string, StepStatus> {
  const steps = getStageSteps(stage);
  const stageSteps: Record<string, StepStatus> = {};

  steps.forEach((step) => {
    stageSteps[step.id] = {
      completed: false,
    };
  });

  return stageSteps;
}

/**
 * Format stage name for display
 */
export function formatStageName(stage: JobStage): string {
  return STAGE_DEFINITIONS[stage].name;
}

/**
 * Get stage color class for Tailwind
 */
export function getStageColor(stage: JobStage): string {
  return STAGE_DEFINITIONS[stage].color;
}

/**
 * Get progress indicator color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'green';
  if (percentage >= 50) return 'yellow';
  return 'gray';
}
