/**
 * Shared ConnectTeam Submission Processing
 *
 * This module provides a unified way to process ConnectTeam submissions
 * whether they come from the API (GitHub Actions) or manual Excel uploads.
 *
 * Both code paths use this same logic to:
 * - Find or create jobs by address
 * - Find or create customers
 * - Add/update notes with deduplication
 * - Generate job numbers
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { matchAddressToCustomer } from './address-customer-matcher'

export interface ConnectTeamSubmission {
  submission_id: string // Unique ID for this submission
  job_location: string // Address
  job_type?: string // installation/repair/maintenance/emergency
  additional_notes?: string
  parts_materials_needed?: string
  what_was_done?: string
  submission_timestamp: string // ISO date when submitted
  updated_at: string // ISO date when last edited
  technician_name: string
  linked_job_id?: string // Pre-linked job (from API sync) or null (needs matching)
}

export interface ProcessingResult {
  success: boolean
  submissions_processed: number
  jobs_matched: number
  jobs_created: number
  notes_added: number
  notes_updated: number
  materials_added: number
  errors: string[]
}

/**
 * Fuzzy match address to existing jobs
 */
async function findJobByAddress(address: string, supabase: any): Promise<string | null> {
  if (!address || address.trim() === '') return null

  // Clean address for matching
  const cleanAddress = address.trim().toLowerCase()

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('jobs')
    .select('id')
    .ilike('service_address', cleanAddress)
    .limit(1)
    .single()

  if (exactMatch) return exactMatch.id

  // Try fuzzy match using substring
  const { data: fuzzyMatches } = await supabase
    .from('jobs')
    .select('id, service_address')
    .not('service_address', 'is', null)
    .limit(10)

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    for (const job of fuzzyMatches) {
      const jobAddr = (job.service_address || '').toLowerCase()
      // Simple fuzzy match - contains most of the address
      if (cleanAddress.includes(jobAddr.substring(0, 20)) ||
          jobAddr.includes(cleanAddress.substring(0, 20))) {
        return job.id
      }
    }
  }

  return null
}

/**
 * Get or create placeholder customer for ConnectTeam imports
 */
async function getOrCreatePlaceholderCustomer(supabase: any, nowISO: string): Promise<string | null> {
  // Get or create a placeholder customer for ConnectTeam imports
  const { data: placeholderCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', 'na-placeholder@placeholder.local')
    .single()

  if (placeholderCustomer) {
    return placeholderCustomer.id
  }

  // Create placeholder customer
  // Note: created_by must be a valid user UUID
  // Using the first admin user from the database
  const { data: adminUser } = await supabase
    .from('customers')
    .select('created_by')
    .limit(1)
    .single()

  const createdBy = adminUser?.created_by || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'

  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      name: 'N/A',
      email: 'na-placeholder@placeholder.local',
      phone: '',
      created_by: createdBy,
      created_at: nowISO,
      updated_at: nowISO
    })
    .select('id')
    .single()

  if (createError) {
    console.error('[PROCESS] Failed to create placeholder customer:', createError.message)
    console.error('[PROCESS] Error details:', createError)
    return null
  }

  return newCustomer?.id || null
}

/**
 * Create a new job from ConnectTeam submission
 */
async function createJobFromSubmission(
  submission: ConnectTeamSubmission,
  supabase: any,
  nowISO: string
): Promise<string | null> {
  console.log(`[PROCESS] 🏗️  Creating new job for address: ${submission.job_location}`)

  // Step 1: Try to match address to existing customer using fuzzy matching
  console.log('[PROCESS] 🔍 Attempting to match address to existing customer...')
  let customerId = await matchAddressToCustomer(submission.job_location)

  if (customerId) {
    console.log(`[PROCESS] ✅ Matched to existing customer: ${customerId}`)
  } else {
    console.log('[PROCESS] ⚠️  No customer match found (< 90% confidence)')
    console.log('[PROCESS] 📝 Creating placeholder customer: "N/A"')

    // Step 2: If no match, get or create placeholder customer
    customerId = await getOrCreatePlaceholderCustomer(supabase, nowISO)
    if (!customerId) {
      console.error('[PROCESS] ❌ Failed to get/create placeholder customer')
      return null
    }
  }

  // Generate job number
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
  const jobNumber = `JOB-${String((count || 0) + 1).padStart(4, '0')}`

  // Map ConnectTeam job type to our job type
  const jobTypeMap: Record<string, 'installation' | 'repair' | 'maintenance' | 'emergency'> = {
    'installation': 'installation',
    'repair': 'repair',
    'maintenance': 'maintenance',
    'emergency': 'emergency',
    'service': 'maintenance'
  }
  const jobType = submission.job_type
    ? jobTypeMap[submission.job_type.toLowerCase()] || 'maintenance'
    : 'maintenance'

  // Get admin user UUID for created_by
  const { data: adminUser } = await supabase
    .from('customers')
    .select('created_by')
    .limit(1)
    .single()
  const createdBy = adminUser?.created_by || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'

  // Create new job
  const { data: newJob, error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_number: jobNumber,
      customer_id: customerId,
      proposal_id: null,
      title: `ConnectTeam Import - ${submission.job_location}`,
      description: submission.what_was_done || null,
      job_type: jobType,
      status: 'not_scheduled',
      service_address: submission.job_location,
      created_by: createdBy,
      created_at: nowISO,
      updated_at: nowISO,
      additional_notes_status: [],
      materials_notes_status: []
    })
    .select('id')
    .single()

  if (jobError || !newJob) {
    console.error('[PROCESS] ❌ Failed to create job:', jobError?.message)
    return null
  }

  console.log(`[PROCESS] ✅ Created new job ${jobNumber} for ${submission.job_location}`)
  return newJob.id
}

/**
 * Process a batch of ConnectTeam submissions
 * Works for both API sync (with linked_job_id) and Excel imports (without)
 */
export async function processConnectTeamSubmissions(
  submissions: ConnectTeamSubmission[]
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: true,
    submissions_processed: 0,
    jobs_matched: 0,
    jobs_created: 0,
    notes_added: 0,
    notes_updated: 0,
    materials_added: 0,
    errors: []
  }

  if (!submissions || submissions.length === 0) {
    return result
  }

  const supabase = createAdminClient()
  const nowISO = new Date().toISOString()

  // Group submissions by job
  const jobUpdates = new Map<string, {
    additionalNotes: any[]
    materialsNotes: any[]
    submissionIds: string[]
  }>()

  // Process each submission
  for (const submission of submissions) {
    try {
      result.submissions_processed++

      // Find or create job
      let jobId: string | null = submission.linked_job_id || null // API sync provides this

      if (!jobId) {
        // Excel import path: find by address
        jobId = await findJobByAddress(submission.job_location, supabase)

        if (jobId) {
          result.jobs_matched++
        } else {
          // Create new job
          jobId = await createJobFromSubmission(submission, supabase, nowISO)
          if (jobId) {
            result.jobs_created++
          } else {
            result.errors.push(`Failed to create job for ${submission.job_location}`)
            continue
          }
        }
      } else {
        result.jobs_matched++
      }

      // Initialize job update if not exists
      if (!jobUpdates.has(jobId)) {
        jobUpdates.set(jobId, {
          additionalNotes: [],
          materialsNotes: [],
          submissionIds: []
        })
      }

      const jobUpdate = jobUpdates.get(jobId)!
      jobUpdate.submissionIds.push(submission.submission_id)

      // Process additional notes
      if (submission.additional_notes && submission.additional_notes.trim() !== '') {
        const noteObj = {
          id: randomUUID(),
          note_text: submission.additional_notes.trim(),
          status: 'undone' as const,
          created_at: submission.submission_timestamp,
          created_by: submission.technician_name,
          updated_at: submission.updated_at,
          synced_at: nowISO,
          submission_id: submission.submission_id
        }

        jobUpdate.additionalNotes.push(noteObj)
        result.notes_added++
      }

      // Process materials notes
      if (submission.parts_materials_needed && submission.parts_materials_needed.trim() !== '') {
        const materialObj = {
          id: randomUUID(),
          note_text: submission.parts_materials_needed.trim(),
          status: 'undone' as const,
          created_at: submission.submission_timestamp,
          created_by: submission.technician_name,
          updated_at: submission.updated_at,
          synced_at: nowISO,
          submission_id: submission.submission_id
        }

        jobUpdate.materialsNotes.push(materialObj)
        result.materials_added++
      }
    } catch (error: any) {
      result.errors.push(`Submission ${submission.submission_id}: ${error.message}`)
    }
  }

  // Update each job with new notes/materials
  for (const [jobId, updates] of jobUpdates.entries()) {
    try {
      // Fetch current job data
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('additional_notes_status, materials_notes_status')
        .eq('id', jobId)
        .single()

      if (jobError) {
        result.errors.push(`Job ${jobId}: ${jobError.message}`)
        continue
      }

      // Get existing notes/materials arrays
      let existingAdditionalNotes = (job?.additional_notes_status as any[]) || []
      let existingMaterialsNotes = (job?.materials_notes_status as any[]) || []

      // Track which submission IDs are being updated
      const submissionIdsToUpdate = new Set(updates.submissionIds)

      // Remove old notes from submissions being updated (deduplication)
      existingAdditionalNotes = existingAdditionalNotes.filter((note: any) => {
        if (submissionIdsToUpdate.has(note.submission_id)) {
          result.notes_updated++
          return false // Remove old version
        }
        return true
      })

      existingMaterialsNotes = existingMaterialsNotes.filter((note: any) => {
        if (submissionIdsToUpdate.has(note.submission_id)) {
          result.notes_updated++
          return false // Remove old version
        }
        return true
      })

      // Add all new/updated notes
      const updatedAdditionalNotes = [...existingAdditionalNotes, ...updates.additionalNotes]
      const updatedMaterialsNotes = [...existingMaterialsNotes, ...updates.materialsNotes]

      // Update job
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          additional_notes_status: updatedAdditionalNotes,
          materials_notes_status: updatedMaterialsNotes,
          updated_at: nowISO
        })
        .eq('id', jobId)

      if (updateError) {
        result.errors.push(`Job ${jobId} update failed: ${updateError.message}`)
        continue
      }

      console.log(`[PROCESS] Updated job ${jobId}: ${updates.additionalNotes.length} notes, ${updates.materialsNotes.length} materials`)
    } catch (error: any) {
      result.errors.push(`Job ${jobId}: ${error.message}`)
    }
  }

  result.success = result.errors.length === 0 || (result.notes_added + result.notes_updated + result.materials_added) > 0
  return result
}
