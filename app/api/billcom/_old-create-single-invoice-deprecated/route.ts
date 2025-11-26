// Create a single Bill.com invoice for the full proposal amount
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { proposalId, customerId, amount, description, dueDate } = await request.json()
    
    const config = {
      devKey: process.env.BILLCOM_DEV_KEY,
      username: process.env.BILLCOM_USERNAME,
      password: process.env.BILLCOM_PASSWORD,
      orgId: process.env.BILLCOM_ORG_ID,
      apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
    }

    // Step 1: Authenticate with Bill.com
    const loginUrl = `${config.apiUrl}/v2/Login.json`
    
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        userName: config.username!,
        password: config.password!,
        devKey: config.devKey!,
        orgId: config.orgId!,
      }).toString(),
    })

    const authData = await authResponse.json()
    
    if (authData.response_status !== 0) {
      console.error('Bill.com authentication failed:', authData)
      throw new Error(authData.response_message || 'Failed to authenticate with Bill.com')
    }

    const sessionId = authData.response_data.sessionId
    
    // Step 2: Create Invoice
    const invoiceNumber = `INV-${Date.now()}`
    const invoiceData = [
      {
        entity: 'Invoice',
        customerId: customerId,
        invoiceNumber: invoiceNumber,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(dueDate).toISOString().split('T')[0],
        description: description,
        invoiceLineItems: [
          {
            entity: 'InvoiceLineItem',            description: description,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          }
        ]
      }
    ]
    
    const createUrl = `${config.apiUrl}/v2/Crud/Create/Invoice.json`
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        sessionId,
        devKey: config.devKey!,
        data: JSON.stringify(invoiceData),
      }).toString(),
    })
    
    const createData = await createResponse.json()
    
    if (createData.response_status !== 0) {
      console.error('Bill.com invoice creation failed:', createData)
      throw new Error(createData.response_message || 'Failed to create invoice in Bill.com')
    }
    
    const invoiceId = createData.response_data[0].id
    
    // Generate payment link (format may vary based on Bill.com configuration)
    const paymentLink = `https://app.bill.com/PayInvoice?id=${invoiceId}`
    
    // Log the invoice creation
    const supabase = await createClient()
    await supabase
      .from('billcom_payment_log')
      .insert({
        proposal_id: proposalId,
        invoice_id: invoiceId,
        amount: amount,
        status: 'CREATED',
        billcom_response: createData.response_data[0],
        created_at: new Date().toISOString()
      })
    
    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceLink: paymentLink,
      invoiceNumber: invoiceNumber,
      invoiceData: createData.response_data[0]
    })
    
  } catch (error) {
    console.error('Error creating Bill.com invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}