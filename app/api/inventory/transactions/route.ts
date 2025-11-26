/**
 * API Route: /api/inventory/transactions
 * GET - Get transaction history with optional filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTransactionHistory } from '@/lib/inventory/transaction-service'
import type { TransactionHistoryFilters } from '@/lib/inventory/types'

/**
 * GET /api/inventory/transactions
 * Query params:
 *   ?technician_id=uuid
 *   &item_id=uuid
 *   &transaction_type=checkout|return|adjustment|restock
 *   &start_date=2025-01-01
 *   &end_date=2025-12-31
 *   &limit=100
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build filters from query params
    const filters: TransactionHistoryFilters = {}

    const technicianId = searchParams.get('technician_id')
    if (technicianId) filters.technician_id = technicianId

    const itemId = searchParams.get('item_id')
    if (itemId) filters.item_id = itemId

    const transactionType = searchParams.get('transaction_type')
    if (transactionType && ['checkout', 'return', 'adjustment', 'restock'].includes(transactionType)) {
      filters.transaction_type = transactionType as 'checkout' | 'return' | 'adjustment' | 'restock'
    }

    const startDate = searchParams.get('start_date')
    if (startDate) filters.start_date = startDate

    const endDate = searchParams.get('end_date')
    if (endDate) filters.end_date = endDate

    const limit = searchParams.get('limit')
    if (limit) filters.limit = parseInt(limit, 10)

    const result = await getTransactionHistory(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[API /inventory/transactions] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    )
  }
}
