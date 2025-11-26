// /app/api/test-billcom/check-invoice/route.ts
// Enhanced Bill.com invoice status check with complete information

import { NextRequest, NextResponse } from 'next/server';

const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME || '';
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD || '';
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { invoiceId, invoiceNumber } = body;

    // Handle the new 4-digit invoice number format
    const input = (invoiceId || invoiceNumber || '').trim();
    
    // Extract invoice number from various formats
    let searchInvoiceNumber = '';
    
    // Check if it's just digits (our new format like "2036", "2045")
    if (/^\d+$/.test(input)) {
      // Use the number as-is
      searchInvoiceNumber = input;
    } else if (input.includes('INV-')) {
      // Legacy format - extract everything after INV-
      const match = input.match(/INV-(\d+)/);
      searchInvoiceNumber = match ? match[1] : input;
    } else if (input.toLowerCase().includes('invoice')) {
      // Remove "Invoice" word and extract the number
      const cleaned = input.replace(/invoice/gi, '').trim();
      searchInvoiceNumber = cleaned;
    } else {
      // Use as-is if no pattern matches
      searchInvoiceNumber = input;
    }

    console.log('[CHECK] Parsing input:', input, '→ Searching for invoice number:', searchInvoiceNumber);

    if (!searchInvoiceNumber) {
      return NextResponse.json({
        success: false,
        message: 'Please provide an invoice number (e.g., 2036)'
      }, { status: 400 });
    }

    // Step 1: Login to Bill.com
    const loginResponse = await fetch(`${BILLCOM_API_URL}/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        userName: BILLCOM_USERNAME,
        password: BILLCOM_PASSWORD,
        orgId: BILLCOM_ORG_ID
      })
    });

    const loginData = await loginResponse.json();
    if (loginData.response_status !== 0) {
      throw new Error(`Login failed: ${loginData.response_message}`);
    }

    const sessionId = loginData.response_data.sessionId;
    console.log('[CHECK] Session established');

    // Step 2: Search for invoice by number
    const searchResponse = await fetch(`${BILLCOM_API_URL}/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId,
        data: JSON.stringify({
          filters: [
            {
              field: 'invoiceNumber',
              op: '=',
              value: searchInvoiceNumber
            }
          ],
          start: 0,
          max: 1
        })
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchData.response_status !== 0 || !searchData.response_data || searchData.response_data.length === 0) {
      throw new Error(`Invoice not found: ${searchInvoiceNumber}`);
    }

    const invoiceBasic = searchData.response_data[0];
    const foundInvoiceId = invoiceBasic.id;

    // Step 3: Get complete invoice details using Read
    const readResponse = await fetch(`${BILLCOM_API_URL}/Crud/Read/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: {
            entity: 'Invoice',
            id: foundInvoiceId
          }
        })
      })
    });

    const readData = await readResponse.json();
    let invoice = invoiceBasic; // Default to basic data
    
    if (readData.response_status === 0 && readData.response_data) {
      invoice = readData.response_data;
    }

    // Step 4: Get customer details
    let customerDetails = null;
    if (invoice.customerId && invoice.customerId !== '00000000000000000000') {
      try {
        const customerResponse = await fetch(`${BILLCOM_API_URL}/Crud/Read/Customer.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            devKey: BILLCOM_DEV_KEY,
            sessionId: sessionId,
            data: JSON.stringify({
              obj: {
                entity: 'Customer',
                id: invoice.customerId
              }
            })
          })
        });

        const customerData = await customerResponse.json();
        if (customerData.response_status === 0) {
          customerDetails = customerData.response_data;
        }
      } catch (err) {
        console.log('[CHECK] Could not fetch customer details');
      }
    }

    // Step 5: Check for payments
    let payments = [];
    try {
      const paymentsResponse = await fetch(`${BILLCOM_API_URL}/List/ReceivedPay.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          devKey: BILLCOM_DEV_KEY,
          sessionId: sessionId,
          data: JSON.stringify({
            filters: [
              {
                field: 'invoiceId',
                op: '=',
                value: foundInvoiceId
              }
            ],
            start: 0,
            max: 100
          })
        })
      });

      const paymentsData = await paymentsResponse.json();
      if (paymentsData.response_status === 0) {
        payments = paymentsData.response_data || [];
      }
    } catch (err) {
      console.log('[CHECK] Could not fetch payments');
    }

    // Parse payment status
    const paymentStatusMap: Record<string, string> = {
      '0': 'UNPAID',
      '1': 'UNPAID (Sent)',
      '2': 'PARTIALLY PAID',
      '3': 'PAID',
      '4': 'CLOSED'
    };

    const status = paymentStatusMap[invoice.paymentStatus] || 'UNKNOWN';
    const amountPaid = invoice.amount - invoice.amountDue;

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} retrieved successfully`,
      data: {
        // Basic Information
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        createdDate: invoice.createdTime ? new Date(invoice.createdTime).toLocaleDateString() : null,
        
        // Customer Information
        customerId: invoice.customerId,
        customerName: customerDetails?.name || invoice.customerName || 'Danny',
        customerEmail: customerDetails?.email || null,
        customerPhone: customerDetails?.phone || null,
        customerAddress: customerDetails ? {
          address1: customerDetails.billAddress1,
          address2: customerDetails.billAddress2,
          city: customerDetails.billAddressCity,
          state: customerDetails.billAddressState,
          zip: customerDetails.billAddressZip,
          country: customerDetails.billAddressCountry
        } : null,
        
        // Payment Information
        status: status,
        paymentStatus: invoice.paymentStatus,
        totalAmount: invoice.amount,
        amountDue: invoice.amountDue,
        amountPaid: amountPaid,
        
        // Additional Details
        terms: invoice.terms,
        description: invoice.description,
        poNumber: invoice.poNumber,
        
        // Line Items
        lineItems: invoice.invoiceLineItems || [],
        
        // Payment History
        payments: payments.map((p: any) => ({
          amount: p.amount,
          date: p.paymentDate,
          method: p.paymentMethod
        })),
        
        // Metadata
        isActive: invoice.isActive === '1',
        lastUpdated: invoice.updatedTime,
        
        // Full raw response for debugging
        _raw: {
          invoice: invoice,
          customer: customerDetails
        }
      }
    });

  } catch (error: any) {
    console.error('[CHECK] Invoice check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Invoice status check failed',
      error: error.message,
      details: error
    }, { status: 500 });
  }
}
