import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { submissionId, reviewType } = body;

    if (!submissionId || !reviewType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['materials', 'work_done', 'notes'].includes(reviewType)) {
      return NextResponse.json(
        { error: 'Invalid review type' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Upsert review record
    const { data, error } = await supabase
      .from('connecteam_submission_reviews')
      .upsert({
        submission_id: submissionId,
        review_type: reviewType,
        reviewed: true,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      }, {
        onConflict: 'submission_id,review_type'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting review:', error);
      return NextResponse.json(
        { error: 'Failed to mark as reviewed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data });

  } catch (error) {
    console.error('Error in materials/review API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
