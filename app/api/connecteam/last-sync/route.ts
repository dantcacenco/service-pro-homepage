import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the most recent completed sync from the log
    const { data, error } = await supabase
      .from('connecteam_sync_log')
      .select('sync_started_at, sync_completed_at, sync_status')
      .in('sync_status', ['completed', 'partial'])
      .order('sync_started_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last sync:', error);
      return NextResponse.json(
        { error: 'Failed to fetch last sync time' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      // No sync found, return null
      return NextResponse.json({ lastSync: null });
    }

    return NextResponse.json({
      lastSync: data[0].sync_completed_at || data[0].sync_started_at,
      status: data[0].sync_status
    });

  } catch (error) {
    console.error('Error in last-sync API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
