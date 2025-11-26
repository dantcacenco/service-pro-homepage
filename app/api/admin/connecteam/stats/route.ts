import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/connecteam/stats
 * 
 * Returns comprehensive statistics about ConnectTeam data
 * 
 * Response:
 * {
 *   success: boolean,
 *   stats: {
 *     employees: number,
 *     submissions: number,
 *     photos: number,
 *     materials: number,
 *     pendingMaterials: number,
 *     matchedJobs: number,
 *     lastSync: string
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get counts from all tables
    const [
      { count: employeesCount },
      { count: submissionsCount },
      { count: photosCount },
      { count: submissionsWithMaterials },
      { data: sampleMaterials },
      { data: lastSyncData }
    ] = await Promise.all([
      // Employees
      supabase
        .from('connecteam_employees')
        .select('*', { count: 'exact', head: true }),

      // Submissions
      supabase
        .from('connecteam_form_submissions')
        .select('*', { count: 'exact', head: true }),

      // Photos
      supabase
        .from('connecteam_photos')
        .select('*', { count: 'exact', head: true }),

      // Materials Count = Submissions with non-empty parts_materials_needed field
      supabase
        .from('connecteam_form_submissions')
        .select('*', { count: 'exact', head: true })
        .not('parts_materials_needed', 'is', null)
        .neq('parts_materials_needed', '')
        .neq('parts_materials_needed', 'N/A')
        .neq('parts_materials_needed', 'n/a'),

      // Sample Materials (5 most recent)
      supabase
        .from('connecteam_form_submissions')
        .select('parts_materials_needed, submission_timestamp')
        .not('parts_materials_needed', 'is', null)
        .neq('parts_materials_needed', '')
        .neq('parts_materials_needed', 'N/A')
        .neq('parts_materials_needed', 'n/a')
        .order('submission_timestamp', { ascending: false })
        .limit(5),

      // Last Sync (most recent submission)
      supabase
        .from('connecteam_form_submissions')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(1)
    ]);

    // Format sample materials for display
    const formattedSamples = (sampleMaterials || []).map((sample: any) => ({
      date: new Date(sample.submission_timestamp).toLocaleDateString(),
      text: sample.parts_materials_needed
    }));

    return NextResponse.json({
      success: true,
      stats: {
        employees: employeesCount || 0,
        submissions: submissionsCount || 0,
        photos: photosCount || 0,
        materials: submissionsWithMaterials || 0,
        sampleMaterials: formattedSamples,
        lastSync: lastSyncData?.[0]?.last_synced_at || null,
      },
    });
  } catch (error) {
    console.error('Error fetching ConnectTeam stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
