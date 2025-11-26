/**
 * Auto-Retry Customer Matching for "N/A" Jobs
 *
 * Called by hourly cron job after Bill.com customer sync
 * Attempts to fuzzy match addresses for jobs with placeholder customers
 *
 * POST /api/jobs/retry-customer-matching
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchAddressToCustomer } from '@/lib/connecteam/address-customer-matcher';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  console.log('🔄 [RETRY MATCHING] Starting auto-retry customer matching...');

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const isCronRequest = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  if (!isCronRequest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stats = {
    total_checked: 0,
    matched: 0,
    still_unmatched: 0,
    errors: 0,
    error_details: [] as any[]
  };

  try {
    // Step 1: Find "N/A" placeholder customer
    const { data: placeholderCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', 'na-placeholder@placeholder.local')
      .single();

    if (!placeholderCustomer) {
      console.log('[RETRY MATCHING] No placeholder customer found - nothing to retry');
      return NextResponse.json({
        success: true,
        message: 'No jobs need retry matching',
        stats
      });
    }

    console.log(`[RETRY MATCHING] Found placeholder customer: ${placeholderCustomer.id}`);

    // Step 2: Find all jobs with "N/A" customer
    const { data: unmatchedJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, job_number, service_address')
      .eq('customer_id', placeholderCustomer.id)
      .not('service_address', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch unmatched jobs: ${fetchError.message}`);
    }

    if (!unmatchedJobs || unmatchedJobs.length === 0) {
      console.log('[RETRY MATCHING] No jobs with placeholder customer');
      return NextResponse.json({
        success: true,
        message: 'No jobs need retry matching',
        stats
      });
    }

    console.log(`[RETRY MATCHING] Found ${unmatchedJobs.length} jobs to retry`);
    stats.total_checked = unmatchedJobs.length;

    // Step 3: Try to match each job
    for (const job of unmatchedJobs) {
      try {
        console.log(`\n[RETRY MATCHING] Attempting to match job ${job.job_number}...`);
        console.log(`[RETRY MATCHING] Address: ${job.service_address}`);

        // Use fuzzy matching
        const matchedCustomerId = await matchAddressToCustomer(job.service_address);

        if (matchedCustomerId) {
          // Update job with matched customer
          const { error: updateError } = await supabase
            .from('jobs')
            .update({ customer_id: matchedCustomerId })
            .eq('id', job.id);

          if (updateError) {
            console.error(`[RETRY MATCHING] Failed to update job ${job.job_number}:`, updateError.message);
            stats.errors++;
            stats.error_details.push({
              job_number: job.job_number,
              error: updateError.message
            });
          } else {
            console.log(`[RETRY MATCHING] ✅ Matched job ${job.job_number} to customer ${matchedCustomerId}`);
            stats.matched++;
          }
        } else {
          console.log(`[RETRY MATCHING] ⚠️  No match found for job ${job.job_number}`);
          stats.still_unmatched++;
        }
      } catch (error: any) {
        console.error(`[RETRY MATCHING] Error processing job ${job.job_number}:`, error.message);
        stats.errors++;
        stats.error_details.push({
          job_number: job.job_number,
          error: error.message
        });
      }
    }

    console.log('\n✅ [RETRY MATCHING] Complete!');
    console.log('📊 Statistics:');
    console.log(`   - Total checked: ${stats.total_checked}`);
    console.log(`   - Matched: ${stats.matched}`);
    console.log(`   - Still unmatched: ${stats.still_unmatched}`);
    console.log(`   - Errors: ${stats.errors}`);

    return NextResponse.json({
      success: true,
      message: 'Retry matching completed',
      stats
    });

  } catch (error: any) {
    console.error('❌ [RETRY MATCHING] Fatal error:', error);
    return NextResponse.json({
      error: 'Retry matching failed',
      message: error.message,
      stats
    }, { status: 500 });
  }
}
