import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchAddressToJob } from '@/lib/connecteam/address-matcher';

/**
 * POST /api/connecteam/webhook
 * 
 * Receives webhook notifications from ConnectTeam for form submissions
 * 
 * ConnectTeam Webhook Documentation:
 * https://developer.connecteam.com/docs/forms-webhook
 * 
 * ACTUAL PAYLOAD FORMAT (from ConnectTeam docs):
 * {
 *   "type": "workflow",
 *   "title": "End of Job Report",
 *   "workflowId": "11221823",
 *   "workflowEntryId": "5b43a76b1d41c85da1ff8b77",
 *   "entryNum": 15,
 *   "dateSubmitted": "2018-05-25T17:20:22+03:00",
 *   "workflowEntry": [ array of question objects ],
 *   "user": { user details }
 * }
 * 
 * Security:
 * - ConnectTeam retries 3 times with 60-second intervals on failure
 * - Validates webhook structure and required fields
 * - Logs all webhook attempts for audit trail
 */

// ConnectTeam's ACTUAL webhook payload structure (from documentation)
interface ConnecteamWebhookPayload {
  type: 'workflow';
  title: string;
  workflowId: string;
  workflowEntryId: string;
  entryNum: number;
  dateSubmitted: string;
  workflowEntry: Array<{
    type: string;
    questionId: string;
    title: string;
    description?: string;
    location?: {
      longitude: number;
      latitude: number;
      address: string;
      isMock: boolean;
      altitude?: number;
      accuracy?: number;
      speed?: number;
    };
    // Different question types have different answer fields
    text?: string;              // openEnded
    markedAnswers?: any[];      // multipleChoice
    images?: string[];          // image
    date?: string;              // datetime
    time?: string;              // datetime
    datetime?: string;          // datetime
    rating?: number;            // rating
    number?: string;            // number
    completed?: boolean;        // task
    signature?: string;         // signature
    audioUrl?: string;          // audioRecording
    files?: Array<{             // file upload
      url: string;
      size: number;
      filename: string;
    }>;
  }>;
  user: {
    userId: number;
    customFields?: Array<{
      name: string;
      value: any;
    }>;
    lastName: string;
    phoneNumber?: string;
    firstName: string;
    email?: string;
    profile?: {
      url: string;
    };
  };
}

export async function POST(request: NextRequest) {
  console.log('🔔 [WEBHOOK] ConnectTeam webhook received');
  const supabase = createAdminClient();
  
  try {
    // Log raw request for debugging
    const rawBody = await request.text();
    console.log('📦 [WEBHOOK] Raw payload:', rawBody);
    
    // Parse webhook payload
    const payload: ConnecteamWebhookPayload = JSON.parse(rawBody);
    console.log('📋 [WEBHOOK] Parsed:', {
      type: payload.type,
      workflowId: payload.workflowId,
      workflowEntryId: payload.workflowEntryId,
      title: payload.title,
      dateSubmitted: payload.dateSubmitted,
      userId: payload.user?.userId,
    });

    // Validate required fields
    if (!payload.workflowEntryId || !payload.workflowId || !payload.user?.userId) {
      console.error('❌ [WEBHOOK] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only process "End of Job Report" form (ID: 11221823)
    if (payload.workflowId !== '11221823') {
      console.log(`ℹ️ [WEBHOOK] Ignoring webhook for workflow ${payload.workflowId}`);
      return NextResponse.json({
        success: true,
        message: 'Workflow not configured for processing',
      });
    }

    // Check if this is a duplicate webhook (ConnectTeam retries)
    const { data: existingSubmission } = await supabase
      .from('connecteam_form_submissions')
      .select('id, updated_at')
      .eq('connecteam_submission_id', payload.workflowEntryId)
      .single();
    
    if (existingSubmission) {
      console.log('⚠️ [WEBHOOK] Duplicate webhook - submission already exists');
      // Update existing submission
      await updateSubmission(supabase, existingSubmission.id, payload);
      return NextResponse.json({
        success: true,
        message: 'Submission updated',
        submissionId: payload.workflowEntryId,
      });
    }

    // Parse form answers
    const parsedData = parseWorkflowEntry(payload.workflowEntry);
    console.log('📋 [WEBHOOK] Parsed data:', {
      address: parsedData.address,
      workDescription: parsedData.workDescription?.substring(0, 50),
      materialsNeeded: parsedData.materialsNeeded?.substring(0, 50),
      photoCount: parsedData.photos.length,
    });

    // Get or create employee record
    const employee = await getOrCreateEmployee(supabase, payload.user);
    
    // Create new submission
    console.log('✨ [WEBHOOK] Creating new submission');
    await createSubmission(supabase, payload, parsedData, employee?.id || null);

    return NextResponse.json({
      success: true,
      message: 'Submission created',
      submissionId: payload.workflowEntryId,
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error);
    
    // Return 200 to prevent ConnectTeam retries (log error for manual review)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 200 }); // Changed to 200 to prevent retries
  }
}

/**
 * Parse workflowEntry array (ConnectTeam's actual payload format)
 */
function parseWorkflowEntry(workflowEntry: any[]): {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: Date | null;
  endTime: Date | null;
  jobType: string[];
  workDescription: string | null;
  additionalNotes: string | null;
  materialsNeeded: string | null;
  photos: Array<{ type: 'before' | 'after'; url: string }>;
} {
  const result = {
    address: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    startTime: null as Date | null,
    endTime: null as Date | null,
    jobType: [] as string[],
    workDescription: null as string | null,
    additionalNotes: null as string | null,
    materialsNeeded: null as string | null,
    photos: [] as Array<{ type: 'before' | 'after'; url: string }>,
  };

  for (const entry of workflowEntry) {
    const title = entry.title?.toLowerCase() || '';
    
    // Address field (location type question)
    if (entry.type === 'location' && entry.location) {
      result.address = entry.location.address;
      result.latitude = entry.location.latitude;
      result.longitude = entry.location.longitude;
    }
    
    // Start time
    if (title.includes('start time') || title.includes('arrived')) {
      if (entry.datetime) {
        result.startTime = new Date(entry.datetime);
      }
    }
    
    // End time
    if (title.includes('end time') || title.includes('completed') || title.includes('finished')) {
      if (entry.datetime) {
        result.endTime = new Date(entry.datetime);
      }
    }
    
    // Job type (multiple choice)
    if (title.includes('job type') || title.includes('service type')) {
      if (Array.isArray(entry.markedAnswers)) {
        result.jobType = entry.markedAnswers.map((a: any) => a.value || a);
      }
    }
    
    // Work description
    if (title.includes('what was done') || title.includes('work performed') || title.includes('description')) {
      result.workDescription = entry.text || null;
    }
    
    // Additional notes
    if (title.includes('notes') || title.includes('comments')) {
      result.additionalNotes = entry.text || null;
    }
    
    // Materials needed
    if (title.includes('materials') || title.includes('parts needed') || title.includes('supplies')) {
      result.materialsNeeded = entry.text || null;
    }
    
    // Photos (before/after)
    if (entry.type === 'image' && entry.images && Array.isArray(entry.images)) {
      const photoType = title.includes('before') ? 'before' : 'after';
      for (const imageUrl of entry.images) {
        result.photos.push({ type: photoType, url: imageUrl });
      }
    }
  }

  return result;
}

/**
 * Get or create employee record
 */
async function getOrCreateEmployee(
  supabase: any,
  user: any
): Promise<{ id: string } | null> {
  try {
    // Try to find existing employee
    const { data: existing } = await supabase
      .from('connecteam_employees')
      .select('id')
      .eq('connecteam_user_id', user.userId)
      .single();

    if (existing) {
      return existing;
    }

    // Create new employee
    const { data: newEmployee, error } = await supabase
      .from('connecteam_employees')
      .insert({
        connecteam_user_id: user.userId,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email || null,
        phone: user.phoneNumber || null,
        user_type: 'user',
        is_archived: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create employee:', error);
      return null;
    }

    return newEmployee;
  } catch (error) {
    console.error('Error in getOrCreateEmployee:', error);
    return null;
  }
}

/**
 * Create new submission with automatic address matching
 */
async function createSubmission(
  supabase: any,
  payload: ConnecteamWebhookPayload,
  parsedData: any,
  employeeId: string | null
): Promise<void> {
  // Attempt automatic address matching
  let linkedJobId = null;
  let matchConfidence = null;
  let matchMethod = null;
  let matchScore = null;

  if (parsedData.address) {
    try {
      // Fetch active jobs for matching
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, address')
        .not('address', 'is', null)
        .in('status', ['scheduled', 'working_on_it', 'parts_needed']);

      if (jobs && jobs.length > 0) {
        const jobList = jobs.map((job: any) => ({
          id: job.id,
          address: job.address || ''
        }));

        const matchResult = await matchAddressToJob(parsedData.address, jobList, { minScore: 0.8 });
        
        if (matchResult && matchResult.matchScore >= 0.8) {
          linkedJobId = matchResult.jobId;
          matchConfidence = matchResult.confidence;
          matchMethod = matchResult.matchMethod;
          matchScore = matchResult.matchScore;
          
          console.log('✅ [WEBHOOK] Auto-matched to job:', linkedJobId, `(${Math.round(matchResult.matchScore * 100)}%)`);
        } else {
          console.log('⚠️ [WEBHOOK] No confident match found');
        }
      }
    } catch (error) {
      console.error('Error matching address:', error);
    }
  }

  // Parse submission timestamp
  const submissionTimestamp = new Date(payload.dateSubmitted).toISOString();

  // Insert submission
  const { error: submissionError } = await supabase
    .from('connecteam_form_submissions')
    .insert({
      connecteam_submission_id: payload.workflowEntryId,
      form_id: payload.workflowId,
      employee_id: employeeId,
      connecteam_user_id: payload.user.userId,
      submission_timestamp: submissionTimestamp,
      job_address: parsedData.address,
      job_latitude: parsedData.latitude,
      job_longitude: parsedData.longitude,
      linked_job_id: linkedJobId,
      match_confidence: matchConfidence,
      match_method: matchMethod,
      match_score: matchScore,
      start_time: parsedData.startTime?.toISOString(),
      end_time: parsedData.endTime?.toISOString(),
      job_type: parsedData.jobType,
      work_description: parsedData.workDescription,
      additional_notes: parsedData.additionalNotes,
      parts_materials_needed: parsedData.materialsNeeded,
      raw_json: payload,
    });

  if (submissionError) {
    throw new Error(`Failed to create submission: ${submissionError.message}`);
  }

  // Get the created submission ID
  const { data: createdSubmission } = await supabase
    .from('connecteam_form_submissions')
    .select('id')
    .eq('connecteam_submission_id', payload.workflowEntryId)
    .single();

  if (!createdSubmission) {
    throw new Error('Failed to retrieve created submission');
  }

  // Store photos (with duplicate check)
  if (parsedData.photos.length > 0) {
    // Get existing photos to prevent duplicates
    const { data: existingPhotos } = await supabase
      .from('connecteam_photos')
      .select('connecteam_url')
      .eq('submission_id', createdSubmission.id);

    const existingUrls = new Set(existingPhotos?.map((p: any) => p.connecteam_url) || []);

    // Filter out photos that already exist
    const newPhotos = parsedData.photos
      .filter((photo: any) => !existingUrls.has(photo.url))
      .map((photo: any) => ({
        submission_id: createdSubmission.id,
        photo_type: photo.type,
        connecteam_url: photo.url,
      }));

    if (newPhotos.length > 0) {
      const { error: photoError } = await supabase
        .from('connecteam_photos')
        .insert(newPhotos);

      if (photoError) {
        console.error('Failed to store photos:', photoError);
      } else {
        console.log(`📸 [WEBHOOK] Stored ${newPhotos.length} new photos (${parsedData.photos.length - newPhotos.length} duplicates skipped)`);
      }
    } else {
      console.log(`⏭️ [WEBHOOK] All ${parsedData.photos.length} photos already exist, skipping`);
    }
  }

  // Store materials if provided
  if (parsedData.materialsNeeded && parsedData.materialsNeeded.trim() !== '') {
    const { error: materialError } = await supabase
      .from('materials_checklist')
      .insert({
        submission_id: createdSubmission.id,
        job_id: linkedJobId,
        employee_id: employeeId,
        material_description: parsedData.materialsNeeded,
        ordered: false,
      });

    if (materialError) {
      console.error('Failed to store materials:', materialError);
    } else {
      console.log('📦 [WEBHOOK] Stored materials checklist');
    }
  }

  // Log address match attempt
  if (linkedJobId) {
    await supabase
      .from('connecteam_address_matches')
      .insert({
        submission_id: createdSubmission.id,
        job_id: linkedJobId,
        connecteam_address: parsedData.address,
        service_pro_address: 'auto-matched',
        match_score: matchScore,
        match_method: 'fuzzy',
      });
  }
}

/**
 * Update existing submission
 * FIXED: Now also syncs photos when updating
 */
async function updateSubmission(
  supabase: any,
  submissionId: string,
  payload: ConnecteamWebhookPayload
): Promise<void> {
  const parsedData = parseWorkflowEntry(payload.workflowEntry);

  // Update submission
  const { error: updateError } = await supabase
    .from('connecteam_form_submissions')
    .update({
      job_address: parsedData.address,
      job_latitude: parsedData.latitude,
      job_longitude: parsedData.longitude,
      start_time: parsedData.startTime?.toISOString(),
      end_time: parsedData.endTime?.toISOString(),
      job_type: parsedData.jobType,
      work_description: parsedData.workDescription,
      additional_notes: parsedData.additionalNotes,
      parts_materials_needed: parsedData.materialsNeeded,
      raw_json: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (updateError) {
    throw new Error(`Failed to update submission: ${updateError.message}`);
  }

  // Sync photos (with duplicate check)
  if (parsedData.photos.length > 0) {
    const { data: existingPhotos } = await supabase
      .from('connecteam_photos')
      .select('connecteam_url')
      .eq('submission_id', submissionId);

    const existingUrls = new Set(existingPhotos?.map((p: any) => p.connecteam_url) || []);

    const newPhotos = parsedData.photos
      .filter((photo: any) => !existingUrls.has(photo.url))
      .map((photo: any) => ({
        submission_id: submissionId,
        photo_type: photo.type,
        connecteam_url: photo.url,
      }));

    if (newPhotos.length > 0) {
      const { error: photoError } = await supabase
        .from('connecteam_photos')
        .insert(newPhotos);

      if (photoError) {
        console.error('Failed to sync photos on update:', photoError);
      } else {
        console.log(`📸 [WEBHOOK] Synced ${newPhotos.length} new photos on update`);
      }
    }
  }

  console.log('✅ [WEBHOOK] Submission updated successfully');
}
