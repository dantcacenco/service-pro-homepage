import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting RLS policy update for payment_stages...')

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('payment_stages')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Connection test failed:', testError)
    } else {
      console.log('Connection successful')
    }

    // Since we can't use rpc, we'll need to do this via the Supabase SQL Editor
    // For now, return instructions
    return NextResponse.json({
      success: true,
      message: 'Please run this SQL manually in Supabase SQL Editor',
      sql: `
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view payment stages" ON payment_stages;
DROP POLICY IF EXISTS "Allow authenticated users to insert payment stages" ON payment_stages;
DROP POLICY IF EXISTS "Allow authenticated users to update payment stages" ON payment_stages;

-- Create new permissive policies
CREATE POLICY "Allow all to view payment stages"
ON payment_stages FOR SELECT USING (true);

CREATE POLICY "Allow all to insert payment stages"
ON payment_stages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update payment stages"
ON payment_stages FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all to delete payment stages"
ON payment_stages FOR DELETE USING (true);

-- Verify RLS is enabled
ALTER TABLE payment_stages ENABLE ROW LEVEL SECURITY;
      `
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
