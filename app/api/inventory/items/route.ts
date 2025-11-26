/**
 * API Route: /api/inventory/items
 * GET - List all active inventory items (with optional search)
 * POST - Create new inventory item
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllItems, createItem, searchItems } from '@/lib/inventory/inventory-service'

/**
 * GET /api/inventory/items
 * Query params: ?search=query (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')

    // Use search if query provided, otherwise get all
    const result = searchQuery
      ? await searchItems(searchQuery)
      : await getAllItems()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[API /inventory/items] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/items
 * Body: CreateItemRequest
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await createItem(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error: any) {
    console.error('[API /inventory/items] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
