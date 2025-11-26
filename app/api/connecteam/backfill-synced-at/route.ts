/**
 * One-time migration to backfill synced_at timestamp for existing notes
 *
 * This adds synced_at field to all existing notes in job JSONB arrays
 * Sets synced_at = created_at for old notes (best estimate)
 *
 * POST /api/connecteam/backfill-synced-at
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - CRON_SECRET required' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    console.log('[BACKFILL] Starting synced_at backfill...')

    // Fetch all jobs with notes
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, job_number, boss_notes_status, additional_notes_status, materials_notes_status')
      .or('jsonb_array_length(boss_notes_status).gt.0,jsonb_array_length(additional_notes_status).gt.0,jsonb_array_length(materials_notes_status).gt.0')

    if (fetchError) {
      console.error('[BACKFILL] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let totalUpdated = 0
    let totalNotesBackfilled = 0

    for (const job of jobs || []) {
      let needsUpdate = false

      // Backfill boss_notes_status
      const bossNotes = (job.boss_notes_status as any[]) || []
      const updatedBossNotes = bossNotes.map((note: any) => {
        if (!note.synced_at) {
          totalNotesBackfilled++
          needsUpdate = true
          return {
            ...note,
            synced_at: note.created_at // Use created_at as best estimate
          }
        }
        return note
      })

      // Backfill additional_notes_status
      const additionalNotes = (job.additional_notes_status as any[]) || []
      const updatedAdditionalNotes = additionalNotes.map((note: any) => {
        if (!note.synced_at) {
          totalNotesBackfilled++
          needsUpdate = true
          return {
            ...note,
            synced_at: note.created_at // Use created_at as best estimate
          }
        }
        return note
      })

      // Backfill materials_notes_status
      const materialsNotes = (job.materials_notes_status as any[]) || []
      const updatedMaterialsNotes = materialsNotes.map((note: any) => {
        if (!note.synced_at) {
          totalNotesBackfilled++
          needsUpdate = true
          return {
            ...note,
            synced_at: note.created_at // Use created_at as best estimate
          }
        }
        return note
      })

      // Update job if any notes were backfilled
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            boss_notes_status: updatedBossNotes,
            additional_notes_status: updatedAdditionalNotes,
            materials_notes_status: updatedMaterialsNotes
          })
          .eq('id', job.id)

        if (updateError) {
          console.error(`[BACKFILL] Error updating job ${job.job_number}:`, updateError)
        } else {
          totalUpdated++
          console.log(`[BACKFILL] Updated job ${job.job_number}: ${updatedBossNotes.length + updatedAdditionalNotes.length + updatedMaterialsNotes.length} notes`)
        }
      }
    }

    const duration = Date.now() - startTime

    console.log(`[BACKFILL] Complete: ${totalNotesBackfilled} notes backfilled across ${totalUpdated} jobs in ${duration}ms`)

    return NextResponse.json({
      success: true,
      jobs_updated: totalUpdated,
      notes_backfilled: totalNotesBackfilled,
      duration_ms: duration
    })
  } catch (error: any) {
    console.error('[BACKFILL] Fatal error:', error)
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
