import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchAddressToJob, normalizeAddress, calculateSimilarity } from '@/lib/connecteam/address-matcher';

/**
 * POST /api/connecteam/relink-jobs
 * 
 * Re-attempts to link unlinked ConnectTeam submissions to jobs
 * Useful after fixing address matching logic or adding new jobs
 * 
 * Query params:
 * - force: "true" to re-link ALL submissions (including already linked)
 * - dry_run: "true" to just show what would be matched without updating
 */
export async function POST(request: NextRequest) {
  console.log('🔗 [RELINK] Endpoint called');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';
    const dryRun = searchParams.get('dry_run') === 'true';
    
    console.log('🔗 [RELINK] Starting job re-linking process...');
    console.log(`   Force: ${force}, Dry Run: ${dryRun}`);
    
    const supabase = createAdminClient();
    console.log('✅ [RELINK] Supabase client created');
    
    // Get submissions to process
    let submissionsQuery = supabase
      .from('connecteam_form_submissions')
      .select('id, connecteam_submission_id, job_address, linked_job_id')
      .not('job_address', 'is', null);
    
    if (!force) {
      submissionsQuery = submissionsQuery.is('linked_job_id', null);
    }
    
    const { data: submissions, error: subError } = await submissionsQuery
      .order('submission_timestamp', { ascending: false })
      .limit(100);
    
    if (subError) throw subError;
    
    console.log(`📋 [RELINK] Found ${submissions?.length || 0} submissions to process`);
    
    // Get active jobs with addresses
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
      .limit(200);
    
    if (jobsError) throw jobsError;
    
    console.log(`📦 [RELINK] Found ${jobs?.length || 0} active jobs`);
    
    // Build job addresses
    const jobsWithAddresses = (jobs || [])
      .map(job => {
        const customers = job.customers as any;
        let address = '';
        
        if (job.service_address) {
          address = `${job.service_address}, ${job.service_city || ''}, ${job.service_state || ''} ${job.service_zip || ''}`.trim();
        } else if (customers?.address) {
          address = customers.address;
        }
        
        address = address.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
        
        return {
          id: job.id,
          jobNumber: job.job_number,
          address,
        };
      })
      .filter(j => j.address);
    
    console.log(`✅ [RELINK] ${jobsWithAddresses.length} jobs have valid addresses`);
    
    // Process each submission
    const results = {
      processed: 0,
      matched: 0,
      notMatched: 0,
      updated: 0,
      errors: [] as string[],
      matches: [] as any[],
    };
    
    for (const submission of submissions || []) {
      results.processed++;
      
      try {
        const match = await matchAddressToJob(
          submission.job_address,
          jobsWithAddresses,
          { minScore: 0.8 }
        );
        
        if (match) {
          results.matched++;
          const matchedJob = jobsWithAddresses.find(j => j.id === match.jobId);
          
          results.matches.push({
            submissionId: submission.connecteam_submission_id,
            connecteamAddress: submission.job_address,
            jobNumber: matchedJob?.jobNumber,
            jobAddress: match.jobAddress,
            score: match.matchScore,
            confidence: match.confidence,
            previouslyLinked: !!submission.linked_job_id,
          });
          
          // Update submission if not dry run
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('connecteam_form_submissions')
              .update({
                linked_job_id: match.jobId,
                match_confidence: match.confidence,
                match_method: match.matchMethod,
                match_score: match.matchScore,
              })
              .eq('id', submission.id);
            
            if (updateError) {
              results.errors.push(`Update failed for ${submission.connecteam_submission_id}: ${updateError.message}`);
            } else {
              results.updated++;
              
              // Update materials with job_id
              await supabase
                .from('materials_checklist')
                .update({ job_id: match.jobId })
                .eq('submission_id', submission.id);
            }
          }
        } else {
          results.notMatched++;
          
          // Show top 3 closest for debugging
          const topMatches = jobsWithAddresses
            .map(job => ({
              job,
              score: calculateSimilarity(
                normalizeAddress(submission.job_address),
                normalizeAddress(job.address)
              ),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          
          results.matches.push({
            submissionId: submission.connecteam_submission_id,
            connecteamAddress: submission.job_address,
            matched: false,
            topCandidates: topMatches.map(m => ({
              jobNumber: m.job.jobNumber,
              address: m.job.address,
              score: m.score,
            })),
          });
        }
      } catch (err) {
        results.errors.push(`Error processing ${submission.connecteam_submission_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    console.log('✅ [RELINK] Complete!');
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Matched: ${results.matched}`);
    console.log(`   Not Matched: ${results.notMatched}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    return NextResponse.json({
      success: true,
      summary: {
        processed: results.processed,
        matched: results.matched,
        notMatched: results.notMatched,
        updated: results.updated,
        errors: results.errors.length,
      },
      matches: results.matches,
      errors: results.errors,
      dryRun,
    });
  } catch (error) {
    console.error('❌ [RELINK] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to relink jobs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
