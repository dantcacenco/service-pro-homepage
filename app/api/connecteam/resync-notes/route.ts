import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transformSubmission } from '@/lib/connecteam/sync-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Re-sync existing ConnectTeam submissions with fixed note extraction
 * Applies the corrected transformSubmission logic to all submissions in database
 * 
 * This endpoint re-processes all ConnectTeam submissions to extract notes properly.
 */
export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Fetch all submissions from database
    const { data: submissions, error: fetchError } = await supabase
      .from('connecteam_form_submissions')
      .select('id, raw_json')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching submissions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }
    
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No submissions to process',
        totalSubmissions: 0,
        updated: 0,
        skipped: 0,
        errors: []
      })
    }
    
    const result = {
      totalSubmissions: submissions.length,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    }
    
    // Process each submission
    for (const submission of submissions) {
      try {
        // Skip if no raw_json
        if (!submission.raw_json) {
          result.skipped++
          continue
        }
        
        // Apply fixed transformation logic
        const transformed = transformSubmission(submission.raw_json)
        
        // Update submission with corrected extracted data
        const { error: updateError } = await supabase
          .from('connecteam_form_submissions')
          .update({
            work_description: transformed.workDescription || null,
            additional_notes: transformed.additionalNotes || null,
            parts_materials_needed: transformed.partsMaterialsNeeded || null,
            manager_note: transformed.managerNote || null,
            manager_status: transformed.managerStatus || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', submission.id)
        
        if (updateError) {
          console.error(`Error updating submission ${submission.id}:`, updateError)
          result.errors.push({
            id: submission.id,
            error: updateError.message
          })
        } else {
          result.updated++
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Error processing submission ${submission.id}:`, errorMessage)
        result.errors.push({
          id: submission.id,
          error: errorMessage
        })
      }
    }
    
    console.log('Re-sync complete:', result)
    
    return NextResponse.json({
      success: true,
      ...result
    })
    
  } catch (error) {
    console.error('Re-sync failed:', error)
    return NextResponse.json(
      { 
        error: 'Re-sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
