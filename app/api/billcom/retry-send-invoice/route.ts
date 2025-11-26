// API endpoint to retry sending failed Bill.com invoices
// Called automatically when dashboard/admin pages load to check for pending retries
// Works like the maintenance reminder system - triggers on page load

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BillcomClient } from '@/lib/billcom/client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: process.env.BILLCOM_API_ENDPOINT || 'https://api.bill.com/api/v2'
}

// Support both GET and POST
export async function GET(request: Request) {
  return handleRetry()
}

export async function POST(request: Request) {
  return handleRetry()
}

async function handleRetry() {
  try {
    const supabase = await createClient()
    
    // Find all pending retries that are due
    const { data: pendingRetries, error: fetchError } = await supabase
      .from('invoice_send_attempts')
      .select('*, proposals!inner(proposal_number, customers!inner(name, email))')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(10) // Process max 10 at a time

    if (fetchError) {
      console.error('Error fetching pending retries:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending retries',
        processed: 0 
      })
    }

    console.log(`Found ${pendingRetries.length} invoice(s) to retry sending`)

    const billcomClient = new BillcomClient(BILLCOM_CONFIG)
    const results = []

    for (const retry of pendingRetries) {
      const proposal = retry.proposals
      const customer = proposal.customers
      const attemptNumber = retry.attempt_number + 1
      
      console.log(`Retrying invoice send (attempt ${attemptNumber}/10): ${retry.billcom_invoice_number}`)

      try {
        // Attempt to send invoice
        await billcomClient.sendInvoice(retry.billcom_invoice_id, customer.email)
        
        console.log(`✅ Invoice ${retry.billcom_invoice_number} sent successfully on attempt ${attemptNumber}`)

        // Update as success
        await supabase
          .from('invoice_send_attempts')
          .update({
            status: 'success',
            attempt_number: attemptNumber,
            completed_at: new Date().toISOString(),
            next_retry_at: null
          })
          .eq('id', retry.id)

        // Log activity
        await supabase.from('proposal_activities').insert({
          proposal_id: retry.proposal_id,
          activity_type: 'invoice_sent',
          description: `Invoice #${retry.billcom_invoice_number} sent to customer via Bill.com (attempt ${attemptNumber})`,
          metadata: { attemptNumber }
        })

        // Notify business owner of success
        if (process.env.BUSINESS_EMAIL) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
            to: process.env.BUSINESS_EMAIL,
            subject: `✅ Invoice Send Succeeded on Retry #${attemptNumber}`,
            html: `
              <h2>Invoice Successfully Sent!</h2>
              <p><strong>Invoice:</strong> #${retry.billcom_invoice_number}</p>
              <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
              <p><strong>Attempt:</strong> ${attemptNumber}/10</p>
              <p>The invoice email was successfully delivered to the customer.</p>
            `
          })
        }

        results.push({ id: retry.id, status: 'success', attemptNumber })

      } catch (error: any) {
        console.error(`❌ Invoice ${retry.billcom_invoice_number} failed on attempt ${attemptNumber}:`, error.message)

        // Check if we've hit max retries
        if (attemptNumber >= 10) {
          // Permanent failure after 10 attempts
          await supabase
            .from('invoice_send_attempts')
            .update({
              status: 'failed',
              attempt_number: attemptNumber,
              error_message: error.message,
              error_details: { name: error.name, message: error.message },
              error_stack: error.stack,
              next_retry_at: null,
              completed_at: new Date().toISOString()
            })
            .eq('id', retry.id)

          // Notify business owner of permanent failure
          if (process.env.BUSINESS_EMAIL) {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
              to: process.env.BUSINESS_EMAIL,
              subject: `🚨 URGENT: Invoice Send Failed After 10 Attempts - Manual Action Required`,
              html: `
                <h2 style="color: red;">Invoice Send Failed Permanently</h2>
                <p><strong>Invoice:</strong> #${retry.billcom_invoice_number}</p>
                <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
                <p><strong>Attempts:</strong> 10/10 (all failed)</p>
                <p><strong>Last Error:</strong> ${error.message}</p>
                <p><strong>Action Required:</strong> Please manually send this invoice to the customer or investigate the issue.</p>
                <p>The invoice was created in Bill.com but the email notification failed to send.</p>
              `
            })
          }

          results.push({ id: retry.id, status: 'failed', attemptNumber, maxRetriesReached: true })

        } else {
          // Calculate next retry with exponential backoff
          const minutesUntilRetry = 
            attemptNumber === 1 ? 5 :
            attemptNumber === 2 ? 15 :
            attemptNumber === 3 ? 60 :
            attemptNumber === 4 ? 600 :
            1440 * (attemptNumber - 4) // 24 hours * (attempt - 4)

          const nextRetryAt = new Date(Date.now() + minutesUntilRetry * 60 * 1000).toISOString()

          await supabase
            .from('invoice_send_attempts')
            .update({
              status: 'retrying',
              attempt_number: attemptNumber,
              error_message: error.message,
              error_details: { name: error.name, message: error.message },
              error_stack: error.stack,
              next_retry_at: nextRetryAt
            })
            .eq('id', retry.id)

          // Notify business owner of retry
          if (process.env.BUSINESS_EMAIL) {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
              to: process.env.BUSINESS_EMAIL,
              subject: `⚠️ Invoice Send Failed - Retry ${attemptNumber}/10 Scheduled`,
              html: `
                <h2>Invoice Send Failed (Retry Scheduled)</h2>
                <p><strong>Invoice:</strong> #${retry.billcom_invoice_number}</p>
                <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
                <p><strong>Attempt:</strong> ${attemptNumber}/10</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Next Retry:</strong> ${new Date(nextRetryAt).toLocaleString()}</p>
              `
            })
          }

          results.push({ id: retry.id, status: 'retrying', attemptNumber, nextRetry: nextRetryAt })
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })

  } catch (error: any) {
    console.error('Error in retry-send-invoice:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 })
  }
}
