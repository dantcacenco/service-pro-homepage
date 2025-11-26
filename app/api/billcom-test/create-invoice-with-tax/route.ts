// API Route: Create REAL Bill.com Invoice with Tax Line Items
// Fixed version with correct column names and extensive debugging

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Debug logger function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (data !== undefined) {
    console.log(logMessage, '| Data:', JSON.stringify(data));
  } else {
    console.log(logMessage);
  }
}

export async function POST(request: NextRequest) {
  try {
    debugLog('=== Starting Bill.com Invoice Creation ===');
    
    const supabase = await createClient();
    const body = await request.json();
    
    debugLog('Request body received', body);

    // Override with Danny's information for testing
    const testCustomer = {
      name: 'Danny',
      email: 'dantcacenco@gmail.com',
      phone: '828-667-1234',  // Example phone
      address: '214 Alta Vista Dr',
      city: 'Candler',
      state: 'NC',
      zip: '28715'
    };
    
    debugLog('Using test customer Danny', testCustomer);

    // Validate request has line items
    if (!body.lineItems || !Array.isArray(body.lineItems)) {
      debugLog('ERROR: Invalid line items in request');
      return NextResponse.json(
        { success: false, error: 'Missing or invalid line items' },
        { status: 400 }
      );
    }

    debugLog('Line items validated', {
      count: body.lineItems.length,
      items: body.lineItems
    });

    // Step 1: Check if Danny exists in local database
    debugLog('Step 1: Checking for existing customer in database...');
    
    const { data: existingCustomer, error: customerSearchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', testCustomer.email)
      .single();

    if (customerSearchError && customerSearchError.code !== 'PGRST116') {
      debugLog('ERROR: Failed to search for customer', customerSearchError);
      throw customerSearchError;
    }

    let customerId = existingCustomer?.id;
    let billcomId = existingCustomer?.billcom_id; // CORRECT COLUMN NAME
    
    debugLog('Customer search results', {
      found: !!existingCustomer,
      customerId,
      billcomId,
      existingData: existingCustomer
    });

    // Step 2: Create or update customer in local database
    if (!existingCustomer) {
      debugLog('Creating new customer in database...');
      
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          name: testCustomer.name,
          email: testCustomer.email,
          phone: testCustomer.phone,
          // Combine address into single field (customers table only has one address field)
          address: `${testCustomer.address}, ${testCustomer.city}, ${testCustomer.state} ${testCustomer.zip}`,
          billcom_id: null, // Will update later if we sync with Bill.com
          notes: 'Test customer for tax invoice testing'
        })
        .select()
        .single();

      if (createError) {
        debugLog('ERROR: Failed to create customer', createError);
        throw createError;
      }
      
      customerId = newCustomer.id;
      debugLog('Customer created successfully', {
        customerId,
        customerData: newCustomer
      });
    } else {
      debugLog('Using existing customer', {
        customerId,
        billcomId
      });
      
      // Update address if it's different
      const fullAddress = `${testCustomer.address}, ${testCustomer.city}, ${testCustomer.state} ${testCustomer.zip}`;
      if (existingCustomer.address !== fullAddress) {
        
        debugLog('Updating customer address...');
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            address: fullAddress
          })
          .eq('id', customerId);

        if (updateError) {
          debugLog('WARNING: Failed to update customer address', updateError);
        } else {
          debugLog('Customer address updated successfully');
        }
      }
    }

    // Step 3: Calculate tax based on Buncombe County (Candler is in Buncombe)
    const buncombeTaxRate = 0.0225; // 2.25% county tax
    const stateTaxRate = 0.0475;    // 4.75% state tax
    const totalTaxRate = stateTaxRate + buncombeTaxRate; // 7.0% total
    
    debugLog('Tax calculation for Buncombe County', {
      county: 'Buncombe',
      countyRate: `${(buncombeTaxRate * 100).toFixed(2)}%`,
      stateRate: `${(stateTaxRate * 100).toFixed(2)}%`,
      totalRate: `${(totalTaxRate * 100).toFixed(2)}%`
    });

    // Calculate amounts
    const subtotal = body.lineItems
      .filter((item: any) => item.type === 'SERVICE')
      .reduce((sum: number, item: any) => sum + item.amount, 0);
    
    const stateTaxAmount = subtotal * stateTaxRate;
    const countyTaxAmount = subtotal * buncombeTaxRate;
    const totalTaxAmount = stateTaxAmount + countyTaxAmount;
    const total = subtotal + totalTaxAmount;
    
    debugLog('Amount calculations', {
      subtotal: subtotal.toFixed(2),
      stateTax: stateTaxAmount.toFixed(2),
      countyTax: countyTaxAmount.toFixed(2),
      totalTax: totalTaxAmount.toFixed(2),
      grandTotal: total.toFixed(2)
    });

    // Step 4: Create proposal for invoice
    debugLog('Step 4: Creating proposal...');
    
    const proposalNumber = `TEST-TAX-${Date.now()}`;
    
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        customer_id: customerId,
        proposal_number: proposalNumber,
        status: 'approved',
        approved_at: new Date().toISOString(),
        items: [
          ...body.lineItems.filter((item: any) => item.type === 'SERVICE').map((item: any) => ({
            description: item.description,
            price: item.amount,
            quantity: item.quantity || 1
          })),
          {
            description: `NC State Tax (${(stateTaxRate * 100).toFixed(2)}%)`,
            price: stateTaxAmount,
            quantity: 1,
            is_tax: true
          },
          {
            description: `Buncombe County Tax (${(buncombeTaxRate * 100).toFixed(2)}%)`,
            price: countyTaxAmount,
            quantity: 1,
            is_tax: true
          }
        ],
        subtotal: subtotal,
        total: total,
        includes_tax: true,
        tax_amount: totalTaxAmount,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Tax test invoice for Buncombe County (Danny)'
      })
      .select()
      .single();

    if (proposalError) {
      debugLog('ERROR: Failed to create proposal', proposalError);
      throw proposalError;
    }
    
    debugLog('Proposal created successfully', {
      proposalId: proposal.id,
      proposalNumber: proposal.proposal_number,
      items: proposal.items
    });

    // Step 5: Create invoice with tax line items
    debugLog('Step 5: Creating invoice...');
    
    const invoiceNumber = `INV-TAX-${Date.now()}`;
    
    const billcomLineItems = [
      ...body.lineItems.filter((item: any) => item.type === 'SERVICE'),
      {
        description: `NC State Tax (${(stateTaxRate * 100).toFixed(2)}%)`,
        amount: stateTaxAmount,
        type: 'TAX',
        quantity: 1
      },
      {
        description: `Buncombe County Tax (${(buncombeTaxRate * 100).toFixed(2)}%)`,
        amount: countyTaxAmount,
        type: 'TAX',
        quantity: 1
      }
    ];
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        proposal_id: proposal.id,
        invoice_number: invoiceNumber,
        amount: total,
        amount_due: total,
        status: 'pending',
        payment_status: 'UNPAID',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Store tax details
        tax_rate: totalTaxRate,
        tax_amount: totalTaxAmount,
        
        // Bill.com formatted line items
        billcom_line_items: billcomLineItems,
        
        // Mark as test invoice
        notes: `TEST INVOICE - Buncombe County Tax Testing for Danny`,
        created_from_test: true,
        
        // Add county for reference
        tax_county: 'Buncombe County',
        tax_breakdown: {
          state: { rate: stateTaxRate, amount: stateTaxAmount },
          county: { rate: buncombeTaxRate, amount: countyTaxAmount },
          total: { rate: totalTaxRate, amount: totalTaxAmount }
        }
      })
      .select()
      .single();

    if (invoiceError) {
      debugLog('ERROR: Failed to create invoice', invoiceError);
      throw invoiceError;
    }
    
    debugLog('Invoice created successfully', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      taxAmount: invoice.tax_amount,
      lineItems: invoice.billcom_line_items
    });

    // Step 6: Return comprehensive success response
    const successResponse = {
      success: true,
      message: 'Test invoice created successfully with Buncombe County tax',
      customer: {
        id: customerId,
        name: testCustomer.name,
        email: testCustomer.email,
        address: `${testCustomer.address}, ${testCustomer.city}, ${testCustomer.state} ${testCustomer.zip}`,
        billcomId: billcomId || null
      },
      proposal: {
        id: proposal.id,
        number: proposal.proposal_number,
        total: proposal.total
      },
      invoice: {
        id: invoice.id,
        number: invoice.invoice_number,
        total: invoice.amount,
        dueDate: invoice.due_date
      },
      taxDetails: {
        county: 'Buncombe County',
        address: `${testCustomer.address}, ${testCustomer.city}, ${testCustomer.state}`,
        calculations: {
          subtotal: subtotal.toFixed(2),
          stateTax: {
            rate: `${(stateTaxRate * 100).toFixed(2)}%`,
            amount: stateTaxAmount.toFixed(2)
          },
          countyTax: {
            rate: `${(buncombeTaxRate * 100).toFixed(2)}%`,
            amount: countyTaxAmount.toFixed(2)
          },
          totalTax: {
            rate: `${(totalTaxRate * 100).toFixed(2)}%`,
            amount: totalTaxAmount.toFixed(2)
          },
          grandTotal: total.toFixed(2)
        }
      },
      billcomLineItems: billcomLineItems,
      debugInfo: {
        customerId,
        proposalId: proposal.id,
        invoiceId: invoice.id,
        timestamp: new Date().toISOString()
      }
    };
    
    debugLog('=== Invoice Creation Complete ===', successResponse);
    
    return NextResponse.json(successResponse);

  } catch (error) {
    debugLog('=== CRITICAL ERROR ===', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString(),
      debugMessage: 'Check server logs for detailed debug information'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET method to check if endpoint is working
export async function GET() {
  return NextResponse.json({
    message: 'Bill.com Tax Invoice Test Endpoint (Fixed)',
    status: 'Ready',
    testCustomer: {
      name: 'Danny',
      email: 'dantcacenco@gmail.com',
      address: '214 Alta Vista Dr, Candler, NC 28715'
    },
    taxInfo: {
      county: 'Buncombe',
      countyRate: '2.25%',
      stateRate: '4.75%',
      totalRate: '7.0%'
    },
    usage: 'POST to this endpoint with lineItems array',
    example: {
      lineItems: [
        { description: 'HVAC Service', amount: 100, type: 'SERVICE', quantity: 1 }
      ]
    },
    notes: [
      'Uses Danny as test customer',
      'Address in Buncombe County (Candler)',
      'Correct column name: billcom_id (not billcom_customer_id)',
      'Extensive debug logging enabled'
    ]
  });
}
