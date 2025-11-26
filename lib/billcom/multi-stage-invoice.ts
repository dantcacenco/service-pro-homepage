// Bill.com Multi-Stage Invoice Creation
// Handles invoice creation for rough-in and final stages with county tax breakdown

import { getBillcomClient } from './client'

export interface InvoiceItem {
  name: string
  description: string
  unit_price: number
  quantity: number
  total_price: number
}

export interface CreateMultiStageInvoiceParams {
  customerId: string // Bill.com customer ID
  customerName: string
  customerEmail: string // Customer email for sending invoice
  jobNumber: string
  stage: 'deposit' | 'roughin' | 'final'
  items: InvoiceItem[]
  subtotal: number
  stateTaxAmount: number
  countyTaxAmount: number
  totalTaxAmount: number
  total: number
  county: string
  dueDate?: string
}

export async function createMultiStageInvoice(params: CreateMultiStageInvoiceParams): Promise<{
  success: boolean
  billcomInvoiceId?: string
  invoiceUrl?: string
  error?: string
}> {
  try {
    const billcom = getBillcomClient()

    console.log('[MULTI-STAGE INVOICE] Creating invoice:', {
      stage: params.stage,
      jobNumber: params.jobNumber,
      items: params.items.length,
      total: params.total
    })

    // Let Bill.com auto-generate invoice number using their organization settings
    // No need to manually create invoice numbers - Bill.com handles this

    // Format items as line items for Bill.com
    const lineItems = params.items.map(item => ({
      description: `${item.name} (qty: ${item.quantity.toFixed(2)})`,
      amount: item.total_price,
      quantity: item.quantity,
      price: item.unit_price,
      taxable: true // Regular items are taxable
    }))

    // Calculate stage quantity for tax items (matches invoice items)
    const stageQuantity = params.stage === 'deposit' ? 0.5 : params.stage === 'roughin' ? 0.3 : 0.2

    // Add tax line items with stage-appropriate quantity
    const taxLineItems = [
      {
        description: `NC State Sales Tax (4.75%) (qty: ${stageQuantity.toFixed(2)})`,
        amount: params.stateTaxAmount,
        quantity: stageQuantity,
        price: params.stateTaxAmount / stageQuantity, // Unit price
        taxable: false, // Tax items themselves are not taxable
        isTaxItem: true
      },
      {
        description: `${params.county} Tax (qty: ${stageQuantity.toFixed(2)})`,
        amount: params.countyTaxAmount,
        quantity: stageQuantity,
        price: params.countyTaxAmount / stageQuantity, // Unit price
        taxable: false,
        isTaxItem: true
      }
    ]

    // Combine all line items
    const allLineItems = [...lineItems, ...taxLineItems]

    console.log('[MULTI-STAGE INVOICE] Line items:', allLineItems)

    // Create invoice in Bill.com
    const stageName = params.stage === 'deposit' ? 'Deposit' : params.stage === 'roughin' ? 'Rough-in' : 'Final'
    const invoice = await billcom.createInvoice({
      customerId: params.customerId,
      amount: params.total,
      description: `${params.jobNumber} - ${stageName} Payment`,
      lineItems: allLineItems,
      dueDate: params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // No invoiceNumber - let Bill.com auto-generate it
      sendEmail: false // Don't send email automatically
    })

    console.log('[MULTI-STAGE INVOICE] Invoice created in Bill.com:', invoice.id)
    console.log('[MULTI-STAGE INVOICE] Invoice Number (Bill.com auto-generated):', invoice.invoiceNumber)

    // Get invoice URL
    const invoiceUrl = `https://app.bill.com/Invoice/${invoice.id}`

    // Send invoice email to customer via Bill.com - CRITICAL for customer workflow
    console.log('📧 ========== BILL.COM SEND INVOICE START =========')
    console.log('Invoice ID:', invoice.id)
    console.log('Invoice Number:', invoice.invoiceNumber)
    console.log('Customer Email:', params.customerEmail)

    try {
      const sendResult = await billcom.sendInvoice(invoice.id, params.customerEmail)

      console.log('✅ Bill.com sendInvoice SUCCESS!')
      console.log('Send result:', JSON.stringify(sendResult, null, 2))
      console.log('=========== BILL.COM SEND INVOICE END ===========')
    } catch (sendError: any) {
      console.error('❌ FAILED to send invoice email:', sendError)
      console.error('Invoice was created but email was NOT sent to customer!')
      // Don't throw - invoice was created successfully, just email failed
    }

    return {
      success: true,
      billcomInvoiceId: invoice.id,
      invoiceUrl: invoiceUrl
    }
  } catch (error: any) {
    console.error('[MULTI-STAGE INVOICE] Error creating invoice:', error)
    return {
      success: false,
      error: error.message || 'Failed to create invoice in Bill.com'
    }
  }
}

// Helper function to get or create Bill.com customer
export async function getOrCreateBillcomCustomer(customer: {
  name: string
  email?: string
  phone?: string
  address?: string
  billcom_customer_id?: string
}): Promise<{
  success: boolean
  customerId?: string
  customerData?: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  error?: string
}> {
  try {
    const billcom = getBillcomClient()

    console.log('[MULTI-STAGE INVOICE] Fetching customer from Bill.com:', customer.name)

    // ALWAYS fetch from Bill.com to get latest data (especially address!)
    const billcomCustomer = await billcom.createOrFindCustomer({
      name: customer.name,
      email: customer.email || `${customer.name.toLowerCase().replace(/\s+/g, '')}@placeholder.com`,
      phone: customer.phone,
      address: customer.address
    })

    console.log('[MULTI-STAGE INVOICE] Bill.com customer ID:', billcomCustomer.id)
    console.log('[MULTI-STAGE INVOICE] Bill.com customer address:', billcomCustomer.address)

    return {
      success: true,
      customerId: billcomCustomer.id,
      customerData: billcomCustomer
    }
  } catch (error: any) {
    console.error('[MULTI-STAGE INVOICE] Error with customer:', error)
    return {
      success: false,
      error: error.message || 'Failed to get or create Bill.com customer'
    }
  }
}
