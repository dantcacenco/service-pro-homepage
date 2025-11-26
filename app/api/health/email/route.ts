import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Resend API key not configured' },
        { status: 500 }
      );
    }
    
    // Could add actual Resend API health check here if needed
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Email service configured',
      provider: 'Resend',
      from_address: process.env.EMAIL_FROM || 'Not configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Email service check failed' },
      { status: 500 }
    );
  }
}
