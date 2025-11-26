/**
 * API Route: Sync Job-Customer Matches
 *
 * Matches jobs to customers based on address similarity
 * Can be triggered manually or via cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { matchJobToCustomer } from '@/lib/customer-matcher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all jobs that either:
    // 1. Don't have a customer assigned (customer_id is null)
    // 2. Have an address but no customer (to catch edge cases)
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, service_address, customer_id')
      .not('service_address', 'is', null);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs to process',
        matched: 0,
        unmatched: 0,
      });
    }

    let matchedCount = 0;
    let unmatchedCount = 0;
    const matches: Array<{ jobId: string; customerId: string; matchScore: number }> = [];

    // Match each job to a customer
    for (const job of jobs) {
      try {
        const match = await matchJobToCustomer(job.service_address, {
          minScore: 0.85, // High confidence threshold
        });

        if (match) {
          // Update job with matched customer
          const { error: updateError } = await supabase
            .from('jobs')
            .update({ customer_id: match.customerId })
            .eq('id', job.id);

          if (updateError) {
            console.error(`Error updating job ${job.id}:`, updateError);
          } else {
            matchedCount++;
            matches.push({
              jobId: job.id,
              customerId: match.customerId,
              matchScore: match.matchScore,
            });
          }
        } else {
          unmatchedCount++;
        }
      } catch (matchError) {
        console.error(`Error matching job ${job.id}:`, matchError);
        unmatchedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalJobs: jobs.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
      matches: matches.slice(0, 10), // Return first 10 for debugging
    });
  } catch (error) {
    console.error('Error in sync-customers endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing (no auth required in development)
export async function GET(request: NextRequest) {
  // Only allow GET in development for testing
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST method' }, { status: 405 });
  }

  // Call POST internally
  return POST(request);
}
