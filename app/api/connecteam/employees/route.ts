import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/connecteam/employees
 *
 * DISABLED - ConnectTeam API requires premium subscription
 */
export async function GET(request: NextRequest) {
  console.log('🚫 [API] ConnectTeam employees endpoint called - DISABLED (requires premium subscription)');

  return NextResponse.json({
    success: false,
    disabled: true,
    error: 'ConnectTeam API is disabled',
    message: 'ConnectTeam API requires a premium subscription. Please upgrade your ConnectTeam plan to enable API access.',
    employees: [],
    total: 0,
    timestamp: new Date().toISOString(),
  }, { status: 503 });
}
