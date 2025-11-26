/**
 * Stage-Based Workflow System - Transitions
 *
 * Handles stage transitions, step completion, and validation logic
 */

import { createClient } from '@/lib/supabase/server';
import {
  JobStage,
  JobStageData,
  StageHistoryEntry,
  StepStatus,
  STAGES_IN_ORDER,
  areRequiredStepsComplete,
  getIncompleteRequiredSteps,
  getStageDefinition,
  getNextStage,
  isStageEarlier,
} from './definitions';

// ============================================================================
// Types
// ============================================================================

export interface StageTransitionResult {
  success: boolean;
  message: string;
  job?: any;
  errors?: string[];
}

export interface StepCompletionResult {
  success: boolean;
  message: string;
  step_status?: StepStatus;
  should_advance?: boolean; // If true, all required steps complete, ready for next stage
}

// ============================================================================
// Stage Transition Functions
// ============================================================================

/**
 * Move a job to a different stage
 * Validates transition rules and updates database
 */
export async function moveToStage(
  jobId: string,
  newStage: JobStage,
  userId?: string,
  notes?: string
): Promise<StageTransitionResult> {
  const supabase = await createClient();

  try {
    // Fetch current job data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps, stage_history, status')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: false,
        message: 'Job not found',
        errors: [fetchError?.message || 'Job does not exist'],
      };
    }

    const currentStage = job.stage as JobStage;

    // Check if stage is actually changing
    if (currentStage === newStage) {
      return {
        success: true,
        message: 'Job is already at this stage',
        job,
      };
    }

    // Validate transition
    const validation = canMoveToStage(currentStage, newStage);
    if (!validation.allowed) {
      return {
        success: false,
        message: validation.reason || 'Invalid stage transition',
        errors: validation.errors,
      };
    }

    // Check if required steps are completed when moving forward
    if (isStageEarlier(currentStage, newStage)) {
      const requiredComplete = areRequiredStepsComplete(currentStage, job.stage_steps || {});
      if (!requiredComplete) {
        const incompleteSteps = getIncompleteRequiredSteps(currentStage, job.stage_steps || {});
        return {
          success: false,
          message: 'Cannot advance: Required steps not completed',
          errors: incompleteSteps.map((step) => `Missing: ${step.label}`),
        };
      }
    }

    // Create history entry
    const historyEntry: StageHistoryEntry = {
      stage: newStage,
      entered_at: new Date().toISOString(),
      previous_stage: currentStage,
      notes: notes || `Stage changed from ${currentStage} to ${newStage}`,
      changed_by: userId,
    };

    // Update stage_history array
    const updatedHistory = [...(job.stage_history || []), historyEntry];

    // Initialize steps for new stage (reset all steps to uncompleted)
    // Preserve any completed steps that exist in both stages
    const newStageSteps: Record<string, StepStatus> = {};
    const newStageDefinition = getStageDefinition(newStage);
    const existingSteps = job.stage_steps || {};

    newStageDefinition.steps.forEach((step) => {
      // If step exists in old stage and was completed, preserve it
      if (existingSteps[step.id]?.completed) {
        newStageSteps[step.id] = existingSteps[step.id];
      } else {
        // Otherwise, initialize as uncompleted
        newStageSteps[step.id] = {
          completed: false,
          completed_at: undefined,
          completed_by: undefined,
        };
      }
    });

    // Update job in database
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        stage: newStage,
        stage_steps: newStageSteps,
        stage_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError || !updatedJob) {
      return {
        success: false,
        message: 'Failed to update job stage',
        errors: [updateError?.message || 'Database update failed'],
      };
    }

    return {
      success: true,
      message: `Job moved to ${getStageDefinition(newStage).name} stage`,
      job: updatedJob,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error moving job to new stage',
      errors: [error.message],
    };
  }
}

/**
 * Complete a specific step within a stage
 */
export async function completeStep(
  jobId: string,
  stepId: string,
  userId?: string,
  notes?: string
): Promise<StepCompletionResult> {
  const supabase = await createClient();

  try {
    // Fetch current job data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    const currentStage = job.stage as JobStage;
    const stageSteps = job.stage_steps || {};

    // Create updated step status
    const stepStatus: StepStatus = {
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      notes,
    };

    // Update stage_steps object
    const updatedStageSteps = {
      ...stageSteps,
      [stepId]: stepStatus,
    };

    // Check if all required steps are now complete
    const allRequiredComplete = areRequiredStepsComplete(currentStage, updatedStageSteps);

    // Update database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        stage_steps: updatedStageSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update step',
      };
    }

    return {
      success: true,
      message: 'Step marked as complete',
      step_status: stepStatus,
      should_advance: allRequiredComplete,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error completing step',
    };
  }
}

/**
 * Uncomplete (uncheck) a specific step within a stage
 */
export async function uncompleteStep(
  jobId: string,
  stepId: string
): Promise<StepCompletionResult> {
  const supabase = await createClient();

  try {
    // Fetch current job data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    const stageSteps = job.stage_steps || {};

    // Create updated step status (uncompleted)
    const stepStatus: StepStatus = {
      completed: false,
    };

    // Update stage_steps object
    const updatedStageSteps = {
      ...stageSteps,
      [stepId]: stepStatus,
    };

    // Update database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        stage_steps: updatedStageSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update step',
      };
    }

    return {
      success: true,
      message: 'Step marked as incomplete',
      step_status: stepStatus,
      should_advance: false,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error uncompleting step',
    };
  }
}

/**
 * Complete multiple steps at once
 */
export async function completeMultipleSteps(
  jobId: string,
  stepIds: string[],
  userId?: string
): Promise<StepCompletionResult> {
  const supabase = await createClient();

  try {
    // Fetch current job data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    const currentStage = job.stage as JobStage;
    const stageSteps = job.stage_steps || {};

    // Update all specified steps
    const updatedStageSteps = { ...stageSteps };
    const completedAt = new Date().toISOString();

    stepIds.forEach((stepId) => {
      updatedStageSteps[stepId] = {
        completed: true,
        completed_at: completedAt,
        completed_by: userId,
      };
    });

    // Check if all required steps are now complete
    const allRequiredComplete = areRequiredStepsComplete(currentStage, updatedStageSteps);

    // Update database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        stage_steps: updatedStageSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update steps',
      };
    }

    return {
      success: true,
      message: `${stepIds.length} steps marked as complete`,
      should_advance: allRequiredComplete,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error completing steps',
    };
  }
}

/**
 * Move to next stage automatically if all required steps are complete
 */
export async function advanceStageIfReady(
  jobId: string,
  userId?: string
): Promise<StageTransitionResult> {
  const supabase = await createClient();

  try {
    // Fetch current job data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    const currentStage = job.stage as JobStage;
    const stageSteps = job.stage_steps || {};

    // Check if ready to advance
    const requiredComplete = areRequiredStepsComplete(currentStage, stageSteps);
    if (!requiredComplete) {
      return {
        success: false,
        message: 'Not ready to advance: Required steps incomplete',
      };
    }

    // Get next stage
    const nextStage = getNextStage(currentStage);
    if (!nextStage) {
      return {
        success: false,
        message: 'Already at final stage',
      };
    }

    // Move to next stage
    return await moveToStage(jobId, nextStage, userId, 'Auto-advanced after completing all required steps');
  } catch (error: any) {
    return {
      success: false,
      message: 'Error advancing stage',
      errors: [error.message],
    };
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  errors?: string[];
}

/**
 * Check if moving from current stage to target stage is allowed
 */
export function canMoveToStage(
  currentStage: JobStage,
  targetStage: JobStage
): ValidationResult {
  // Same stage - always allowed
  if (currentStage === targetStage) {
    return {
      allowed: true,
    };
  }

  const currentIndex = STAGES_IN_ORDER.indexOf(currentStage);
  const targetIndex = STAGES_IN_ORDER.indexOf(targetStage);

  // Invalid stages
  if (currentIndex === -1 || targetIndex === -1) {
    return {
      allowed: false,
      reason: 'Invalid stage',
      errors: ['One or both stages are invalid'],
    };
  }

  // Forward progression - always allowed
  if (targetIndex > currentIndex) {
    return {
      allowed: true,
    };
  }

  // Backward progression - allowed but should warn
  if (targetIndex < currentIndex) {
    return {
      allowed: true,
      reason: 'Moving backwards - ensure this is intentional',
    };
  }

  return {
    allowed: false,
    reason: 'Invalid transition',
  };
}

/**
 * Get stage progress information for a job
 */
export interface StageProgressInfo {
  current_stage: JobStage;
  current_stage_name: string;
  total_steps: number;
  completed_steps: number;
  percentage: number;
  required_steps_complete: boolean;
  can_advance: boolean;
  next_stage: JobStage | null;
  incomplete_required_steps: string[];
}

export async function getStageProgress(jobId: string): Promise<StageProgressInfo | null> {
  const supabase = await createClient();

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('stage, stage_steps')
      .eq('id', jobId)
      .single();

    if (error || !job) return null;

    const currentStage = job.stage as JobStage;
    const stageSteps = job.stage_steps || {};
    const definition = getStageDefinition(currentStage);

    const totalSteps = definition.steps.length;
    const completedSteps = definition.steps.filter((step) => {
      const status = stageSteps[step.id];
      return status?.completed === true;
    }).length;

    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

    const requiredComplete = areRequiredStepsComplete(currentStage, stageSteps);
    const incompleteSteps = getIncompleteRequiredSteps(currentStage, stageSteps);
    const nextStage = getNextStage(currentStage);

    return {
      current_stage: currentStage,
      current_stage_name: definition.name,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      percentage,
      required_steps_complete: requiredComplete,
      can_advance: requiredComplete && nextStage !== null,
      next_stage: nextStage,
      incomplete_required_steps: incompleteSteps.map((step) => step.label),
    };
  } catch (error) {
    return null;
  }
}
