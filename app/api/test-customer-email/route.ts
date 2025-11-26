import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    console.log('🧪 TEST: Starting direct email test')
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
      to: 'dantcacenco@gmail.com',
      subject: '🧪 TEST: Direct Customer Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Test Email</h2>
          <p>This is a direct test of the Resend email system.</p>
          <p>If you receive this, Resend is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    })
    
    console.log('✅ TEST: Email sent successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Email sent successfully. Check dantcacenco@gmail.com inbox.'
    })
  } catch (error) {
    console.error('❌ TEST: Email failed!')
    console.error('Error:', error)
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
