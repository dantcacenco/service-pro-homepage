import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentStatusFromWebhook } from '@/lib/billcom/service'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentConfirmationEmail } from '@/lib/email-service'
import crypto from 'crypto'
import {
  handleProposalDepositPayment,
  handleProposalProgressPayment,
  handleProposalFinalPayment,
} from '@/lib/stages/proposal-sync'

/**
 * Bill.com Webhook Handler
 *
 * ⚠️ IMPORTANT: As of 2025-11-09, Bill.com webhooks support ONLY AP events.
 * AR events (invoice.paid, customer.created, receivable-payment.created, etc.) DO NOT EXIST.
 *
 * Current webhook subscription (ID: 03eb091e-6d41-4255-b942-ede33c0fde84):
 * - Event: payment.updated
 * - Purpose: Tracks when WE pay vendor bills (Accounts Payable)
 * - Does NOT track: When customers pay our invoices (Accounts Receivable)
 * - Payload contains: billIds, vendor (NOT invoiceIds, customer)
 *
 * For AR invoice payments, we use polling instead:
 * - File: /app/api/cron/check-billcom-payments/route.ts
 * - Frequency: Every 5 minutes
 * - Method: GET /v3/invoices + check status changes
 * - Reliability: 100% (uses official API)
 * - Latency: Max 5 minutes (acceptable for our use case)
 *
 * Why no AR webhooks?
 * - Event catalog (/v3/events/catalog) returns 16 events, ALL AP only
 * - Bill.com's webhook API is in beta and currently AP-focused
 * - AR APIs exist and work perfectly, but webhook events don't
 * - See BILLCOM_AR_WEBHOOKS_FINAL_TRUTH.md for complete investigation
 *
 * What to do if AR webhooks become available:
 * 1. Check event catalog for invoice.*, customer.*, receivable-payment.* events
 * 2. Update subscription to include AR events
 * 3. Keep polling as backup (hybrid approach = best reliability)
 * 4. Update handlers below to process AR events
 */

// Verify webhook signature
// IMPORTANT: Bill.com uses HMAC-SHA256 with base64 encoding (NOT hex)
// The payload must be minified JSON (no whitespace)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.text()
    const signature = request.headers.get('x-bill-sha-signature')

    console.log('[Webhook] Received Bill.com webhook')
    console.log('[Webhook] Signature present:', !!signature)

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.BILLCOM_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      console.log('[Webhook] Verifying signature...')
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('[Webhook] ❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      console.log('[Webhook] ✅ Signature verified')
    } else if (webhookSecret && !signature) {
      console.warn('[Webhook] ⚠️ Webhook secret configured but no signature provided')
    } else {
      console.warn('[Webhook] ⚠️ No webhook secret configured - skipping verification')
    }

    const data = JSON.parse(body)
    const eventType = data.metadata?.eventType || data.type || 'unknown'

    console.log(`[Webhook] Event type: ${eventType}`)
    console.log(`[Webhook] Event data:`, JSON.stringify(data, null, 2))

    // Handle different event types
    switch (eventType) {
      case 'invoice.paid':
        await handleInvoicePaid(data.invoice || data.data, data.payment)
        break
      case 'invoice.updated':
        await handleInvoiceUpdated(data.invoice || data.data)
        break
      case 'invoice.partially_paid':
        await handleInvoicePartiallyPaid(data.invoice || data.data)
        break
      case 'invoice.sent':
        await handleInvoiceSent(data.invoice || data.data)
        break
      case 'invoice.viewed':
        await handleInvoiceViewed(data.invoice || data.data)
        break
      case 'invoice.overdue':
        await handleInvoiceOverdue(data.invoice || data.data)
        break
      case 'payment.updated':
        await handlePaymentUpdated(data.payment || data.data)
        break
      case 'payment.processed':
        await handlePaymentProcessed(data.payment || data.data)
        break
      case 'payment.failed':
        await handlePaymentFailed(data.payment || data.data)
        break
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(data.customer || data.data, eventType)
        break
      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    const duration = Date.now() - startTime
    console.log(`[Webhook] ✅ Processed in ${duration}ms`)

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true, eventType, duration }, { status: 200 })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Webhook] ❌ Error processing Bill.com webhook:', error)
    console.error('[Webhook] Duration before error:', duration + 'ms')
    // Still return 200 to prevent retries (we've logged the error)
    return NextResponse.json({ received: true, error: 'Processing error logged' }, { status: 200 })
  }
}

async function handleInvoicePaid(invoice: any, payment: any) {
  const supabase = await createClient()
  
  try {
    // Find the proposal associated with this invoice
    const { data: proposals } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email
        )
      `)
      .or(
        `billcom_deposit_invoice_id.eq.${invoice.id},` +
        `billcom_roughin_invoice_id.eq.${invoice.id},` +
        `billcom_final_invoice_id.eq.${invoice.id}`
      )

    if (!proposals || proposals.length === 0) {
      console.error('No proposal found for invoice:', invoice.id)
      return
    }

    const proposal = proposals[0]
    let stage = ''
    let updateData: any = {
      billcom_last_sync_at: new Date().toISOString(),
    }

    // Determine which stage was paid and update accordingly
    if (invoice.id === proposal.billcom_deposit_invoice_id) {
      stage = 'deposit'
      updateData.billcom_deposit_status = 'PAID'
      updateData.deposit_paid_at = new Date().toISOString()
      updateData.payment_stage = 'roughin'
      updateData.total_paid = (proposal.total_paid || 0) + proposal.deposit_amount
    } else if (invoice.id === proposal.billcom_roughin_invoice_id) {
      stage = 'roughin'
      updateData.billcom_roughin_status = 'PAID'
      updateData.progress_paid_at = new Date().toISOString()
      updateData.payment_stage = 'final'
      updateData.total_paid = (proposal.total_paid || 0) + proposal.progress_payment_amount
    } else if (invoice.id === proposal.billcom_final_invoice_id) {
      stage = 'final'
      updateData.billcom_final_status = 'PAID'
      updateData.final_paid_at = new Date().toISOString()
      updateData.payment_stage = 'complete'
      updateData.status = 'completed'
      updateData.total_paid = proposal.total
    }

    // Update proposal in database
    const { error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposal.id)

    if (updateError) {
      console.error('Error updating proposal:', updateError)
      return
    }

    // Auto-complete job stage steps based on payment
    console.log(`🎯 Auto-completing job stages for ${stage} payment...`)
    try {
      const paidAt = new Date().toISOString()
      if (stage === 'deposit') {
        await handleProposalDepositPayment(proposal.id, paidAt)
      } else if (stage === 'roughin') {
        await handleProposalProgressPayment(proposal.id, paidAt)
      } else if (stage === 'final') {
        await handleProposalFinalPayment(proposal.id, paidAt)
      }
      console.log('✅ Job stages auto-completed')
    } catch (stageError) {
      console.error('❌ Error auto-completing job stages:', stageError)
      // Don't fail the webhook if stage update fails
    }

    // Send confirmation email
    if (proposal.customers?.email) {
      const amountPaid = payment?.amount || invoice.totalAmount
      const remainingBalance = proposal.total - (updateData.total_paid || 0)
      
      await sendPaymentConfirmationEmail({
        to: proposal.customers.email,
        customerName: proposal.customers.name,
        proposalTitle: proposal.title,
        stage: stage,
        amountPaid: amountPaid,
        remainingBalance: remainingBalance,
        totalAmount: proposal.total,
        proposalLink: `${process.env.NEXT_PUBLIC_BASE_URL}/proposal/view/${proposal.customer_view_token}`,
        nextSteps: getNextSteps(stage),
      })
    }

    console.log(`Successfully processed payment for ${stage} stage of proposal ${proposal.id}`)
  } catch (error) {
    console.error('Error handling invoice paid webhook:', error)
    throw error
  }
}

async function handleInvoiceUpdated(invoice: any) {
  // Handle invoice status updates (e.g., viewed, partially paid)
  const status = invoice.status === 'PAID' ? 'PAID' : 
                 invoice.status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'OPEN'
  
  await updatePaymentStatusFromWebhook(
    invoice.id,
    status,
    invoice.paidAmount
  )
}

async function handlePaymentUpdated(payment: any) {
  console.log('[Webhook] Payment updated:', {
    id: payment.id,
    status: payment.status,
    billsCount: payment.bills?.length,
  })

  const supabase = await createClient()

  // Handle failed payments
  if (payment.status === 'FAILED') {
    console.error('[Webhook] Payment failed:', payment.id)
    // Could send a notification email about the failed payment
    return
  }

  // Handle successful payments (status: PROCESSED, COMPLETED, etc.)
  if (payment.status === 'PROCESSED' || payment.status === 'COMPLETED') {
    console.log(`[Webhook] Processing successful payment: ${payment.id}`)

    // Payment object contains array of bills (invoices) that were paid
    const bills = payment.bills || []

    for (const bill of bills) {
      console.log(`[Webhook] Processing bill: ${bill.id}`)

      // Find proposal associated with this bill/invoice
      const { data: proposals } = await supabase
        .from('proposals')
        .select(`
          *,
          customers (
            id,
            name,
            email
          )
        `)
        .or(
          `billcom_deposit_invoice_id.eq.${bill.id},` +
          `billcom_roughin_invoice_id.eq.${bill.id},` +
          `billcom_final_invoice_id.eq.${bill.id}`
        )

      if (!proposals || proposals.length === 0) {
        console.log(`[Webhook] No proposal found for bill: ${bill.id}`)
        continue
      }

      const proposal = proposals[0]
      const paidAt = new Date().toISOString()
      let stage = ''
      let updateData: any = {
        billcom_last_sync_at: paidAt,
      }

      // Determine which stage was paid
      if (bill.id === proposal.billcom_deposit_invoice_id) {
        stage = 'deposit'
        updateData.billcom_deposit_status = 'PAID'
        updateData.deposit_paid_at = paidAt
        updateData.payment_stage = 'roughin'
        updateData.total_paid = (proposal.total_paid || 0) + proposal.deposit_amount
      } else if (bill.id === proposal.billcom_roughin_invoice_id) {
        stage = 'roughin'
        updateData.billcom_roughin_status = 'PAID'
        updateData.progress_paid_at = paidAt
        updateData.payment_stage = 'final'
        updateData.total_paid = (proposal.total_paid || 0) + proposal.progress_payment_amount
      } else if (bill.id === proposal.billcom_final_invoice_id) {
        stage = 'final'
        updateData.billcom_final_status = 'PAID'
        updateData.final_paid_at = paidAt
        updateData.payment_stage = 'complete'
        updateData.status = 'completed'
        updateData.total_paid = proposal.total
      }

      console.log(`[Webhook] Updating proposal ${proposal.id} for ${stage} payment`)

      // Update proposal
      const { error: updateError } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', proposal.id)

      if (updateError) {
        console.error('[Webhook] Error updating proposal:', updateError)
        continue
      }

      // Auto-complete job stage steps
      console.log(`[Webhook] Auto-completing job stages for ${stage} payment`)
      try {
        if (stage === 'deposit') {
          await handleProposalDepositPayment(proposal.id, paidAt)
        } else if (stage === 'roughin') {
          await handleProposalProgressPayment(proposal.id, paidAt)
        } else if (stage === 'final') {
          await handleProposalFinalPayment(proposal.id, paidAt)
        }
        console.log('[Webhook] ✅ Job stages auto-completed')
      } catch (stageError) {
        console.error('[Webhook] ❌ Error auto-completing stages:', stageError)
      }

      // Send confirmation email
      if (proposal.customers?.email) {
        const amountPaid = bill.amount || proposal[`${stage}_amount`]
        const remainingBalance = proposal.total - (updateData.total_paid || 0)

        await sendPaymentConfirmationEmail({
          to: proposal.customers.email,
          customerName: proposal.customers.name,
          proposalTitle: proposal.title,
          stage: stage,
          amountPaid: amountPaid,
          remainingBalance: remainingBalance,
          totalAmount: proposal.total,
          proposalLink: `${process.env.NEXT_PUBLIC_BASE_URL}/proposal/view/${proposal.customer_view_token}`,
          nextSteps: getNextSteps(stage),
        })

        console.log(`[Webhook] ✅ Email sent to ${proposal.customers.email}`)
      }

      console.log(`[Webhook] ✅ Successfully processed ${stage} payment for proposal ${proposal.id}`)
    }
  }
}

// Handler for invoice.partially_paid event
async function handleInvoicePartiallyPaid(invoice: any) {
  console.log('[Webhook] Invoice partially paid:', invoice.id)
  // Update payment status in database
  await updatePaymentStatusFromWebhook(
    invoice.id,
    'PARTIALLY_PAID',
    invoice.paidAmount || 0
  )
}

// Handler for invoice.sent event
async function handleInvoiceSent(invoice: any) {
  console.log('[Webhook] Invoice sent:', invoice.id)
  const supabase = await createClient()

  // Update sent timestamp in proposals
  await supabase
    .from('proposals')
    .update({ billcom_last_sync_at: new Date().toISOString() })
    .or(
      `billcom_deposit_invoice_id.eq.${invoice.id},` +
      `billcom_roughin_invoice_id.eq.${invoice.id},` +
      `billcom_final_invoice_id.eq.${invoice.id}`
    )
}

// Handler for invoice.viewed event
async function handleInvoiceViewed(invoice: any) {
  console.log('[Webhook] Invoice viewed by customer:', invoice.id)
  // Could track customer engagement here
}

// Handler for invoice.overdue event
async function handleInvoiceOverdue(invoice: any) {
  console.log('[Webhook] Invoice overdue:', invoice.id)
  // Could send reminder emails or notifications here
}

// Handler for payment.processed event
async function handlePaymentProcessed(payment: any) {
  console.log('[Webhook] Payment processed successfully:', payment.id)
  // Similar to payment.updated but specifically for successful processing
  await handlePaymentUpdated(payment)
}

// Handler for payment.failed event
async function handlePaymentFailed(payment: any) {
  console.error('[Webhook] Payment failed:', payment.id)
  const supabase = await createClient()

  // Find associated proposals and notify
  const bills = payment.bills || []
  for (const bill of bills) {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*, customers(email, name)')
      .or(
        `billcom_deposit_invoice_id.eq.${bill.id},` +
        `billcom_roughin_invoice_id.eq.${bill.id},` +
        `billcom_final_invoice_id.eq.${bill.id}`
      )

    if (proposals && proposals.length > 0) {
      // Could send failure notification email here
      console.log(`[Webhook] Payment failed for proposal: ${proposals[0].id}`)
    }
  }
}

// Handler for customer events (created/updated)
async function handleCustomerEvent(customer: any, eventType: string) {
  console.log(`[Webhook] Customer ${eventType}:`, customer.id)
  const supabase = await createClient()

  // Update or create customer in our database
  const customerData = {
    billcom_customer_id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: [
      customer.billAddress1,
      customer.billAddress2,
      customer.billAddressCity,
      customer.billAddressState,
      customer.billAddressZip
    ].filter(Boolean).join(', '),
    billcom_last_sync_at: new Date().toISOString()
  }

  // Try to find existing customer by Bill.com ID
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('billcom_customer_id', customer.id)
    .single()

  if (existingCustomer) {
    // Update existing customer
    await supabase
      .from('customers')
      .update(customerData)
      .eq('id', existingCustomer.id)
    console.log(`[Webhook] Updated customer: ${existingCustomer.id}`)
  } else {
    // Create new customer
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()
    console.log(`[Webhook] Created customer: ${newCustomer?.id}`)
  }
}

function getNextSteps(stage: string): string {
  switch (stage) {
    case 'deposit':
      return 'Thank you for your deposit payment! We will begin scheduling your project and will contact you soon with the timeline. The next payment (30% rough-in) will be due when we complete the rough-in phase.'
    case 'roughin':
      return 'Thank you for your rough-in payment! We are making great progress on your project. The final payment (20%) will be due upon project completion.'
    case 'final':
      return 'Thank you for your final payment! Your project is now complete. We appreciate your business and hope you enjoy your new HVAC system. Please don\'t hesitate to contact us if you have any questions.'
    default:
      return 'Thank you for your payment!'
  }
}
