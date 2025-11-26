import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getApprovalEmailTemplate } from '@/lib/email-templates'
import { BillcomClient } from '@/lib/billcom/client'
import { COMPANY_INFO } from '@/lib/legal-disclaimers'
import {
  updateTaxItem,
  getCombinedTaxRate,
  extractCountyFromAddress
} from '@/lib/billcom/tax-manager'
import { generateProposalPDF } from '@/lib/pdf/proposal-generator'
import { createOrMergeJob } from '@/lib/proposals/job-creator'
import type { InvoiceCreationResult } from '@/lib/proposals/types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Bill.com configuration
const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: 'https://api.bill.com/api'
}

const TAX_ITEM_ID = process.env.BILLCOM_TAX_ITEM_ID || ''

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { proposalId, action, rejectionReason, approvedBy } = await request.json()

    // Bill.com variables (available throughout function)
    let billcomInvoiceId: string | null = null
    let billcomInvoiceNumber: string | null = null
    let taxInfo: { county: string; rate: number; taxAmount: number; totalWithTax: number } | null = null
    
    // PDF variables (available throughout function)
    let pdfBlob: Blob | null = null
    let pdfBuffer: Buffer | null = null

    console.log('Proposal approval request:', { proposalId, action })

    if (!proposalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*, customers(*)')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      console.error('Error fetching proposal:', proposalError)
      return NextResponse.json(
        { error: 'Proposal not found', details: proposalError?.message },
        { status: 404 }
      )
    }

    // Update proposal status
    const updateData: any = {}
    const now = new Date().toISOString()

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_at = now
      updateData.payment_status = 'pending'
      updateData.current_payment_stage = 'deposit'
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_at = now
      updateData.customer_notes = rejectionReason || ''
    }

    const { error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId)

    if (updateError) {
      console.error('Error updating proposal:', updateError)
      return NextResponse.json(
        { error: 'Failed to update proposal', details: updateError.message },
        { status: 500 }
      )
    }

    // If approved, create payment stages and send notification
    if (action === 'approve') {
      console.log('🔵 CHECKPOINT 1: Inside approve block')
      // Calculate payment amounts
      const depositAmount = proposal.total * 0.5
      const progressAmount = proposal.total * 0.3
      const finalAmount = proposal.total * 0.2

      // Create payment stages
      const stages = [
        {
          proposal_id: proposalId,
          stage: 'deposit',
          percentage: 50,
          amount: depositAmount,
          due_date: new Date().toISOString().split('T')[0],
          paid: false
        },
        {
          proposal_id: proposalId,
          stage: 'progress',
          percentage: 30,
          amount: progressAmount,
          due_date: null,
          paid: false
        },
        {
          proposal_id: proposalId,
          stage: 'final',
          percentage: 20,
          amount: finalAmount,
          due_date: null,
          paid: false
        }
      ]

      const { error: stagesError } = await supabase
        .from('payment_stages')
        .insert(stages)

      if (stagesError) {
        console.error('Error creating payment stages:', stagesError)
        
        // If it's an RLS error, try to handle it gracefully
        if (stagesError.message?.includes('row level security')) {
          console.log('RLS policy issue - payment stages may need manual creation')
          // Continue with the approval process even if stages fail
          // Admin can manually create stages later
        }
        // Continue anyway - stages can be created manually
      }
      
      console.log('🔵 CHECKPOINT 2: Payment stages handled, moving to Bill.com')

      // Create Bill.com invoice with tax
      console.log('=== BILL.COM INVOICE CREATION START ===')
      console.log('TAX_ITEM_ID:', TAX_ITEM_ID)
      console.log('Customer address:', proposal.customers?.address)
      console.log('Proposal ID:', proposalId)
      console.log('Proposal number:', proposal.proposal_number)
      
      if (!TAX_ITEM_ID) {
        console.error('❌ CRITICAL: TAX_ITEM_ID not set in environment variables!')
      }
      
      if (!proposal.customers?.address) {
        console.error('❌ CRITICAL: Customer address is missing!')
      }
      
      if (TAX_ITEM_ID && proposal.customers?.address) {
        try {
          console.log('✅ Starting Bill.com invoice creation...')
          
          const billcomClient = new BillcomClient(BILLCOM_CONFIG)
          const sessionId = await billcomClient.authenticate()

          // Extract county and get tax rate
          const county = extractCountyFromAddress(proposal.customers.address)
          
          if (!county) {
            console.error('❌ CRITICAL: Could not extract county from address:', proposal.customers.address)
            throw new Error('Could not determine county from customer address. Invoice creation failed.')
          }
          
          const taxRate = getCombinedTaxRate(county)
            console.log(`Tax: ${county} County at ${(taxRate * 100).toFixed(2)}%`)

            // Update the tax item with this county's rate
            await updateTaxItem({
              sessionId,
              taxItemId: TAX_ITEM_ID,
              county,
              rate: taxRate,
              devKey: BILLCOM_CONFIG.devKey,
              apiUrl: BILLCOM_CONFIG.apiUrl
            })

            // Create/find customer in Bill.com
            const billcomCustomer = await billcomClient.createOrFindCustomer({
              name: proposal.customers.name,
              email: proposal.customers.email,
              phone: proposal.customers.phone || '',
              address: proposal.customers.address
            })

            // Calculate totals
            const subtotal = proposal.total
            const taxAmount = subtotal * taxRate
            const totalWithTax = subtotal + taxAmount

            // Calculate tax breakdown (state vs county)
            const NC_STATE_TAX = 0.0475 // 4.75%
            const countyTaxRate = taxRate - NC_STATE_TAX
            const stateTaxAmount = subtotal * NC_STATE_TAX
            const countyTaxAmount = subtotal * countyTaxRate

            // Get proposal items from the SELECTED TIER
            const { data: allProposalItems } = await supabase
              .from('proposal_items')
              .select('*')
              .eq('proposal_id', proposalId)

            // Find which tier was selected
            const { data: selectedTier } = await supabase
              .from('proposal_tiers')
              .select('*')
              .eq('proposal_id', proposalId)
              .eq('is_selected', true)
              .single()

            // Filter items by selected tier (or all if single-tier proposal)
            const lineItems = selectedTier 
              ? allProposalItems?.filter(item => item.tier_id === selectedTier.id && !item.is_addon)
              : allProposalItems?.filter(item => !item.is_addon)

            console.log(`Using ${lineItems?.length || 0} items from ${selectedTier ? `tier: ${selectedTier.tier_name}` : 'single-tier proposal'}`)

            // Build tax breakdown and legal disclaimer for notes
            const taxBreakdown = `${county} County Tax ${(countyTaxRate * 100).toFixed(2)}%: $${countyTaxAmount.toFixed(2)}\nNC State Tax 4.75%: $${stateTaxAmount.toFixed(2)}`
            const legalDisclaimer = `\n\n${COMPANY_INFO.businessName}\nNC License #${COMPANY_INFO.licenseNumber}`

            // Build line items array: service items + tax as separate line item
            const billcomLineItems = [
              // Service items (50% deposit)
              ...(lineItems || []).map((item: any) => ({
                description: item.name || item.description,
                amount: item.total_price || item.unit_price,
                quantity: 0.5, // 50% deposit - half quantity
                taxable: false, // Don't apply tax on top of tax
                isTaxItem: false
              })),
              // Tax as separate line item
              {
                itemId: TAX_ITEM_ID, // Reference the tax item in Bill.com
                description: `Tax (${(taxRate * 100).toFixed(2)}%)`,
                amount: taxAmount, // Total tax amount calculated
                quantity: 1,
                taxable: false, // Tax items are never taxable
                isTaxItem: true // Flag this as a tax line item
              }
            ]

            console.log(`Creating invoice with ${billcomLineItems.length} line items (${(lineItems || []).length} services + 1 tax)`)

            // Create invoice (invoice number will be auto-fetched from Bill.com)
            const billcomInvoice = await billcomClient.createInvoice({
              customerId: billcomCustomer.id,
              amount: totalWithTax,
              description: `HVAC Service - ${proposal.proposal_number}\n\n${taxBreakdown}${legalDisclaimer}`,
              lineItems: billcomLineItems,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              sendEmail: false
            })

            billcomInvoiceId = billcomInvoice.id
            billcomInvoiceNumber = billcomInvoice.invoiceNumber
            taxInfo = {
              county,
              rate: taxRate,
              taxAmount,
              totalWithTax
            }

            console.log(`✅ Bill.com Invoice #${billcomInvoiceNumber} created successfully!`)

            // Update proposal with invoice info
            await supabase
              .from('proposals')
              .update({
                billcom_invoice_id: billcomInvoiceId,
                billcom_invoice_number: billcomInvoiceNumber,
                tax_amount: taxAmount,
                total_with_tax: totalWithTax
              })
              .eq('id', proposalId)

            // Send invoice email to customer via Bill.com - MUST WORK OR FAIL LOUDLY
            console.log('📧 ==========  BILL.COM SEND INVOICE START =========')
            console.log('Invoice ID:', billcomInvoiceId)
            console.log('Invoice Number:', billcomInvoiceNumber)
            console.log('Customer Email:', proposal.customers.email)
            console.log('Attempting to send invoice via Bill.com...')
            
            const sendResult = await billcomClient.sendInvoice(billcomInvoiceId, proposal.customers.email)
            
            console.log('✅ Bill.com sendInvoice SUCCESS!')
            console.log('Send result:', JSON.stringify(sendResult, null, 2))
            console.log('=========== BILL.COM SEND INVOICE END ===========')
            
            // Log success
            await supabase.from('proposal_activities').insert({
              proposal_id: proposalId,
              activity_type: 'invoice_sent',
              description: `Invoice #${billcomInvoiceNumber} sent to customer via Bill.com`,
              metadata: { sendResult }
            })
        } catch (billcomError) {
          console.error('❌ Bill.com invoice creation FAILED:', billcomError)
          console.error('Error details:', JSON.stringify(billcomError, null, 2))
          // Don't fail the approval if Bill.com fails
          // Admin can manually create invoice later
        }
      } else {
        console.error('❌ SKIPPING Bill.com invoice creation!')
        console.error('Reason: TAX_ITEM_ID or customer address missing')
        console.error('TAX_ITEM_ID present:', !!TAX_ITEM_ID)
        console.error('Customer address present:', !!proposal.customers?.address)
      }
      
      console.log('=== BILL.COM INVOICE CREATION END ===')
      console.log('🔵 CHECKPOINT 3: Bill.com section complete, moving to job creation')

      // Create job from approved proposal
      console.log('=== JOB CREATION START ===')
      try {
        // Prepare invoice data for job creator
        const invoiceData: InvoiceCreationResult = {
          success: !!billcomInvoiceId,
          invoiceId: billcomInvoiceId || undefined,
          invoiceLink: billcomInvoiceId ? `https://app02.us.bill.com/Pay/${billcomInvoiceId}` : undefined,
          dbInvoiceId: undefined // We don't store separate DB invoice records in this flow
        }

        console.log('Calling job creator with invoice data:', invoiceData)

        const jobResult = await createOrMergeJob(
          proposal,
          proposal.customers,
          invoiceData,
          proposalId
        )

        if (jobResult.success) {
          console.log('✅ Job created/merged successfully!')
          console.log('Job ID:', jobResult.jobId)
          console.log('Job Number:', jobResult.jobNumber)
          console.log('Merged into existing:', jobResult.merged)
        } else {
          console.error('❌ Job creation failed:', jobResult.error)
          // Continue anyway - admin can manually create job
        }
      } catch (jobError) {
        console.error('❌ Exception during job creation:', jobError)
        // Continue anyway - admin can manually create job
      }
      console.log('=== JOB CREATION END ===')
      console.log('🔵 CHECKPOINT 3.5: Job creation complete, moving to PDF generation')

      // Generate PDF for approved proposal
      try {
        console.log('Generating PDF for approved proposal...')
          
          // Get proposal items for PDF (filter by selected tier if multi-tier)
          const { data: allPdfItems } = await supabase
            .from('proposal_items')
            .select('*')
            .eq('proposal_id', proposalId)
            .order('sort_order', { ascending: true })

          // Get selected tier if multi-tier proposal
          const { data: selectedTierForPdf } = await supabase
            .from('proposal_tiers')
            .select('*')
            .eq('proposal_id', proposalId)
            .eq('is_selected', true)
            .single()

          // Filter by selected tier (or use all if single-tier)
          const lineItems = selectedTierForPdf
            ? allPdfItems?.filter(item => item.tier_id === selectedTierForPdf.id)
            : allPdfItems

          console.log(`PDF: Using ${lineItems?.length || 0} items from ${selectedTierForPdf ? `tier: ${selectedTierForPdf.tier_name}` : 'single-tier'}`)

          // Prepare data for PDF generator
          const pdfData = {
            proposal_number: proposal.proposal_number,
            title: proposal.title || 'HVAC Service Proposal',
            description: proposal.description,
            subtotal: proposal.subtotal,
            tax_rate: proposal.tax_rate,
            tax_amount: taxInfo ? taxInfo.taxAmount : proposal.tax_amount,
            total: taxInfo ? taxInfo.totalWithTax : proposal.total,
            created_at: proposal.created_at,
            approved_at: now, // Add approved timestamp for PDF
            valid_until: proposal.valid_until,
            tier_mode: proposal.tier_mode, // Add tier mode for PDF
            selectedTier: selectedTierForPdf ? {
              tierName: selectedTierForPdf.tier_name,
              tierLevel: selectedTierForPdf.tier_level
            } : undefined, // Add selected tier info for PDF
            customers: {
              name: proposal.customers.name,
              email: proposal.customers.email,
              phone: proposal.customers.phone,
              address: proposal.customers.address
            },
            proposal_items: (lineItems || []).map((item: any) => ({
              name: item.name || item.description,
              description: item.description,
              price: item.total_price || item.price,
              unit_price: item.unit_price,
              quantity: item.quantity || 1,
              is_addon: item.is_addon || false,
              is_selected: item.is_selected !== false, // Default to true if not specified
              total_price: item.total_price || item.price // Add total_price for grouping
            }))
          }

          // Generate PDF
          pdfBlob = await generateProposalPDF(pdfData)
          
          // Convert blob to buffer for email attachment
          const arrayBuffer = await pdfBlob.arrayBuffer()
          pdfBuffer = Buffer.from(arrayBuffer)
          
          console.log(`✅ PDF generated successfully (${Math.round(pdfBlob.size / 1024)}KB)`)
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError)
          // Continue without PDF if generation fails
        }
      
      console.log('🔵 CHECKPOINT 4: PDF generation complete, starting email section')
      console.log('🔵 PDF buffer exists:', !!pdfBuffer, 'Size:', pdfBuffer ? pdfBuffer.length : 0)

      // Send approval notification email to business
      console.log('🔵 CHECKPOINT 5: Starting business email section')
      console.log('📧 EMAIL SECTION - Starting email notifications')
      console.log('BUSINESS_EMAIL:', process.env.BUSINESS_EMAIL)
      console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
      console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
      console.log('PDF Buffer exists:', !!pdfBuffer, 'Size:', pdfBuffer ? pdfBuffer.length : 0)
      
      if (process.env.BUSINESS_EMAIL) {
        const proposalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fairairhc.service-pro.app'}/proposals/${proposalId}`
        
        try {
          const emailPayload: any = {
            from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
            to: process.env.BUSINESS_EMAIL,
            replyTo: proposal.customers?.email || process.env.REPLY_TO_EMAIL || 'dantcacenco@gmail.com',
            subject: `🎉 Proposal #${proposal.proposal_number} APPROVED by ${proposal.customers?.name || 'Customer'}`,
            html: getApprovalEmailTemplate({
              proposalNumber: proposal.proposal_number,
              customerName: proposal.customers?.name || 'Customer',
              customerEmail: proposal.customers?.email || 'No email',
              customerPhone: proposal.customers?.phone,
              totalAmount: taxInfo 
                ? `$${taxInfo.totalWithTax.toFixed(2)} (includes $${taxInfo.taxAmount.toFixed(2)} tax)`
                : `$${proposal.total.toFixed(2)}`,
              approvedBy: approvedBy || proposal.customers?.name || 'Customer',
              proposalUrl,
              companyName: 'Fair Air HC'
            })
          }

          // Attach PDF if generated
          if (pdfBuffer) {
            emailPayload.attachments = [{
              filename: `proposal-${proposal.proposal_number}-approved.pdf`,
              content: pdfBuffer
            }]
          }

          console.log('📧 Sending business email to:', process.env.BUSINESS_EMAIL)
          console.log('Email payload keys:', Object.keys(emailPayload))
          const businessResult = await resend.emails.send(emailPayload)
          console.log('✅ Business email SENT! Result:', JSON.stringify(businessResult, null, 2))
        } catch (emailError) {
          console.error('Failed to send approval notification:', emailError)
          // Don't fail the approval if email fails
        }
      }
      
      console.log('🔵 CHECKPOINT 6: Business email section complete')
      console.log('🔵 CHECKPOINT 7: About to start customer email section')

      // Send approval confirmation to customer
      console.log('🔵 CHECKPOINT 8: Inside customer email section')
      console.log('📧 Preparing customer approval email')
      console.log('Customer email:', proposal.customers?.email)
      console.log('Customer email exists?', !!proposal.customers?.email)
      console.log('PDF buffer exists:', !!pdfBuffer)
      
      if (proposal.customers?.email) {
        console.log('🔵 CHECKPOINT 9: Customer email exists, proceeding to send')
        try {
          console.log('🔵 CHECKPOINT 10: Inside try block, building email payload')
          const emailPayload: any = {
            from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
            to: proposal.customers.email,
            replyTo: process.env.REPLY_TO_EMAIL || 'dantcacenco@gmail.com',
            subject: `✅ Proposal Approved - ${COMPANY_INFO.businessName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">✅ You Approved the Proposal!</h2>
                <p>Dear ${proposal.customers.name},</p>
                <p><strong>You will receive an invoice shortly.</strong></p>
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>${COMPANY_INFO.businessName}</strong><br>
                  NC License #${COMPANY_INFO.licenseNumber}
                </p>
              </div>
            `
          }

          // Attach PDF if available (optional)
          if (pdfBuffer) {
            emailPayload.attachments = [{
              filename: `proposal-${proposal.proposal_number}-approved.pdf`,
              content: pdfBuffer
            }]
            console.log('📎 PDF will be attached to customer email')
          } else {
            console.log('⚠️ No PDF to attach to customer email')
          }

          console.log('🔵 CHECKPOINT 11: About to call resend.emails.send for customer')
          console.log('Email payload TO:', emailPayload.to)
          console.log('Email payload FROM:', emailPayload.from)
          console.log('Email payload SUBJECT:', emailPayload.subject)
          
          const customerResult = await resend.emails.send(emailPayload)
          
          console.log('🔵 CHECKPOINT 12: resend.emails.send completed')
          console.log('✅ Customer email SENT! Result:', JSON.stringify(customerResult, null, 2))
        } catch (emailError) {
          console.error('🔵 CHECKPOINT 13: Caught error in customer email try/catch')
          console.error('❌ Failed to send customer email:', emailError)
          console.error('Error details:', JSON.stringify(emailError, null, 2))
          console.error('Error type:', typeof emailError)
          console.error('Error message:', emailError instanceof Error ? emailError.message : String(emailError))
          // Don't fail if customer email fails
        }
      } else {
        console.log('🔵 CHECKPOINT 14: No customer email address - skipping customer email')
        console.log('⚠️ No customer email to send to')
      }
      
      console.log('🔵 CHECKPOINT 15: Customer email section complete, moving to activity log')
      await supabase
        .from('proposal_activities')
        .insert({
          proposal_id: proposalId,
          activity_type: 'approved',
          description: `Proposal approved by customer${billcomInvoiceNumber ? ` - Invoice #${billcomInvoiceNumber} created` : ''}${pdfBuffer ? ' - PDF sent to customer and business' : ''}`,
          metadata: { 
            payment_stages_created: !stagesError,
            billcom_invoice_created: !!billcomInvoiceId,
            billcom_invoice_number: billcomInvoiceNumber,
            tax_info: taxInfo,
            pdf_generated: !!pdfBuffer
          }
        })
      
      console.log('🔵 CHECKPOINT 16: Activity logged, approval flow complete')
      console.log('🔵 Summary - Emails sent:')
      console.log('  - Business email sent:', !!process.env.BUSINESS_EMAIL)
      console.log('  - Customer email sent:', !!proposal.customers?.email)
    }

    // Return appropriate response for mobile
    return NextResponse.json({
      success: true,
      action: action,
      proposalId: proposalId,
      message: action === 'approve' 
        ? `Proposal approved successfully. ${billcomInvoiceNumber ? `Invoice #${billcomInvoiceNumber} created.` : 'Payment stages created.'}`
        : 'Proposal rejected.',
      redirectUrl: action === 'approve' 
        ? `/customer-proposal/${proposal.customer_view_token}/payment`
        : `/customer-proposal/${proposal.customer_view_token}`,
      ...(taxInfo && {
        taxInfo: {
          county: taxInfo.county,
          rate: `${(taxInfo.rate * 100).toFixed(2)}%`,
          taxAmount: taxInfo.taxAmount,
          totalWithTax: taxInfo.totalWithTax
        }
      }),
      ...(billcomInvoiceNumber && {
        invoice: {
          id: billcomInvoiceId,
          number: billcomInvoiceNumber
        }
      })
    })

  } catch (error) {
    console.error('Error in proposal approval:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        // Provide mobile-friendly error message
        mobileMessage: 'Something went wrong. Please try again or contact support.'
      },
      { status: 500 }
    )
  }
}