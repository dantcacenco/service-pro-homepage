import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Bill.com credentials are configured
    const configured = !!(
      process.env.BILLCOM_DEV_KEY &&
      process.env.BILLCOM_USERNAME &&
      process.env.BILLCOM_PASSWORD &&
      process.env.BILLCOM_ORG_ID
    );
    
    if (!configured) {
      return NextResponse.json(
        { status: 'warning', message: 'Bill.com credentials not fully configured' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Bill.com integration configured',
      api_url: process.env.BILLCOM_API_URL || 'Not configured',
      enabled: process.env.BILLCOM_ENABLED === 'true',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Bill.com check failed' },
      { status: 500 }
    );
  }
}
