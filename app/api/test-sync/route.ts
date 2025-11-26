import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[TEST] Test endpoint called!')
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  })
}
