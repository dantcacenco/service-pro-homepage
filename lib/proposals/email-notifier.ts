/**
 * Email Notifier Module
 *
 * Handles email notifications for proposal approvals
 * Sends emails to both customers and business owners
 */

import { Resend } from 'resend'
import { COMPANY_INFO } from '@/lib/legal-disclaimers'
import type { Proposal, ProposalCustomer, EmailNotificationResult } from './types'

/**
 * Sends approval emails to customer and business owner
 *
 * @param proposal - The approved proposal
 * @param customer - The customer information
 * @param invoiceLink - Link to the Bill.com invoice (if created)
 * @param jobNumber - The job number (if created)
 * @param proposalId - The proposal ID for admin link
 * @param selectedTier - Selected tier for multi-tier proposals (null for single-tier)
 * @returns Email notification result
 */
export async function sendApprovalEmails(
  proposal: Proposal,
  customer: ProposalCustomer,
  invoiceLink: string | null | undefined,
  jobNumber: string | null | undefined,
  proposalId: string,
  selectedTier: any | null
): Promise<EmailNotificationResult> {
  console.log('📧 Starting email notifications...')

  const resend = new Resend(process.env.RESEND_API_KEY)
  let customerEmailSent = false
  let businessEmailSent = false

  // Send approval email to customer
  if (customer?.email) {
    try {
      console.log('📧 Sending customer approval email to:', customer.email)
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
        to: customer.email,
        replyTo: process.env.REPLY_TO_EMAIL || 'dantcacenco@gmail.com',
        subject: `✅ Proposal Approved - ${COMPANY_INFO.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ You Approved the Proposal!</h2>
            <p>Dear ${customer.name},</p>
            <p><strong>You will receive an invoice shortly for 50% deposit.</strong></p>
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${COMPANY_INFO.businessName}</strong><br>
              NC License #${COMPANY_INFO.licenseNumber}
            </p>
          </div>
        `
      })
      console.log('✅ Customer approval email sent!')
      customerEmailSent = true
    } catch (emailError) {
      console.error('❌ Failed to send customer email:', emailError)
      // Don't fail approval if email fails
    }
  } else {
    console.log('⚠️ No customer email found, skipping customer notification')
  }

  // Send notification to business owner
  if (process.env.BUSINESS_EMAIL) {
    try {
      console.log('📧 Sending business notification to:', process.env.BUSINESS_EMAIL)
      const proposalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fairairhc.service-pro.app'}/proposals/${proposalId}`

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
        to: process.env.BUSINESS_EMAIL,
        replyTo: customer?.email || process.env.REPLY_TO_EMAIL || 'dantcacenco@gmail.com',
        subject: `🎉 Proposal #${proposal.proposal_number} APPROVED by ${customer?.name || 'Customer'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">🎉 New Proposal Approved!</h2>
            <p><strong>Proposal #${proposal.proposal_number}</strong> has been approved!</p>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${customer?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer?.phone || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Full Amount:</strong> $${proposal.total.toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>50% Deposit:</strong> $${(proposal.total * 0.5).toFixed(2)}</p>
              ${selectedTier ? `<p style="margin: 5px 0;"><strong>Package:</strong> ${selectedTier.tier_name}</p>` : ''}
            </div>

            ${invoiceLink ? `
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>✅ Bill.com Invoice Created (50% Deposit)</strong></p>
                <p style="margin: 5px 0;">Invoice has been sent to customer</p>
                ${invoiceLink !== 'https://app.bill.com' ? `<p style="margin: 5px 0;"><a href="${invoiceLink}" style="color: #2563eb;">View Invoice</a></p>` : ''}
              </div>
            ` : ''}

            ${jobNumber ? `
              <p style="margin: 10px 0;">✅ Job automatically created: ${jobNumber}</p>
            ` : ''}

            <p style="margin-top: 20px;">
              <a href="${proposalUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Proposal Details</a>
            </p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>${COMPANY_INFO.businessName}</strong><br>
              NC License #${COMPANY_INFO.licenseNumber}
            </p>
          </div>
        `
      })
      console.log('✅ Business notification email sent!')
      businessEmailSent = true
    } catch (emailError) {
      console.error('❌ Failed to send business email:', emailError)
      // Don't fail approval if email fails
    }
  } else {
    console.log('⚠️ No BUSINESS_EMAIL configured, skipping business notification')
  }

  console.log('📧 Email notification process completed')

  return {
    success: true,
    customerEmailSent,
    businessEmailSent
  }
}
