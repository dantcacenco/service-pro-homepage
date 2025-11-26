// Email service for sending payment confirmations and other notifications
import { Resend } from 'resend'
import { trackEmailSend } from '@/lib/email-tracking'
import { getPaymentConfirmationEmailTemplate } from '@/lib/email-templates'

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

interface PaymentConfirmationEmailData {
  to: string
  customerName: string
  proposalTitle: string
  stage: string  // 'deposit' | 'roughin' | 'final'
  amountPaid: number
  totalAmount: number
  remainingBalance: number
  proposalLink?: string
  nextSteps?: string
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationEmailData) {
  try {
    // Format stage name for display
    const stageDisplay = data.stage === 'roughin' ? 'Rough-In' : 
                         data.stage.charAt(0).toUpperCase() + data.stage.slice(1)

    const html = getPaymentConfirmationEmailTemplate({
      customerName: data.customerName,
      proposalTitle: data.proposalTitle,
      paymentStage: stageDisplay,
      paymentAmount: data.amountPaid,
      totalAmount: data.totalAmount,
      totalPaid: data.totalAmount - data.remainingBalance,
      remainingBalance: data.remainingBalance,
      invoiceNumber: `INV-${Date.now()}`, // We can improve this later
      businessName: 'Fair Air Heating & Cooling',
      businessEmail: process.env.BUSINESS_EMAIL || 'fairairhc@gmail.com',
      businessPhone: '(555) 123-4567', // Update with actual phone
      proposalLink: data.proposalLink,
      nextSteps: data.nextSteps
    })

    const resend = getResendClient()
    if (!resend) {
      console.warn('Resend client not configured - skipping email send')
      return null
    }

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
      to: data.to,
      subject: `Payment Confirmation - ${stageDisplay} Payment Received`,
      html,
      replyTo: process.env.REPLY_TO_EMAIL || 'fairairhc@gmail.com'
    })

    // Track email usage
    await trackEmailSend()

    console.log('Payment confirmation email sent:', result)
    return result
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error)
    throw error
  }
}
