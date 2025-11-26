import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBillcomClient } from '@/lib/billcom/client'

// Tax extraction helper (copied from multi-stage-invoice.ts)
function extractTaxFromInvoice(invoice: any): {
  subtotal: number
  stateTaxAmount: number
  countyTaxAmount: number
} {
  let subtotal = 0
  let stateTaxAmount = 0
  let countyTaxAmount = 0

  if (invoice.invoiceLineItems && Array.isArray(invoice.invoiceLineItems)) {
    invoice.invoiceLineItems.forEach((item: any) => {
      const itemAmount = parseFloat(item.amount) || 0
      const description = (item.description || '').toLowerCase()

      if (description.includes('state tax')) {
        stateTaxAmount += itemAmount
      } else if (description.includes('county tax')) {
        countyTaxAmount += itemAmount
      } else {
        // Regular line item
        subtotal += itemAmount
      }
    })
  }

  return {
    subtotal,
    stateTaxAmount,
    countyTaxAmount
  }
}

// Geocode address to get county (copied from existing geocoding logic)
async function geocodeAddress(address: string | null | undefined): Promise<{
  county: string | null
  confidence: string
}> {
  if (!address) {
    return { county: null, confidence: 'failed' }
  }

  try {
    // Use Census Geocoding API
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
    )

    if (!response.ok) {
      return { county: null, confidence: 'failed' }
    }

    const data = await response.json()

    if (
      data.result?.addressMatches &&
      data.result.addressMatches.length > 0
    ) {
      const match = data.result.addressMatches[0]
      const countyName = match.geographies?.Counties?.[0]?.NAME

      if (countyName) {
        // Remove " County" suffix if present
        const cleanedCounty = countyName.replace(/ County$/i, '')
        return {
          county: cleanedCounty,
          confidence: match.matchedAddress ? 'high' : 'medium'
        }
      }
    }

    return { county: null, confidence: 'failed' }
  } catch (error) {
    console.error('Geocoding error:', error)
    return { county: null, confidence: 'failed' }
  }
}

// Check exclusion rules (for marking invoices as test)
function checkExclusionRules(
  invoice: any,
  customer: any,
  rules: any[]
): { isTest: boolean; exclude: boolean; reason: string | null } {
  for (const rule of rules) {
    if (rule.rule_type === 'customer_name' && rule.customer_name_pattern) {
      // Convert SQL LIKE pattern to regex (% = .*, _ = .)
      const pattern = rule.customer_name_pattern
        .replace(/%/g, '.*')
        .replace(/_/g, '.')
      const regex = new RegExp(`^${pattern}$`, 'i')

      if (regex.test(customer.name || '')) {
        return { isTest: true, exclude: true, reason: rule.reason }
      }
    }

    if (rule.rule_type === 'email' && rule.email_pattern && customer.email) {
      const pattern = rule.email_pattern
        .replace(/%/g, '.*')
        .replace(/_/g, '.')
      const regex = new RegExp(`^${pattern}$`, 'i')

      if (regex.test(customer.email)) {
        return { isTest: true, exclude: true, reason: rule.reason }
      }
    }

    if (rule.rule_type === 'date_range' && rule.start_date && rule.end_date) {
      const invoiceDate = new Date(invoice.invoiceDate)
      const startDate = new Date(rule.start_date)
      const endDate = new Date(rule.end_date)

      if (invoiceDate >= startDate && invoiceDate <= endDate) {
        return { isTest: true, exclude: true, reason: rule.reason }
      }
    }

    if (rule.rule_type === 'invoice_number' && rule.invoice_number_pattern) {
      const pattern = rule.invoice_number_pattern
        .replace(/%/g, '.*')
        .replace(/_/g, '.')
      const regex = new RegExp(`^${pattern}$`, 'i')

      if (regex.test(invoice.invoiceNumber || '')) {
        return { isTest: true, exclude: true, reason: rule.reason }
      }
    }
  }

  return { isTest: false, exclude: false, reason: null }
}

export async function GET(request: NextRequest) {
  // Get batch parameters from query string
  const { searchParams } = new URL(request.url)
  const batchSize = parseInt(searchParams.get('batch_size') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')

  console.log('='.repeat(80))
  console.log('[BILLCOM SYNC] 🚀 Starting batched invoice sync...')
  console.log('[BILLCOM SYNC] Timestamp:', new Date().toISOString())
  console.log('[BILLCOM SYNC] Batch size:', batchSize)
  console.log('[BILLCOM SYNC] Offset:', offset)
  console.log('='.repeat(80))

  const supabase = await createClient()

  try {
    // Create sync log entry
    console.log('[BILLCOM SYNC] Creating sync log entry...')
    const { data: syncLog, error: syncLogError } = await supabase
      .from('billcom_sync_log')
      .insert({
        status: 'running',
        triggered_by: 'manual', // Will be 'cron' when called from cron job
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncLogError) {
      console.error('[BILLCOM SYNC] ❌ Failed to create sync log:', syncLogError)
    } else {
      console.log('[BILLCOM SYNC] ✅ Sync log created with ID:', syncLog?.id)
    }

    const syncLogId = syncLog?.id

    // Get exclusion rules (for marking, not filtering)
    const { data: exclusionRules } = await supabase
      .from('tax_report_exclusion_rules')
      .select('*')
      .eq('is_active', true)

    const rules = exclusionRules || []
    console.log(`[BILLCOM SYNC] Loaded ${rules.length} exclusion rules`)

    // Authenticate with Bill.com
    console.log('[BILLCOM SYNC] Authenticating with Bill.com...')
    const billcom = getBillcomClient()
    const sessionId = await billcom.authenticate()
    console.log('[BILLCOM SYNC] ✅ Authenticated with Bill.com')
    console.log('[BILLCOM SYNC] Session ID:', sessionId ? `${sessionId.substring(0, 10)}...` : 'null')

    let totalSynced = 0
    let totalNew = 0
    let totalUpdated = 0
    let totalFailed = 0

    // Calculate which page to fetch based on offset
    const page = Math.floor(offset / 100)
    const pageOffset = offset % 100

    console.log(`\n[BILLCOM SYNC] 📄 Fetching page ${page + 1} (offset within page: ${pageOffset})...`)

    // Fetch invoices using List endpoint
    console.log('[BILLCOM SYNC] Calling Bill.com List/Invoice.json API...')
    const response = await fetch('https://api.bill.com/api/v2/List/Invoice.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: process.env.BILLCOM_DEV_KEY!,
        sessionId: sessionId,
        data: JSON.stringify({
          start: page * 100,
          max: 100,
          sort: [{
            field: 'invoiceDate',
            asc: false
          }],
          filters: [
            {
              field: 'invoiceDate',
              op: '>=',
              value: '2025-09-16'  // Cutoff date - only get recent invoices
            }
          ]
        })
      }).toString(),
    })

    const data = await response.json()
    console.log('[BILLCOM SYNC] Bill.com API response status:', data.response_status)

    if (data.response_status !== 0) {
      const errorMsg = `Bill.com API error: ${data.response_message || 'Unknown error'}`
      console.error('[BILLCOM SYNC] ❌', errorMsg)
      throw new Error(errorMsg)
    }

    const allInvoices = data.response_data || []
    console.log(`[BILLCOM SYNC] ✅ Fetched ${allInvoices.length} invoices from Bill.com`)
    console.log(`[BILLCOM SYNC] Page: ${page}, pageOffset: ${pageOffset}, batchSize: ${batchSize}`)

    // If no invoices at all, return early
    if (allInvoices.length === 0 && offset === 0) {
      console.log('[BILLCOM SYNC] ⚠️ No invoices found in Bill.com matching filter criteria')
      return NextResponse.json({
        success: true,
        batch_synced: 0,
        batch_new: 0,
        batch_updated: 0,
        batch_failed: 0,
        has_more: false,
        next_offset: 0,
        processed_count: 0,
        message: 'No invoices found matching filter criteria (invoiceDate >= 2025-09-16)'
      })
    }

    // Slice to get only the batch we want
    const invoices = allInvoices.slice(pageOffset, pageOffset + batchSize)
    const totalAvailable = allInvoices.length
    const hasMore = (pageOffset + batchSize) < allInvoices.length || allInvoices.length === 100

    console.log(`[BILLCOM SYNC] Sliced invoices: ${invoices.length} from ${allInvoices.length} total`)
    console.log(`[BILLCOM SYNC] Processing batch: ${invoices.length} invoices (${offset + 1} to ${offset + invoices.length} of estimated total)`)

    if (invoices.length > 0) {
      console.log('[BILLCOM SYNC] First invoice in batch:', {
        id: invoices[0].id,
        invoiceNumber: invoices[0].invoiceNumber,
        customerId: invoices[0].customerId,
        amount: invoices[0].amount
      })
    }

    // Process each invoice in the batch
    console.log(`[BILLCOM SYNC] Processing ${invoices.length} invoices...`)
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i]
      console.log(`\n[BILLCOM SYNC] 📝 Processing invoice ${i + 1}/${invoices.length}: ${invoice.invoiceNumber}`)

        try {
          // Fetch customer details
          console.log(`[BILLCOM SYNC]   Fetching customer ${invoice.customerId}...`)
          const customerResponse = await fetch('https://api.bill.com/api/v2/Crud/Read/Customer.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: new URLSearchParams({
              devKey: process.env.BILLCOM_DEV_KEY!,
              sessionId: sessionId,
              data: JSON.stringify({ id: invoice.customerId })
            }).toString(),
          })

          const customerData = await customerResponse.json()
          if (customerData.response_status !== 0) {
            console.warn(`[BILLCOM SYNC]   ⚠️ Failed to fetch customer ${invoice.customerId}:`, customerData.response_message)
            totalFailed++
            continue
          }

          const customer = customerData.response_data
          console.log(`[BILLCOM SYNC]   ✅ Customer: ${customer.name}`)

          // Build full address
          const addressParts = [
            customer.billAddress1,
            customer.billAddress2,
            customer.billAddressCity,
            customer.billAddressState,
            customer.billAddressZip
          ].filter(part => part && part.trim() !== '')
          const fullAddress = addressParts.join(', ')

          // Extract tax from line items
          const taxData = extractTaxFromInvoice(invoice)
          console.log(`[BILLCOM SYNC]   Tax data:`, taxData)

          // Geocode address → get county
          console.log(`[BILLCOM SYNC]   Geocoding address: ${fullAddress}`)
          const geocoding = await geocodeAddress(fullAddress)
          console.log(`[BILLCOM SYNC]   County: ${geocoding.county} (${geocoding.confidence})`)

          // Check exclusion rules (for MARKING, not FILTERING)
          const exclusionCheck = checkExclusionRules(invoice, customer, rules)
          if (exclusionCheck.isTest) {
            console.log(`[BILLCOM SYNC]   ⚠️ Marked as TEST: ${exclusionCheck.reason}`)
          }

          // Check if linked to proposal in our system
          const { data: proposal } = await supabase
            .from('proposals')
            .select('id')
            .or(`billcom_deposit_invoice_id.eq.${invoice.id},billcom_roughin_invoice_id.eq.${invoice.id},billcom_final_invoice_id.eq.${invoice.id}`)
            .single()

          // Check if invoice already exists
          const { data: existing } = await supabase
            .from('billcom_invoices_cache')
            .select('id')
            .eq('billcom_invoice_id', invoice.id)
            .single()

          // UPSERT to cache (creates or updates)
          const { error: upsertError } = await supabase
            .from('billcom_invoices_cache')
            .upsert({
              billcom_invoice_id: invoice.id,
              invoice_number: invoice.invoiceNumber,
              invoice_date: invoice.invoiceDate,
              billcom_customer_id: invoice.customerId,
              customer_name: customer.name,
              customer_address: fullAddress,
              customer_email: customer.email,
              amount: parseFloat(invoice.amount) || 0,
              amount_due: parseFloat(invoice.amountDue) || 0,
              subtotal: taxData.subtotal,
              state_tax_amount: taxData.stateTaxAmount,
              county_tax_amount: taxData.countyTaxAmount,
              county: geocoding.county,
              geocoding_confidence: geocoding.confidence,
              payment_status: invoice.paymentStatus,
              paid_date: invoice.paidDate,

              // Mark for filtering (but still import!)
              is_test_invoice: exclusionCheck.isTest,
              exclude_from_reports: exclusionCheck.exclude,
              exclusion_reason: exclusionCheck.reason,

              // System metadata
              created_in_system: !!proposal,
              linked_proposal_id: proposal?.id,
              source: proposal ? 'system' : 'billcom',

              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'billcom_invoice_id'  // Update if exists
            })

          if (upsertError) {
            console.error(`[BILLCOM SYNC]   ❌ Failed to upsert invoice ${invoice.invoiceNumber}:`, upsertError)
            totalFailed++
          } else {
            totalSynced++
            if (existing) {
              totalUpdated++
              console.log(`[BILLCOM SYNC]   ✅ Updated invoice ${invoice.invoiceNumber}`)
            } else {
              totalNew++
              console.log(`[BILLCOM SYNC]   ✅ Created new invoice ${invoice.invoiceNumber}`)
            }
          }
        } catch (error) {
          console.error(`[BILLCOM SYNC]   ❌ Error processing invoice ${invoice.id}:`, error)
          totalFailed++
        }
      }

    console.log('\n' + '='.repeat(80))
    console.log('[BILLCOM SYNC] ✅ BATCH COMPLETE!')
    console.log(`[BILLCOM SYNC] Processed: ${totalSynced} invoices`)
    console.log(`[BILLCOM SYNC] New: ${totalNew}, Updated: ${totalUpdated}, Failed: ${totalFailed}`)
    console.log(`[BILLCOM SYNC] Has more: ${hasMore}`)
    console.log(`[BILLCOM SYNC] Next offset: ${offset + invoices.length}`)
    console.log('='.repeat(80))

    // Update sync log
    if (syncLogId) {
      console.log('[BILLCOM SYNC] Updating sync log...')
      await supabase.rpc('complete_billcom_sync', {
        sync_id: syncLogId,
        sync_status: 'completed',
        error_msg: null
      })

      await supabase
        .from('billcom_sync_log')
        .update({
          total_invoices_synced: totalSynced,
          total_invoices_new: totalNew,
          total_invoices_updated: totalUpdated,
          total_invoices_failed: totalFailed
        })
        .eq('id', syncLogId)
    }

    return NextResponse.json({
      success: true,
      batch_synced: totalSynced,
      batch_new: totalNew,
      batch_updated: totalUpdated,
      batch_failed: totalFailed,
      has_more: hasMore,
      next_offset: offset + invoices.length,
      processed_count: offset + invoices.length
    })
  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('[BILLCOM SYNC] ❌ FATAL ERROR!')
    console.error('[BILLCOM SYNC] Error name:', error.name)
    console.error('[BILLCOM SYNC] Error message:', error.message)
    console.error('[BILLCOM SYNC] Error stack:', error.stack)
    console.error('='.repeat(80))

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
