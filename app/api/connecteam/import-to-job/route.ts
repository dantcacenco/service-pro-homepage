/**
 * ConnectTeam to Jobs Import API
 * 
 * Converts a ConnectTeam submission into a Service Pro job
 * POST /api/connecteam/import-to-job
 * 
 * Body: { submissionId: string }
 * Returns: { success: true, jobId: string } or { success: false, error: string }
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { matchJobToCustomer } from '@/lib/customer-matcher'
import { findExistingJobByAddress, linkSubmissionToJob, linkMaterialsToJob } from '@/lib/connecteam/duplicate-handler'
import { mapConnecteamToJobStatus } from '@/lib/connecteam/status-mapper'

/**
 * Generate job number from submission timestamp
 * Format: YYYYMMDD-HHMM
 * Example: 20251028-1545
 */
function generateJobNumber(timestamp: string): string {
  const date = new Date(timestamp)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}${month}${day}-${hours}${minutes}`
}

export async function POST(request: Request) {
  console.log('🚀 [Import API] Request received')
  
  try {
    const supabase = createAdminClient()
    console.log('✅ [Import API] Supabase admin client created')
    
    // Parse request body
    const body = await request.json()
    console.log('📝 [Import API] Request body:', body)
    const { submissionId } = body
    
    if (!submissionId) {
      console.error('❌ [Import API] Missing submissionId')
      return NextResponse.json(
        { success: false, error: 'submissionId is required' },
        { status: 400 }
      )
    }

    console.log('🔄 [Import API] Starting import for submission:', submissionId)

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('connecteam_form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      console.error('[Import] ❌ Submission not found:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if already linked
    if (submission.linked_job_id) {
      console.log('[Import] ⚠️  Submission already linked to job:', submission.linked_job_id)
      return NextResponse.json(
        { success: false, error: 'Submission already linked to a job', jobId: submission.linked_job_id },
        { status: 400 }
      )
    }

    console.log('[Import] ✅ Submission found:', submission.job_address)

    // Check for duplicate job at same address
    const existingJobId = await findExistingJobByAddress(submission.job_address)
    
    if (existingJobId) {
      console.log('[Import] 🔗 Duplicate detected! Linking to existing job instead of creating new one')
      
      // Link submission to existing job
      const linked = await linkSubmissionToJob(submission.id, existingJobId)
      if (!linked) {
        return NextResponse.json(
          { success: false, error: 'Failed to link submission to existing job' },
          { status: 500 }
        )
      }

      // Link materials to existing job
      await linkMaterialsToJob(submission.id, existingJobId)

      console.log('[Import] ✅ Submission linked to existing job')
      console.log('[Import] This submission will now appear in the job\'s service history')
      
      return NextResponse.json({
        success: true,
        jobId: existingJobId,
        linked: true,
        message: 'Submission linked to existing job (duplicate address detected)'
      })
    }

    console.log('[Import] ✅ No duplicate found - will create new job')

    // Generate job number
    const jobNumber = generateJobNumber(submission.submission_timestamp)
    console.log('[Import] 📋 Generated job number:', jobNumber)

    // Match address to customer using fuzzy matching
    let customerId: string | null = null
    if (submission.job_address) {
      const match = await matchJobToCustomer(submission.job_address, {
        minScore: 0.85 // High confidence threshold
      })

      if (match) {
        customerId = match.customerId
        console.log('[Import] 🎯 Customer matched:', match.customerName)
        console.log('[Import]    Match score:', match.matchScore.toFixed(2), `(${match.matchMethod})`)
        console.log('[Import]    Confidence:', match.confidence)
        console.log('[Import]    Customer ID:', customerId)
      } else {
        console.log('[Import] ⚪ No customer match found (threshold: 0.85)')
        console.log('[Import]    Will create job with NULL customer_id')
      }
    }

    // Get the admin user for created_by field
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'boss')
      .limit(1)
      .single()
    
    const createdBy = adminUser?.id || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac' // Fallback to known admin ID
    console.log('[Import] 👤 Using created_by:', createdBy)

    // Create the job
    // Note: Following Task 8.12 redesign - only essential fields, no deprecated fields
    // Task 8.14.5: Use manager_status from ConnectTeam if available
    const jobStatus = submission.manager_status 
      ? mapConnecteamToJobStatus(submission.manager_status)
      : 'scheduled'
    
    console.log('[Import] 🎯 Job status:', jobStatus, submission.manager_status ? `(from CT: ${submission.manager_status})` : '(default)')

    // Generate job title from available data
    const jobTypeLabel = Array.isArray(submission.job_type) && submission.job_type.length > 0
      ? submission.job_type.join(', ')
      : 'Service Call'
    
    const jobTitle = `${jobTypeLabel} - ${new Date(submission.submission_timestamp).toLocaleDateString()}`
    console.log('[Import] 📝 Generated title:', jobTitle)

    const jobData = {
      job_number: jobNumber,
      title: jobTitle, // REQUIRED: Generated from job type and date
      service_address: submission.job_address || '',
      status: jobStatus,
      customer_id: customerId, // Can be NULL
      description: submission.work_description || submission.additional_notes || null,
      source: 'connecteam',
      connecteam_submission_id: submission.id,
      created_by: createdBy,
      // Initialize empty link arrays (Task 8.12.6)
      proposal_links: [],
      invoice_links: [],
      openphone_links: []
    }

    console.log('[Import] 📝 Creating job with data:', JSON.stringify(jobData, null, 2))

    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()

    if (jobError || !newJob) {
      console.error('[Import] ❌ Error creating job:', jobError)
      return NextResponse.json(
        { success: false, error: `Failed to create job: ${jobError?.message}` },
        { status: 500 }
      )
    }

    console.log('[Import] ✅ Job created:', newJob.id, '-', newJob.job_number)

    // Update submission to link to job
    const { error: updateError } = await supabase
      .from('connecteam_form_submissions')
      .update({ linked_job_id: newJob.id })
      .eq('id', submissionId)

    if (updateError) {
      console.error('[Import] ⚠️  Failed to update submission link:', updateError)
      // Don't fail the entire import, job was created successfully
    } else {
      console.log('[Import] 🔗 Submission linked to job')
    }

    // Link materials (update job_id in materials_checklist)
    const { error: materialsError } = await supabase
      .from('materials_checklist')
      .update({ job_id: newJob.id })
      .eq('submission_id', submissionId)

    if (materialsError) {
      console.error('[Import] ⚠️  Failed to link materials:', materialsError)
    } else {
      const { count } = await supabase
        .from('materials_checklist')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', newJob.id)
      console.log('[Import] 📦 Linked', count || 0, 'materials to job')
    }

    // Photos are already linked via submission_id, no action needed
    const { count: photoCount } = await supabase
      .from('connecteam_photos')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)
    console.log('[Import] 📸 Found', photoCount || 0, 'photos linked to submission')

    // Create time entry if start/end times exist
    if (submission.start_time && submission.end_time && submission.employee_id) {
      const timeEntryData = {
        job_id: newJob.id,
        employee_id: submission.employee_id,
        start_time: submission.start_time,
        end_time: submission.end_time,
        notes: 'Imported from ConnectTeam'
      }

      const { error: timeError } = await supabase
        .from('time_entries')
        .insert(timeEntryData)

      if (timeError) {
        console.error('[Import] ⚠️  Failed to create time entry:', timeError)
      } else {
        console.log('[Import] ⏰ Time entry created')
      }
    } else {
      console.log('[Import] ⏰ No time data to import')
    }

    console.log('[Import] 🎉 Import complete!')
    console.log('[Import] Job ID:', newJob.id)
    console.log('[Import] Job Number:', newJob.job_number)
    console.log('')

    return NextResponse.json({
      success: true,
      jobId: newJob.id,
      jobNumber: newJob.job_number,
      message: 'Job created successfully from ConnectTeam submission'
    })

  } catch (error) {
    console.error('[Import] ❌ Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
