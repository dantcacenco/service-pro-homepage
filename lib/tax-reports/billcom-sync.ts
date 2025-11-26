/**
 * Bill.com Invoice Sync Service
 *
 * Syncs ALL invoices from Bill.com to local database for tax calculation
 * Handles pagination since Bill.com API returns max 999 invoices per request
 *
 * Created: November 18, 2025
 */

import { BillcomClient } from '../billcom/client'
import { createAdminClient } from '../supabase/admin'

const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: 'https://api.bill.com/api'
}

export interface SyncProgress {
  runId: string
  status: 'in_progress' | 'completed' | 'failed'
  currentPage: number
  totalInvoicesSynced: number
  currentStatus: string
  errorMessage?: string
}

export interface SyncResult {
  success: boolean
  runId: string
  totalInvoicesSynced: number
  newInvoices: number
  updatedInvoices: number
  errors: string[]
  durationMs: number
}

/**
 * Sync all invoices from Bill.com to billcom_invoices_sync table
 * Handles pagination (max 999 per page)
 *
 * @param userId Optional user ID who initiated the sync
 * @returns SyncResult with statistics
 */
export async function syncInvoicesFromBillcom(userId?: string): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()
  const billcom = new BillcomClient(BILLCOM_CONFIG)

  let runId: string | null = null
  let totalInvoicesSynced = 0
  let newInvoices = 0
  let updatedInvoices = 0
  const errors: string[] = []

  try {
    // Create run record
    const { data: run, error: runError } = await supabase
      .from('tax_calculation_runs')
      .insert({
        run_type: 'sync',
        status: 'in_progress',
        current_status: 'Connecting to Bill.com...',
        created_by: userId || null
      })
      .select('id')
      .single()

    if (runError || !run) {
      throw new Error(`Failed to create run record: ${runError?.message}`)
    }

    runId = run.id

    console.log('[BILLCOM SYNC] Starting sync, run ID:', runId)

    // Authenticate with Bill.com
    await billcom.authenticate()
    console.log('[BILLCOM SYNC] ✓ Authenticated with Bill.com')

    // Update status
    await updateRunStatus(supabase, runId!, {
      current_status: 'Fetching invoices from Bill.com...'
    })

    // Fetch all invoices (paginated)
    let currentPage = 0
    let hasMore = true
    const PAGE_SIZE = 999 // Max per Bill.com API

    while (hasMore) {
      currentPage++
      const offset = (currentPage - 1) * PAGE_SIZE

      console.log(`[BILLCOM SYNC] Fetching page ${currentPage} (offset ${offset})...`)

      await updateRunStatus(supabase, runId!, {
        current_status: `Fetching page ${currentPage} from Bill.com...`
      })

      // Call Bill.com List/Invoice.json endpoint
      const invoices = await fetchInvoicePage(billcom, offset, PAGE_SIZE)

      if (invoices.length === 0) {
        console.log('[BILLCOM SYNC] No more invoices, stopping pagination')
        hasMore = false
        break
      }

      console.log(`[BILLCOM SYNC] Fetched ${invoices.length} invoices from page ${currentPage}`)

      // Process invoices
      for (const invoice of invoices) {
        try {
          // Upsert invoice to billcom_invoices_sync table
          const { error: upsertError } = await supabase
            .from('billcom_invoices_sync')
            .upsert(
              {
                billcom_invoice_id: invoice.id,
                invoice_number: invoice.invoiceNumber,
                invoice_date: invoice.invoiceDate,
                due_date: invoice.dueDate,
                billcom_customer_id: invoice.customerId,
                customer_name: invoice.customerName || 'Unknown',
                customer_address: invoice.customerAddress || null,
                customer_email: invoice.customerEmail || null,
                subtotal: parseFloat(invoice.amount || '0'),
                amount_due: parseFloat(invoice.amountDue || '0'),
                payment_status: invoice.status || 'unpaid',
                paid_date: invoice.paidDate || null,
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                onConflict: 'billcom_invoice_id'
              }
            )

          if (upsertError) {
            console.error(`[BILLCOM SYNC] Error upserting invoice ${invoice.invoiceNumber}:`, upsertError)
            errors.push(`Invoice ${invoice.invoiceNumber}: ${upsertError.message}`)
          } else {
            totalInvoicesSynced++

            // Check if it was an update or insert (simplified - count as new if error-free)
            // In production, you could query first to determine new vs update
            newInvoices++
          }
        } catch (error: any) {
          console.error(`[BILLCOM SYNC] Exception processing invoice:`, error)
          errors.push(`Invoice processing error: ${error.message}`)
        }
      }

      // Update progress
      await updateRunStatus(supabase, runId!, {
        total_items: totalInvoicesSynced,
        items_processed: totalInvoicesSynced,
        current_status: `Synced ${totalInvoicesSynced} invoices so far...`
      })

      // Check if we got less than PAGE_SIZE (means last page)
      if (invoices.length < PAGE_SIZE) {
        console.log('[BILLCOM SYNC] Received fewer invoices than page size, this is the last page')
        hasMore = false
      }
    }

    // Complete the run
    const durationMs = Date.now() - startTime
    await updateRunStatus(supabase, runId!, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_items: totalInvoicesSynced,
      items_processed: totalInvoicesSynced,
      items_succeeded: totalInvoicesSynced,
      items_failed: errors.length,
      current_status: `✓ Sync complete: ${totalInvoicesSynced} invoices synced`
    })

    console.log(`[BILLCOM SYNC] ✓ Complete: ${totalInvoicesSynced} invoices synced in ${durationMs}ms`)

    return {
      success: true,
      runId: runId!,
      totalInvoicesSynced,
      newInvoices,
      updatedInvoices,
      errors,
      durationMs
    }

  } catch (error: any) {
    console.error('[BILLCOM SYNC] Fatal error:', error)

    if (runId) {
      await updateRunStatus(supabase, runId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        error_stack: error.stack,
        current_status: `✗ Sync failed: ${error.message}`
      })
    }

    return {
      success: false,
      runId: runId || 'unknown',
      totalInvoicesSynced,
      newInvoices,
      updatedInvoices,
      errors: [...errors, error.message],
      durationMs: Date.now() - startTime
    }
  }
}

/**
 * Fetch a single page of invoices from Bill.com
 *
 * @param billcom Authenticated Bill.com client
 * @param offset Start index
 * @param max Max results per page (999 max)
 * @returns Array of invoice objects
 */
async function fetchInvoicePage(
  billcom: any,
  offset: number,
  max: number = 999
): Promise<any[]> {
  try {
    const sessionId = await billcom.authenticate()

    const response = await fetch(`${BILLCOM_CONFIG.apiUrl}/v2/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_CONFIG.devKey,
        sessionId: sessionId,
        data: JSON.stringify({
          start: offset,
          max: max,
          sort: [{
            field: 'createdTime',
            asc: false
          }]
        })
      }).toString(),
    })

    if (!response.ok) {
      throw new Error(`Bill.com API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.response_status !== 0) {
      throw new Error(`Bill.com API error: ${data.response_data?.error_message || 'Unknown error'}`)
    }

    return data.response_data || []

  } catch (error: any) {
    console.error('[BILLCOM SYNC] Error fetching page:', error)
    throw error
  }
}

/**
 * Update run status in database
 */
async function updateRunStatus(
  supabase: any,
  runId: string,
  updates: Partial<{
    status: string
    current_status: string
    total_items: number
    items_processed: number
    items_succeeded: number
    items_failed: number
    completed_at: string
    error_message: string
    error_stack: string
  }>
) {
  await supabase
    .from('tax_calculation_runs')
    .update(updates)
    .eq('id', runId)
}

/**
 * Get sync status for progress bar
 *
 * @param runId Run ID to check
 * @returns Current sync progress
 */
export async function getSyncStatus(runId: string): Promise<SyncProgress | null> {
  const supabase = createAdminClient()

  const { data: run, error } = await supabase
    .from('tax_calculation_runs')
    .select('*')
    .eq('id', runId)
    .eq('run_type', 'sync')
    .single()

  if (error || !run) {
    console.error('[BILLCOM SYNC] Failed to get sync status:', error)
    return null
  }

  return {
    runId: run.id,
    status: run.status,
    currentPage: 0, // Not tracked currently
    totalInvoicesSynced: run.total_items || 0,
    currentStatus: run.current_status || 'Processing...',
    errorMessage: run.error_message
  }
}
