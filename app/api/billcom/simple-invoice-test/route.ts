import { NextResponse } from 'next/server';

const BILLCOM_API_URL = 'https://api.bill.com/api/v2';
const BILLCOM_DEV_KEY = '01XJGFKNSCOWLOBP3558';
const BILLCOM_USERNAME = 'fairairhc@gmail.com';
const BILLCOM_PASSWORD = '957@Riverside1';
const BILLCOM_ORG_ID = '00802NDQRPKOEFQ2uzy3';

export async function GET() {
  let output = '';
  
  try {
    // Login
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
    
    // Get all invoices
    const listResponse = await fetch(`${BILLCOM_API_URL}/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        devKey: BILLCOM_DEV_KEY,
        sessionId: sessionId,
        data: JSON.stringify({
          start: 0,
          max: 999,
          sort: [{ field: 'invoiceNumber', asc: false }]
        })
      })
    });

    const listData = await listResponse.json();
    if (listData.response_status !== 0) {
      throw new Error(`Failed to list invoices: ${listData.response_message}`);
    }
    
    const invoices = listData.response_data || [];
    
    output += `=== TOTAL INVOICES FOUND: ${invoices.length} ===\n\n`;
    
    // Analyze status fields
    const statusCounts: Record<string, number> = {};
    const paymentStatusCounts: Record<string, number> = {};
    const approvalStatusCounts: Record<string, number> = {};
    const unpaidInvoices: string[] = [];
    const paidInvoices: string[] = [];
    
    // Show first 10 invoices with ALL status fields
    output += "=== FIRST 10 INVOICES WITH ALL STATUS FIELDS ===\n";
    invoices.slice(0, 10).forEach((inv: any, idx: number) => {
      output += `\n${idx + 1}. Invoice #${inv.invoiceNumber}\n`;
      output += `   ID: ${inv.id}\n`;
      output += `   Amount: $${inv.amount}\n`;
      output += `   amountDue: $${inv.amountDue}\n`;
      output += `   amountPaid: $${inv.amountPaid || 0}\n`;
      output += `   approvalStatus: ${inv.approvalStatus}\n`;
      output += `   paymentStatus: ${inv.paymentStatus}\n`;
      output += `   status: ${inv.status}\n`;
      output += `   dueDate: ${inv.dueDate}\n`;
      output += `   invoiceDate: ${inv.invoiceDate}\n`;
      output += `   sentDate: ${inv.sentDate}\n`;
      output += `   All fields: ${JSON.stringify(Object.keys(inv))}\n`;
    });
    
    // Count all statuses
    output += "\n=== STATUS FIELD ANALYSIS ===\n";
    
    for (const inv of invoices) {
      // Count approvalStatus
      const approval = inv.approvalStatus || 'null';
      approvalStatusCounts[approval] = (approvalStatusCounts[approval] || 0) + 1;
      
      // Count paymentStatus
      const payment = inv.paymentStatus || 'null';
      paymentStatusCounts[payment] = (paymentStatusCounts[payment] || 0) + 1;
      
      // Count status
      const status = inv.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Determine paid/unpaid
      if (inv.amountDue > 0) {
        unpaidInvoices.push(inv.invoiceNumber);
      } else if (inv.amountDue === 0 && inv.amount > 0) {
        paidInvoices.push(inv.invoiceNumber);
      }
    }
    
    output += "\napprovalStatus values:\n";
    Object.entries(approvalStatusCounts).forEach(([key, count]) => {
      output += `  "${key}": ${count} invoices\n`;
    });
    
    output += "\npaymentStatus values:\n";
    Object.entries(paymentStatusCounts).forEach(([key, count]) => {
      output += `  "${key}": ${count} invoices\n`;
    });
    
    output += "\nstatus values:\n";
    Object.entries(statusCounts).forEach(([key, count]) => {
      output += `  "${key}": ${count} invoices\n`;
    });
    
    output += "\n=== PAYMENT ANALYSIS ===\n";
    output += `Invoices with amountDue > 0 (UNPAID): ${unpaidInvoices.length}\n`;
    output += `Invoices with amountDue = 0 (PAID): ${paidInvoices.length}\n`;
    
    // Check overdue
    const today = new Date();
    let overdueCount = 0;
    
    for (const inv of invoices) {
      if (inv.amountDue > 0 && inv.dueDate) {
        const dueDate = new Date(inv.dueDate);
        if (dueDate < today) {
          overdueCount++;
        }
      }
    }
    
    output += `\n=== FINAL COUNTS ===\n`;
    output += `TOTAL: ${invoices.length}\n`;
    output += `UNPAID (amountDue > 0): ${unpaidInvoices.length}\n`;
    output += `PAID (amountDue = 0): ${paidInvoices.length}\n`;
    output += `OVERDUE (unpaid + past due date): ${overdueCount}\n`;
    
    return new Response(output, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
    
  } catch (error: any) {
    output += `\nERROR: ${error.message}`;
    return new Response(output, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}