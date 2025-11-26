// Simplified Tax Test - Bill.com Native Approach
// Uses itemSalesTax field + automatic tax calculation + proper invoice numbers

import { NextRequest, NextResponse } from 'next/server';
import { BillcomClient } from '@/lib/billcom/client';
import { COMPANY_INFO } from '@/lib/legal-disclaimers';
import {
  updateTaxItem,
  getCombinedTaxRate,
  extractCountyFromAddress
} from '@/lib/billcom/tax-manager';

const BILLCOM_CONFIG = {
  devKey: process.env.BILLCOM_DEV_KEY!,
  username: process.env.BILLCOM_USERNAME!,
  password: process.env.BILLCOM_PASSWORD!,
  orgId: process.env.BILLCOM_ORG_ID!,
  apiUrl: 'https://api.bill.com/api'
};

const TAX_ITEM_ID = process.env.BILLCOM_TAX_ITEM_ID || '';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simplified Tax Test - Bill.com Native ===');
    
    const body = await request.json();
    
    // Test customer
    const testCustomer = {
      name: 'Danny Test',
      email: 'dantcacenco@gmail.com',
      phone: '828-667-1234',
      address: body.customerAddress || '214 Alta Vista Dr, Candler, NC 28715'
    };


    // Validate
    if (!body.lineItems || !Array.isArray(body.lineItems)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid line items' },
        { status: 400 }
      );
    }

    if (!TAX_ITEM_ID) {
      return NextResponse.json(
        { success: false, error: 'Tax item ID not configured in environment' },
        { status: 500 }
      );
    }

    // Initialize Bill.com client
    console.log('Step 1: Initializing Bill.com...');
    const billcomClient = new BillcomClient(BILLCOM_CONFIG);
    const sessionId = await billcomClient.authenticate();

    // Create/find customer
    console.log('Step 2: Creating/finding customer...');
    const billcomCustomer = await billcomClient.createOrFindCustomer({
      name: testCustomer.name,
      email: testCustomer.email,
      phone: testCustomer.phone,
      address: testCustomer.address
    });
    
    console.log(`✅ Customer: ${billcomCustomer.name} (${billcomCustomer.id})`);

    // Extract county and get tax rate
    console.log('Step 3: Determining tax rate...');
    const county = extractCountyFromAddress(testCustomer.address);
    
    if (!county) {
      return NextResponse.json(
        { success: false, error: 'Could not determine county from address' },
        { status: 400 }
      );
    }
    
    const taxRate = getCombinedTaxRate(county);
    console.log(`✅ County: ${county}, Tax Rate: ${(taxRate * 100).toFixed(2)}%`);

    // Update the ONE tax item with this county's rate
    console.log('Step 4: Updating tax item...');
    await updateTaxItem({
      sessionId,
      taxItemId: TAX_ITEM_ID,
      county,
      rate: taxRate,
      devKey: BILLCOM_CONFIG.devKey,
      apiUrl: BILLCOM_CONFIG.apiUrl
    });

    // Get next invoice number
    console.log('Step 5: Getting next invoice number...');
    const invoiceNumber = await billcomClient.getNextInvoiceNumber(2089);
    console.log(`✅ Invoice Number: ${invoiceNumber}`);

    // Calculate totals
    const subtotal = body.lineItems
      .reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Calculate tax breakdown (state vs county)
    const NC_STATE_TAX = 0.0475 // 4.75%
    const countyTaxRate = taxRate - NC_STATE_TAX
    const stateTaxAmount = subtotal * NC_STATE_TAX
    const countyTaxAmount = subtotal * countyTaxRate

    // Build tax breakdown and legal disclaimer for notes
    const taxBreakdown = `${county} County Tax ${(countyTaxRate * 100).toFixed(2)}%: $${countyTaxAmount.toFixed(2)}\nNC State Tax 4.75%: $${stateTaxAmount.toFixed(2)}`
    const legalDisclaimer = `\n\n${COMPANY_INFO.businessName}\nNC License #${COMPANY_INFO.licenseNumber}`

    // Create invoice with itemSalesTax
    console.log('Step 6: Creating invoice with tax reference...');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const billcomInvoice = await billcomClient.createInvoice({
      customerId: billcomCustomer.id,
      amount: total,
      description: `HVAC Service - Test Invoice\n\n${taxBreakdown}${legalDisclaimer}`,
      invoiceNumber: invoiceNumber,
      itemSalesTax: TAX_ITEM_ID, // Reference tax item
      lineItems: body.lineItems.map((item: any) => ({
        description: item.description,
        amount: item.amount,
        quantity: item.quantity || 1,
        taxable: true // Bill.com will calculate tax automatically
      })),
      dueDate: dueDate,
      sendEmail: false
    });

    console.log('✅ Invoice created successfully!');

    return NextResponse.json({
      success: true,
      message: '✅ Invoice created with Bill.com native tax!',
      invoice: {
        invoiceId: billcomInvoice.id,
        invoiceNumber: billcomInvoice.invoiceNumber,
        customerId: billcomCustomer.id,
        status: billcomInvoice.status
      },
      amounts: {
        subtotal: subtotal.toFixed(2),
        countyTax: countyTaxAmount.toFixed(2),
        stateTax: stateTaxAmount.toFixed(2),
        totalTax: taxAmount.toFixed(2),
        total: total.toFixed(2)
      },
      taxInfo: {
        county,
        countyRate: `${(countyTaxRate * 100).toFixed(2)}%`,
        stateRate: '4.75%',
        combinedRate: `${(taxRate * 100).toFixed(2)}%`,
        itemId: TAX_ITEM_ID,
        method: 'Bill.com auto-calculated'
      },
      instructions: [
        '✅ SUCCESS! Invoice created with proper Bill.com tax!',
        '',
        '💰 Tax Breakdown:',
        `   ${county} County Tax (${(countyTaxRate * 100).toFixed(2)}%): $${countyTaxAmount.toFixed(2)}`,
        `   NC State Tax (4.75%): $${stateTaxAmount.toFixed(2)}`,
        `   Total Tax: $${taxAmount.toFixed(2)}`,
        '',
        '📊 Verification Steps:',
        `1. Login to https://app.bill.com`,
        `2. Go to Invoices section`,
        `3. Find invoice: ${invoiceNumber}`,
        `4. Check "Notes" field for tax breakdown`,
        `5. Verify tax shows as "Tax" type (not "Service")`,
        `6. Verify tax description: "NC Sales Tax - ${county} County"`,
        `7. Verify total: $${total.toFixed(2)} ($${subtotal.toFixed(2)} + $${taxAmount.toFixed(2)} tax)`
      ]
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
