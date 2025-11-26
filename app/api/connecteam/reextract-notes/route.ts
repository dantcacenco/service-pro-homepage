import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const QUESTION_IDS = {
  WORK_DESCRIPTION: '4f87cfe2-f94c-f14d-393a-1b3a98baeb9b',
  ADDITIONAL_NOTES: '0d04f47d-c7c7-2bf8-63eb-1bf78814e499',
  MATERIALS_NEEDED: '8ed44929-a716-ace0-3ec6-aab036963b87',
}

function getAnswerValue(answers: any[], questionId: string): any {
  const answer = answers.find((a: any) => a.questionId === questionId)
  if (!answer) return null

  // Handle different answer types
  if (answer.value !== undefined) return answer.value
  if (answer.timestamp !== undefined) return answer.timestamp
  if (answer.locationInput) return answer.locationInput
  if (answer.selectedAnswers) return answer.selectedAnswers.map((sa: any) => sa.text)
  if (answer.images) return answer.images.map((img: any) => img.url)

  return null
}

/**
 * Re-extract notes from raw_json for all existing submissions
 * This fixes submissions that were synced before the notes extraction code was added
 */
export async function POST() {
  try {
    const supabase = createAdminClient()

    // Get all submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('connecteam_form_submissions')
      .select('id, raw_json, work_description, additional_notes, parts_materials_needed')
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
      })
    }

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const submission of submissions) {
      try {
        // Skip if no raw_json
        if (!submission.raw_json || !submission.raw_json.answers) {
          skipped++
          continue
        }

        const answers = submission.raw_json.answers

        // Extract notes from raw_json
        const workDescription = getAnswerValue(answers, QUESTION_IDS.WORK_DESCRIPTION)
        const additionalNotes = getAnswerValue(answers, QUESTION_IDS.ADDITIONAL_NOTES)
        const partsMaterialsNeeded = getAnswerValue(answers, QUESTION_IDS.MATERIALS_NEEDED)

        // Only update if at least one note field has content
        if (workDescription || additionalNotes || partsMaterialsNeeded) {
          const { error: updateError } = await supabase
            .from('connecteam_form_submissions')
            .update({
              work_description: workDescription || null,
              additional_notes: additionalNotes || null,
              parts_materials_needed: partsMaterialsNeeded || null,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', submission.id)

          if (updateError) {
            errors.push(`${submission.id}: ${updateError.message}`)
          } else {
            updated++
          }
        } else {
          skipped++
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${submission.id}: ${errorMessage}`)
      }
    }

    console.log('Re-extraction complete:', {
      total: submissions.length,
      updated,
      skipped,
      errors: errors.length,
    })

    return NextResponse.json({
      success: true,
      totalSubmissions: submissions.length,
      updated,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('Re-extraction failed:', error)
    return NextResponse.json(
      {
        error: 'Re-extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
