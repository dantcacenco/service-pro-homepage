import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBillcomClient } from '@/lib/billcom/client'

/**
 * POST /api/customers/sync-to-billcom
 * 
 * Syncs a Supabase customer to Bill.com
 * 
 * Body: { customerId: string }
 * Returns: { success: boolean, billcomId?: string, error?: string }
 */
export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get customer from Supabase
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (fetchError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if already synced
    if (customer.billcom_id) {
      return NextResponse.json({
        success: true,
        billcomId: customer.billcom_id,
        message: 'Already synced'
      })
    }

    // Get Bill.com client
    const billcomClient = getBillcomClient()

    // Create customer in Bill.com
    const billcomCustomerData = {
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      addressLine1: customer.address || undefined,
      // Bill.com requires these fields
      isActive: '1',
      accountType: '1' // 1 = Customer
    }

    const billcomCustomer = await billcomClient.createOrFindCustomer(billcomCustomerData)

    if (!billcomCustomer || !billcomCustomer.id) {
      throw new Error('Bill.com did not return a customer ID')
    }

    // Update Supabase with Bill.com ID
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        billcom_id: billcomCustomer.id,
        billcom_sync_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('Failed to update customer with Bill.com ID:', updateError)
      // Don't fail - Bill.com customer was created successfully
    }

    return NextResponse.json({
      success: true,
      billcomId: billcomCustomer.id,
      message: 'Customer synced to Bill.com successfully'
    })
  } catch (error: any) {
    console.error('Error syncing customer to Bill.com:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync customer to Bill.com'
      },
      { status: 500 }
    )
  }
}
