// /api/billcom-test/fixed-endpoints.js
// WORKING Bill.com API implementation with correct data parameter format
// Tested and confirmed working on 2025-09-16

const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY;
const BILLCOM_USERNAME = process.env.BILLCOM_USERNAME;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD;
const BILLCOM_ORG_ID = process.env.BILLCOM_ORG_ID;

// Helper function to authenticate with Bill.com
async function authenticateWithBillcom() {
  const authUrl = 'https://app02.us.bill.com/api/v2/Login.json';
  
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      userName: BILLCOM_USERNAME,
      password: BILLCOM_PASSWORD,
      devKey: BILLCOM_DEV_KEY,
      orgId: BILLCOM_ORG_ID,
    }).toString(),
  });

  const result = await response.json();
  
  if (result.response_status !== 0) {
    throw new Error(`Authentication failed: ${result.response_message}`);
  }
  
  return result.response_data;
}

// List all invoices (with pagination)
export async function listInvoices(start = 0, max = 999) {
  const session = await authenticateWithBillcom();
  
  const listUrl = 'https://api.bill.com/api/v2/List/Invoice.json';
  
  // CRITICAL: Use data parameter with JSON object containing integers
  const params = new URLSearchParams({
    devKey: BILLCOM_DEV_KEY,
    sessionId: session.sessionId,
    data: JSON.stringify({
      start: start,  // Must be integer, not string!
      max: max       // Must be integer, not string!
    })
  });
  
  const response = await fetch(listUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const result = await response.json();
  
  if (result.response_status !== 0) {
    throw new Error(`List invoices failed: ${result.response_message}`);
  }
  
  return result.response_data;
}

// List all customers (with pagination)
export async function listCustomers(start = 0, max = 100) {
  const session = await authenticateWithBillcom();
  
  const listUrl = 'https://api.bill.com/api/v2/List/Customer.json';
  
  const params = new URLSearchParams({
    devKey: BILLCOM_DEV_KEY,
    sessionId: session.sessionId,
    data: JSON.stringify({
      start: start,
      max: max
    })
  });
  
  const response = await fetch(listUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const result = await response.json();
  
  if (result.response_status !== 0) {
    throw new Error(`List customers failed: ${result.response_message}`);
  }
  
  return result.response_data;
}

// Create or find a customer
export async function createOrFindCustomer(customerData) {
  const session = await authenticateWithBillcom();
  
  // First, try to find existing customer by email
  const customers = await listCustomers(0, 999);
  const existingCustomer = customers.find(c => c.email === customerData.email);
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // Create new customer
  const createUrl = 'https://api.bill.com/api/v2/Crud/Create/Customer.json';
  
  const params = new URLSearchParams({
    devKey: BILLCOM_DEV_KEY,
    sessionId: session.sessionId,
    data: JSON.stringify({
      obj: {
        entity: 'Customer',
        isActive: '1',
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || null,
        billAddress1: customerData.address || null,
        billAddressCity: customerData.city || null,
        billAddressState: customerData.state || null,
        billAddressZip: customerData.zip || null,
        billAddressCountry: 'United States'
      }
    })
  });
  
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const result = await response.json();
  
  if (result.response_status !== 0) {
    throw new Error(`Create customer failed: ${result.response_message}`);
  }
  
  return result.response_data;
}

// Create an invoice
export async function createInvoice(invoiceData) {
  const session = await authenticateWithBillcom();
  
  // Ensure customer exists
  const customer = await createOrFindCustomer(invoiceData.customer);
  
  const createUrl = 'https://api.bill.com/api/v2/Crud/Create/Invoice.json';
  
  const params = new URLSearchParams({
    devKey: BILLCOM_DEV_KEY,
    sessionId: session.sessionId,
    data: JSON.stringify({
      obj: {
        entity: 'Invoice',
        isActive: '1',
        customerId: customer.id,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.date,
        dueDate: invoiceData.dueDate || invoiceData.date,
        amount: String(invoiceData.amount),
        description: invoiceData.description,
        terms: 'Due upon receipt',
        invoiceLineItems: invoiceData.lineItems.map(item => ({
          entity: 'InvoiceLineItem',
          amount: String(item.amount),
          price: String(item.price || item.amount),
          quantity: item.quantity || 1,
          description: item.description,
          taxable: false,
          taxCode: 'Non'
        }))
      }
    })
  });
  
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const result = await response.json();
  
  if (result.response_status !== 0) {
    throw new Error(`Create invoice failed: ${result.response_message}`);
  }
  
  return result.response_data;
}

// Import all customers from Bill.com to Supabase
export async function importAllCustomers() {
  let allCustomers = [];
  let start = 0;
  const max = 100;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await listCustomers(start, max);
    allCustomers = [...allCustomers, ...batch];
    hasMore = batch.length === max;
    start += max;
    
    // Log progress
    console.log(`Imported ${allCustomers.length} customers so far...`);
  }
  
  return allCustomers;
}

// Get all invoices with full details
export async function getAllInvoices() {
  let allInvoices = [];
  let start = 0;
  const max = 100;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await listInvoices(start, max);
    allInvoices = [...allInvoices, ...batch];
    hasMore = batch.length === max;
    start += max;
    
    // Log progress
    console.log(`Retrieved ${allInvoices.length} invoices so far...`);
  }
  
  return allInvoices;
}

// Test all endpoints
export async function testAllEndpoints() {
  console.log('Testing Bill.com API endpoints...\n');
  
  try {
    // Test authentication
    console.log('1. Testing authentication...');
    const session = await authenticateWithBillcom();
    console.log('✅ Authentication successful');
    console.log('   Session ID:', session.sessionId);
    console.log('   Org ID:', session.orgId);
    
    // Test list invoices
    console.log('\n2. Testing list invoices...');
    const invoices = await listInvoices(0, 10);
    console.log(`✅ Found ${invoices.length} invoices`);
    if (invoices.length > 0) {
      console.log('   First invoice:', invoices[0].invoiceNumber);
    }
    
    // Test list customers
    console.log('\n3. Testing list customers...');
    const customers = await listCustomers(0, 10);
    console.log(`✅ Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log('   First customer:', customers[0].name);
    }
    
    // Test create customer
    console.log('\n4. Testing customer creation...');
    const timestamp = Date.now();
    const newCustomer = await createOrFindCustomer({
      name: `Test Customer ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: '555-0123'
    });
    console.log('✅ Customer created/found');
    console.log('   Customer ID:', newCustomer.id);
    console.log('   Customer name:', newCustomer.name);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Example usage
if (require.main === module) {
  testAllEndpoints();
}