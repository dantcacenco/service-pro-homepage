// Bill.com Service Layer
// Handles business logic for invoice creation and management

import { getBillcomClient } from './client'
import { createClient } from '@/lib/supabase/server'

interface Proposal {
  id: string
  title: string
  total: number
  deposit_amount: number
  progress_payment_amount: number
  final_payment_amount: number
  customer_id: string
  customers?: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  billcom_customer_id?: string
  billcom_deposit_invoice_id?: string
  billcom_roughin_invoice_id?: string
  billcom_final_invoice_id?: string
}

export async function createBillcomInvoicesForProposal(proposalId: string): Promise<{
  success: boolean
  message: string
  invoices?: {
    deposit: { id: string; link: string }
    roughin: { id: string; link: string }
    final: { id: string; link: string }
  }
}> {
  const supabase = await createClient()
  const billcom = getBillcomClient()

  try {
    // Get proposal with customer details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      throw new Error('Proposal not found')
    }

    if (!proposal.customers) {
      throw new Error('Customer information not found')
    }

    // Check if invoices already exist
    if (proposal.billcom_deposit_invoice_id) {
      return {
        success: false,
        message: 'Bill.com invoices already created for this proposal',
      }
    }

    // Format amounts for display
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }

    const totalFormatted = formatCurrency(proposal.total)
    const depositFormatted = formatCurrency(proposal.deposit_amount)
    const roughinFormatted = formatCurrency(proposal.progress_payment_amount)
    const finalFormatted = formatCurrency(proposal.final_payment_amount)

    // Create or find customer in Bill.com
    let customerId = proposal.billcom_customer_id

    if (!customerId) {
      const billcomCustomer = await billcom.createOrFindCustomer({
        name: proposal.customers.name,
        email: proposal.customers.email,
        phone: proposal.customers.phone || undefined,
        address: proposal.customers.address || undefined,
      })
      customerId = billcomCustomer.id

      // Save customer ID for future use
      await supabase
        .from('proposals')
        .update({ billcom_customer_id: customerId })
        .eq('id', proposalId)
    }

    // Generate invoice numbers based on proposal ID
    const baseInvoiceNumber = `INV-${proposalId.substring(0, 8).toUpperCase()}`

    // Create deposit invoice
    const depositInvoice = await billcom.createInvoice({
      customerId: customerId,
      amount: proposal.deposit_amount,
      description: `${proposal.title} - Deposit Payment`,
      lineItems: [
        {
          description: `Deposit Payment - ${depositFormatted} (50% of ${totalFormatted} total project)`,
          amount: proposal.deposit_amount,
        },
      ],
      dueDate: new Date().toISOString().split('T')[0], // Due today
      invoiceNumber: `${baseInvoiceNumber}-DEP`,
      sendEmail: false, // We'll send our own email
    })

    // Create rough-in invoice
    const roughinInvoice = await billcom.createInvoice({
      customerId: customerId,
      amount: proposal.progress_payment_amount,
      description: `${proposal.title} - Rough-In Payment`,
      lineItems: [
        {
          description: `Rough-In Payment - ${roughinFormatted} (30% of ${totalFormatted} total project)`,
          amount: proposal.progress_payment_amount,
        },
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      invoiceNumber: `${baseInvoiceNumber}-RGH`,
      sendEmail: false,
    })

    // Create final invoice
    const finalInvoice = await billcom.createInvoice({
      customerId: customerId,
      amount: proposal.final_payment_amount,
      description: `${proposal.title} - Final Payment`,
      lineItems: [
        {
          description: `Final Payment - ${finalFormatted} (20% of ${totalFormatted} total project)`,
          amount: proposal.final_payment_amount,
        },
      ],
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days
      invoiceNumber: `${baseInvoiceNumber}-FNL`,
      sendEmail: false,
    })

    // Get payment links for each invoice
    const returnBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fairairhc.service-pro.app'
    const proposalViewUrl = `${returnBaseUrl}/proposal/view/${proposal.customer_view_token}`

    const depositLink = await billcom.getPaymentLink(
      depositInvoice.id,
      proposal.customers.email,
      `${proposalViewUrl}?payment=deposit&status=success`
    )

    const roughinLink = await billcom.getPaymentLink(
      roughinInvoice.id,
      proposal.customers.email,
      `${proposalViewUrl}?payment=roughin&status=success`
    )

    const finalLink = await billcom.getPaymentLink(
      finalInvoice.id,
      proposal.customers.email,
      `${proposalViewUrl}?payment=final&status=success`
    )

    // Update proposal with Bill.com invoice information
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        billcom_customer_id: customerId,
        billcom_deposit_invoice_id: depositInvoice.id,
        billcom_deposit_invoice_link: depositLink.paymentLink,
        billcom_deposit_status: 'PENDING',
        billcom_roughin_invoice_id: roughinInvoice.id,
        billcom_roughin_invoice_link: roughinLink.paymentLink,
        billcom_roughin_status: 'PENDING',
        billcom_final_invoice_id: finalInvoice.id,
        billcom_final_invoice_link: finalLink.paymentLink,
        billcom_final_status: 'PENDING',
        billcom_invoices_created_at: new Date().toISOString(),
      })
      .eq('id', proposalId)

    if (updateError) {
      console.error('Error updating proposal with Bill.com data:', updateError)
      // Don't throw here - invoices were created successfully
    }

    return {
      success: true,
      message: 'Bill.com invoices created successfully',
      invoices: {
        deposit: { id: depositInvoice.id, link: depositLink.paymentLink },
        roughin: { id: roughinInvoice.id, link: roughinLink.paymentLink },
        final: { id: finalInvoice.id, link: finalLink.paymentLink },
      },
    }
  } catch (error) {
    console.error('Error creating Bill.com invoices:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create Bill.com invoices',
    }
  }
}

// Get invoice status from Bill.com
export async function getBillcomInvoiceStatus(invoiceId: string): Promise<{
  status: string
  paidAmount?: number
  totalAmount?: number
}> {
  const billcom = getBillcomClient()

  try {
    const invoice = await billcom.getInvoice(invoiceId)
    
    return {
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      // Note: We'll need to check the actual response structure for paid amount
    }
  } catch (error) {
    console.error('Error getting invoice status:', error)
    throw error
  }
}

// Update payment status in our database based on Bill.com webhook
export async function updatePaymentStatusFromWebhook(
  invoiceId: string,
  status: 'PAID' | 'PARTIALLY_PAID' | 'OPEN',
  paidAmount?: number
): Promise<void> {
  const supabase = await createClient()

  try {
    // Find which proposal and stage this invoice belongs to
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .or(
        `billcom_deposit_invoice_id.eq.${invoiceId},` +
        `billcom_roughin_invoice_id.eq.${invoiceId},` +
        `billcom_final_invoice_id.eq.${invoiceId}`
      )

    if (!proposals || proposals.length === 0) {
      console.error('No proposal found for invoice:', invoiceId)
      return
    }

    const proposal = proposals[0]
    let updateData: any = {
      billcom_last_sync_at: new Date().toISOString(),
    }

    // Determine which stage was paid
    if (invoiceId === proposal.billcom_deposit_invoice_id) {
      updateData.billcom_deposit_status = status
      if (status === 'PAID') {
        updateData.deposit_paid_at = new Date().toISOString()
        updateData.payment_stage = 'roughin'
      }
    } else if (invoiceId === proposal.billcom_roughin_invoice_id) {
      updateData.billcom_roughin_status = status
      if (status === 'PAID') {
        updateData.progress_paid_at = new Date().toISOString()
        updateData.payment_stage = 'final'
      }
    } else if (invoiceId === proposal.billcom_final_invoice_id) {
      updateData.billcom_final_status = status
      if (status === 'PAID') {
        updateData.final_paid_at = new Date().toISOString()
        updateData.payment_stage = 'complete'
        updateData.status = 'completed'
      }
    }

    // Update proposal
    await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposal.id)

    // Send confirmation email if payment was successful
    if (status === 'PAID') {
      // Import and use your existing email service
      // await sendPaymentConfirmationEmail(proposal, stage, paidAmount)
    }
  } catch (error) {
    console.error('Error updating payment status from webhook:', error)
    throw error
  }
}
