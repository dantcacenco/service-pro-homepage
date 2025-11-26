/**
 * Update Job Customer (Manual Matching Override)
 *
 * Allows manual customer assignment for jobs with "N/A"
 * or to override fuzzy matching results
 *
 * POST /api/jobs/[id]/update-customer
 * Body: { customer_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const { customer_id } = await request.json();

    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has permission (boss or admin role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'boss' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only bosses/admins can manually match customers' },
        { status: 403 }
      );
    }

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, address')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update job with new customer
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        customer_id: customer_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[MANUAL MATCH] Job ${jobId} manually matched to customer ${customer.name} (${customer_id})`);

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        address: customer.address
      }
    });

  } catch (error: any) {
    console.error('[MANUAL MATCH] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update customer',
        details: error.message
      },
      { status: 500 }
    );
  }
}
