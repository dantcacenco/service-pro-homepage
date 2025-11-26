import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  console.log('🧪 TEST EMAIL ENDPOINT CALLED')
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
  
  try {
    console.log('Attempting to send test email...')
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
      to: 'dantcacenco@gmail.com',
      subject: '🧪 Simple Test Email',
      html: '<h1>TEST EMAIL WORKS!</h1><p>If you see this, Resend is functioning correctly.</p>'
    })
    
    console.log('✅ Test email sent successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully!',
      result 
    })
  } catch (error) {
    console.error('❌ Test email failed!')
    console.error('Error:', error)
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: 'Email sending failed - check logs'
    }, { status: 500 })
  }
}
