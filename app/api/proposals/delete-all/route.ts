import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  console.log('[DELETE /api/proposals/delete-all] Starting request');
  
  try {
    // Step 1: Authenticate user
    console.log('[DELETE] Step 1: Authenticating user...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[DELETE] Auth failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in' },
        { status: 401 }
      );
    }
    console.log('[DELETE] User authenticated:', user.id);

    // Step 2: Verify boss role
    console.log('[DELETE] Step 2: Verifying boss role...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[DELETE] Profile fetch failed:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      );
    }

    if (profile.role !== 'boss') {
      console.log('[DELETE] User role is not boss:', profile.role);
      return NextResponse.json(
        { error: 'Forbidden - only boss can delete all proposals' },
        { status: 403 }
      );
    }
    console.log('[DELETE] Boss role verified');

    // Step 3: Create service client
    console.log('[DELETE] Step 3: Creating service client...');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[DELETE] Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[DELETE] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('[DELETE] Service client created');

    // Step 4: Count proposals
    console.log('[DELETE] Step 4: Counting proposals...');
    const { count: proposalCount, error: countError } = await serviceClient
      .from('proposals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[DELETE] Count error:', countError);
      return NextResponse.json(
        { error: `Failed to count proposals: ${countError.message}` },
        { status: 500 }
      );
    }

    console.log('[DELETE] Proposal count:', proposalCount);

    if (!proposalCount || proposalCount === 0) {
      console.log('[DELETE] No proposals to delete');
      return NextResponse.json({
        success: true,
        message: 'No proposals to delete',
        deleted_count: 0
      });
    }

    // Step 5: Delete related records
    console.log('[DELETE] Step 5: Deleting related records...');
    
    // Tables with NO ACTION constraint need explicit deletion
    const deletionSteps = [
      { table: 'email_blacklist', field: 'proposal_id' },
      { table: 'manual_payments', field: 'proposal_id' },
      { table: 'billcom_payment_log', field: 'proposal_id' },
      { table: 'billcom_test_scenarios', field: 'proposal_id' },
      { table: 'invoices', field: 'proposal_id' },
      { table: 'jobs', field: 'proposal_id' }
    ];

    for (const step of deletionSteps) {
      console.log(`[DELETE] Deleting from ${step.table}...`);
      const { error } = await serviceClient
        .from(step.table)
        .delete()
        .not(step.field, 'is', null);
      
      if (error) {
        console.warn(`[DELETE] Warning - Error deleting from ${step.table}:`, error.message);
      } else {
        console.log(`[DELETE] Deleted records from ${step.table}`);
      }
    }

    // Step 6: Delete proposals
    console.log('[DELETE] Step 6: Deleting proposals...');
    const { data: deletedProposals, error: deleteError } = await serviceClient
      .from('proposals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Matches all real UUIDs
      .select('id');

    if (deleteError) {
      console.error('[DELETE] Delete error:', deleteError);
      
      if (deleteError.code === '23503') {
        return NextResponse.json(
          { 
            error: 'Foreign key constraint violation',
            details: deleteError.message,
            hint: 'Some related records could not be deleted. Please check the logs.'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to delete proposals: ${deleteError.message}` },
        { status: 500 }
      );
    }

    const actualDeleted = deletedProposals?.length || 0;
    console.log(`[DELETE] Successfully deleted ${actualDeleted} proposals`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${actualDeleted} proposal${actualDeleted !== 1 ? 's' : ''} and related records`,
      deleted_count: actualDeleted
    });

  } catch (error: any) {
    console.error('[DELETE] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
