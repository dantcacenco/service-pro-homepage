/**
 * API Route: /api/inventory/checkout
 * POST - Process inventory checkout (technician takes items)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processCheckout } from '@/lib/inventory/transaction-service'

/**
 * POST /api/inventory/checkout
 * Body: CheckoutRequest
 * {
 *   items: [{ inventory_item_id: string, quantity: number }],
 *   technician_id: string,
 *   job_id?: string,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await processCheckout(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error: any) {
    console.error('[API /inventory/checkout] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}
