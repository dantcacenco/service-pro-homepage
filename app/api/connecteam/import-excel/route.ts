/**
 * ConnectTeam Excel Import Endpoint
 *
 * Accepts manual Excel upload from ConnectTeam export
 * Parses submissions and syncs to connecteam_form_submissions table
 * Then links to jobs with fuzzy address matching
 *
 * POST /api/connecteam/import-excel
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'
import { matchAddressToCustomer } from '@/lib/connecteam/address-customer-matcher'

interface SubmissionRow {
  '#': number
  'Full name': string
  'Submission Date': number // Excel date format
  'Submission Time': string
  'Start Time': string
  'End Time': string
  'Job Location📍': string
  'Job Type': string
  'What was done?': string
  'Additional notes': string
  'Parts/material needed': string
  'Note': string
  'Status': string
  'Status_1': string
  'Before Photos': string // Photo URLs separated by newlines
  'After Photos': string // Photo URLs separated by newlines
}

// Convert Excel date number to ISO string
function excelDateToISO(excelDate: number, timeString: string): string {
  // Excel epoch is 1899-12-30
  const epoch = new Date(1899, 11, 30)
  const days = Math.floor(excelDate)
  const date = new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000)

  // Parse time string (e.g., "10:36 AM")
  if (timeString && timeString.includes(':')) {
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/)
    if (match) {
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const isPM = match[3] === 'PM'

      if (isPM && hours !== 12) hours += 12
      if (!isPM && hours === 12) hours = 0

      date.setHours(hours, minutes, 0, 0)
    }
  }

  return date.toISOString()
}

// Parse photo URLs from Excel cell (newline-separated)
function parsePhotoURLs(photoCell: string | undefined): string[] {
  if (!photoCell || typeof photoCell !== 'string') return []

  return photoCell
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'))
}

// Get or create placeholder customer for unmatched jobs
async function getOrCreatePlaceholderCustomer(supabase: any): Promise<string> {
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', 'na-placeholder@placeholder.local')
    .single()

  if (existing) return existing.id

  // Create placeholder
  const { data: admin } = await supabase
    .from('customers')
    .select('created_by')
    .limit(1)
    .single()

  const createdBy = admin?.created_by || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'

  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({
      name: 'N/A',
      email: 'na-placeholder@placeholder.local',
      phone: '',
      created_by: createdBy,
    })
    .select('id')
    .single()

  return newCustomer!.id
}

// Match technician name to employee_id
async function matchTechnicianName(fullName: string, supabase: any): Promise<string | null> {
  if (!fullName || fullName.trim() === '') return null

  const nameParts = fullName.trim().split(' ')
  if (nameParts.length < 2) return null

  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]

  console.log(`[EXCEL IMPORT] 👤 Matching technician: ${firstName} ${lastName}`)

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('connecteam_employees')
    .select('id, first_name, last_name')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .limit(1)
    .single()

  if (exactMatch) {
    console.log(`[EXCEL IMPORT] ✅ Matched technician: ${exactMatch.first_name} ${exactMatch.last_name}`)
    return exactMatch.id
  }

  // Try partial match on last name only
  const { data: partialMatch } = await supabase
    .from('connecteam_employees')
    .select('id, first_name, last_name')
    .ilike('last_name', lastName)
    .limit(1)
    .single()

  if (partialMatch) {
    console.log(`[EXCEL IMPORT] ⚠️  Partial match (last name only): ${partialMatch.first_name} ${partialMatch.last_name}`)
    return partialMatch.id
  }

  console.log(`[EXCEL IMPORT] ❌ No technician match found for: ${fullName}`)
  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createAdminClient()

  const stats = {
    rows_parsed: 0,
    submissions_saved: 0,
    submissions_updated: 0,
    jobs_created: 0,
    jobs_linked: 0,
    photos_saved: 0,
    customers_matched: 0,
    customers_unmatched: 0,
    errors: [] as string[]
  }

  try {
    console.log('[EXCEL IMPORT] 🚀 Starting enhanced import...')

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`[EXCEL IMPORT] 📄 File received: ${file.name} (${file.size} bytes)`)

    // Read and parse Excel
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet) as SubmissionRow[]

    console.log(`[EXCEL IMPORT] 📊 Parsed ${rows.length} rows`)
    stats.rows_parsed = rows.length

    const nowISO = new Date().toISOString()

    // Step 1: Identify last 30 submissions chronologically
    // These need edit detection (compare updated_at vs last_synced_at)
    const { data: recentSubmissions } = await supabase
      .from('connecteam_form_submissions')
      .select('connecteam_submission_id, updated_at, last_synced_at')
      .order('submission_timestamp', { ascending: false })
      .limit(30)

    const recentSubmissionMap = new Map(
      (recentSubmissions || []).map(sub => [sub.connecteam_submission_id, sub])
    )

    console.log(`[EXCEL IMPORT] 📋 Monitoring ${recentSubmissionMap.size} recent submissions for edits`)

    // Process each row
    for (const row of rows) {
      try {
        // Skip if no location
        if (!row['Job Location📍']?.trim()) {
          console.log(`[EXCEL IMPORT] Row ${row['#']}: Skipping (no location)`)
          continue
        }

        const address = row['Job Location📍'].trim()
        const submissionTimestamp = excelDateToISO(row['Submission Date'], row['Submission Time'])

        // Create stable submission ID using submission timestamp
        const submissionId = `excel-${submissionTimestamp}`

        console.log(`\n[EXCEL IMPORT] Processing row ${row['#']}: ${address}`)

        // Step 1: Check if submission already exists
        const { data: existing } = await supabase
          .from('connecteam_form_submissions')
          .select('id, linked_job_id')
          .eq('connecteam_submission_id', submissionId)
          .single()

        // Match technician by name
        const employeeId = await matchTechnicianName(row['Full name'], supabase)

        let submissionDbId: string
        let linkedJobId: string | null = existing?.linked_job_id || null

        if (existing) {
          console.log(`[EXCEL IMPORT] Submission already exists`)

          // Check if this is one of the last 30 submissions needing edit detection
          const recentData = recentSubmissionMap.get(submissionId)
          let shouldUpdate = false
          let editDetected = false

          if (recentData) {
            // Compare updated_at vs last_synced_at for edit detection
            const updatedAt = new Date(recentData.updated_at || 0)
            const lastSyncedAt = new Date(recentData.last_synced_at || 0)

            if (updatedAt > lastSyncedAt) {
              editDetected = true
              shouldUpdate = true
              console.log(`[EXCEL IMPORT] 🔄 Edit detected! Updated: ${updatedAt.toISOString()}, Last synced: ${lastSyncedAt.toISOString()}`)
            } else {
              console.log(`[EXCEL IMPORT] ✅ No edits detected, skipping update`)
            }
          } else {
            // Not in recent 30, always update to be safe
            shouldUpdate = true
            console.log(`[EXCEL IMPORT] Updating (not in recent 30)`)
          }

          if (shouldUpdate) {
            // Update existing
            const { data: updated } = await supabase
              .from('connecteam_form_submissions')
              .update({
                employee_id: employeeId,
                job_address: address,
                work_description: row['What was done?'] || null,
                additional_notes: row['Additional notes'] || null,
                parts_materials_needed: row['Parts/material needed'] || null,
                job_type: row['Job Type'] ? [row['Job Type']] : null,
                updated_at: nowISO,
                last_synced_at: nowISO,
              })
              .eq('id', existing.id)
              .select('id')
              .single()

            submissionDbId = updated!.id
            stats.submissions_updated++

            if (editDetected) {
              console.log(`[EXCEL IMPORT] ✏️  Updated edited submission`)
            }
          } else {
            // Skip update, just use existing ID
            submissionDbId = existing.id
            console.log(`[EXCEL IMPORT] ⏭️  Skipped (no changes)`)
          }
        } else {
          console.log(`[EXCEL IMPORT] New submission, creating...`)

          // Create new submission
          const { data: created } = await supabase
            .from('connecteam_form_submissions')
            .insert({
              connecteam_submission_id: submissionId,
              form_id: 11221823,
              employee_id: employeeId,
              submission_timestamp: submissionTimestamp,
              job_address: address,
              work_description: row['What was done?'] || null,
              additional_notes: row['Additional notes'] || null,
              parts_materials_needed: row['Parts/material needed'] || null,
              job_type: row['Job Type'] ? [row['Job Type']] : null,
              match_method: null,
              last_synced_at: nowISO,
              created_at: nowISO,
              updated_at: nowISO,
            })
            .select('id')
            .single()

          submissionDbId = created!.id
          stats.submissions_saved++
        }

        // Step 2: Save photos
        const beforePhotos = parsePhotoURLs(row['Before Photos'])
        const afterPhotos = parsePhotoURLs(row['After Photos'])

        if (beforePhotos.length > 0 || afterPhotos.length > 0) {
          console.log(`[EXCEL IMPORT] 📸 Found ${beforePhotos.length} before + ${afterPhotos.length} after photos`)
        } else {
          console.log(`[EXCEL IMPORT] ⚠️  No photos found in Excel columns`)
        }

        for (const url of beforePhotos) {
          // Check if photo already exists
          const { data: existing } = await supabase
            .from('connecteam_photos')
            .select('id')
            .eq('submission_id', submissionDbId)
            .eq('connecteam_url', url)
            .single()

          if (!existing) {
            const { error } = await supabase
              .from('connecteam_photos')
              .insert({
                submission_id: submissionDbId,
                photo_type: 'before',
                connecteam_url: url,
                created_at: nowISO
              })

            if (!error) stats.photos_saved++
          }
        }

        for (const url of afterPhotos) {
          // Check if photo already exists
          const { data: existing } = await supabase
            .from('connecteam_photos')
            .select('id')
            .eq('submission_id', submissionDbId)
            .eq('connecteam_url', url)
            .single()

          if (!existing) {
            const { error } = await supabase
              .from('connecteam_photos')
              .insert({
                submission_id: submissionDbId,
                photo_type: 'after',
                connecteam_url: url,
                created_at: nowISO
              })

            if (!error) stats.photos_saved++
          }
        }

        // Step 3: Find or create job
        if (!linkedJobId) {
          console.log(`[EXCEL IMPORT] No linked job, searching...`)

          // Try to find existing job by address
          const { data: existingJobs } = await supabase
            .from('jobs')
            .select('id')
            .ilike('service_address', `%${address}%`)
            .limit(1)

          if (existingJobs && existingJobs.length > 0) {
            linkedJobId = existingJobs[0].id
            console.log(`[EXCEL IMPORT] ✅ Found existing job: ${linkedJobId}`)
            stats.jobs_linked++
          } else {
            // Create new job with fuzzy customer matching
            console.log(`[EXCEL IMPORT] Creating new job...`)

            const customerId = await matchAddressToCustomer(address) || await getOrCreatePlaceholderCustomer(supabase)

            if (customerId === await getOrCreatePlaceholderCustomer(supabase)) {
              stats.customers_unmatched++
            } else {
              stats.customers_matched++
            }

            const { count } = await supabase
              .from('jobs')
              .select('id', { count: 'exact', head: true })

            const jobNumber = `JOB-${String((count || 0) + 1).padStart(4, '0')}`

            const { data: adminUser } = await supabase
              .from('customers')
              .select('created_by')
              .limit(1)
              .single()

            const createdBy = adminUser?.created_by || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac'

            const { data: newJob } = await supabase
              .from('jobs')
              .insert({
                job_number: jobNumber,
                customer_id: customerId,
                title: `ConnectTeam Import - ${address}`,
                description: row['What was done?'] || null,
                job_type: 'maintenance',
                status: 'not_scheduled',
                service_address: address,
                created_by: createdBy,
                created_at: nowISO,
                updated_at: nowISO,
              })
              .select('id')
              .single()

            linkedJobId = newJob!.id
            console.log(`[EXCEL IMPORT] ✅ Created job: ${jobNumber}`)
            stats.jobs_created++
          }

          // Link submission to job
          await supabase
            .from('connecteam_form_submissions')
            .update({ linked_job_id: linkedJobId })
            .eq('id', submissionDbId)
        }

      } catch (error: any) {
        console.error(`[EXCEL IMPORT] Error processing row ${row['#']}:`, error.message)
        stats.errors.push(`Row ${row['#']}: ${error.message}`)
      }
    }

    const duration = Date.now() - startTime

    console.log('\n✅ [EXCEL IMPORT] Complete!')
    console.log('📊 Statistics:', stats)

    return NextResponse.json({
      success: stats.errors.length === 0,
      ...stats,
      duration_ms: duration,
    })

  } catch (error: any) {
    console.error('[EXCEL IMPORT] ❌ Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Import failed',
        stats
      },
      { status: 500 }
    )
  }
}

