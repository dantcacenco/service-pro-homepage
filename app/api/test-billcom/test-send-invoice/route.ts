import { NextResponse } from 'next/server'
import { getBillcomClient } from '@/lib/billcom/client'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint for Bill.com SendInvoice API
 * 
 * Usage:
 * GET /api/test-billcom/test-send-invoice?invoiceId=00e02XXX&customerEmail=test@example.com
 * 
 * This will test sending an invoice email using the corrected API structure
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const customerEmail = searchParams.get('customerEmail')

    if (!invoiceId) {
      return NextResponse.json({
        error: 'Missing invoiceId parameter'
      }, { status: 400 })
    }

    console.log('🧪 Testing Bill.com SendInvoice API...')
    console.log(`   Invoice ID: ${invoiceId}`)
    console.log(`   Customer Email: ${customerEmail || 'Using default from Bill.com'}`)

    // Get client and call the fixed sendInvoice method
    const client = getBillcomClient()
    const result = await client.sendInvoice(
      invoiceId,
      customerEmail || undefined
    )

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully via Bill.com API',
      details: result,
      testInfo: {
        invoiceId,
        customerEmail: customerEmail || 'default',
        timestamp: new Date().toISOString(),
        apiStructure: {
          parameter: 'data',
          dataObject: {
            invoiceId: invoiceId,
            headers: customerEmail ? { toEmailAddresses: [customerEmail] } : {},
            content: {}
          },
          note: 'Empty headers and content use Bill.com default email template'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
