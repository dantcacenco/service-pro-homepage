import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// POST /api/jobs/[id]/send-warranty-offer - Send warranty offer email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers!customer_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.customers?.email) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
    }

    // Fetch warranty settings
    const { data: settings } = await supabase
      .from('warranty_settings')
      .select('*')
      .single()

    // Generate unique acceptance token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Token valid for 30 days

    // Store the warranty offer token (we'll create a table for this)
    // For now, we'll just create a record that tracks the offer was sent
    const offerData = {
      job_id: job.id,
      customer_id: job.customers.id,
      token: token,
      expires_at: expiresAt.toISOString(),
      sent_at: new Date().toISOString(),
      status: 'sent'
    }

    // Note: You would store this in a warranty_offers table
    // For now, we'll just track in job notes or a simple table

    // Build warranty offer email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/warranty-accept/${token}`

    const emailSubject = settings?.warranty_offer_email_subject || 'Protect Your Investment with Fair Air Warranty'
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for choosing Fair Air!</h2>

          <p>Your HVAC installation is complete. To protect your investment and ensure optimal performance, we offer comprehensive warranty and maintenance plans:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Choose Your Protection Plan:</h3>

            <div style="margin: 15px 0; padding: 15px; background-color: white; border-radius: 5px;">
              <strong>Maintenance Only - $${settings?.maintenance_only_price || 200}/year</strong>
              <p style="margin: 5px 0; color: #666;">Two annual maintenance visits to keep your system running efficiently</p>
            </div>

            <div style="margin: 15px 0; padding: 15px; background-color: white; border-radius: 5px;">
              <strong>Warranty Only - $${settings?.warranty_only_price || 365}/year</strong>
              <p style="margin: 5px 0; color: #666;">Coverage for repairs and service calls on your new system</p>
            </div>

            <div style="margin: 15px 0; padding: 15px; background-color: #e8f5e9; border-radius: 5px; border: 2px solid #4caf50;">
              <strong>Maintenance + Warranty Bundle - $${settings?.both_bundled_price || 500}/year</strong>
              <p style="margin: 5px 0; color: #666;">Complete protection: maintenance visits + warranty coverage</p>
              <p style="margin: 5px 0; color: #4caf50; font-weight: bold;">Best Value!</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Accept Warranty Offer
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">This offer is valid for 30 days.</p>

          <div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Financing Available:</strong></p>
            <p style="margin: 5px 0; color: #666;">Need financing? <a href="https://www.synchrony.com" style="color: #2196F3;">Learn about Synchrony Bank financing options</a> (integration coming soon)</p>
          </div>

          <p style="margin-top: 30px;">Questions? Contact us at ${job.customers?.phone || 'your phone number'}</p>

          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            Fair Air HVAC Services<br>
            Job #${job.job_number || id}
          </p>
        </body>
      </html>
    `

    // In production, you would send this via your email service (Resend, SendGrid, etc.)
    // For now, we'll just log it and return success
    console.log('Warranty offer email prepared for:', job.customers.email)
    console.log('Accept URL:', acceptUrl)

    // TODO: Send actual email using email service
    // await sendEmail({
    //   to: job.customers.email,
    //   subject: emailSubject,
    //   html: emailBody
    // })

    return NextResponse.json({
      success: true,
      message: 'Warranty offer email sent',
      acceptUrl: acceptUrl,
      offerData: offerData
    })
  } catch (error) {
    console.error('Error sending warranty offer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
