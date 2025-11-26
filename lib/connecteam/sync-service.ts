/**
 * ConnectTeam Sync Service
 * 
 * Handles synchronization of data from ConnectTeam API to database
 * 
 * Functions:
 * - syncEmployees() - Sync employees from API to database
 * - syncSubmissions() - Sync form submissions with all related data
 * - syncPhotos() - Store photos from submissions
 * - syncMaterials() - Store materials text (no parsing, whole text as one item)
 * - matchAndLinkJobs() - Match addresses to jobs
 * - logAddressMatches() - Log matching attempts for audit
 * 
 * Created: October 15, 2025
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { matchAddressToJob } from './address-matcher';

// ============================================================================
// TYPES
// ============================================================================

interface SyncResult {
  success: boolean;
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

interface EmployeeSyncResult extends SyncResult {
  employees: any[];
}

interface SubmissionSyncResult extends SyncResult {
  submissions: any[];
  photosCreated: number;
  materialsCreated: number;
  jobsMatched: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONNECTEAM_API_URL = process.env.CONNECTEAM_API_URL || 'https://api.connecteam.com';
const CONNECTEAM_API_KEY = process.env.CONNECTEAM_API_KEY;
const CONNECTEAM_FORM_ID = process.env.CONNECTEAM_FORM_ID || '11221823'; // Default to End of Job Report form

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract roles from ConnectTeam customFields
 */
function extractRoles(customFields: any): string[] {
  if (!customFields || !Array.isArray(customFields)) return [];
  
  const roles: string[] = [];
  for (const field of customFields) {
    if (field.name === 'Role' && field.values) {
      roles.push(...field.values);
    }
  }
  return roles;
}

/**
 * Fetch employees directly from ConnectTeam API
 */
async function fetchEmployeesFromAPI(): Promise<any[]> {
  if (!CONNECTEAM_API_KEY || !CONNECTEAM_API_URL) {
    throw new Error('ConnectTeam API credentials not configured');
  }

  const response = await fetch(`${CONNECTEAM_API_URL}/users/v1/users`, {
    method: 'GET',
    headers: {
      'X-API-KEY': CONNECTEAM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Employees API error:', response.status, errorText.substring(0, 200));
    throw new Error(`Employees API error: ${response.status}`);
  }

  const data = await response.json();
  // ConnectTeam returns: { data: { users: [...] } }
  return data.data?.users || [];
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync employees from ConnectTeam API to database
 */
export async function syncEmployees(): Promise<EmployeeSyncResult> {
  const result: EmployeeSyncResult = {
    success: true,
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
    employees: [],
  };

  try {
    // Fetch employees from API
    const employees = await fetchEmployeesFromAPI();
    const supabase = createAdminClient();

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if employee exists
        const { data: existing } = await supabase
          .from('connecteam_employees')
          .select('id')
          .eq('connecteam_user_id', employee.userId)
          .single();

        // Prepare employee data
        const employeeData = {
          connecteam_user_id: employee.userId,
          first_name: employee.firstName || '',
          last_name: employee.lastName || '',
          email: employee.email || null,
          phone: employee.phoneNumber || null,
          user_type: employee.userType || null,
          role: extractRoles(employee.customFields),
          kiosk_code: employee.kioskCode || null,
          is_archived: employee.isArchived || false,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert employee
        const { data, error } = await supabase
          .from('connecteam_employees')
          .upsert(employeeData, {
            onConflict: 'connecteam_user_id',
          })
          .select()
          .single();

        if (error) {
          result.errors.push(`Employee ${employee.userId}: ${error.message}`);
          continue;
        }

        result.employees.push(data);
        result.synced++;
        
        if (existing) {
          result.updated++;
        } else {
          result.created++;
        }
      } catch (err) {
        result.errors.push(`Employee ${employee.userId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Fetch form submissions directly from ConnectTeam API
 */
async function fetchSubmissionsFromAPI(since?: Date, offset: number = 0, limit: number = 50): Promise<any> {
  if (!CONNECTEAM_API_KEY || !CONNECTEAM_API_URL) {
    throw new Error('ConnectTeam API credentials not configured');
  }

  if (!CONNECTEAM_FORM_ID) {
    throw new Error('ConnectTeam FORM_ID not configured');
  }

  // Correct endpoint: /forms/v1/forms/{formId}/form-submissions
  const url = `${CONNECTEAM_API_URL}/forms/v1/forms/${CONNECTEAM_FORM_ID}/form-submissions?offset=${offset}&limit=${limit}&sortBy=submissionDate&sortOrder=descending`;
  
  console.log(`📡 [API] Fetching submissions from: ${url.replace(CONNECTEAM_API_KEY, 'xxx')}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': CONNECTEAM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Submissions API error:', response.status, errorText.substring(0, 200));
    throw new Error(`Submissions API error: ${response.status}`);
  }

  const data = await response.json();
  // ConnectTeam returns: { data: { formSubmissions: [...] } }
  return data.data?.formSubmissions || [];
}

/**
 * Transform raw ConnectTeam API submission to our expected format
 * FIXED: Now uses question IDs instead of title matching
 */
export function transformSubmission(raw: any): any {
  const answers = raw.answers || [];
  
  // Extract key fields using question IDs (not titles!)
  const locationAnswer = getAnswerValue(answers, QUESTION_IDS.JOB_LOCATION);
  const startTimestamp = getAnswerValue(answers, QUESTION_IDS.START_TIME);
  const endTimestamp = getAnswerValue(answers, QUESTION_IDS.END_TIME);
  const workDescription = getAnswerValue(answers, QUESTION_IDS.WORK_DESCRIPTION);
  const additionalNotes = getAnswerValue(answers, QUESTION_IDS.ADDITIONAL_NOTES);
  const partsMaterialsNeeded = getAnswerValue(answers, QUESTION_IDS.MATERIALS_NEEDED);
  const jobType = getAnswerValue(answers, QUESTION_IDS.JOB_TYPE);
  const beforePhotos = getAnswerValue(answers, QUESTION_IDS.BEFORE_PHOTOS);
  const afterPhotos = getAnswerValue(answers, QUESTION_IDS.AFTER_PHOTOS);
  
  // Extract manager fields from the raw response
  let managerNote = null;
  let managerStatus = null;
  
  if (Array.isArray(raw.managerFields)) {
    // Find the note field (HTML format: <p>text</p>)
    const noteField = raw.managerFields.find((f: any) => f.managerFieldType === 'note');
    if (noteField?.note) {
      // Strip HTML tags for clean text display
      managerNote = noteField.note.replace(/<[^>]*>/g, '').trim();
    }
    
    // Find the status field
    const statusField = raw.managerFields.find((f: any) => f.managerFieldType === 'status');
    if (statusField?.status?.name) {
      managerStatus = statusField.status.name;
    }
  }
  
  return {
    submissionId: raw.formSubmissionId,
    formSubmissionId: raw.formSubmissionId,
    employeeId: raw.submittingUserId,
    submissionTimestamp: raw.submissionTimestamp,
    timezone: raw.submissionTimezone,
    entryNum: raw.entryNum,
    jobAddress: locationAnswer?.address || null,
    jobLatitude: locationAnswer?.latitude || null,
    jobLongitude: locationAnswer?.longitude || null,
    startTime: startTimestamp ? new Date(startTimestamp * 1000).toISOString() : null,
    endTime: endTimestamp ? new Date(endTimestamp * 1000).toISOString() : null,
    jobType: jobType || null,
    workDescription: workDescription || null,
    additionalNotes: additionalNotes || null,
    partsMaterialsNeeded: partsMaterialsNeeded || null,
    beforePhotos: beforePhotos || [],
    afterPhotos: afterPhotos || [],
    managerNote: managerNote,
    managerStatus: managerStatus,
    rawData: raw,
  };
}

/**
 * Extract answer value by question ID
 */
function getAnswerValue(answers: any[], questionId: string): any {
  const answer = answers.find((a) => a.questionId === questionId);
  if (!answer) return null;

  // Handle different answer types
  if (answer.value !== undefined) return answer.value;
  if (answer.timestamp !== undefined) return answer.timestamp;
  if (answer.locationInput) return answer.locationInput;
  if (answer.selectedAnswers) return answer.selectedAnswers.map((sa: any) => sa.text);
  if (answer.images) return answer.images.map((img: any) => img.url);
  
  return null;
}

// Question IDs from ConnectTeam form
const QUESTION_IDS = {
  START_TIME: '1f14e73b-5fd1-525a-65e9-bf7ed906808c',
  END_TIME: 'b9b46e58-26bb-3df1-d1fb-1b7d4c7d8142',
  JOB_LOCATION: '359fedb3-2e43-faf4-94c7-9dcc2c19020d',
  JOB_TYPE: '8a43070c-b65f-4c65-4aef-4da1e914ebe1',
  WORK_DESCRIPTION: '4f87cfe2-f94c-f14d-393a-1b3a98baeb9b',
  BEFORE_PHOTOS: '940729f2-f0d1-3213-5fcc-a46569ec0cab',
  AFTER_PHOTOS: 'c1f997fd-b464-3c91-66c6-9626ec7fc75b',
  ADDITIONAL_NOTES: '0d04f47d-c7c7-2bf8-63eb-1bf78814e499',
  MATERIALS_NEEDED: '8ed44929-a716-ace0-3ec6-aab036963b87',
};

/**
 * Sync form submissions from ConnectTeam API to database
 */
export async function syncSubmissions(since?: Date): Promise<SubmissionSyncResult> {
  console.log('🔄 [SYNC] Starting syncSubmissions...');
  const result: SubmissionSyncResult = {
    success: true,
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
    submissions: [],
    photosCreated: 0,
    materialsCreated: 0,
    jobsMatched: 0,
  };

  try {
    const supabase = createAdminClient();
    
    // Fetch submissions from API (paginated)
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let totalFetched = 0;

    console.log('📡 [SYNC] Fetching submissions from ConnectTeam API...');

    while (hasMore) {
      console.log(`📄 [SYNC] Fetching batch: offset=${offset}, limit=${limit}`);
      const rawSubmissions = await fetchSubmissionsFromAPI(since, offset, limit);
      totalFetched += rawSubmissions.length;
      console.log(`✅ [SYNC] Fetched ${rawSubmissions.length} submissions (total: ${totalFetched})`);
      
      if (rawSubmissions.length === 0) {
        hasMore = false;
        break;
      }

      // Transform raw API responses to our expected format
      const submissions = rawSubmissions.map(transformSubmission);

      // Process each submission
      for (const submission of submissions) {
        try {
          // Check if submission exists
          const { data: existing } = await supabase
            .from('connecteam_form_submissions')
            .select('id')
            .eq('connecteam_submission_id', submission.submissionId)
            .single();

          // Get employee ID from database (if synced)
          let employeeId = null;
          if (submission.employeeId) {
            const { data: employee } = await supabase
              .from('connecteam_employees')
              .select('id')
              .eq('connecteam_user_id', submission.employeeId)
              .single();
            employeeId = employee?.id || null;
          }

          // Prepare submission data (already processed by our API)
          const submissionData = {
            connecteam_submission_id: submission.submissionId,
            form_id: 11221823,
            employee_id: employeeId,
            connecteam_user_id: submission.employeeId,
            submission_timestamp: new Date(submission.submissionTimestamp * 1000).toISOString(),
            submission_timezone: submission.timezone || null,
            entry_num: submission.entryNum || null,
            job_address: submission.jobAddress || null,
            job_latitude: submission.jobLatitude || null,
            job_longitude: submission.jobLongitude || null,
            start_time: submission.startTime || null,
            end_time: submission.endTime || null,
            job_type: Array.isArray(submission.jobType) ? submission.jobType : null,
            work_description: submission.workDescription || null,
            additional_notes: submission.additionalNotes || null,
            parts_materials_needed: submission.partsMaterialsNeeded || null,
            manager_note: submission.managerNote || null,
            manager_status: submission.managerStatus || null,
            raw_json: submission.rawData || submission,
            last_synced_at: new Date().toISOString(),
          };

          // Upsert submission
          const { data: submissionRecord, error } = await supabase
            .from('connecteam_form_submissions')
            .upsert(submissionData, {
              onConflict: 'connecteam_submission_id',
            })
            .select()
            .single();

          if (error) {
            result.errors.push(`Submission ${submission.formSubmissionId}: ${error.message}`);
            continue;
          }

          result.submissions.push(submissionRecord);
          result.synced++;
          
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }

          // Sync related data
          const submissionId = submissionRecord.id;

          // 1. Sync photos (already extracted by our API)
          if (submission.beforePhotos || submission.afterPhotos) {
            const photosResult = await syncPhotos(
              submissionId, 
              submission.beforePhotos || [], 
              submission.afterPhotos || []
            );
            result.photosCreated += photosResult.created;
          }

          // 2. Sync materials (already extracted by our API)
          if (submission.partsMaterialsNeeded) {
            console.log(`📦 [SYNC] Material found for submission ${submission.submissionId}:`, {
              materialsText: submission.partsMaterialsNeeded,
              length: submission.partsMaterialsNeeded.length,
              preview: submission.partsMaterialsNeeded.substring(0, 100)
            });
            const materialsResult = await syncMaterials(
              submissionId, 
              employeeId, 
              submission.partsMaterialsNeeded
            );
            console.log(`✅ [SYNC] Material result: created=${materialsResult.created}, errors=${materialsResult.errors.length}`);
            result.materialsCreated += materialsResult.created;
            if (materialsResult.errors.length > 0) {
              console.error('❌ [SYNC] Material errors:', materialsResult.errors);
            }
          } else {
            console.log(`⚠️ [SYNC] No materials for submission ${submission.submissionId}`);
          }

          // 3. Match and link jobs
          if (submission.jobAddress) {
            const matchResult = await matchAndLinkJobs(submissionId, submission.jobAddress);
            if (matchResult.matched) {
              result.jobsMatched++;
            }
          }
        } catch (err) {
          result.errors.push(
            `Submission ${submission.submissionId}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // Pagination
      offset += limit;
      hasMore = submissions.length === limit;
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Sync photos from submission to database
 * FIXED: Now checks for existing photos to prevent duplicates
 */
async function syncPhotos(
  submissionId: string,
  beforePhotos: string[],
  afterPhotos: string[]
): Promise<{ created: number; errors: string[] }> {
  const result = { created: 0, errors: [] as string[] };
  const supabase = createAdminClient();

  // Get existing photo URLs for this submission to prevent duplicates
  const { data: existingPhotos } = await supabase
    .from('connecteam_photos')
    .select('connecteam_url')
    .eq('submission_id', submissionId);

  const existingUrls = new Set(existingPhotos?.map(p => p.connecteam_url) || []);

  // Process before photos
  for (const photoUrl of beforePhotos) {
    try {
      // Skip if photo already exists
      if (existingUrls.has(photoUrl)) {
        console.log(`⏭️ [PHOTOS] Skipping duplicate photo: ${photoUrl.substring(0, 50)}...`);
        continue;
      }

      const { error } = await supabase
        .from('connecteam_photos')
        .insert({
          submission_id: submissionId,
          photo_type: 'before',
          connecteam_url: photoUrl,
        });

      if (error) {
        result.errors.push(`Before photo: ${error.message}`);
      } else {
        result.created++;
      }
    } catch (err) {
      result.errors.push(`Before photo: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Process after photos
  for (const photoUrl of afterPhotos) {
    try {
      // Skip if photo already exists
      if (existingUrls.has(photoUrl)) {
        console.log(`⏭️ [PHOTOS] Skipping duplicate photo: ${photoUrl.substring(0, 50)}...`);
        continue;
      }

      const { error } = await supabase
        .from('connecteam_photos')
        .insert({
          submission_id: submissionId,
          photo_type: 'after',
          connecteam_url: photoUrl,
        });

      if (error) {
        result.errors.push(`After photo: ${error.message}`);
      } else {
        result.created++;
      }
    } catch (err) {
      result.errors.push(`After photo: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Parse and store materials from submission
 * SIMPLIFIED: Just stores the entire materials text as ONE item (no parsing)
 * Handles multilingual text (Russian, English, etc.) and any formatting
 */
async function syncMaterials(
  submissionId: string,
  employeeId: string | null,
  materialsText: string
): Promise<{ created: number; errors: string[] }> {
  console.log('📦 [MATERIALS] syncMaterials called:', {
    submissionId,
    employeeId,
    materialsLength: materialsText?.length,
    materialsPreview: materialsText?.substring(0, 50)
  });

  const result = { created: 0, errors: [] as string[] };
  
  // Skip if empty or "N/A"
  if (!materialsText || materialsText.trim() === '' || materialsText.toLowerCase() === 'n/a') {
    console.log('⚠️ [MATERIALS] Skipping empty/N/A material');
    return result;
  }

  const supabase = createAdminClient();

  try {
    console.log('💾 [MATERIALS] Inserting to database...');
    // Store the ENTIRE text as ONE material item (no parsing)
    const { error } = await supabase
      .from('materials_checklist')
      .insert({
        submission_id: submissionId,
        employee_id: employeeId,
        material_description: materialsText.trim(), // Just the whole text
        quantity: null, // No quantity parsing
      });

    if (error) {
      console.error('❌ [MATERIALS] Database error:', error);
      result.errors.push(`Material storage error: ${error.message}`);
    } else {
      console.log('✅ [MATERIALS] Successfully stored material');
      result.created++;
    }
  } catch (err) {
    console.error('❌ [MATERIALS] Exception:', err);
    result.errors.push(`Storage error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Match submission address to jobs and link
 */
async function matchAndLinkJobs(
  submissionId: string,
  address: string
): Promise<{ matched: boolean; jobId: string | null; score: number | null }> {
  const supabase = createAdminClient();

  try {
    // Get active jobs from database with customer addresses
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        service_address,
        service_city,
        service_state,
        service_zip,
        customer_id,
        customers (
          address
        )
      `)
      .in('status', ['scheduled', 'working_on_it', 'parts_needed', 'done'])
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent jobs for performance

    if (jobsError || !jobs || jobs.length === 0) {
      return { matched: false, jobId: null, score: null };
    }

    // Transform jobs to have single address field
    // Prefer service_address, fallback to customer address
    const transformedJobs = jobs
      .map(job => {
        const customers = job.customers as any;
        let fullAddress = '';
        
        // Try service address first (if all components exist)
        if (job.service_address) {
          fullAddress = `${job.service_address}, ${job.service_city || ''}, ${job.service_state || ''} ${job.service_zip || ''}`.trim();
        }
        // Fallback to customer address
        else if (customers?.address) {
          fullAddress = customers.address;
        }
        
        // Clean up address (remove double commas, extra spaces)
        fullAddress = fullAddress.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
        
        return {
          id: job.id,
          address: fullAddress,
        };
      })
      .filter(j => j.address); // Only include jobs with addresses

    // Use address matcher to find best match
    const match = await matchAddressToJob(address, transformedJobs, { minScore: 0.8 });

    if (!match) {
      console.log(`⚠️ [MATCH] No match found for address: ${address}`);
      console.log(`   Available jobs: ${transformedJobs.length}`);
      if (transformedJobs.length > 0) {
        console.log(`   Sample job addresses:`, transformedJobs.slice(0, 3).map(j => j.address));
      }
      return { matched: false, jobId: null, score: null };
    }

    console.log(`✅ [MATCH] Found match for submission ${submissionId}`);
    console.log(`   ConnectTeam: ${address}`);
    console.log(`   Job: ${match.jobAddress}`);
    console.log(`   Score: ${(match.matchScore * 100).toFixed(1)}%`);


    // Update submission with match
    const { error: updateError } = await supabase
      .from('connecteam_form_submissions')
      .update({
        linked_job_id: match.jobId,
        match_confidence: match.confidence,
        match_method: match.matchMethod,
        match_score: match.matchScore,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission with match:', updateError);
    }

    // Log the match for audit
    await logAddressMatch(submissionId, match.jobId, address, match);

    // Update materials with job_id if materials exist
    await supabase
      .from('materials_checklist')
      .update({ job_id: match.jobId })
      .eq('submission_id', submissionId);

    return {
      matched: true,
      jobId: match.jobId,
      score: match.matchScore,
    };
  } catch (err) {
    console.error('Error matching jobs:', err);
    return { matched: false, jobId: null, score: null };
  }
}

/**
 * Log address match attempt for audit trail
 */
async function logAddressMatch(
  submissionId: string,
  jobId: string,
  address: string,
  match: any
): Promise<void> {
  const supabase = createAdminClient();

  try {
    await supabase.from('connecteam_address_matches').insert({
      submission_id: submissionId,
      job_id: jobId,
      matched_at: new Date().toISOString(),
      match_confidence: match.confidence,
      match_method: match.matchMethod,
      match_score: match.matchScore,
      connecteam_address: address,
      job_address: match.jobAddress,
    });
  } catch (err) {
    console.error('Error logging address match:', err);
    // Don't throw - logging failure shouldn't stop sync
  }
}

/**
 * Full sync - employees and submissions
 */
export async function fullSync(): Promise<{
  success: boolean;
  employees: EmployeeSyncResult;
  submissions: SubmissionSyncResult;
  duration: number;
}> {
  console.log('🚀 [FULL SYNC] Starting full sync...');
  const startTime = Date.now();

  // Sync employees first
  console.log('👥 [FULL SYNC] Step 1: Syncing employees...');
  const employeesResult = await syncEmployees();
  console.log('✅ [FULL SYNC] Employees result:', {
    synced: employeesResult.synced,
    created: employeesResult.created,
    updated: employeesResult.updated,
    errors: employeesResult.errors.length
  });

  // Then sync submissions (which depend on employees)
  console.log('📋 [FULL SYNC] Step 2: Syncing submissions...');
  const submissionsResult = await syncSubmissions();
  console.log('✅ [FULL SYNC] Submissions result:', {
    synced: submissionsResult.synced,
    created: submissionsResult.created,
    updated: submissionsResult.updated,
    photosCreated: submissionsResult.photosCreated,
    materialsCreated: submissionsResult.materialsCreated,
    jobsMatched: submissionsResult.jobsMatched,
    errors: submissionsResult.errors.length
  });

  const duration = Date.now() - startTime;
  console.log(`🎉 [FULL SYNC] Complete! Duration: ${duration}ms`);

  return {
    success: employeesResult.success && submissionsResult.success,
    employees: employeesResult,
    submissions: submissionsResult,
    duration,
  };
}
