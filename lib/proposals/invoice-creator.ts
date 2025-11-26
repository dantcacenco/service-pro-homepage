/**
 * Invoice Creator Module
 *
 * Handles Bill.com deposit invoice creation for approved proposals
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createMultiStageInvoice, getOrCreateBillcomCustomer } from '@/lib/billcom/multi-stage-invoice'
import { calculateTax } from '@/lib/tax-calculator'
import type { Proposal, ProposalCustomer, InvoiceCreationResult } from './types'

/**
 * Creates a 50% deposit invoice in Bill.com for an approved proposal
 *
 * @param proposal - The proposal with items and tiers
 * @param customer - The customer information
 * @param selectedTier - Selected tier for multi-tier proposals (null for single-tier)
 * @param proposalId - The proposal ID
 * @param jobNumber - Optional job number to use for invoice numbering (preferred)
 * @returns Invoice creation result with IDs and links
 */
export async function createDepositInvoice(
  proposal: Proposal,
  customer: ProposalCustomer,
  selectedTier: any | null,
  proposalId: string,
  jobNumber?: string
): Promise<InvoiceCreationResult> {
  // Check if customer has address (required for county tax)
  const hasAddress = customer?.address && customer.address.trim() !== ''

  console.log('=== INVOICE CREATION DEBUG ===')
  console.log('Customer:', {
    id: customer?.id,
    name: customer?.name,
    email: customer?.email,
    address: customer?.address,
    billcom_customer_id: customer?.billcom_customer_id
  })
  console.log('Proposal:', {
    id: proposal.id,
    proposal_number: proposal.proposal_number,
    billcom_customer_id: proposal.billcom_customer_id
  })
  console.log('Has address?', hasAddress)

  if (!hasAddress) {
    console.error('❌ INVOICE CREATION BLOCKED: Customer has no address')
    console.error('   County tax cannot be determined without an address')
    console.error('   Customer:', customer.name, '| Proposal:', proposal.proposal_number)
    console.error('   This should have been synced from Bill.com during proposal creation')
    return {
      success: false,
      error: 'Customer address required for invoice creation. Address should be synced from Bill.com.'
    }
  }

  // Check if invoice already exists
  if (proposal.billcom_deposit_invoice_id) {
    console.log('✅ Deposit invoice already exists:', proposal.billcom_deposit_invoice_id)
    return {
      success: true,
      invoiceId: proposal.billcom_deposit_invoice_id,
      invoiceLink: proposal.billcom_deposit_invoice_link,
      dbInvoiceId: undefined // We don't have the database ID in this case
    }
  }

  // Create service role client for database operations
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('Creating deposit invoice with new multi-stage system...')

    // Step 1: Get or create Bill.com customer
    const customerResult = await getOrCreateBillcomCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      billcom_customer_id: proposal.billcom_customer_id || customer.billcom_customer_id
    })

    if (!customerResult.success || !customerResult.customerId) {
      throw new Error(customerResult.error || 'Failed to get/create Bill.com customer')
    }

    const billcomCustomerId = customerResult.customerId
    const billcomCustomerData = customerResult.customerData

    // Sync Bill.com customer data to our database (ID, address, phone)
    const updateData: any = {}

    if (!customer.billcom_customer_id) {
      updateData.billcom_customer_id = billcomCustomerId
    }

    // CRITICAL: Sync address from Bill.com to our database
    if (billcomCustomerData?.address && billcomCustomerData.address !== customer.address) {
      updateData.address = billcomCustomerData.address
      console.log(`📍 Syncing address from Bill.com: ${billcomCustomerData.address}`)
    }

    if (billcomCustomerData?.phone && billcomCustomerData.phone !== customer.phone) {
      updateData.phone = billcomCustomerData.phone
    }

    if (Object.keys(updateData).length > 0) {
      await serviceSupabase
        .from('customers')
        .update(updateData)
        .eq('id', customer.id)

      // Update local customer object with synced data
      customer.address = billcomCustomerData?.address || customer.address
      customer.phone = billcomCustomerData?.phone || customer.phone
      customer.billcom_customer_id = billcomCustomerId
    }

    // Step 2: Prepare invoice items (50% deposit)
    const proposalItems = proposal.proposal_items || []
    let itemsToInclude: any[] = []

    if (proposal.tier_mode === 'multi' && selectedTier) {
      // Multi-tier: Only include items from selected tier
      itemsToInclude = proposalItems.filter((item: any) => {
        return item.tier_id === selectedTier.id &&
               (!item.is_addon || item.is_selected)
      })
      console.log(`Multi-tier: Including ${itemsToInclude.length} items from ${selectedTier.tier_name} tier`)
    } else {
      // Single-tier: Include all services + selected add-ons
      itemsToInclude = proposalItems.filter((item: any) => {
        return !item.is_addon || item.is_selected
      })
      console.log(`Single-tier: Including ${itemsToInclude.length} items`)
    }

    // Transform items for invoice (50% deposit quantity)
    const invoiceItems = itemsToInclude.map((item: any) => ({
      name: item.name,
      description: item.description || '',
      unit_price: item.unit_price,
      quantity: 0.5, // 50% deposit
      total_price: item.total_price * 0.5,
      added_at_stage: 'deposit' as const,
      proposal_item_id: item.id
    }))

    // Step 3: Calculate totals and tax breakdown using tax calculator
    const subtotal = proposal.subtotal || proposal.total
    const depositSubtotal = subtotal * 0.5

    // CRITICAL: Dynamically calculate county tax based on CURRENT customer address
    console.log('📍 Calculating county tax from customer address:', customer.address)

    // Parse customer address for tax calculator
    let street = '', city = '', state = 'NC', zip = ''
    if (customer.address) {
      const addressParts = customer.address.split(',').map(s => s.trim())
      if (addressParts.length >= 3) {
        street = addressParts[0]
        city = addressParts[1]
        // Parse state and zip from last parts
        const lastPart = addressParts[addressParts.length - 1]
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/)
        if (stateZipMatch) {
          state = stateZipMatch[1]
          zip = stateZipMatch[2]
        }
        // State might be in second-to-last part
        if (addressParts.length >= 4 && !stateZipMatch) {
          state = addressParts[addressParts.length - 2]
        }
      }
    }

    // Use tax calculator to get county-specific tax rates
    const taxCalc = await calculateTax(depositSubtotal, {
      street,
      city,
      state,
      zip
    })

    const county = taxCalc.county || 'Unknown County'
    const depositStateTaxAmount = taxCalc.stateTaxAmount
    const depositCountyTaxAmount = taxCalc.countyTaxAmount
    const depositTotalTaxAmount = taxCalc.totalTaxAmount
    const depositTotal = depositSubtotal + depositTotalTaxAmount
    const totalTaxRate = taxCalc.totalTax

    console.log('=== DEPOSIT INVOICE CALCULATION ===')
    console.log('Customer Address:', customer.address)
    console.log('Parsed Address:', { street, city, state, zip })
    console.log('County:', county)
    console.log('Subtotal:', depositSubtotal)
    console.log('State Tax (4.75%):', depositStateTaxAmount)
    console.log(`County Tax (${county}):`, depositCountyTaxAmount)
    console.log('Total Tax:', depositTotalTaxAmount)
    console.log('Total:', depositTotal)

    // Step 4: Use provided job number or generate fallback
    const invoiceJobNumber = jobNumber || `PROP-${proposal.proposal_number}`

    // Step 5: Create invoice in Bill.com using multi-stage system
    const invoiceResult = await createMultiStageInvoice({
      customerId: billcomCustomerId,
      customerName: customer.name,
      customerEmail: customer.email, // CRITICAL: Customer email for sendInvoice()
      jobNumber: invoiceJobNumber,
      stage: 'deposit' as const,
      items: invoiceItems,
      subtotal: depositSubtotal,
      stateTaxAmount: depositStateTaxAmount,
      countyTaxAmount: depositCountyTaxAmount,
      totalTaxAmount: depositTotalTaxAmount,
      total: depositTotal,
      county: county
    })

    if (!invoiceResult.success) {
      throw new Error(invoiceResult.error || 'Failed to create invoice in Bill.com')
    }

    const invoiceId = invoiceResult.billcomInvoiceId
    const invoiceLink = invoiceResult.invoiceUrl

    console.log('✅ Deposit invoice created:', invoiceId)
    console.log('✅ Invoice URL:', invoiceLink)

    // Step 6: Save invoice to database
    const { data: invoiceData, error: invoiceError } = await serviceSupabase
      .from('invoices')
      .insert({
        customer_id: customer.id,
        proposal_id: proposalId,
        subtotal: depositSubtotal,
        tax_rate: totalTaxRate,
        tax_amount: depositTotalTaxAmount,
        state_tax_amount: depositStateTaxAmount,
        county_tax_amount: depositCountyTaxAmount,
        county: county,
        total: depositTotal,
        job_stage: 'deposit',
        billcom_invoice_id: invoiceId,
        status: 'sent'
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Failed to save invoice to database:', invoiceError)
    } else {
      console.log('✅ Invoice saved to database:', invoiceData.id)
    }

    // Step 7: Update proposal with DEPOSIT invoice details
    await serviceSupabase
      .from('proposals')
      .update({
        billcom_deposit_invoice_id: invoiceId,
        billcom_deposit_invoice_link: invoiceLink,
        billcom_deposit_status: 'SENT',
        billcom_customer_id: billcomCustomerId
      })
      .eq('id', proposalId)

    return {
      success: true,
      invoiceId: invoiceId,
      invoiceLink: invoiceLink,
      dbInvoiceId: invoiceData?.id
    }

  } catch (invoiceError: any) {
    console.error('Invoice creation error:', invoiceError)

    // Update proposal with error status (no fallback link)
    await serviceSupabase
      .from('proposals')
      .update({
        billcom_deposit_status: 'FAILED',
        notes: `Deposit invoice creation failed: ${invoiceError.message}. Please retry or create manually in Bill.com.`
      })
      .eq('id', proposalId)

    return {
      success: false,
      error: invoiceError.message || 'Invoice creation failed'
    }
  }
}
