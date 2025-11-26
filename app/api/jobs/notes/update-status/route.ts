import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { noteId, status } = body

    console.log('[Update Note Status] Request:', { noteId, status })

    if (!noteId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: noteId, status' },
        { status: 400 }
      )
    }

    if (!['undone', 'in_progress', 'done'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: undone, in_progress, or done' },
        { status: 400 }
      )
    }

    // Fetch all jobs with notes (we need to search through them)
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, boss_notes_status, additional_notes_status, materials_notes_status')
      .not('status', 'in', '("archived", "cancelled")')

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch jobs', details: fetchError.message }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found' }, { status: 404 })
    }

    // Search through all jobs to find the one containing this note
    let job: any = null
    for (const j of jobs) {
      if (j.boss_notes_status?.some((n: any) => n.id === noteId) ||
          j.additional_notes_status?.some((n: any) => n.id === noteId) ||
          j.materials_notes_status?.some((n: any) => n.id === noteId)) {
        job = j
        break
      }
    }

    if (!job) {
      console.error('[Update Note Status] Note not found in any job:', noteId)
      return NextResponse.json({ error: 'Note not found in any job' }, { status: 404 })
    }

    console.log('[Update Note Status] Found job:', job.id)

    const now = new Date().toISOString()

    // Determine which field contains the note and update it
    let updatedField: string | null = null
    let updatedNotes: any[] = []

    if (job.boss_notes_status?.some((n: any) => n.id === noteId)) {
      updatedField = 'boss_notes_status'
      updatedNotes = job.boss_notes_status.map((n: any) =>
        n.id === noteId ? { ...n, status, updated_at: now } : n
      )
    } else if (job.additional_notes_status?.some((n: any) => n.id === noteId)) {
      updatedField = 'additional_notes_status'
      updatedNotes = job.additional_notes_status.map((n: any) =>
        n.id === noteId ? { ...n, status, updated_at: now } : n
      )
    } else if (job.materials_notes_status?.some((n: any) => n.id === noteId)) {
      updatedField = 'materials_notes_status'
      updatedNotes = job.materials_notes_status.map((n: any) =>
        n.id === noteId ? { ...n, status, updated_at: now } : n
      )
    }

    if (!updatedField) {
      console.error('[Update Note Status] Note not found in any field')
      return NextResponse.json({ error: 'Note not found in any field' }, { status: 404 })
    }

    console.log('[Update Note Status] Updating field:', updatedField, 'for job:', job.id)

    // Update the job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ [updatedField]: updatedNotes })
      .eq('id', job.id)

    if (updateError) {
      console.error('[Update Note Status] Error updating:', updateError)
      return NextResponse.json({ error: 'Failed to update note status', details: updateError.message }, { status: 500 })
    }

    console.log('[Update Note Status] Successfully updated note')

    return NextResponse.json({
      success: true,
      noteId,
      status,
      updated_at: now
    })
  } catch (error) {
    console.error('Error in update-status route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
