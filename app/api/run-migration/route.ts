// Temporary migration endpoint - Run once then delete
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createAdminClient();

    console.log('🔧 Running migration: add_out_of_state_tax_rate');

    // Add "Out of State" entry to nc_county_tax_rates table
    const { data, error } = await supabase
      .from('nc_county_tax_rates')
      .upsert({
        county_name: 'Out of State',
        state_tax_rate: 0.0000,
        county_tax_rate: 0.0700,
        total_tax_rate: 0.0700,
        notes: 'Default tax rate for addresses outside North Carolina. Used for out-of-state customers.',
        effective_date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'county_name'
      })
      .select();

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Migration completed!');
    console.log('Added/Updated record:', data);

    return NextResponse.json({
      success: true,
      message: '✅ Migration completed successfully!',
      change: 'Added "Out of State" entry to nc_county_tax_rates table',
      details: {
        county_name: 'Out of State',
        state_tax_rate: '0%',
        county_tax_rate: '7%',
        total_tax_rate: '7%'
      },
      note: 'This will be used for all non-NC addresses with 7% total tax'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
