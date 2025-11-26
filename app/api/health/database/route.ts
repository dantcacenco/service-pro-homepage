import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try a simple query
    const { error } = await supabase
      .from('app_settings')
      .select('key')
      .limit(1)
      .single();
    
    if (error) {
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Database connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Database check failed' },
      { status: 500 }
    );
  }
}
