import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use admin client to check policies
    const adminClient = createAdminClient()
    
    // Query to check RLS policies
    const { data: policies, error: policiesError } = await adminClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'payment_stages')
    
    // Test if anon can insert
    const regularClient = await createClient()
    const testData = {
      proposal_id: 'test-' + Date.now(),
      stage: 'test',
      percentage: 0,
      amount: 0,
      paid: false
    }
    
    const { error: insertError } = await regularClient
      .from('payment_stages')
      .insert(testData)
    
    // Clean up if successful
    if (!insertError) {
      await adminClient
        .from('payment_stages')
        .delete()
        .eq('proposal_id', testData.proposal_id)
    }
    
    // Check table permissions
    const { data: permissions, error: permError } = await adminClient.rpc('has_table_privilege', {
      schema_name: 'public',
      table_name: 'payment_stages',
      privilege_type: 'INSERT'
    }).single()
    
    return NextResponse.json({
      policies_found: policies?.length || 0,
      policies: policies?.map(p => ({
        name: p.policyname,
        command: p.cmd,
        roles: p.roles
      })),
      can_insert_as_user: !insertError,
      insert_error: insertError?.message,
      table_permissions: permissions,
      recommendation: insertError?.message?.includes('row level security') 
        ? 'Run the fix SQL in Supabase dashboard'
        : 'Permissions look OK'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}