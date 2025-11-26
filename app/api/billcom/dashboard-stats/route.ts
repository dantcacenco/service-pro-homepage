import { NextResponse } from 'next/server';
import { getBillcomCredentials } from '@/lib/billcom/credentials';

// Bill.com uses different URLs for login vs API calls
const LOGIN_URL = 'https://app02.us.bill.com/api/v2';
const API_URL = 'https://api.bill.com/api/v2';

export async function GET() {
  try {
    // Get credentials from env or database
    const { credentials } = await getBillcomCredentials();

    // Login to Bill.com (must use app02.us.bill.com)
    const loginResponse = await fetch(`${LOGIN_URL}/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        devKey: credentials.devKey,
        userName: credentials.username,
        password: credentials.password,
        orgId: credentials.orgId,
      }),
    });

    const loginData = await loginResponse.json();
    if (loginData.response_status !== 0) {
      throw new Error(
        `Login failed: ${loginData.response_data?.error_message || loginData.response_message}`
      );
    }

    const sessionId = loginData.response_data.sessionId;

    // Get all invoices (up to 999) - use api.bill.com for data calls
    const listResponse = await fetch(`${API_URL}/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        devKey: credentials.devKey,
        sessionId: sessionId,
        data: JSON.stringify({
          start: 0,
          max: 999,
          sort: [
            {
              field: 'createdTime',
              asc: false,
            },
          ],
        }),
      }),
    });

    const listData = await listResponse.json();

    if (listData.response_status !== 0) {
      throw new Error(`Failed to list invoices: ${listData.response_message}`);
    }

    const invoices = listData.response_data || [];

    // Calculate stats
    let totalCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    const today = new Date();

    for (const invoice of invoices) {
      // Only count 4-digit invoice numbers (our system invoices)
      const num = parseInt(invoice.invoiceNumber);
      if (!isNaN(num) && num >= 1000 && num <= 9999) {
        totalCount++;

        // Use amountDue to determine payment status
        // amountDue > 0 means unpaid
        // amountDue = 0 means paid
        if (invoice.amountDue === 0 || invoice.amountDue === '0' || invoice.amountDue === null) {
          paidCount++;
        } else if (invoice.amountDue > 0) {
          unpaidCount++;

          // Check if overdue
          if (invoice.dueDate) {
            const dueDate = new Date(invoice.dueDate);
            if (dueDate < today) {
              overdueCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: totalCount,
      paid: paidCount,
      unpaid: unpaidCount,
      overdue: overdueCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching Bill.com stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoice stats',
        total: 0,
        paid: 0,
        overdue: 0,
      },
      { status: 500 }
    );
  }
}
