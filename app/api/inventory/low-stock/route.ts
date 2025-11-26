/**
 * API Route: /api/inventory/low-stock
 * GET - Get items with stock below threshold (low stock alerts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLowStockItems } from '@/lib/inventory/inventory-service'

/**
 * GET /api/inventory/low-stock
 * Returns items where quantity_on_hand <= low_stock_threshold
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getLowStockItems()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[API /inventory/low-stock] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock items' },
      { status: 500 }
    )
  }
}
