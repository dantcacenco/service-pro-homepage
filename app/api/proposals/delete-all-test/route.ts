import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Test regular client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in' },
        { status: 401 }
      );
    }

    // Test service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get proposal stats
    const { count: proposalCount } = await serviceClient
      .from('proposals')
      .select('*', { count: 'exact', head: true });

    // Get related table counts
    const tables = [
      'jobs', 'invoices', 'manual_payments', 'billcom_payment_log',
      'proposal_items', 'proposal_activities', 'payment_stages'
    ];

    const stats: Record<string, number> = {
      proposals: proposalCount || 0
    };

    for (const table of tables) {
      const { count } = await serviceClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      stats[table] = count || 0;
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      database_stats: stats,
      service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      can_delete: true
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}
