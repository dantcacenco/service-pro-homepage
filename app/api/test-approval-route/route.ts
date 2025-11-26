import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 TEST: Approval route diagnostic endpoint called')
  console.log('🧪 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('🧪 BUSINESS_EMAIL:', process.env.BUSINESS_EMAIL)
  console.log('🧪 EMAIL_FROM:', process.env.EMAIL_FROM)
  
  // Test that imports work
  try {
    const { createClient } = require('@/lib/supabase/server')
    const { Resend } = require('resend')
    
    console.log('✅ All imports successful')
    
    return NextResponse.json({
      success: true,
      message: 'Approval route dependencies are working',
      env: {
        resendKeyExists: !!process.env.RESEND_API_KEY,
        businessEmail: process.env.BUSINESS_EMAIL,
        emailFrom: process.env.EMAIL_FROM
      }
    })
  } catch (error) {
    console.error('❌ Import failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('🧪 TEST: POST to approval diagnostic')
  
  try {
    const body = await request.json()
    console.log('🧪 Received body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'POST endpoint working',
      receivedData: body
    })
  } catch (error) {
    console.error('❌ POST failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
