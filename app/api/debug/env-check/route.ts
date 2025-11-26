import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
    has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    anon_key_start: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?.substring(0, 20) + '...',
    service_key_start: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    node_env: process.env.NODE_ENV,
  });
}
