/**
 * Centralized Status-to-Stage Mapping
 *
 * This is the single source of truth for:
 * - Which job statuses belong to which stages
 * - How statuses are grouped in filters
 * - Display labels for status groups
 *
 * IMPORTANT: Update this file to change groupings everywhere
 */

import { type JobStage } from './definitions';

// Job status type
export type JobStatus =
  | 'not_scheduled'
  | 'estimate'
  | 'scheduled'
  | 'ask_vadim'
  | 'start_up'
  | 'working_on_it'
  | 'parts_needed'
  | 'done'
  | 'sent_invoice'
  | 'warranty'
  | 'warranty_no_charge'
  | 'completed'
  | 'archived'
  | 'cancelled';

/**
 * Map statuses to their corresponding stage
 * This determines kanban column placement AND filter grouping
 */
export const STATUS_TO_STAGE_MAP: Record<JobStatus, JobStage> = {
  // Beginning stage - Planning and preparation
  not_scheduled: 'beginning',
  estimate: 'beginning',
  scheduled: 'beginning',
  ask_vadim: 'beginning',

  // Rough In stage - Active installation work
  working_on_it: 'rough_in',
  parts_needed: 'rough_in',

  // Trim Out stage - Finishing and startup
  start_up: 'trim_out',

  // Closing stage - Final invoicing and warranty
  sent_invoice: 'closing',
  warranty: 'closing',
  warranty_no_charge: 'closing',

  // Completed stage - Done
  done: 'completed',
  completed: 'completed',
  archived: 'completed',
  cancelled: 'completed',
};

/**
 * Get the stage for a given status
 */
export function getStageForStatus(status: JobStatus): JobStage {
  return STATUS_TO_STAGE_MAP[status] || 'beginning';
}

/**
 * Get all statuses for a given stage
 */
export function getStatusesForStage(stage: JobStage): JobStatus[] {
  return Object.entries(STATUS_TO_STAGE_MAP)
    .filter(([_, s]) => s === stage)
    .map(([status, _]) => status as JobStatus);
}

/**
 * Stage display configuration for filters
 */
export interface StageGroup {
  stage: JobStage;
  label: string;
  statuses: JobStatus[];
  description: string;
}

/**
 * Get filter groups based on stages
 * Used in Jobs page filter dropdown and anywhere else we need grouped statuses
 */
export function getStatusFilterGroups(): StageGroup[] {
  return [
    {
      stage: 'beginning',
      label: 'Beginning',
      description: 'Planning and preparation',
      statuses: getStatusesForStage('beginning'),
    },
    {
      stage: 'rough_in',
      label: 'Rough In',
      description: 'Active installation work',
      statuses: getStatusesForStage('rough_in'),
    },
    {
      stage: 'trim_out',
      label: 'Trim Out',
      description: 'Finishing and startup',
      statuses: getStatusesForStage('trim_out'),
    },
    {
      stage: 'closing',
      label: 'Closing',
      description: 'Final invoicing and warranty',
      statuses: getStatusesForStage('closing'),
    },
    {
      stage: 'completed',
      label: 'Completed',
      description: 'Finished jobs',
      statuses: getStatusesForStage('completed'),
    },
  ];
}

/**
 * Get all statuses in stage order
 * Useful for status ordering in dropdowns
 */
export function getAllStatusesInStageOrder(): JobStatus[] {
  const groups = getStatusFilterGroups();
  return groups.flatMap(group => group.statuses);
}
