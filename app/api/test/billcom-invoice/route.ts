import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Bill.com v3 Invoice Creation
 *
 * This endpoint creates a $1 test invoice for Danny and returns the results.
 * Access: GET /api/test/billcom-invoice
 */

const BILLCOM_API_URL = 'https://gateway.prod.bill.com/connect/v3';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY || '01CACUSCGRAVXGOA4193';
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;

/**
 * Make API request to Bill.com v3
 */
async function billcomRequest(endpoint: string, data: any = null, sessionId?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'devKey': BILLCOM_DEV_KEY!
  };

  // Add sessionId header for authenticated requests
  if (sessionId) {
    headers['sessionId'] = sessionId;
  }

  const method = data ? 'POST' : 'GET';

  const response = await fetch(`${BILLCOM_API_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });

  const json = await response.json();

  // Check for errors in response
  if (response.ok && !json.error) {
    return json;
  } else {
    const errorMsg = json.error?.message || json.message || JSON.stringify(json);
    throw new Error(`Bill.com API Error: ${errorMsg}`);
  }
}

export async function GET(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('=== Bill.com v3 API Test Started ===');
    logs.push('');

    // Step 1: Login (devKey goes in body for login)
    logs.push('Step 1: Logging in...');
    const loginResponse = await fetch(`${BILLCOM_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: BILLCOM_USERNAME,
        password: BILLCOM_PASSWORD,
        organizationId: BILLCOM_ORG_ID,
        devKey: BILLCOM_DEV_KEY
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.sessionId) {
      const errorMsg = loginData.error?.message || loginData.message || JSON.stringify(loginData);
      throw new Error(`Login failed: ${errorMsg}`);
    }

    const sessionId = loginData.sessionId;
    logs.push(`✅ Login successful (Session ID: ${sessionId.substring(0, 20)}...)`);
    logs.push('');

    // Step 2: Find or create customer (Danny)
    logs.push('Step 2: Finding customer (Danny)...');
    let customerId: string | null = null;

    try {
      // For this test, we'll just create a new customer each time to ensure it works
      // In production, you'd want to search first using the proper v3 endpoint
      logs.push('Creating customer...');

      const newCustomer = await billcomRequest('/customers', {
        name: 'Danny Test',
        email: 'dantcacenco@gmail.com',
        address: {
          line1: '214 Alta Vista Dr',
          city: 'Candler',
          state: 'NC',
          zip: '28715',
          country: 'USA'
        },
        phone: '(555) 123-4567'
      }, sessionId);

      customerId = newCustomer.id;
      logs.push(`✅ Customer created: ${newCustomer.name} (${customerId})`);
    } catch (error) {
      logs.push(`❌ Customer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // If creation failed because customer exists, try to find existing customer by email
      try {
        logs.push('Searching for existing customer...');
        const customersResponse = await billcomRequest('/customers', null, sessionId);

        if (customersResponse.customers) {
          const existingCustomer = customersResponse.customers.find((c: any) => c.email === 'dantcacenco@gmail.com');
          if (existingCustomer) {
            customerId = existingCustomer.id;
            logs.push(`✅ Found existing customer: ${existingCustomer.name} (${customerId})`);
          }
        }
      } catch (searchError) {
        logs.push(`❌ Customer search also failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
      }
    }
    logs.push('');

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get or create customer',
        logs
      }, { status: 500 });
    }

    // Step 3: Create invoice with v3 API (Bill.com auto-generates invoice number)
    logs.push('Step 3: Creating $1 test invoice...');
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoice = await billcomRequest('/invoices', {
      customer: {
        id: customerId
      },
      invoiceDate: today,
      dueDate: dueDate,
      invoiceLineItems: [
        {
          quantity: 1,
          description: 'Test Invoice - Bill.com v3 Integration Test from Vercel',
          price: 1.00
        }
      ],
      processingOptions: {
        sendEmail: true  // Automatically send invoice via email
      }
    }, sessionId);

    logs.push(`✅ Invoice created and sent via email automatically!`);
    logs.push(`   Invoice ID: ${invoice.id}`);
    logs.push(`   Invoice Number: ${invoice.invoiceNumber}`);
    logs.push(`   Amount: $${invoice.totalAmount || invoice.amount || '1.00'}`);
    logs.push(`   Status: ${invoice.status || 'SENT'}`);
    logs.push(`   📧 Email sent to: dantcacenco@gmail.com`);
    logs.push('');

    logs.push('=== Test Complete ===');
    logs.push('');
    logs.push('📌 Next Steps:');
    logs.push('1. Check your email (dantcacenco@gmail.com) for the invoice');
    logs.push('2. Pay the $1 invoice via the payment link in the email');
    logs.push('3. Bill.com webhook will notify our system automatically');
    logs.push('4. Database will be updated with payment status');

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        amount: invoice.totalAmount || invoice.amount || 1.00,
        status: invoice.status || 'SENT'
      },
      customerId,
      logs
    });

  } catch (error) {
    logs.push('');
    logs.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs
    }, { status: 500 });
  }
}
