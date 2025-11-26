import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  matchAddressToJob, 
  findAllMatches, 
  normalizeAddress,
  calculateSimilarity 
} from '@/lib/connecteam/address-matcher';

/**
 * POST /api/connecteam/match-address
 * 
 * Match a ConnectTeam address to Service Pro jobs
 * 
 * Request body:
 * {
 *   address: string,              // ConnectTeam address to match
 *   findAll?: boolean,            // Return all matches above threshold
 *   minScore?: number,            // Minimum similarity score (0.0-1.0)
 *   includeArchived?: boolean,    // Include archived jobs
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   query: {
 *     address: string,
 *     normalized: string
 *   },
 *   match?: AddressMatch,         // Best match (if findAll=false)
 *   matches?: AddressMatch[],     // All matches (if findAll=true)
 *   totalJobs: number,
 *   timestamp: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      address, 
      findAll = false,
      minScore = 0.8,
      includeArchived = false 
    } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { 
          error: 'Missing or invalid address',
          details: 'Request body must include "address" string'
        },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Fetch active jobs from database
    let query = supabase
      .from('jobs')
      .select('id, job_number, address, status')
      .not('address', 'is', null);

    // Filter by status unless including archived
    if (!includeArchived) {
      query = query.in('status', ['scheduled', 'working_on_it', 'parts_needed']);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Database error fetching jobs:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch jobs from database',
          details: error.message
        },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        query: {
          address,
          normalized: normalizeAddress(address)
        },
        match: null,
        matches: [],
        totalJobs: 0,
        message: 'No jobs found in database',
        timestamp: new Date().toISOString(),
      });
    }

    // Prepare jobs for matching
    const jobList = jobs.map(job => ({
      id: job.id,
      address: job.address || ''
    }));

    // Perform matching
    const options = { minScore, includeArchived };

    if (findAll) {
      // Find all potential matches
      const matches = await findAllMatches(address, jobList, options);

      return NextResponse.json({
        success: true,
        query: {
          address,
          normalized: normalizeAddress(address)
        },
        matches,
        totalMatches: matches.length,
        totalJobs: jobs.length,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Find best match only
      const match = await matchAddressToJob(address, jobList, options);

      return NextResponse.json({
        success: true,
        query: {
          address,
          normalized: normalizeAddress(address)
        },
        match,
        totalJobs: jobs.length,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Error matching address:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/connecteam/match-address/test
 * 
 * Test the address normalization and similarity calculation
 * 
 * Query params:
 * - address1: First address to compare
 * - address2: Second address to compare
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address1 = searchParams.get('address1');
    const address2 = searchParams.get('address2');

    if (!address1 || !address2) {
      return NextResponse.json(
        { 
          error: 'Missing parameters',
          details: 'Both address1 and address2 query parameters are required'
        },
        { status: 400 }
      );
    }

    const normalized1 = normalizeAddress(address1);
    const normalized2 = normalizeAddress(address2);
    const similarity = calculateSimilarity(normalized1, normalized2);

    return NextResponse.json({
      success: true,
      comparison: {
        address1: {
          original: address1,
          normalized: normalized1
        },
        address2: {
          original: address2,
          normalized: normalized2
        },
        similarity,
        isMatch: similarity >= 0.8,
        confidence: similarity >= 0.95 ? 'high' : similarity >= 0.85 ? 'medium' : 'low'
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in address test:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
