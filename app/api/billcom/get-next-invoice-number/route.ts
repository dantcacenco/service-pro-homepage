import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BILLCOM_API_BASE = 'https://api-dev.bill.com/v3';
const BILLCOM_DEV_KEY = process.env.BILLCOM_DEV_KEY!;
const BILLCOM_EMAIL = process.env.BILLCOM_EMAIL!;
const BILLCOM_PASSWORD = process.env.BILLCOM_PASSWORD!;

interface ApiLogEntry {
  type: string;
  message: string;
  timestamp: string;
  url?: string;
  method?: string;
  headers?: any;
  body?: string;
  response?: any;
  data?: any;
  error?: string;
}

async function loginToBillcom(logs: ApiLogEntry[]) {
  const loginUrl = `${BILLCOM_API_BASE}/Login.json`;
  
  logs.push({
    type: 'BILLCOM_REQUEST',
    message: 'Attempting Bill.com login',
    timestamp: new Date().toISOString(),
    url: loginUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `devKey=${BILLCOM_DEV_KEY}&email=${BILLCOM_EMAIL}&password=***REDACTED***`
  });

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      devKey: BILLCOM_DEV_KEY,
      email: BILLCOM_EMAIL,
      password: BILLCOM_PASSWORD
    }).toString()
  });

  const responseText = await response.text();
  
  logs.push({
    type: 'BILLCOM_RESPONSE',
    message: `Login response received: ${response.status} ${response.statusText}`,
    timestamp: new Date().toISOString(),
    data: responseText
  });

  if (!response.ok) {
    throw new Error(`Bill.com login failed: ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  if (data.response_status !== 0) {
    throw new Error(`Bill.com login failed: ${data.response_message || 'Unknown error'}`);
  }

  return data.response_data.sessionId;
}

async function checkInvoiceExists(sessionId: string, invoiceNumber: string, logs: ApiLogEntry[]) {
  const searchUrl = `${BILLCOM_API_BASE}/Crud/Read/Invoice.json`;
  
  // First, try to find the invoice by number
  const searchBody = {
    devKey: BILLCOM_DEV_KEY,
    sessionId: sessionId,
    data: JSON.stringify({
      filters: [
        {
          field: 'invoiceNumber',
          op: '=',
          value: invoiceNumber
        }
      ]
    })
  };

  logs.push({
    type: 'BILLCOM_REQUEST',
    message: `Checking if invoice #${invoiceNumber} exists`,
    timestamp: new Date().toISOString(),
    url: searchUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(searchBody, null, 2)
  });

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(searchBody).toString()
  });

  const responseText = await response.text();
  
  logs.push({
    type: 'BILLCOM_RESPONSE', 
    message: `Search response for invoice #${invoiceNumber}: ${response.status}`,
    timestamp: new Date().toISOString(),
    data: responseText
  });

  if (!response.ok) {
    // If it's a 404 or similar, the invoice doesn't exist
    return false;
  }

  try {
    const data = JSON.parse(responseText);
    
    // Check if Bill.com returned any invoices
    if (data.response_status === 0 && data.response_data && data.response_data.length > 0) {
      logs.push({
        type: 'INFO',
        message: `Invoice #${invoiceNumber} EXISTS in Bill.com`,
        timestamp: new Date().toISOString(),
        data: `Found ${data.response_data.length} invoice(s)`
      });
      return true;
    }
    
    logs.push({
      type: 'INFO',
      message: `Invoice #${invoiceNumber} is AVAILABLE (not found in Bill.com)`,
      timestamp: new Date().toISOString()
    });
    return false;
  } catch (err) {
    logs.push({
      type: 'ERROR',
      message: `Error parsing response for invoice #${invoiceNumber}`,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
      data: responseText
    });
    // If we can't parse the response, assume the invoice doesn't exist
    return false;
  }
}

export async function GET() {
  const logs: ApiLogEntry[] = [];
  
  try {
    // Get the last known invoice number from our database
    const supabase = await createClient();
    
    logs.push({
      type: 'DATABASE',
      message: 'Fetching last known invoice from database',
      timestamp: new Date().toISOString()
    });

    const { data: lastInvoice, error: dbError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      logs.push({
        type: 'ERROR',
        message: 'Database error',
        timestamp: new Date().toISOString(),
        error: dbError.message
      });
      throw dbError;
    }

    const lastKnownNumber = lastInvoice?.invoice_number || 2039;
    
    logs.push({
      type: 'DATABASE',
      message: `Last known invoice number from DB: ${lastKnownNumber}`,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(lastInvoice, null, 2)
    });

    // Login to Bill.com
    const sessionId = await loginToBillcom(logs);
    
    logs.push({
      type: 'INFO',
      message: 'Successfully logged into Bill.com',
      timestamp: new Date().toISOString(),
      data: `Session ID: ${sessionId.substring(0, 10)}...`
    });

    // Check the next few numbers to find an available one
    const searchResults = [];
    let nextAvailable = null;
    const maxChecks = 10; // Check up to 10 numbers ahead

    for (let i = 0; i < maxChecks; i++) {
      const checkNumber = lastKnownNumber + i + 1;
      
      logs.push({
        type: 'INFO',
        message: `Checking invoice number: ${checkNumber}`,
        timestamp: new Date().toISOString()
      });
      
      const exists = await checkInvoiceExists(sessionId, checkNumber.toString(), logs);
      
      searchResults.push({
        number: checkNumber,
        exists: exists,
        isLastKnown: i === 0 && lastKnownNumber === checkNumber - 1,
        details: exists ? 'Invoice exists in Bill.com' : 'Number is available'
      });

      if (!exists && !nextAvailable) {
        nextAvailable = checkNumber;
        logs.push({
          type: 'SUCCESS',
          message: `Found next available number: ${checkNumber}`,
          timestamp: new Date().toISOString()
        });
        
        // Check a few more to show context
        if (i < 3) continue;
        else break;
      }
    }

    const summary = {
      checked: searchResults.length,
      existing: searchResults.filter(r => r.exists).length,
      available: searchResults.filter(r => !r.exists).length
    };

    logs.push({
      type: 'SUMMARY',
      message: 'Invoice number check completed',
      timestamp: new Date().toISOString(),
      data: JSON.stringify(summary, null, 2)
    });

    return NextResponse.json({
      success: true,
      nextNumber: nextAvailable,
      lastKnownNumber: lastKnownNumber,
      searchResults: searchResults,
      summary: summary,
      apiLogs: logs // Include all the detailed logs
    });

  } catch (error) {
    logs.push({
      type: 'ERROR',
      message: 'Fatal error occurred',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error('Error checking invoice number:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check invoice number',
        apiLogs: logs // Include logs even on error
      },
      { status: 500 }
    );
  }
}