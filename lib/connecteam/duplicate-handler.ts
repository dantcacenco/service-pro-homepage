/**
 * Duplicate Detection Handler for ConnectTeam Submissions
 * 
 * Checks if a job already exists at the same address.
 * If found, link submission to existing job instead of creating new one.
 * This prevents duplicate jobs and enables service history tracking.
 */

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Check if a job already exists at the given address
 * Returns the job ID if found, null if not found
 */
export async function findExistingJobByAddress(address: string): Promise<string | null> {
  if (!address) {
    console.log('[DuplicateHandler] No address provided, skipping duplicate check')
    return null
  }

  const supabase = createAdminClient()
  
  // Normalize address for comparison
  const normalizedAddress = normalizeAddress(address)
  
  console.log('[DuplicateHandler] Checking for existing jobs at:', normalizedAddress)

  // Query for jobs with matching address
  // Exclude archived jobs - we only want to link to active jobs
  const { data: existingJobs, error } = await supabase
    .from('jobs')
    .select('id, job_number, service_address, status, created_at')
    .neq('status', 'archived')
    .order('created_at', { ascending: false }) // Get most recent job first

  if (error) {
    console.error('[DuplicateHandler] Error querying jobs:', error)
    return null
  }

  if (!existingJobs || existingJobs.length === 0) {
    console.log('[DuplicateHandler] No existing jobs found')
    return null
  }

  // Find job with matching address (case-insensitive comparison)
  const matchingJob = existingJobs.find(job => {
    const jobAddress = normalizeAddress(job.service_address || '')
    return jobAddress === normalizedAddress
  })

  if (matchingJob) {
    console.log('[DuplicateHandler] ✅ Found existing job:')
    console.log('  - Job ID:', matchingJob.id)
    console.log('  - Job #:', matchingJob.job_number)
    console.log('  - Status:', matchingJob.status)
    console.log('  - Address:', matchingJob.service_address)
    return matchingJob.id
  }

  console.log('[DuplicateHandler] No matching job found at this address')
  return null
}

/**
 * Normalize address for consistent comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Remove common variations (Street/St, Road/Rd, etc.)
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\bstreet\b/g, 'st')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bparkway\b/g, 'pkwy')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bboulevard\b/g, 'blvd')
}

/**
 * Link a submission to an existing job
 * Updates the submission's linked_job_id
 */
export async function linkSubmissionToJob(
  submissionId: string, 
  jobId: string
): Promise<boolean> {
  const supabase = createAdminClient()
  
  console.log('[DuplicateHandler] Linking submission', submissionId, 'to job', jobId)

  const { error: updateError } = await supabase
    .from('connecteam_form_submissions')
    .update({ linked_job_id: jobId })
    .eq('id', submissionId)

  if (updateError) {
    console.error('[DuplicateHandler] ❌ Failed to link submission:', updateError)
    return false
  }

  console.log('[DuplicateHandler] ✅ Submission linked successfully')
  return true
}

/**
 * Link materials to an existing job
 * Updates job_id in materials_checklist
 */
export async function linkMaterialsToJob(
  submissionId: string, 
  jobId: string
): Promise<number> {
  const supabase = createAdminClient()
  
  console.log('[DuplicateHandler] Linking materials from submission', submissionId, 'to job', jobId)

  const { error: materialsError } = await supabase
    .from('materials_checklist')
    .update({ job_id: jobId })
    .eq('submission_id', submissionId)

  if (materialsError) {
    console.error('[DuplicateHandler] ⚠️  Failed to link materials:', materialsError)
    return 0
  }

  // Count the linked materials
  const { count } = await supabase
    .from('materials_checklist')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)

  console.log('[DuplicateHandler] ✅ Linked', count || 0, 'materials to job')
  return count || 0
}
