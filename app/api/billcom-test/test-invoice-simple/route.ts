// Simple test to create invoice with hardcoded customer ID - WITH DETAILED ERROR LOGGING
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('📄 Simple Invoice Test...');
  
  const body = await request.json();
  // Use provided customer ID or use a test one
  const { customerId, amount = 100 } = body;

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  const allAttempts: any[] = [];

  try {
    // Step 1: Authenticate
    const loginUrl = `${config.apiUrl}/v2/Login.json`;
    
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
    });

    const authData = await authResponse.json();

    if (authData.response_status !== 0) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authData,
      }, { status: 401 });
    }

    const sessionId = authData.response_data.sessionId;
    const apiEndpoint = authData.response_data.apiEndPoint || 'https://api.bill.com/api/v2';

    // Step 2: If no customer ID provided, get first active customer
    let targetCustomerId = customerId;
    let customerInfo = null;
    
    if (!targetCustomerId) {
      const listResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            start: 0,
            max: 10
          })
        }).toString(),
      });
      
      const customers = await listResponse.json();
      if (customers.response_status === 0 && customers.response_data?.length > 0) {
        // Find an active customer
        const activeCustomer = customers.response_data.find((c: any) => c.isActive === '1');
        if (activeCustomer) {
          targetCustomerId = activeCustomer.id;
          customerInfo = activeCustomer;
          console.log('Using customer:', activeCustomer.name, targetCustomerId);
        }
      }
      
      if (!targetCustomerId) {
        return NextResponse.json({
          error: 'No active customers found',
          customersResponse: customers,
          suggestion: 'Create a customer first using the List Customers test'
        }, { status: 400 });
      }
    }

    // Step 3: Try different invoice formats
    const today = new Date().toISOString().split('T')[0];
    
    // Test 1: Minimal invoice with NUMBERS
    const minimalInvoice = {
      entity: 'Invoice',
      customerId: targetCustomerId,
      invoiceNumber: 'TEST-' + Date.now(),  // Required!
      invoiceDate: today,
      dueDate: today,
      invoiceLineItems: [
        {
          entity: 'InvoiceLineItem',
          amount: Number(amount) || 100,  // NUMBER!
          description: 'Test Item'
        }
      ]
    };

    console.log('Trying minimal invoice:', minimalInvoice);

    let response = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: minimalInvoice
        })
      }).toString(),
    });

    let result = await response.json();
    
    allAttempts.push({
      format: 'minimal',
      request: minimalInvoice,
      response: result,
      success: result.response_status === 0
    });
    
    if (result.response_status === 0) {
      return NextResponse.json({
        success: true,
        message: 'Minimal invoice created!',
        invoice: result.response_data,
        format: 'minimal',
        attempts: allAttempts
      });
    }

    // Test 2: Invoice with line items - FIXED with numbers
    const invoiceWithLines = {
      entity: 'Invoice',
      customerId: targetCustomerId,
      invoiceNumber: 'TEST-' + Date.now(),  // Required!
      invoiceDate: today,
      dueDate: today,
      invoiceLineItems: [
        {
          entity: 'InvoiceLineItem',
          amount: Number(amount) || 100,  // NUMBER!
          price: Number(amount) || 100,   // NUMBER!
          quantity: 1,                    // NUMBER!
          description: 'Test Item'
        }
      ]
    };

    console.log('Trying invoice with line items:', invoiceWithLines);

    response = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: invoiceWithLines
        })
      }).toString(),
    });

    result = await response.json();
    
    allAttempts.push({
      format: 'with-lines',
      request: invoiceWithLines,
      response: result,
      success: result.response_status === 0
    });
    
    if (result.response_status === 0) {
      return NextResponse.json({
        success: true,
        message: 'Invoice with line items created!',
        invoice: result.response_data,
        format: 'with-lines',
        attempts: allAttempts
      });
    }

    // Test 3: Full invoice matching existing invoice structure - FIXED with numbers
    const fullInvoice = {
      entity: 'Invoice',
      isActive: '1',
      customerId: targetCustomerId,
      invoiceNumber: 'API-' + Date.now(),
      invoiceDate: today,
      dueDate: today,
      glPostingDate: today,
      paymentStatus: '1',
      description: 'Test Invoice via API',
      isToBePrinted: false,
      isToBeEmailed: false,
      salesTaxPercentage: 0,
      salesTaxTotal: 0.0,  // NUMBER!
      terms: 'Due upon receipt',
      invoiceLineItems: [
        {
          entity: 'InvoiceLineItem',
          quantity: 1,                         // NUMBER!
          amount: Number(amount) || 100,       // NUMBER!
          price: Number(amount) || 100,        // NUMBER!
          description: 'Test Service',
          taxable: false,
          taxCode: 'Non',
          lineOrder: 0
        }
      ]
    };

    console.log('Trying full invoice:', fullInvoice);

    response = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: fullInvoice
        })
      }).toString(),
    });

    result = await response.json();
    
    allAttempts.push({
      format: 'full',
      request: fullInvoice,
      response: result,
      success: result.response_status === 0
    });
    
    if (result.response_status === 0) {
      return NextResponse.json({
        success: true,
        message: 'Full invoice created!',
        invoice: result.response_data,
        format: 'full',
        attempts: allAttempts
      });
    }

    // All formats failed - return detailed error info
    return NextResponse.json({
      error: 'All invoice formats failed',
      customerId: targetCustomerId,
      customerInfo: customerInfo,
      attempts: allAttempts,
      allErrors: allAttempts.map(a => ({
        format: a.format,
        error: a.response.response_message,
        errorData: a.response.response_data
      })),
      suggestion: 'Check error details in attempts array'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Exception occurred',
      message: error.message,
      stack: error.stack,
      attempts: allAttempts
    }, { status: 500 });
  }
}