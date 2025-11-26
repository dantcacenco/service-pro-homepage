import { NextRequest, NextResponse } from 'next/server';

/**
 * ConnectTeam Form Submissions API Endpoint
 *
 * GET /api/connecteam/submissions
 *
 * DISABLED - ConnectTeam API requires premium subscription
 */
export async function GET(request: NextRequest) {
  console.log('🚫 [API] ConnectTeam submissions endpoint called - DISABLED (requires premium subscription)');

  return NextResponse.json({
    success: false,
    disabled: true,
    error: 'ConnectTeam API is disabled',
    message: 'ConnectTeam API requires a premium subscription. Please upgrade your ConnectTeam plan to enable API access.',
    submissions: [],
    pagination: {
      offset: 0,
      limit: 0,
      total: 0,
      hasMore: false,
    },
    timestamp: new Date().toISOString(),
  }, { status: 503 });
}

/* DISABLED - Original code below requires premium ConnectTeam subscription

const CONNECTEAM_API_URL = process.env.CONNECTEAM_API_URL || 'https://api.connecteam.com';
const CONNECTEAM_API_KEY = process.env.CONNECTEAM_API_KEY;
const FORM_ID = '11221823'; // "End of Job Report" form

interface ConnectTeamFormSubmission {
  formSubmissionId: string;
  submittingUserId: number;
  submissionTimestamp: number;
  submissionTimezone: string;
  answers: Array<{
    questionId: string;
    questionText?: string;
    questionType: string;
    value?: string;
    timestamp?: number; // For datetime questions
    timezone?: string;
    locationInput?: {
      address: string;
      latitude: number;
      longitude: number;
    };
    selectedAnswers?: Array<{ text: string }>;
    images?: Array<{ url: string }>;
  }>;
  entryNum?: number;
  managerNote?: string;
  status?: string;
}

interface ProcessedSubmission {
  submissionId: string;
  employeeId: number;
  submissionTimestamp: number;
  submissionDate: string;
  timezone: string;
  entryNum?: number;
  
  // Extracted answers
  startTime?: string;
  endTime?: string;
  jobAddress?: string;
  jobLatitude?: number;
  jobLongitude?: number;
  jobType?: string[];
  workDescription?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  additionalNotes?: string;
  partsMaterialsNeeded?: string;
  
  // Manager fields
  managerNote?: string;
  status?: string;
  
  // Raw data backup
  rawData: ConnectTeamFormSubmission;
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key
    if (!CONNECTEAM_API_KEY) {
      return NextResponse.json(
        { error: 'ConnectTeam API key not configured' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Fetch form submissions from ConnectTeam API
    const url = `${CONNECTEAM_API_URL}/forms/v1/forms/${FORM_ID}/form-submissions?offset=${offset}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': CONNECTEAM_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConnectTeam API error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch form submissions',
          status: response.status,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract submissions from nested structure (data.data.formSubmissions)
    const rawSubmissions: ConnectTeamFormSubmission[] = data.data?.formSubmissions || [];

    // Process submissions to extract relevant data
    const processedSubmissions: ProcessedSubmission[] = rawSubmissions.map((submission) => {
      const processed: ProcessedSubmission = {
        submissionId: submission.formSubmissionId,
        employeeId: submission.submittingUserId,
        submissionTimestamp: submission.submissionTimestamp,
        submissionDate: new Date(submission.submissionTimestamp * 1000).toLocaleString(), // Convert seconds to milliseconds
        timezone: submission.submissionTimezone,
        entryNum: submission.entryNum,
        managerNote: submission.managerNote,
        status: submission.status,
        rawData: submission,
      };

      // Extract data from answers array using questionId
      // Question IDs from ConnectTeam form (verified from actual API response)
      const QUESTION_IDS = {
        START_TIME: '1f14e73b-5fd1-525a-65e9-bf7ed906808c',       // Start time
        END_TIME: 'b9b46e58-26bb-3df1-d1fb-1b7d4c7d8142',         // End time
        JOB_LOCATION: '359fedb3-2e43-faf4-94c7-9dcc2c19020d',     // Job Location 📍
        JOB_TYPE: '8a43070c-b65f-4c65-4aef-4da1e914ebe1',         // Job Type
        WORK_DESCRIPTION: '4f87cfe2-f94c-f14d-393a-1b3a98baeb9b', // "What was done?"
        BEFORE_PHOTOS: '940729f2-f0d1-3213-5fcc-a46569ec0cab',    // Before pictures 📷
        AFTER_PHOTOS: 'c1f997fd-b464-3c91-66c6-9626ec7fc75b',     // After pictures 📸
        ADDITIONAL_NOTES: '0d04f47d-c7c7-2bf8-63eb-1bf78814e499', // Additional notes
        MATERIALS_NEEDED: '8ed44929-a716-ace0-3ec6-aab036963b87', // Parts/material needed ⭐
      };

      submission.answers.forEach((answer) => {
        // Start Time (datetime)
        if (answer.questionId === QUESTION_IDS.START_TIME && answer.timestamp) {
          processed.startTime = new Date(answer.timestamp * 1000).toLocaleString();
        }

        // End Time (datetime)
        if (answer.questionId === QUESTION_IDS.END_TIME && answer.timestamp) {
          processed.endTime = new Date(answer.timestamp * 1000).toLocaleString();
        }

        // Job Location
        if (answer.questionType === 'location' && answer.locationInput) {
          processed.jobAddress = answer.locationInput.address;
          processed.jobLatitude = answer.locationInput.latitude;
          processed.jobLongitude = answer.locationInput.longitude;
        }

        // Job Type (multiple choice)
        if (answer.questionType === 'multipleChoice' && answer.selectedAnswers) {
          processed.jobType = answer.selectedAnswers.map((a) => a.text);
        }

        // Work Description ("What was done?")
        if (answer.questionId === QUESTION_IDS.WORK_DESCRIPTION && answer.value) {
          processed.workDescription = answer.value;
        }

        // Additional Notes
        if (answer.questionId === QUESTION_IDS.ADDITIONAL_NOTES && answer.value) {
          processed.additionalNotes = answer.value;
        }

        // Parts/Materials Needed (KEY for checklist)
        if (answer.questionId === QUESTION_IDS.MATERIALS_NEEDED && answer.value) {
          processed.partsMaterialsNeeded = answer.value;
        }

        // Before Pictures
        if (answer.questionId === QUESTION_IDS.BEFORE_PHOTOS && answer.questionType === 'image' && answer.images) {
          processed.beforePhotos = answer.images.map((img) => img.url);
        }

        // After Pictures
        if (answer.questionId === QUESTION_IDS.AFTER_PHOTOS && answer.questionType === 'image' && answer.images) {
          processed.afterPhotos = answer.images.map((img) => img.url);
        }
      });

      return processed;
    });

    // Calculate pagination metadata
    const total = processedSubmissions.length;
    const hasMore = total === limit; // If we got exactly 'limit' results, there might be more

    // Return processed submissions with pagination
    return NextResponse.json({
      success: true,
      submissions: processedSubmissions,
      pagination: {
        offset,
        limit,
        total,
        hasMore,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching form submissions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
END OF DISABLED CODE */
