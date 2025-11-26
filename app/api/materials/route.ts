import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/materials
 * 
 * Fetches all materials from materials_checklist with related job and employee data
 * 
 * Response:
 * {
 *   success: boolean,
 *   materials: Array<{
 *     id, material_description, quantity, estimated_cost,
 *     ordered, ordered_at, vendor, tracking_number, notes,
 *     job: { id, job_number, service_address },
 *     employee: { id, first_name, last_name }
 *   }>,
 *   total: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Fetch materials with related data
    const { data: materials, error } = await supabase
      .from('materials_checklist')
      .select(`
        id,
        material_description,
        quantity,
        estimated_cost,
        ordered,
        ordered_at,
        ordered_by_email,
        vendor,
        tracking_number,
        notes,
        created_at,
        updated_at,
        submission_id,
        job_id,
        employee_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch related jobs, employees, and submissions
    const materialsWithRelations = await Promise.all(
      (materials || []).map(async (material) => {
        let job = null;
        let employee = null;
        let submission = null;

        // Fetch job if linked
        if (material.job_id) {
          const { data: jobData } = await supabase
            .from('jobs')
            .select('id, job_number, service_address')
            .eq('id', material.job_id)
            .single();
          job = jobData;
        }

        // Fetch employee if linked
        if (material.employee_id) {
          const { data: empData } = await supabase
            .from('connecteam_employees')
            .select('id, first_name, last_name')
            .eq('id', material.employee_id)
            .single();
          employee = empData;
        }

        // Fetch submission with address if linked
        if (material.submission_id) {
          const { data: subData } = await supabase
            .from('connecteam_form_submissions')
            .select('id, job_address, submission_timestamp')
            .eq('id', material.submission_id)
            .single();
          submission = subData;
        }

        return {
          ...material,
          job,
          employee,
          submission,
        };
      })
    );

    return NextResponse.json({
      success: true,
      materials: materialsWithRelations,
      total: materialsWithRelations.length,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch materials',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
