/**
 * API Route: /api/inventory/return
 * POST - Process inventory return (technician returns items)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processReturn } from '@/lib/inventory/transaction-service'

/**
 * POST /api/inventory/return
 * Body: ReturnRequest
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

    const result = await processReturn(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error: any) {
    console.error('[API /inventory/return] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process return' },
      { status: 500 }
    )
  }
}
