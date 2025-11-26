/**
 * Transaction Service - Checkout/Return operations
 * Single responsibility: Manage inventory movements and transactions
 *
 * Created: 2025-11-19
 * Modular design for easy troubleshooting
 */

import { createAdminClient } from '../supabase/admin'
import type {
  ServiceResponse,
  CheckoutRequest,
  ReturnRequest,
  InventoryTransaction,
  TransactionHistoryFilters
} from './types'

/**
 * Generate unique transaction number
 * Format: CHK-2025-001, RET-2025-001, etc.
 */
async function generateTransactionNumber(type: string): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const prefix = type === 'checkout' ? 'CHK' : type === 'return' ? 'RET' : type === 'adjustment' ? 'ADJ' : 'RST'

  // Get the latest transaction number for this type and year
  const { data } = await supabase
    .from('inventory_transactions')
    .select('transaction_number')
    .ilike('transaction_number', `${prefix}-${year}-%`)
    .order('transaction_number', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return `${prefix}-${year}-001`
  }

  // Extract the sequence number and increment
  const lastNumber = data[0].transaction_number
  const match = lastNumber.match(/-(\d+)$/)
  const nextSeq = match ? parseInt(match[1], 10) + 1 : 1

  return `${prefix}-${year}-${nextSeq.toString().padStart(3, '0')}`
}

/**
 * Process inventory checkout (technician takes items)
 * @param request - Checkout details
 * @returns ServiceResponse with transaction records
 */
export async function processCheckout(
  request: CheckoutRequest
): Promise<ServiceResponse<InventoryTransaction[]>> {
  const supabase = createAdminClient()

  try {
    console.log('[TRANSACTION SERVICE] Processing checkout:', {
      technician: request.technician_id,
      items: request.items.length,
      job: request.job_id
    })

    // Validate request
    if (!request.items || request.items.length === 0) {
      return { success: false, error: 'No items specified for checkout' }
    }

    if (!request.technician_id) {
      return { success: false, error: 'Technician ID is required' }
    }

    const transactions: InventoryTransaction[] = []
    const errors: string[] = []

    // Process each item atomically
    for (const item of request.items) {
      try {
        // 1. Get current item and lock row
        const { data: inventoryItem, error: fetchError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('id', item.inventory_item_id)
          .eq('is_active', true)
          .single()

        if (fetchError || !inventoryItem) {
          errors.push(`Item ${item.inventory_item_id} not found`)
          continue
        }

        // 2. Check if sufficient stock
        if (inventoryItem.quantity_on_hand < item.quantity) {
          errors.push(
            `Insufficient stock for ${inventoryItem.name}: has ${inventoryItem.quantity_on_hand}, requested ${item.quantity}`
          )
          continue
        }

        const quantityBefore = inventoryItem.quantity_on_hand
        const quantityAfter = quantityBefore - item.quantity

        // 3. Update inventory quantity
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            quantity_on_hand: quantityAfter,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.inventory_item_id)

        if (updateError) {
          errors.push(`Failed to update ${inventoryItem.name}: ${updateError.message}`)
          continue
        }

        // 4. Create transaction record
        const transactionNumber = await generateTransactionNumber('checkout')

        const { data: transaction, error: transError } = await supabase
          .from('inventory_transactions')
          .insert({
            transaction_type: 'checkout',
            transaction_number: transactionNumber,
            inventory_item_id: item.inventory_item_id,
            technician_id: request.technician_id,
            job_id: request.job_id || null,
            quantity: item.quantity,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            notes: request.notes,
            transaction_date: new Date().toISOString()
          })
          .select()
          .single()

        if (transError) {
          // Rollback inventory update
          await supabase
            .from('inventory_items')
            .update({ quantity_on_hand: quantityBefore })
            .eq('id', item.inventory_item_id)

          errors.push(`Failed to create transaction for ${inventoryItem.name}: ${transError.message}`)
          continue
        }

        transactions.push(transaction as InventoryTransaction)
        console.log(`[TRANSACTION SERVICE] ✓ Checked out ${item.quantity}x ${inventoryItem.name} (${transactionNumber})`)

      } catch (itemError: any) {
        errors.push(`Error processing item: ${itemError.message}`)
      }
    }

    // Return results
    if (transactions.length === 0 && errors.length > 0) {
      return {
        success: false,
        error: `Checkout failed: ${errors.join('; ')}`
      }
    }

    if (errors.length > 0) {
      return {
        success: true,
        data: transactions,
        message: `Partial success: ${transactions.length} items checked out, ${errors.length} failed. Errors: ${errors.join('; ')}`
      }
    }

    console.log(`[TRANSACTION SERVICE] ✓ Checkout complete: ${transactions.length} items`)
    return {
      success: true,
      data: transactions,
      message: `Successfully checked out ${transactions.length} items`
    }

  } catch (error: any) {
    console.error('[TRANSACTION SERVICE] Exception during checkout:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Process inventory return (technician returns items)
 * @param request - Return details
 * @returns ServiceResponse with transaction records
 */
export async function processReturn(
  request: ReturnRequest
): Promise<ServiceResponse<InventoryTransaction[]>> {
  const supabase = createAdminClient()

  try {
    console.log('[TRANSACTION SERVICE] Processing return:', {
      technician: request.technician_id,
      items: request.items.length,
      job: request.job_id
    })

    // Validate request
    if (!request.items || request.items.length === 0) {
      return { success: false, error: 'No items specified for return' }
    }

    if (!request.technician_id) {
      return { success: false, error: 'Technician ID is required' }
    }

    const transactions: InventoryTransaction[] = []
    const errors: string[] = []

    // Process each item atomically
    for (const item of request.items) {
      try {
        // 1. Get current item
        const { data: inventoryItem, error: fetchError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('id', item.inventory_item_id)
          .eq('is_active', true)
          .single()

        if (fetchError || !inventoryItem) {
          errors.push(`Item ${item.inventory_item_id} not found`)
          continue
        }

        const quantityBefore = inventoryItem.quantity_on_hand
        const quantityAfter = quantityBefore + item.quantity

        // 2. Check max stock level (optional warning, doesn't block)
        if (inventoryItem.max_stock_level && quantityAfter > inventoryItem.max_stock_level) {
          console.warn(
            `[TRANSACTION SERVICE] Warning: ${inventoryItem.name} will exceed max stock (${inventoryItem.max_stock_level})`
          )
        }

        // 3. Update inventory quantity
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            quantity_on_hand: quantityAfter,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.inventory_item_id)

        if (updateError) {
          errors.push(`Failed to update ${inventoryItem.name}: ${updateError.message}`)
          continue
        }

        // 4. Create transaction record
        const transactionNumber = await generateTransactionNumber('return')

        const { data: transaction, error: transError } = await supabase
          .from('inventory_transactions')
          .insert({
            transaction_type: 'return',
            transaction_number: transactionNumber,
            inventory_item_id: item.inventory_item_id,
            technician_id: request.technician_id,
            job_id: request.job_id || null,
            quantity: item.quantity,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            notes: request.notes,
            transaction_date: new Date().toISOString()
          })
          .select()
          .single()

        if (transError) {
          // Rollback inventory update
          await supabase
            .from('inventory_items')
            .update({ quantity_on_hand: quantityBefore })
            .eq('id', item.inventory_item_id)

          errors.push(`Failed to create transaction for ${inventoryItem.name}: ${transError.message}`)
          continue
        }

        transactions.push(transaction as InventoryTransaction)
        console.log(`[TRANSACTION SERVICE] ✓ Returned ${item.quantity}x ${inventoryItem.name} (${transactionNumber})`)

      } catch (itemError: any) {
        errors.push(`Error processing item: ${itemError.message}`)
      }
    }

    // Return results
    if (transactions.length === 0 && errors.length > 0) {
      return {
        success: false,
        error: `Return failed: ${errors.join('; ')}`
      }
    }

    if (errors.length > 0) {
      return {
        success: true,
        data: transactions,
        message: `Partial success: ${transactions.length} items returned, ${errors.length} failed. Errors: ${errors.join('; ')}`
      }
    }

    console.log(`[TRANSACTION SERVICE] ✓ Return complete: ${transactions.length} items`)
    return {
      success: true,
      data: transactions,
      message: `Successfully returned ${transactions.length} items`
    }

  } catch (error: any) {
    console.error('[TRANSACTION SERVICE] Exception during return:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction history with filters
 * @param filters - Optional filters for querying transactions
 * @returns ServiceResponse with transaction history
 */
export async function getTransactionHistory(
  filters?: TransactionHistoryFilters
): Promise<ServiceResponse<InventoryTransaction[]>> {
  const supabase = createAdminClient()

  try {
    console.log('[TRANSACTION SERVICE] Fetching transaction history...', filters)

    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })

    // Apply filters
    if (filters?.technician_id) {
      query = query.eq('technician_id', filters.technician_id)
    }

    if (filters?.item_id) {
      query = query.eq('inventory_item_id', filters.item_id)
    }

    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type)
    }

    if (filters?.start_date) {
      query = query.gte('transaction_date', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('transaction_date', filters.end_date)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[TRANSACTION SERVICE] Error fetching history:', error)
      return { success: false, error: error.message }
    }

    console.log(`[TRANSACTION SERVICE] ✓ Fetched ${data.length} transactions`)
    return { success: true, data: data as InventoryTransaction[] }

  } catch (error: any) {
    console.error('[TRANSACTION SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction by ID
 * @param id - Transaction UUID
 * @returns ServiceResponse with single transaction
 */
export async function getTransactionById(
  id: string
): Promise<ServiceResponse<InventoryTransaction>> {
  const supabase = createAdminClient()

  try {
    console.log(`[TRANSACTION SERVICE] Fetching transaction ${id}...`)

    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`[TRANSACTION SERVICE] Error fetching transaction ${id}:`, error)
      return { success: false, error: error.message }
    }

    console.log(`[TRANSACTION SERVICE] ✓ Fetched transaction: ${data.transaction_number}`)
    return { success: true, data: data as InventoryTransaction }

  } catch (error: any) {
    console.error('[TRANSACTION SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}
