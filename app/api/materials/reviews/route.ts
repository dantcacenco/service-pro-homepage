import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'materials' | 'work_done' | 'notes';

    if (!type || !['materials', 'work_done', 'notes'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      );
    }

    if (type === 'materials') {
      // Query materials_checklist table for materials
      const { data: materials, error } = await supabase
        .from('materials_checklist')
        .select(`
          id,
          submission_id,
          material_description,
          created_at,
          ordered,
          ordered_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        return NextResponse.json(
          { error: 'Failed to fetch materials', details: error.message },
          { status: 500 }
        );
      }

      const items = materials?.map(mat => ({
        id: mat.id,
        submission_id: mat.submission_id,
        material_description: mat.material_description,
        created_at: mat.created_at,
        reviewed: mat.ordered, // For now, treat 'ordered' as 'reviewed'
        reviewed_at: mat.ordered_at,
        job: null,
        employee: null
      })) || [];

      return NextResponse.json({ items });
    }

    // For work_done and notes, query form_submissions table
    const { data: submissions, error } = await supabase
      .from('connecteam_form_submissions')
      .select(`
        id,
        connecteam_submission_id,
        linked_job_id,
        employee_id,
        parts_materials_needed,
        work_description,
        additional_notes,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error.message },
        { status: 500 }
      );
    }

    // Get reviews for these submissions
    const submissionIds = submissions?.map(s => s.connecteam_submission_id) || [];
    
    const { data: reviews, error: reviewsError } = await supabase
      .from('connecteam_submission_reviews')
      .select('*')
      .in('connecteam_submission_id', submissionIds)
      .eq('review_type', type);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Build review map
    const reviewMap = new Map();
    reviews?.forEach(review => {
      reviewMap.set(review.connecteam_submission_id, review);
    });

    // Transform data based on type (work_done or notes only at this point)
    const items = submissions?.map(sub => {
      const review = reviewMap.get(sub.connecteam_submission_id);
      const baseItem = {
        id: sub.id,
        submission_id: sub.connecteam_submission_id,
        created_at: sub.created_at,
        reviewed: review?.reviewed || false,
        reviewed_at: review?.reviewed_at,
        job: null,
        employee: null
      };

      if (type === 'work_done') {
        return {
          ...baseItem,
          work_description: sub.work_description || 'No work description'
        };
      } else {
        return {
          ...baseItem,
          additional_notes: sub.additional_notes || 'No notes'
        };
      }
    }) || [];

    // Filter out items with no content
    const filteredItems = items.filter((item): boolean => {
      if (type === 'work_done') return 'work_description' in item && item.work_description && item.work_description !== 'No work description';
      return 'additional_notes' in item && item.additional_notes && item.additional_notes !== 'No notes';
    });

    return NextResponse.json({ items: filteredItems });

  } catch (error) {
    console.error('Error in materials/reviews API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
