import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { JobNote } from '@/app/types'

interface JobNoteWithMeta extends JobNote {
  job_number: string
  service_address?: string
  technician_name?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active jobs (not archived/cancelled) with their notes
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        service_address,
        boss_notes_status,
        additional_notes_status,
        materials_notes_status,
        assigned_technician:assigned_technician_id(full_name),
        created_by
      `)
      .not('status', 'in', '("archived", "cancelled")')
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Aggregate all notes from all jobs
    const allNotes: JobNoteWithMeta[] = []

    for (const job of jobs || []) {
      const technicianName = (job.assigned_technician as any)?.full_name || undefined

      // Boss notes
      if (job.boss_notes_status && Array.isArray(job.boss_notes_status)) {
        for (const note of job.boss_notes_status) {
          allNotes.push({
            ...note,
            job_number: job.job_number,
            service_address: job.service_address || undefined,
            technician_name: technicianName,
          })
        }
      }

      // Additional notes (from ConnectTeam)
      if (job.additional_notes_status && Array.isArray(job.additional_notes_status)) {
        for (const note of job.additional_notes_status) {
          allNotes.push({
            ...note,
            job_number: job.job_number,
            service_address: job.service_address || undefined,
            technician_name: technicianName,
          })
        }
      }

      // Materials notes (from ConnectTeam)
      if (job.materials_notes_status && Array.isArray(job.materials_notes_status)) {
        for (const note of job.materials_notes_status) {
          allNotes.push({
            ...note,
            job_number: job.job_number,
            service_address: job.service_address || undefined,
            technician_name: technicianName,
          })
        }
      }
    }

    // Sort by created_at descending (most recent first)
    allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      notes: allNotes,
      total: allNotes.length,
      counts: {
        undone: allNotes.filter(n => n.status === 'undone').length,
        in_progress: allNotes.filter(n => n.status === 'in_progress').length,
        done: allNotes.filter(n => n.status === 'done').length,
      }
    })
  } catch (error) {
    console.error('Error in notes/all route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
