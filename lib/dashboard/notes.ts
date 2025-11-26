/**
 * Dashboard Job Notes Aggregation
 * Aggregates job notes from multiple sources
 */

interface JobWithNotes {
  id: string
  job_number: string
  service_address: string
  boss_notes_status?: any[]
  additional_notes_status?: any[]
  materials_notes_status?: any[]
}

export interface AggregatedNote {
  created_at: string
  job_number: string
  service_address: string
  technician_name?: string
  [key: string]: any
}

/**
 * Aggregate all notes from jobs
 */
export function aggregateJobNotes(jobs: JobWithNotes[]): AggregatedNote[] {
  const allNotes: AggregatedNote[] = []

  for (const job of jobs) {
    if (job.boss_notes_status && Array.isArray(job.boss_notes_status)) {
      for (const note of job.boss_notes_status) {
        allNotes.push({
          ...note,
          job_number: job.job_number,
          service_address: job.service_address,
          technician_name: note.created_by, // Use who created the note
        })
      }
    }

    if (job.additional_notes_status && Array.isArray(job.additional_notes_status)) {
      for (const note of job.additional_notes_status) {
        allNotes.push({
          ...note,
          job_number: job.job_number,
          service_address: job.service_address,
          technician_name: note.created_by, // Use who created the note
        })
      }
    }

    if (job.materials_notes_status && Array.isArray(job.materials_notes_status)) {
      for (const note of job.materials_notes_status) {
        allNotes.push({
          ...note,
          job_number: job.job_number,
          service_address: job.service_address,
          technician_name: note.created_by, // Use who created the note
        })
      }
    }
  }

  // Sort by created_at descending (most recent ConnectTeam submission first)
  allNotes.sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return bTime - aTime
  })

  return allNotes
}
