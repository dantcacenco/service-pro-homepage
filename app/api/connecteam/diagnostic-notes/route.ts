/**
 * Diagnostic endpoint to check what notes exist in the database
 * GET /api/connecteam/diagnostic-notes
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  try {
    // Get all jobs with notes
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, job_number, service_address, additional_notes_status, materials_notes_status')
      .not('additional_notes_status', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const analysis: any = {
      totalJobsWithNotes: jobs.length,
      notesByDate: {} as Record<string, number>,
      notesByStatus: { undone: 0, in_progress: 0, done: 0 },
      recentNotes: [] as any[],
      nov18Notes: [] as any[]
    }

    jobs.forEach(job => {
      const notes = (job.additional_notes_status as any[]) || []

      notes.forEach(note => {
        // Count by date
        const date = new Date(note.created_at).toLocaleDateString()
        analysis.notesByDate[date] = (analysis.notesByDate[date] || 0) + 1

        // Count by status
        if (note.status === 'undone') analysis.notesByStatus.undone++
        else if (note.status === 'in_progress') analysis.notesByStatus.in_progress++
        else if (note.status === 'done') analysis.notesByStatus.done++

        // Collect recent notes
        if (analysis.recentNotes.length < 10) {
          analysis.recentNotes.push({
            job: job.job_number,
            address: job.service_address,
            created_at: note.created_at,
            status: note.status,
            text: note.note_text?.substring(0, 100),
            submission_id: note.submission_id
          })
        }

        // Check for 11/18 notes
        const noteDate = new Date(note.created_at)
        if (noteDate.getMonth() === 10 && noteDate.getDate() === 18 && noteDate.getFullYear() === 2025) {
          analysis.nov18Notes.push({
            job: job.job_number,
            address: job.service_address,
            created_at: note.created_at,
            status: note.status,
            text: note.note_text?.substring(0, 100),
            submission_id: note.submission_id
          })
        }
      })
    })

    return NextResponse.json({
      success: true,
      analysis,
      message: analysis.nov18Notes.length > 0
        ? `Found ${analysis.nov18Notes.length} notes from 11/18/2025`
        : 'No notes from 11/18/2025 found'
    })

  } catch (error: any) {
    console.error('[DIAGNOSTIC] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Clear all notes from all jobs
 */
export async function DELETE() {
  const supabase = createAdminClient()

  try {
    console.log('[DIAGNOSTIC] Clearing all notes from jobs...')

    // Get all jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id')

    if (fetchError) throw fetchError

    console.log(`[DIAGNOSTIC] Found ${jobs.length} jobs, clearing notes...`)

    // Clear all notes
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        additional_notes_status: [],
        materials_notes_status: []
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (updateError) throw updateError

    console.log('[DIAGNOSTIC] ✓ All notes cleared')

    return NextResponse.json({
      success: true,
      message: `Cleared notes from ${jobs.length} jobs`,
      jobsCleared: jobs.length
    })

  } catch (error: any) {
    console.error('[DIAGNOSTIC] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
