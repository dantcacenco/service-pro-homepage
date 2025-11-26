/**
 * API Route: /api/inventory/items/[id]
 * GET - Get single inventory item by ID
 * PUT - Update inventory item
 * DELETE - Delete (soft delete) inventory item
 */

import { NextRequest, NextResponse } from 'next/server'
import { getItemById, updateItem, deleteItem } from '@/lib/inventory/inventory-service'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/inventory/items/[id]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  try {
    const result = await getItemById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error(`[API /inventory/items/${id}] GET error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/items/[id]
 * Body: UpdateItemRequest
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  try {
    const body = await request.json()

    const result = await updateItem(id, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error(`[API /inventory/items/${id}] PUT error:`, error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/items/[id]
 * Soft delete (sets is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  try {
    const result = await deleteItem(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error(`[API /inventory/items/${id}] DELETE error:`, error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
