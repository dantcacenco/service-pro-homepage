import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createMultiStageInvoice, getOrCreateBillcomCustomer } from '@/lib/billcom/multi-stage-invoice'
import { calculateTax } from '@/lib/tax-calculator'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stage, items, subtotal } = body

    console.log('[CREATE INVOICE API] Job ID:', jobId)
    console.log('[CREATE INVOICE API] Stage:', stage)
    console.log('[CREATE INVOICE API] Items:', items?.length)

    // Validate input
    if (!stage || !['roughin', 'final'].includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 })
    }

    // Get job with customer and proposal data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address,
          billcom_customer_id
        ),
        proposals (
          id,
          billcom_customer_id
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('[CREATE INVOICE API] Job not found:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.customers) {
      return NextResponse.json({ error: 'Customer not found for job' }, { status: 400 })
    }

    console.log('[CREATE INVOICE API] Job loaded:', job.job_number)
    console.log('[CREATE INVOICE API] Customer:', job.customers.name)

    // Get or create Bill.com customer
    const customerResult = await getOrCreateBillcomCustomer({
      name: job.customers.name,
      email: job.customers.email,
      phone: job.customers.phone,
      address: job.customers.address,
      billcom_customer_id: job.proposals?.billcom_customer_id || job.customers.billcom_customer_id
    })

    if (!customerResult.success || !customerResult.customerId) {
      console.error('[CREATE INVOICE API] Failed to get/create customer:', customerResult.error)
      return NextResponse.json(
        { error: customerResult.error || 'Failed to create Bill.com customer' },
        { status: 500 }
      )
    }

    const billcomCustomerId = customerResult.customerId
    const billcomCustomerData = customerResult.customerData

    console.log('[CREATE INVOICE API] Bill.com customer ID:', billcomCustomerId)

    // Sync Bill.com customer data to our database (ID, address, phone)
    const customerUpdateData: any = {}

    if (!job.customers.billcom_customer_id) {
      customerUpdateData.billcom_customer_id = billcomCustomerId
    }

    // CRITICAL: Sync address from Bill.com to our database
    if (billcomCustomerData?.address && billcomCustomerData.address !== job.customers.address) {
      customerUpdateData.address = billcomCustomerData.address
      console.log(`[CREATE INVOICE API] 📍 Syncing address from Bill.com: ${billcomCustomerData.address}`)
    }

    if (billcomCustomerData?.phone && billcomCustomerData.phone !== job.customers.phone) {
      customerUpdateData.phone = billcomCustomerData.phone
    }

    if (Object.keys(customerUpdateData).length > 0) {
      await supabase
        .from('customers')
        .update(customerUpdateData)
        .eq('id', job.customers.id)

      // Update local job.customers object with synced data
      job.customers.address = billcomCustomerData?.address || job.customers.address
      job.customers.phone = billcomCustomerData?.phone || job.customers.phone
    }

    if (job.proposals && !job.proposals.billcom_customer_id) {
      await supabase
        .from('proposals')
        .update({ billcom_customer_id: billcomCustomerId })
        .eq('id', job.proposals.id)
    }

    // CRITICAL: Calculate county tax dynamically based on customer address
    console.log('[CREATE INVOICE API] 📍 Calculating county tax from customer address:', job.customers.address)

    // Parse customer address for tax calculator
    let street = '', city = '', stateCode = 'NC', zip = ''
    if (job.customers.address) {
      const addressParts = job.customers.address.split(',').map((s: string) => s.trim())
      if (addressParts.length >= 3) {
        street = addressParts[0]
        city = addressParts[1]
        // Parse state and zip from last parts
        const lastPart = addressParts[addressParts.length - 1]
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/)
        if (stateZipMatch) {
          stateCode = stateZipMatch[1]
          zip = stateZipMatch[2]
        }
        // State might be in second-to-last part
        if (addressParts.length >= 4 && !stateZipMatch) {
          stateCode = addressParts[addressParts.length - 2]
        }
      }
    }

    // Use tax calculator to get county-specific tax rates
    const taxCalc = await calculateTax(subtotal, {
      street,
      city,
      state: stateCode,
      zip
    })

    const county = taxCalc.county || 'Unknown County'
    const stateTaxAmount = taxCalc.stateTaxAmount
    const countyTaxAmount = taxCalc.countyTaxAmount
    const totalTaxAmount = taxCalc.totalTaxAmount
    const total = subtotal + totalTaxAmount

    console.log('[CREATE INVOICE API] Tax Calculation:')
    console.log('  Customer Address:', job.customers.address)
    console.log('  Parsed Address:', { street, city, state: stateCode, zip })
    console.log('  County:', county)
    console.log('  State Tax:', stateTaxAmount)
    console.log('  County Tax:', countyTaxAmount)
    console.log('  Total Tax:', totalTaxAmount)
    console.log('  Total:', total)

    // Create invoice in Bill.com
    const invoiceResult = await createMultiStageInvoice({
      customerId: billcomCustomerId,
      customerName: job.customers.name,
      customerEmail: job.customers.email, // CRITICAL: Customer email for sendInvoice()
      jobNumber: job.job_number,
      stage: stage,
      items: items,
      subtotal: subtotal,
      stateTaxAmount: stateTaxAmount,
      countyTaxAmount: countyTaxAmount,
      totalTaxAmount: totalTaxAmount,
      total: total,
      county: county
    })

    if (!invoiceResult.success) {
      console.error('[CREATE INVOICE API] Invoice creation failed:', invoiceResult.error)
      return NextResponse.json(
        { error: invoiceResult.error || 'Failed to create invoice' },
        { status: 500 }
      )
    }

    console.log('[CREATE INVOICE API] Invoice created:', invoiceResult.billcomInvoiceId)

    // Create invoice record in database
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        job_id: jobId,
        customer_id: job.customer_id,
        proposal_id: job.proposal_id,
        subtotal: subtotal,
        tax_rate: (stateTaxAmount + countyTaxAmount) / subtotal,
        tax_amount: totalTaxAmount,
        state_tax_amount: stateTaxAmount,
        county_tax_amount: countyTaxAmount,
        county: county,
        total: total,
        job_stage: stage,
        billcom_invoice_id: invoiceResult.billcomInvoiceId,
        status: 'sent', // Invoice is now sent to customer via Bill.com
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('[CREATE INVOICE API] Error saving invoice to database:', invoiceError)
      return NextResponse.json(
        { error: 'Invoice created in Bill.com but failed to save to database' },
        { status: 500 }
      )
    }

    console.log('[CREATE INVOICE API] Invoice saved to database:', invoiceData.id)

    // Update job.invoice_links array
    const invoiceLink = {
      url: invoiceResult.invoiceUrl,
      stage: stage,
      quantity: stage === 'roughin' ? 0.3 : 0.2, // Base quantity for original items
      invoice_id: invoiceData.id,
      billcom_invoice_id: invoiceResult.billcomInvoiceId,
      created_at: new Date().toISOString(),
    }

    const currentInvoiceLinks = job.invoice_links || []
    const updatedInvoiceLinks = [...currentInvoiceLinks, invoiceLink]

    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({ invoice_links: updatedInvoiceLinks })
      .eq('id', jobId)

    if (jobUpdateError) {
      console.error('[CREATE INVOICE API] Error updating job invoice_links:', jobUpdateError)
      // Don't fail the request, invoice is already created
    }

    console.log('[CREATE INVOICE API] Success!')

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
      billcomInvoiceId: invoiceResult.billcomInvoiceId,
      invoiceUrl: invoiceResult.invoiceUrl
    })

  } catch (error) {
    console.error('[CREATE INVOICE API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
