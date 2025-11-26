// Test Bill.com Create REAL Invoice - FINAL VERSION with Sequential Invoice Numbers
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('📄 Creating REAL Bill.com Invoice...');
  
  const body = await request.json();
  const { customerEmail, customerName, customerId, billcomCustomerId, amount, description } = body;

  // Validate required fields - now either billcomCustomerId, customerId, OR customerEmail
  if (!billcomCustomerId && !customerId && !customerEmail) {
    return NextResponse.json({
      error: 'Bill.com customer ID, local customer ID, or email is required',
      note: 'Please select a customer or enter an email address'
    }, { status: 400 });
  }

  const config = {
    devKey: process.env.BILLCOM_DEV_KEY,
    username: process.env.BILLCOM_USERNAME,
    password: process.env.BILLCOM_PASSWORD,
    orgId: process.env.BILLCOM_ORG_ID,
    apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api',
  };

  try {
    // Step 1: Authenticate
    console.log('Step 1: Authenticating with Bill.com...');
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

    const sessionData = authData.response_data;
    const sessionId = sessionData.sessionId;
    const apiEndpoint = sessionData.apiEndPoint || 'https://api.bill.com/api/v2';

    console.log('Authentication successful');

    // Step 2: Handle customer based on whether we have billcomCustomerId, customerId, or email
    let billcomCustomerId = body.billcomCustomerId; // Use directly if provided
    let customerDetails = null;
    let customerAction = '';
    
    // If we already have a Bill.com customer ID, use it directly
    if (billcomCustomerId) {
      customerDetails = {
        id: billcomCustomerId,
        name: customerName || 'Customer',
        email: customerEmail || ''
      };
      customerAction = 'Using provided Bill.com customer ID';
      console.log(`Using provided Bill.com customer ID: ${billcomCustomerId}`);
    } 
    // If we have a customerId, check if they're already synced with Bill.com
    else if (customerId) {
      // Import createClient at the top of the file
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: dbCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (dbCustomer?.billcom_id) {
        billcomCustomerId = dbCustomer.billcom_id;
        customerDetails = dbCustomer;
        customerAction = 'Using synced customer from database';
        console.log(`Using synced customer: ${dbCustomer.name} (${billcomCustomerId})`);
      } else if (dbCustomer) {
        // Customer exists but not synced - we'll sync them below
        // Set the email from the database
        body.customerEmail = dbCustomer.email;
        body.customerName = dbCustomer.name;
      }
    }

    // Step 3: Get the next invoice number by finding the highest existing one
    console.log('Step 2: Getting next invoice number...');
    
    const listInvoicesResponse = await fetch(`${apiEndpoint}/List/Invoice.json`, {
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
          max: 999  // Get all to find highest number
        })
      }).toString(),
    });
    
    const invoicesData = await listInvoicesResponse.json();
    let nextInvoiceNumber = '2018'; // Default if no invoices exist
    
    if (invoicesData.response_status === 0 && invoicesData.response_data) {
      // Find the highest numeric invoice number
      const numericInvoiceNumbers = invoicesData.response_data
        .map((inv: any) => inv.invoiceNumber)
        .filter((num: string) => /^\d+$/.test(num))  // Only numeric invoice numbers
        .map((num: string) => parseInt(num, 10));
      
      if (numericInvoiceNumbers.length > 0) {
        const highestNumber = Math.max(...numericInvoiceNumbers);
        nextInvoiceNumber = String(highestNumber + 1);
        console.log(`Highest existing invoice number: ${highestNumber}, using: ${nextInvoiceNumber}`);
      }
    }

    // Step 4: Check if customer exists by email (only if we don't have a billcomCustomerId yet)
    if (!billcomCustomerId && customerEmail) {
      console.log(`Step 4: Checking if customer exists with email: ${customerEmail}`);
      
      const listCustomersResponse = await fetch(`${apiEndpoint}/List/Customer.json`, {
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
            max: 999  // Get all to search by email
          })
        }).toString(),
      });
      
      const listData = await listCustomersResponse.json();
      
      if (listData.response_status === 0 && listData.response_data) {
        // Look for customer with matching email (case-insensitive)
        const existingCustomer = listData.response_data.find((c: any) => 
          c.email?.toLowerCase() === customerEmail.toLowerCase() && c.isActive === '1'
        );
        
        if (existingCustomer) {
          billcomCustomerId = existingCustomer.id;
          customerDetails = existingCustomer;
          customerAction = 'Using existing customer';
          console.log(`Found existing customer: ${existingCustomer.name} (${billcomCustomerId})`);
        }
      }
    }
    
    // Step 5: If customer doesn't exist, create them
    if (!billcomCustomerId) {
      console.log(`Step 5: Creating new customer for ${customerEmail}`);
      
      // Use provided name or default to email prefix
      const finalCustomerName = customerName || customerEmail?.split('@')[0] || 'Customer';
      
      const customerObj = {
        entity: 'Customer',
        isActive: '1',
        name: finalCustomerName,
        email: customerEmail || 'noemail@example.com',
      };

      console.log('Creating customer:', customerObj);

      const createCustomerResponse = await fetch(`${apiEndpoint}/Crud/Create/Customer.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          devKey: config.devKey!,
          sessionId: sessionId,
          data: JSON.stringify({
            obj: customerObj
          })
        }).toString(),
      });

      const customerData = await createCustomerResponse.json();
      
      if (customerData.response_status === 0) {
        billcomCustomerId = customerData.response_data.id;
        customerDetails = customerData.response_data;
        customerAction = 'Created new customer';
        console.log(`Created new customer: ${customerData.response_data.name} (${billcomCustomerId})`);
        
        // Update database if we have a customerId
        if (customerId) {
          const { createClient } = await import('@/lib/supabase/server');
          const supabase = await createClient();
          await supabase
            .from('customers')
            .update({ 
              billcom_id: billcomCustomerId,
              billcom_sync_at: new Date().toISOString()
            })
            .eq('id', customerId);
        }      } else {
        // Check if customer already exists error
        if (customerData.response_data?.error_message?.includes('already exists')) {
          // Customer exists but we couldn't retrieve them
          return NextResponse.json({
            error: 'Customer already exists in Bill.com',
            details: customerData,
            customerEmail: customerEmail,
            note: 'Customer may be inactive or email may be duplicate'
          }, { status: 400 });
        } else {
          return NextResponse.json({
            error: 'Failed to create customer',
            details: customerData,
            customerEmail: customerEmail,
          }, { status: 400 });
        }
      }
    }

    // Step 6: Create the invoice with sequential invoice number
    console.log(`Step 6: Creating invoice #${nextInvoiceNumber} for customer ${billcomCustomerId}`);
    
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const invoiceObj = {
      entity: 'Invoice',
      customerId: billcomCustomerId,
      invoiceNumber: nextInvoiceNumber,  // Use sequential number
      invoiceDate: today,
      dueDate: dueDate,
      glPostingDate: today,
      description: description || `Invoice for ${customerDetails?.name || customerName}`,
      terms: 'Due upon receipt',
      invoiceLineItems: [
        {
          entity: 'InvoiceLineItem',
          amount: Number(amount) || 100,     // NUMBER not string!
          price: Number(amount) || 100,      // NUMBER not string!
          quantity: 1,                       // NUMBER not string!
          description: description || 'Service',
          taxable: false,
          taxCode: 'Non'
        }
      ]
    };

    console.log(`Creating invoice #${nextInvoiceNumber}`);

    const createInvoiceResponse = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        devKey: config.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          obj: invoiceObj
        })
      }).toString(),
    });

    const invoiceData = await createInvoiceResponse.json();
    
    if (invoiceData.response_status !== 0) {
      // If invoice number already exists, try next one
      if (invoiceData.response_data?.error_message?.includes('already exists') || 
          invoiceData.response_data?.error_message?.includes('duplicate')) {
        console.log(`Invoice #${nextInvoiceNumber} already exists, trying next number...`);
        
        // Try with timestamp suffix for uniqueness
        invoiceObj.invoiceNumber = `${nextInvoiceNumber}-${Date.now().toString().slice(-4)}`;
        
        const retryResponse = await fetch(`${apiEndpoint}/Crud/Create/Invoice.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            devKey: config.devKey!,
            sessionId: sessionId,
            data: JSON.stringify({
              obj: invoiceObj
            })
          }).toString(),
        });

        const retryData = await retryResponse.json();
        
        if (retryData.response_status === 0) {
          const createdInvoice = retryData.response_data;
          
          return NextResponse.json({
            success: true,
            message: '🎉 Invoice created in Bill.com!',
            invoice: {
              id: createdInvoice.id,
              invoiceNumber: createdInvoice.invoiceNumber,
              customerId: billcomCustomerId,
              customerEmail: customerEmail,
              customerName: customerDetails?.name || customerName,
              amount: amount,
              status: createdInvoice.paymentStatus === '0' ? 'Paid' : 
                      createdInvoice.paymentStatus === '1' ? 'Open' : 
                      createdInvoice.paymentStatus === '2' ? 'Partial' : 'Unknown',
              dueDate: createdInvoice.dueDate,
              createdAt: createdInvoice.createdTime,
            },
            customerAction: customerAction,
            paymentLink: `https://app02.us.bill.com/CustomerPayment/${createdInvoice.id}`,
            billcomDashboard: `https://app02.us.bill.com`,
            note: `✅ Invoice #${createdInvoice.invoiceNumber} created! ${customerAction}`,
          });
        } else {
          return NextResponse.json({
            error: 'Failed to create invoice with alternate number',
            details: retryData,
            attemptedNumber: invoiceObj.invoiceNumber,
          }, { status: 400 });
        }
      }
      
      return NextResponse.json({
        error: invoiceData.response_data?.error_message || 'Failed to create invoice',
        details: invoiceData,
        customerId: billcomCustomerId,
        customerEmail: customerEmail,
        attemptedInvoiceNumber: nextInvoiceNumber,
        note: 'Check error details above'
      }, { status: 400 });
    }

    // Success! Return the created invoice
    const createdInvoice = invoiceData.response_data;
    
    return NextResponse.json({
      success: true,
      message: '🎉 Invoice created in Bill.com!',
      invoice: {
        id: createdInvoice.id,
        invoiceNumber: createdInvoice.invoiceNumber,
        customerId: billcomCustomerId,
        customerEmail: customerEmail,
        customerName: customerDetails?.name || customerName,
        amount: amount,
        status: createdInvoice.paymentStatus === '0' ? 'Paid' : 
                createdInvoice.paymentStatus === '1' ? 'Open' : 
                createdInvoice.paymentStatus === '2' ? 'Partial' : 'Unknown',
        dueDate: createdInvoice.dueDate,
        createdAt: createdInvoice.createdTime,
      },
      customerAction: customerAction,
      paymentLink: `https://app02.us.bill.com/CustomerPayment/${createdInvoice.id}`,
      billcomDashboard: `https://app02.us.bill.com`,
      note: `✅ Invoice #${createdInvoice.invoiceNumber} created successfully! ${customerAction}`,
    });

  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json({
      error: 'Failed to create invoice - Exception',
      message: error.message,
      customerEmail: customerEmail,
      stack: error.stack,
    }, { status: 500 });
  }
}