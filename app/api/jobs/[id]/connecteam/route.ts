import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/jobs/[id]/connecteam
 * 
 * Fetches all ConnectTeam data related to a specific job:
 * - Form submissions
 * - Photos (before/after)
 * - Materials used
 * - Technician info
 * - Time tracking
 * 
 * Response:
 * {
 *   success: boolean,
 *   submissions: Array<{
 *     id, submissionDate, technician, startTime, endTime,
 *     workDescription, additionalNotes, photos[], materials[]
 *   }>,
 *   totalSubmissions: number,
 *   totalPhotos: number,
 *   totalMaterials: number
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const supabase = createAdminClient();

    // Fetch submissions linked to this job
    const { data: submissions, error: submissionsError } = await supabase
      .from('connecteam_form_submissions')
      .select(`
        id,
        connecteam_submission_id,
        submission_timestamp,
        start_time,
        end_time,
        job_type,
        work_description,
        additional_notes,
        parts_materials_needed,
        manager_note,
        manager_status,
        raw_json,
        match_confidence,
        match_score,
        employee_id,
        connecteam_employees!employee_id (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('linked_job_id', jobId)
      .order('submission_timestamp', { ascending: false });

    if (submissionsError) {
      throw submissionsError;
    }

    // For each submission, fetch photos and materials
    const enrichedSubmissions = await Promise.all(
      (submissions || []).map(async (submission) => {
        // Fetch photos
        const { data: photos } = await supabase
          .from('connecteam_photos')
          .select('id, photo_type, connecteam_url')
          .eq('submission_id', submission.id)
          .order('created_at', { ascending: true });

        // Fetch materials
        const { data: materials } = await supabase
          .from('materials_checklist')
          .select('id, material_description, quantity, ordered, ordered_at')
          .eq('submission_id', submission.id)
          .order('created_at', { ascending: true });

        // Handle technician data (can be array or object)
        const technicianData = submission.connecteam_employees;
        let technician = null;
        
        if (technicianData) {
          if (Array.isArray(technicianData) && technicianData.length > 0) {
            technician = {
              id: technicianData[0].id,
              name: `${technicianData[0].first_name} ${technicianData[0].last_name}`.trim(),
              role: technicianData[0].role,
            };
          } else if (!Array.isArray(technicianData)) {
            technician = {
              id: (technicianData as any).id,
              name: `${(technicianData as any).first_name} ${(technicianData as any).last_name}`.trim(),
              role: (technicianData as any).role,
            };
          }
        }

        // Extract job type from raw_json if not in job_type field
        let jobType = submission.job_type;
        if (!jobType && submission.raw_json?.answers) {
          const jobTypeAnswer = submission.raw_json.answers.find(
            (a: any) => a.questionId === '8a43070c-b65f-4c65-4aef-4da1e914ebe1' && a.questionType === 'multipleChoice'
          );
          if (jobTypeAnswer?.selectedAnswers?.[0]?.text) {
            jobType = jobTypeAnswer.selectedAnswers[0].text;
          }
        }

        return {
          id: submission.id,
          submissionId: submission.connecteam_submission_id,
          submissionDate: submission.submission_timestamp,
          startTime: submission.start_time,
          endTime: submission.end_time,
          jobType,
          workDescription: submission.work_description,
          additionalNotes: submission.additional_notes,
          partsMaterialsNeeded: submission.parts_materials_needed,
          managerNote: submission.manager_note,
          managerStatus: submission.manager_status,
          matchConfidence: submission.match_confidence,
          matchScore: submission.match_score,
          technician,
          photos: photos?.map(p => ({
            id: p.id,
            type: p.photo_type,
            url: p.connecteam_url,
          })) || [],
          materials: materials?.map(m => ({
            id: m.id,
            description: m.material_description,
            quantity: m.quantity,
            ordered: m.ordered,
            orderedAt: m.ordered_at,
          })) || [],
        };
      })
    );

    // Calculate totals
    const totalPhotos = enrichedSubmissions.reduce(
      (sum, sub) => sum + sub.photos.length,
      0
    );
    
    // Count notes based on populated text fields (including manager note)
    const totalNotes = enrichedSubmissions.reduce((sum, sub) => {
      const notesCount = [
        sub.workDescription,
        sub.additionalNotes,
        sub.partsMaterialsNeeded,
        sub.managerNote // Include manager note in count
      ].filter(Boolean).length;
      return sum + notesCount;
    }, 0);

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions,
      totalSubmissions: enrichedSubmissions.length,
      totalPhotos,
      totalNotes,
    });
  } catch (error) {
    console.error('Error fetching ConnectTeam data for job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ConnectTeam data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
