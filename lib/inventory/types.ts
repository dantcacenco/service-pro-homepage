/**
 * Inventory System - Type Definitions
 * Single responsibility: Define all TypeScript interfaces and types
 *
 * Created: 2025-11-19
 * Purpose: Centralized type definitions for easy maintenance
 */

export interface InventoryItem {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  barcode?: string | null
  category?: string | null

  // Stock Management
  quantity_on_hand: number
  low_stock_threshold: number
  reorder_point: number
  max_stock_level?: number | null

  // Location
  warehouse_location?: string | null
  warehouse_zone?: string | null

  // Pricing
  unit_cost?: number | null
  retail_price?: number | null

  // Vendor
  vendor_name?: string | null
  vendor_sku?: string | null
  vendor_contact?: string | null

  // Metadata
  emoji?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface InventoryTransaction {
  id: string
  transaction_type: 'checkout' | 'return' | 'adjustment' | 'restock'
  transaction_number: string
  inventory_item_id: string
  technician_id?: string | null
  job_id?: string | null
  quantity: number
  quantity_before: number
  quantity_after: number
  notes?: string | null
  scanned_barcode?: string | null
  transaction_date: string
  created_at: string
  created_by?: string | null
}

export interface CheckoutRequest {
  items: Array<{
    inventory_item_id: string
    quantity: number
  }>
  technician_id: string
  job_id?: string
  notes?: string
}

export interface ReturnRequest {
  items: Array<{
    inventory_item_id: string
    quantity: number
  }>
  technician_id: string
  job_id?: string
  notes?: string
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TransactionHistoryFilters {
  technician_id?: string
  item_id?: string
  transaction_type?: 'checkout' | 'return' | 'adjustment' | 'restock'
  start_date?: string
  end_date?: string
  limit?: number
}

export interface CreateItemRequest {
  name: string
  description?: string
  sku?: string
  barcode?: string
  category?: string
  quantity_on_hand?: number
  low_stock_threshold?: number
  reorder_point?: number
  max_stock_level?: number
  warehouse_location?: string
  warehouse_zone?: string
  unit_cost?: number
  retail_price?: number
  vendor_name?: string
  vendor_sku?: string
  vendor_contact?: string
  emoji?: string
  notes?: string
}

export interface UpdateItemRequest {
  name?: string
  description?: string
  sku?: string
  barcode?: string
  category?: string
  quantity_on_hand?: number
  low_stock_threshold?: number
  reorder_point?: number
  max_stock_level?: number
  warehouse_location?: string
  warehouse_zone?: string
  unit_cost?: number
  retail_price?: number
  vendor_name?: string
  vendor_sku?: string
  vendor_contact?: string
  emoji?: string
  is_active?: boolean
  notes?: string
}
