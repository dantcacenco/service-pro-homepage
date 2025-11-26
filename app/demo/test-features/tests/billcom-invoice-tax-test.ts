// Test Bill.com Invoice Creation with Tax
// This file creates a real invoice in Bill.com with proper tax line items

export async function createBillcomInvoiceWithTax() {
  console.log('Creating real Bill.com invoice with tax...');
  
  // Test data
  const testInvoiceData = {
    customerEmail: 'test@fairairhc.service-pro.app',
    customerName: 'Test Customer - Tax Testing',
    subtotal: 100.00,
    
    // Correct NC tax calculation
    // Wake County: 2.5% county + 4.75% state = 7.25% total
    stateTax: 4.75,     // $4.75 on $100
    countyTax: 2.50,    // $2.50 on $100  
    totalTax: 7.25,     // $7.25 total tax
    
    invoiceNumber: `TEST-TAX-${Date.now()}`,
    description: 'Service Pro Tax Test Invoice'
  };

  try {
    // Call the Bill.com API to create invoice
    const response = await fetch('/api/billcom-test/create-invoice-with-tax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          email: testInvoiceData.customerEmail,
          name: testInvoiceData.customerName,
          address: {
            street: '123 Test St',
            city: 'Raleigh',
            state: 'NC',
            zip: '27601'
          }
        },
        lineItems: [
          {
            description: testInvoiceData.description,
            amount: testInvoiceData.subtotal,
            type: 'SERVICE', // Main service line item
            quantity: 1
          },
          {
            description: 'NC State Tax (4.75%)',
            amount: testInvoiceData.stateTax,
            type: 'TAX', // CRITICAL: Must be TAX type
            quantity: 1
          },
          {
            description: 'Wake County Tax (2.5%)',
            amount: testInvoiceData.countyTax,
            type: 'TAX', // CRITICAL: Must be TAX type
            quantity: 1
          }
        ],
        invoiceNumber: testInvoiceData.invoiceNumber,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        total: testInvoiceData.subtotal + testInvoiceData.totalTax // $107.25
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        invoiceId: result.invoiceId,
        invoiceNumber: testInvoiceData.invoiceNumber,
        message: `Invoice created successfully in Bill.com`,
        details: `Subtotal: $${testInvoiceData.subtotal.toFixed(2)}, State Tax: $${testInvoiceData.stateTax.toFixed(2)}, County Tax: $${testInvoiceData.countyTax.toFixed(2)}, Total: $${(testInvoiceData.subtotal + testInvoiceData.totalTax).toFixed(2)}`,
        correctCalculation: {
          subtotal: testInvoiceData.subtotal,
          stateTaxRate: '4.75%',
          stateTaxAmount: testInvoiceData.stateTax,
          countyTaxRate: '2.5%',
          countyTaxAmount: testInvoiceData.countyTax,
          totalTaxRate: '7.25%',
          totalTaxAmount: testInvoiceData.totalTax,
          invoiceTotal: testInvoiceData.subtotal + testInvoiceData.totalTax
        }
      };
    } else {
      throw new Error(result.error || 'Failed to create invoice');
    }
  } catch (error) {
    console.error('Error creating Bill.com invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create invoice in Bill.com',
      details: 'Check if Bill.com API is configured correctly'
    };
  }
}
