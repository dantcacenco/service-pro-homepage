/**
 * Inventory Service - Core CRUD operations
 * Single responsibility: Manage inventory items
 *
 * Created: 2025-11-19
 * Modular design for easy troubleshooting
 */

import { createAdminClient } from '../supabase/admin'
import type {
  InventoryItem,
  ServiceResponse,
  CreateItemRequest,
  UpdateItemRequest
} from './types'

/**
 * Get all active inventory items
 * @returns ServiceResponse with array of inventory items
 */
export async function getAllItems(): Promise<ServiceResponse<InventoryItem[]>> {
  const supabase = createAdminClient()

  try {
    console.log('[INVENTORY SERVICE] Fetching all active items...')

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[INVENTORY SERVICE] Error fetching items:', error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Fetched ${data.length} items`)
    return { success: true, data: data as InventoryItem[] }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get single inventory item by ID
 * @param id - UUID of inventory item
 * @returns ServiceResponse with single inventory item
 */
export async function getItemById(id: string): Promise<ServiceResponse<InventoryItem>> {
  const supabase = createAdminClient()

  try {
    console.log(`[INVENTORY SERVICE] Fetching item ${id}...`)

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`[INVENTORY SERVICE] Error fetching item ${id}:`, error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Fetched item: ${data.name}`)
    return { success: true, data: data as InventoryItem }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create new inventory item
 * @param item - Item details
 * @returns ServiceResponse with created item
 */
export async function createItem(item: CreateItemRequest): Promise<ServiceResponse<InventoryItem>> {
  const supabase = createAdminClient()

  try {
    console.log('[INVENTORY SERVICE] Creating new item:', item.name)

    // Validate required fields
    if (!item.name || item.name.trim() === '') {
      return { success: false, error: 'Item name is required' }
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        name: item.name,
        description: item.description,
        sku: item.sku,
        barcode: item.barcode,
        category: item.category,
        quantity_on_hand: item.quantity_on_hand ?? 0,
        low_stock_threshold: item.low_stock_threshold ?? 3,
        reorder_point: item.reorder_point ?? 5,
        max_stock_level: item.max_stock_level,
        warehouse_location: item.warehouse_location,
        warehouse_zone: item.warehouse_zone,
        unit_cost: item.unit_cost,
        retail_price: item.retail_price,
        vendor_name: item.vendor_name,
        vendor_sku: item.vendor_sku,
        vendor_contact: item.vendor_contact,
        emoji: item.emoji ?? '📦',
        notes: item.notes,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('[INVENTORY SERVICE] Error creating item:', error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Created item: ${data.name} (ID: ${data.id})`)
    return { success: true, data: data as InventoryItem, message: 'Item created successfully' }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update existing inventory item
 * @param id - UUID of item to update
 * @param updates - Fields to update
 * @returns ServiceResponse with updated item
 */
export async function updateItem(
  id: string,
  updates: UpdateItemRequest
): Promise<ServiceResponse<InventoryItem>> {
  const supabase = createAdminClient()

  try {
    console.log(`[INVENTORY SERVICE] Updating item ${id}...`)

    const { data, error} = await supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`[INVENTORY SERVICE] Error updating item ${id}:`, error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Updated item: ${data.name}`)
    return { success: true, data: data as InventoryItem, message: 'Item updated successfully' }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Soft delete inventory item (set is_active = false)
 * @param id - UUID of item to delete
 * @returns ServiceResponse
 */
export async function deleteItem(id: string): Promise<ServiceResponse<void>> {
  const supabase = createAdminClient()

  try {
    console.log(`[INVENTORY SERVICE] Deleting (deactivating) item ${id}...`)

    const { error } = await supabase
      .from('inventory_items')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error(`[INVENTORY SERVICE] Error deleting item ${id}:`, error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Deleted item ${id}`)
    return { success: true, message: 'Item deleted successfully' }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get items with stock below threshold (low stock alert)
 * @returns ServiceResponse with low stock items
 */
export async function getLowStockItems(): Promise<ServiceResponse<InventoryItem[]>> {
  const supabase = createAdminClient()

  try {
    console.log('[INVENTORY SERVICE] Fetching low stock items...')

    // Query items where quantity_on_hand <= low_stock_threshold
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('quantity_on_hand', { ascending: true })

    if (error) {
      console.error('[INVENTORY SERVICE] Error fetching low stock:', error)
      return { success: false, error: error.message }
    }

    // Filter in JS since Supabase doesn't support column comparison in WHERE clause easily
    const lowStockItems = (data as InventoryItem[]).filter(
      item => item.quantity_on_hand <= item.low_stock_threshold
    )

    console.log(`[INVENTORY SERVICE] ✓ Found ${lowStockItems.length} low stock items`)
    return { success: true, data: lowStockItems }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Search inventory items by name, SKU, barcode, or description
 * @param query - Search query string
 * @returns ServiceResponse with matching items
 */
export async function searchItems(query: string): Promise<ServiceResponse<InventoryItem[]>> {
  const supabase = createAdminClient()

  try {
    console.log(`[INVENTORY SERVICE] Searching for: "${query}"...`)

    if (!query || query.trim() === '') {
      return getAllItems() // Return all if no query
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name')

    if (error) {
      console.error('[INVENTORY SERVICE] Error searching:', error)
      return { success: false, error: error.message }
    }

    console.log(`[INVENTORY SERVICE] ✓ Found ${data.length} matching items`)
    return { success: true, data: data as InventoryItem[] }

  } catch (error: any) {
    console.error('[INVENTORY SERVICE] Exception:', error)
    return { success: false, error: error.message }
  }
}
