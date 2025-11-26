import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/materials/bulk-order
 * 
 * Marks multiple materials as ordered
 * 
 * Request Body:
 * {
 *   materialIds: string[],
 *   vendor?: string,
 *   trackingNumber?: string,
 *   notes?: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   updated: number,
 *   materialIds: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { materialIds, vendor, trackingNumber, notes } = body;

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'materialIds array is required' },
        { status: 400 }
      );
    }

    // Update materials
    const { data, error } = await supabase
      .from('materials_checklist')
      .update({
        ordered: true,
        ordered_at: new Date().toISOString(),
        ordered_by_email: user.email,
        vendor: vendor || null,
        tracking_number: trackingNumber || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', materialIds)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      materialIds: data?.map((m) => m.id) || [],
    });
  } catch (error) {
    console.error('Error marking materials as ordered:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark materials as ordered',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
