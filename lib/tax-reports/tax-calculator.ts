/**
 * Tax Calculation Service
 *
 * Processes invoices from billcom_invoices_sync table and calculates county taxes
 * - Processes in batches of 20 invoices
 * - Smart re-processing: Only re-geocode if payment status changed unpaid → paid
 * - Skips already-processed paid invoices on subsequent runs
 * - Uses US Census Geocoding API for address → county mapping
 * - Looks up county tax rates from nc_county_tax_rates table
 *
 * Created: November 18, 2025
 */

import { createAdminClient } from '../supabase/admin'
import { geocodeAddress, type GeocodingResult } from './geocoding'

const BATCH_SIZE = 20 // Process 20 invoices per batch
const NC_STATE_TAX_RATE = 0.0475 // 4.75%

export interface CalculationProgress {
  runId: string
  status: 'in_progress' | 'completed' | 'failed'
  totalInvoices: number
  processedInvoices: number
  countedInvoices: number
  skippedInvoices: number
  failedInvoices: number
  currentBatch: number
  totalBatches: number
  currentStatus: string
  errorMessage?: string
}

export interface CalculationResult {
  success: boolean
  runId: string
  totalInvoices: number
  processedInvoices: number
  countedInvoices: number
  skippedInvoices: number
  failedInvoices: number
  errors: string[]
  durationMs: number
}

export interface FilterOptions {
  includeMode: 'all' | 'exclude' | 'include_only'
  customerIds?: string[] // Bill.com customer IDs to include/exclude
}

/**
 * Calculate county taxes for all invoices in billcom_invoices_sync table
 * Smart re-processing: Only processes new/changed invoices
 *
 * @param userId Optional user ID who initiated calculation
 * @param filters Optional customer inclusion/exclusion filters
 * @returns CalculationResult with statistics
 */
export async function calculateCountyTaxes(
  userId?: string,
  filters?: FilterOptions
): Promise<CalculationResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  let runId: string | null = null
  let totalInvoices = 0
  let processedInvoices = 0
  let countedInvoices = 0
  let skippedInvoices = 0
  let failedInvoices = 0
  const errors: string[] = []

  try {
    // Create run record
    const { data: run, error: runError } = await supabase
      .from('tax_calculation_runs')
      .insert({
        run_type: 'calculate',
        status: 'in_progress',
        current_status: 'Initializing tax calculation...',
        created_by: userId || null
      })
      .select('id')
      .single()

    if (runError || !run) {
      throw new Error(`Failed to create run record: ${runError?.message}`)
    }

    runId = run.id
    console.log('[TAX CALC] Starting calculation, run ID:', runId)

    // Get customer exclusions/inclusions
    const excludedCustomerIds = await getExcludedCustomers(supabase)
    const includedCustomerIds = await getIncludedCustomers(supabase)

    console.log(`[TAX CALC] Excluded customers: ${excludedCustomerIds.length}`)
    console.log(`[TAX CALC] Included customers: ${includedCustomerIds.length}`)

    // Fetch invoices to process
    await updateRunStatus(supabase, runId!, {
      current_status: 'Loading invoices from database...'
    })

    const invoicesToProcess = await getInvoicesToProcess(
      supabase,
      excludedCustomerIds,
      includedCustomerIds,
      filters
    )

    totalInvoices = invoicesToProcess.length
    const totalBatches = Math.ceil(totalInvoices / BATCH_SIZE)

    console.log(`[TAX CALC] Found ${totalInvoices} invoices to process in ${totalBatches} batches`)

    await updateRunStatus(supabase, runId!, {
      total_items: totalInvoices,
      total_batches: totalBatches,
      current_status: `Processing ${totalInvoices} invoices in ${totalBatches} batches...`
    })

    // Process in batches of 20
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * BATCH_SIZE
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalInvoices)
      const batch = invoicesToProcess.slice(batchStart, batchEnd)

      console.log(`[TAX CALC] Processing batch ${batchNum + 1}/${totalBatches} (invoices ${batchStart + 1}-${batchEnd})`)

      await updateRunStatus(supabase, runId!, {
        current_batch: batchNum + 1,
        current_status: `Processing batch ${batchNum + 1}/${totalBatches}: invoices ${batchStart + 1}-${batchEnd}...`
      })

      // Process each invoice in batch
      for (let i = 0; i < batch.length; i++) {
        const invoice = batch[i]
        const invoiceNum = batchStart + i + 1

        try {
          console.log(`[TAX CALC] [${invoiceNum}/${totalInvoices}] Processing invoice ${invoice.invoice_number}`)

          await updateRunStatus(supabase, runId!, {
            items_processed: invoiceNum,
            current_status: `[${invoiceNum}/${totalInvoices}] Processing invoice ${invoice.invoice_number}...`
          })

          const result = await processInvoice(supabase, invoice, runId!)

          if (result.status === 'counted') {
            countedInvoices++
          } else if (result.status === 'skipped' || result.status === 'excluded') {
            skippedInvoices++
          } else if (result.status === 'failed') {
            failedInvoices++
            errors.push(`Invoice ${invoice.invoice_number}: ${result.error}`)
          }

          processedInvoices++

        } catch (error: any) {
          console.error(`[TAX CALC] Exception processing invoice ${invoice.invoice_number}:`, error)
          failedInvoices++
          errors.push(`Invoice ${invoice.invoice_number}: ${error.message}`)
        }
      }

      // Update progress after batch
      await updateRunStatus(supabase, runId!, {
        items_processed: processedInvoices,
        items_succeeded: countedInvoices,
        items_skipped: skippedInvoices,
        items_failed: failedInvoices
      })
    }

    // Complete the run
    const durationMs = Date.now() - startTime
    await updateRunStatus(supabase, runId!, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      items_processed: processedInvoices,
      items_succeeded: countedInvoices,
      items_skipped: skippedInvoices,
      items_failed: failedInvoices,
      current_status: `✓ Complete: ${countedInvoices} invoices counted, ${skippedInvoices} skipped, ${failedInvoices} failed`
    })

    console.log(`[TAX CALC] ✓ Complete in ${durationMs}ms:`, {
      processed: processedInvoices,
      counted: countedInvoices,
      skipped: skippedInvoices,
      failed: failedInvoices
    })

    return {
      success: true,
      runId: runId!,
      totalInvoices,
      processedInvoices,
      countedInvoices,
      skippedInvoices,
      failedInvoices,
      errors,
      durationMs
    }

  } catch (error: any) {
    console.error('[TAX CALC] Fatal error:', error)

    if (runId) {
      await updateRunStatus(supabase, runId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        error_stack: error.stack,
        current_status: `✗ Failed: ${error.message}`
      })
    }

    return {
      success: false,
      runId: runId || 'unknown',
      totalInvoices,
      processedInvoices,
      countedInvoices,
      skippedInvoices,
      failedInvoices,
      errors: [...errors, error.message],
      durationMs: Date.now() - startTime
    }
  }
}

/**
 * Get list of invoices that need processing
 * Excludes already-processed paid invoices (smart re-processing)
 */
async function getInvoicesToProcess(
  supabase: any,
  excludedCustomerIds: string[],
  includedCustomerIds: string[],
  filters?: FilterOptions
): Promise<any[]> {
  // Base query: all invoices from sync table
  let query = supabase
    .from('billcom_invoices_sync')
    .select('*')
    .order('invoice_date', { ascending: false })

  // Apply customer filters
  if (filters?.includeMode === 'exclude' && excludedCustomerIds.length > 0) {
    query = query.not('billcom_customer_id', 'in', `(${excludedCustomerIds.join(',')})`)
  } else if (filters?.includeMode === 'include_only' && includedCustomerIds.length > 0) {
    query = query.in('billcom_customer_id', includedCustomerIds)
  }

  const { data: allInvoices, error } = await query

  if (error) {
    throw new Error(`Failed to fetch invoices: ${error.message}`)
  }

  // Filter out invoices that are already processed and haven't changed
  const invoicesToProcess: any[] = []

  for (const invoice of allInvoices || []) {
    // Check if already processed
    const { data: existingResult } = await supabase
      .from('tax_calculation_results')
      .select('*')
      .eq('billcom_invoice_id', invoice.billcom_invoice_id)
      .single()

    if (!existingResult) {
      // New invoice, needs processing
      invoicesToProcess.push(invoice)
      continue
    }

    // Check if payment status changed from unpaid → paid
    const wasUnpaid = existingResult.skip_reason === 'unpaid'
    const nowPaid = invoice.payment_status === 'paid'

    if (wasUnpaid && nowPaid) {
      // Payment status changed, re-process to geocode and count
      console.log(`[TAX CALC] Invoice ${invoice.invoice_number}: Payment status changed, will re-process`)
      invoicesToProcess.push(invoice)
      continue
    }

    // Already processed and no change, skip
    console.log(`[TAX CALC] Invoice ${invoice.invoice_number}: Already processed, skipping`)
  }

  return invoicesToProcess
}

/**
 * Process a single invoice
 */
async function processInvoice(
  supabase: any,
  invoice: any,
  runId: string
): Promise<{ status: string; error?: string }> {
  // Check if customer is excluded
  const { data: exclusion } = await supabase
    .from('tax_customer_exclusions')
    .select('exclusion_reason')
    .eq('billcom_customer_id', invoice.billcom_customer_id)
    .single()

  if (exclusion) {
    // Customer excluded
    await upsertResult(supabase, invoice, {
      status: 'excluded',
      skip_reason: 'customer_excluded',
      error_message: exclusion.exclusion_reason
    })
    return { status: 'excluded' }
  }

  // Check if paid
  if (invoice.payment_status !== 'paid') {
    // Unpaid, skip
    await upsertResult(supabase, invoice, {
      status: 'skipped',
      skip_reason: 'unpaid'
    })
    return { status: 'skipped' }
  }

  // Invoice is paid, geocode address
  if (!invoice.customer_address) {
    await upsertResult(supabase, invoice, {
      status: 'failed',
      skip_reason: 'no_address',
      error_message: 'Customer address is missing'
    })
    return { status: 'failed', error: 'No address' }
  }

  console.log(`[TAX CALC] Geocoding address: ${invoice.customer_address}`)
  const geocoding: GeocodingResult = await geocodeAddress(invoice.customer_address)

  if (!geocoding.success || !geocoding.county) {
    // Geocoding failed
    await upsertResult(supabase, invoice, {
      status: 'failed',
      skip_reason: 'geocoding_failed',
      error_message: geocoding.errorMessage || 'Failed to determine county',
      geocoded_county: null,
      geocoding_confidence: geocoding.confidence,
      geocoding_raw_response: geocoding.rawResponse
    })
    return { status: 'failed', error: 'Geocoding failed' }
  }

  console.log(`[TAX CALC] ✓ Geocoded to: ${geocoding.county} County`)

  // Look up county tax rate
  const countyTaxRate = await getCountyTaxRate(supabase, geocoding.county)

  if (countyTaxRate === null) {
    await upsertResult(supabase, invoice, {
      status: 'failed',
      skip_reason: 'county_rate_not_found',
      error_message: `Tax rate not found for ${geocoding.county} County`,
      geocoded_county: geocoding.county,
      geocoding_confidence: geocoding.confidence,
      geocoding_raw_response: geocoding.rawResponse
    })
    return { status: 'failed', error: 'County rate not found' }
  }

  // Calculate taxes
  const subtotal = invoice.subtotal || 0
  const stateTaxAmount = subtotal * NC_STATE_TAX_RATE
  const countyTaxAmount = subtotal * countyTaxRate
  const totalTax = stateTaxAmount + countyTaxAmount

  console.log(`[TAX CALC] Calculated taxes:`, {
    subtotal,
    stateTax: stateTaxAmount.toFixed(2),
    countyTax: countyTaxAmount.toFixed(2),
    total: totalTax.toFixed(2)
  })

  // Save result
  await upsertResult(supabase, invoice, {
    status: 'counted',
    geocoded_county: geocoding.county,
    geocoding_confidence: geocoding.confidence,
    geocoding_raw_response: geocoding.rawResponse,
    state_tax_rate: NC_STATE_TAX_RATE,
    state_tax_amount: stateTaxAmount,
    county_tax_rate: countyTaxRate,
    county_tax_amount: countyTaxAmount,
    total_tax: totalTax
  })

  return { status: 'counted' }
}

/**
 * Upsert result to tax_calculation_results table
 */
async function upsertResult(supabase: any, invoice: any, data: any) {
  await supabase
    .from('tax_calculation_results')
    .upsert(
      {
        billcom_invoice_id: invoice.billcom_invoice_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        paid_date: invoice.paid_date,
        customer_name: invoice.customer_name,
        customer_address: invoice.customer_address,
        subtotal: invoice.subtotal || 0,
        ...data,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'billcom_invoice_id'
      }
    )
}

/**
 * Get county tax rate from nc_county_tax_rates table
 */
async function getCountyTaxRate(supabase: any, countyName: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('nc_county_tax_rates')
    .select('county_tax_rate')
    .ilike('county_name', `%${countyName}%`)
    .single()

  if (error || !data) {
    console.error(`[TAX CALC] County rate not found for: ${countyName}`)
    return null
  }

  return data.county_tax_rate
}

/**
 * Get excluded customer IDs
 */
async function getExcludedCustomers(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('tax_customer_exclusions')
    .select('billcom_customer_id')

  return (data || []).map((row: any) => row.billcom_customer_id).filter(Boolean)
}

/**
 * Get included customer IDs (include-only mode)
 */
async function getIncludedCustomers(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('tax_customer_inclusions')
    .select('billcom_customer_id')

  return (data || []).map((row: any) => row.billcom_customer_id).filter(Boolean)
}

/**
 * Update run status
 */
async function updateRunStatus(supabase: any, runId: string, updates: any) {
  await supabase
    .from('tax_calculation_runs')
    .update(updates)
    .eq('id', runId)
}

/**
 * Get calculation status for progress bar
 */
export async function getCalculationStatus(runId: string): Promise<CalculationProgress | null> {
  const supabase = createAdminClient()

  const { data: run, error } = await supabase
    .from('tax_calculation_runs')
    .select('*')
    .eq('id', runId)
    .eq('run_type', 'calculate')
    .single()

  if (error || !run) {
    return null
  }

  return {
    runId: run.id,
    status: run.status,
    totalInvoices: run.total_items || 0,
    processedInvoices: run.items_processed || 0,
    countedInvoices: run.items_succeeded || 0,
    skippedInvoices: run.items_skipped || 0,
    failedInvoices: run.items_failed || 0,
    currentBatch: run.current_batch || 0,
    totalBatches: run.total_batches || 0,
    currentStatus: run.current_status || 'Processing...',
    errorMessage: run.error_message
  }
}
