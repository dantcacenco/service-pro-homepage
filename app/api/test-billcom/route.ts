import { NextResponse } from 'next/server'
import { getBillcomClient } from '@/lib/billcom/client'

export async function GET() {
  console.log('[TEST BILLCOM] Testing Bill.com API connection...')

  try {
    // Authenticate
    console.log('[TEST BILLCOM] Authenticating...')
    const billcom = getBillcomClient()
    const sessionId = await billcom.authenticate()
    console.log('[TEST BILLCOM] ✅ Authenticated, session:', sessionId?.substring(0, 10))

    // Try to fetch invoices
    console.log('[TEST BILLCOM] Fetching invoices...')
    const response = await fetch('https://api.bill.com/api/v2/List/Invoice.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: process.env.BILLCOM_DEV_KEY!,
        sessionId: sessionId,
        data: JSON.stringify({
          start: 0,
          max: 10,  // Just get first 10
          sort: [{
            field: 'invoiceDate',
            asc: false
          }],
          filters: [
            {
              field: 'invoiceDate',
              op: '>=',
              value: '2025-09-16'
            }
          ]
        })
      }).toString(),
    })

    const data = await response.json()
    console.log('[TEST BILLCOM] Response:', JSON.stringify(data, null, 2))

    if (data.response_status !== 0) {
      return NextResponse.json({
        success: false,
        error: data.response_message || 'Unknown error',
        raw: data
      })
    }

    const invoices = data.response_data || []

    return NextResponse.json({
      success: true,
      invoice_count: invoices.length,
      invoices: invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerId: inv.customerId,
        amount: inv.amount,
        paymentStatus: inv.paymentStatus
      }))
    })
  } catch (error: any) {
    console.error('[TEST BILLCOM] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
