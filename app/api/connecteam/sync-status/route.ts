import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapConnecteamToJobStatus } from '@/lib/connecteam/status-mapper'

/**
 * POST /api/connecteam/sync-status
 * 
 * Syncs ConnectTeam manager status to Service Pro job status.
 * 
 * Request body:
 * {
 *   submissionId: string - The ConnectTeam submission ID
 *   jobId: string - The job ID to update
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   newStatus: string - The new job status
 *   connecteamStatus: string - The original ConnectTeam status
 * }
 */
export async function POST(request: Request) {
  try {
    const { submissionId, jobId } = await request.json()
    
    if (!submissionId || !jobId) {
      return NextResponse.json(
        { error: 'Missing submissionId or jobId' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // Get submission with manager status
    const { data: submission, error: submissionError } = await supabase
      .from('connecteam_form_submissions')
      .select('manager_status')
      .eq('id', submissionId)
      .single()
    
    if (submissionError) {
      console.error('Error fetching submission:', submissionError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    if (!submission?.manager_status) {
      return NextResponse.json(
        { error: 'No manager status found on this submission' },
        { status: 400 }
      )
    }
    
    // Map ConnectTeam status to job status
    const newStatus = mapConnecteamToJobStatus(submission.manager_status)
    
    // Update job status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)
    
    if (updateError) {
      console.error('Error updating job status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      newStatus,
      connecteamStatus: submission.manager_status
    })
  } catch (error) {
    console.error('Sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to sync status' },
      { status: 500 }
    )
  }
}