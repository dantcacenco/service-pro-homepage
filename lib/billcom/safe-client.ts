// lib/billcom/safe-client.ts
// Minimal, safe Bill.com client for production use
// Only creates invoices, never modifies existing ones

import { createClient } from '@/lib/supabase/server';

// Configuration with multiple safety layers
export const BILLCOM_CONFIG = {
  // Must explicitly enable Bill.com
  enabled: process.env.BILLCOM_ENABLED === 'true',
  
  // Mode: 'readonly', 'test', 'production'
  mode: process.env.BILLCOM_MODE || 'readonly',
  
  // Optional: Limit to specific test customer email
  testCustomerEmail: process.env.BILLCOM_TEST_CUSTOMER_EMAIL,
  
  // API configuration
  apiKey: process.env.BILLCOM_API_KEY,
  apiUrl: process.env.BILLCOM_API_URL || 'https://api.bill.com/v3',
  
  // Safety limits
  maxRetries: 2,
  retryDelay: 1000, // ms
  requestTimeout: 10000, // ms
};

// Types for type safety
interface CreateInvoiceData {
  customerEmail: string;
  customerName: string;
  amount: number;
  description: string;
  invoiceNumber: string;
  dueDate: string;
  metadata?: Record<string, any>;
}

interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'VOID';
  amount: number;
  balance?: number;
  customerEmail: string;
  createdDate: string;
  dueDate: string;
  paymentLink?: string;
}

interface AuditLogEntry {
  proposalId: string;
  action: string;
  mode: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  duration?: number;
}

// Audit logging for safety and debugging
async function logAudit(entry: AuditLogEntry) {
  const supabase = await createClient();
  
  try {
    await supabase
      .from('billcom_audit_log')
      .insert({
        proposal_id: entry.proposalId,
        action: entry.action,
        mode: entry.mode,
        request_data: entry.requestData,
        response_data: entry.responseData,
        error_message: entry.errorMessage,
        duration_ms: entry.duration,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    // Don't let logging failures break the main flow
    console.error('Audit logging failed:', error);
  }
}

// Safe API request wrapper with timeout and retry
async function safeApiRequest<T>(
  url: string,
  options: RequestInit,
  retries = BILLCOM_CONFIG.maxRetries
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BILLCOM_CONFIG.requestTimeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Bill.com API error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage += ` - ${errorText}`;
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(errorMessage);
      }

      // Retry on server errors (5xx)
      if (retries > 0 && response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, BILLCOM_CONFIG.retryDelay));
        return safeApiRequest<T>(url, options, retries - 1);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Bill.com API request timeout');
    }
    
    throw error;
  }
}

export class SafeBillcomClient {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    if (!BILLCOM_CONFIG.apiKey) {
      throw new Error('BILLCOM_API_KEY is not configured');
    }
    
    this.apiKey = BILLCOM_CONFIG.apiKey;
    this.apiUrl = BILLCOM_CONFIG.apiUrl;
  }

  // Check if we can proceed with operations
  async canOperate(proposalId: string, customerEmail?: string): Promise<{
    canProceed: boolean;
    reason?: string;
  }> {
    // Check 1: Is Bill.com enabled?
    if (!BILLCOM_CONFIG.enabled) {
      return { canProceed: false, reason: 'Bill.com integration is disabled' };
    }

    // Check 2: Are we in readonly mode?
    if (BILLCOM_CONFIG.mode === 'readonly') {
      return { canProceed: false, reason: 'Bill.com is in read-only mode' };
    }

    // Check 3: Test customer restriction
    if (BILLCOM_CONFIG.testCustomerEmail && 
        customerEmail && 
        customerEmail !== BILLCOM_CONFIG.testCustomerEmail) {
      return { 
        canProceed: false, 
        reason: `Test mode - only ${BILLCOM_CONFIG.testCustomerEmail} is allowed` 
      };
    }

    // Check 4: Check proposal state in database
    const supabase = await createClient();
    const { data: proposal } = await supabase
      .from('proposals')
      .select('billcom_creation_attempts, billcom_safe_to_retry, billcom_deposit_invoice_id')
      .eq('id', proposalId)
      .single();

    if (proposal?.billcom_deposit_invoice_id) {
      return { canProceed: false, reason: 'Invoices already exist for this proposal' };
    }

    if (proposal?.billcom_creation_attempts >= 3) {
      return { canProceed: false, reason: 'Maximum creation attempts exceeded' };
    }

    if (proposal?.billcom_safe_to_retry === false) {
      return { canProceed: false, reason: 'Manual review required - marked unsafe' };
    }

    return { canProceed: true };
  }

  // Create a single invoice - minimal data, maximum safety
  async createInvoice(
    proposalId: string,
    data: CreateInvoiceData
  ): Promise<InvoiceResponse | null> {
    const startTime = Date.now();
    const auditEntry: AuditLogEntry = {
      proposalId,
      action: 'create_invoice',
      mode: BILLCOM_CONFIG.mode,
      requestData: { ...data, apiKey: '[REDACTED]' },
    };

    try {
      // Pre-flight safety check
      const { canProceed, reason } = await this.canOperate(proposalId, data.customerEmail);
      if (!canProceed) {
        throw new Error(reason);
      }

      // Increment attempt counter
      await this.incrementAttemptCounter(proposalId);

      // Create the invoice using the Bill.com API
      // Note: This is a simplified version - actual API may differ
      const invoice = await safeApiRequest<InvoiceResponse>(
        `${this.apiUrl}/invoices`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Bill-API-Version': '3.0',
          },
          body: JSON.stringify({
            customer: {
              email: data.customerEmail,
              name: data.customerName,
            },
            amount: data.amount,
            description: data.description,
            invoiceNumber: data.invoiceNumber,
            dueDate: data.dueDate,
            // Minimal data - no line items, let Bill.com handle defaults
          }),
        }
      );

      auditEntry.responseData = invoice;
      auditEntry.duration = Date.now() - startTime;
      await logAudit(auditEntry);

      return invoice;
    } catch (error: any) {
      auditEntry.errorMessage = error.message;
      auditEntry.duration = Date.now() - startTime;
      await logAudit(auditEntry);

      // Mark as unsafe to retry if certain errors
      if (error.message.includes('duplicate') || 
          error.message.includes('customer not found')) {
        await this.markUnsafeToRetry(proposalId, error.message);
      }

      console.error('Invoice creation failed:', error);
      return null;
    }
  }

  // Get invoice details (read-only, always safe)
  async getInvoice(invoiceId: string): Promise<InvoiceResponse | null> {
    try {
      const invoice = await safeApiRequest<InvoiceResponse>(
        `${this.apiUrl}/invoices/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Bill-API-Version': '3.0',
          },
        }
      );

      return invoice;
    } catch (error) {
      console.error('Failed to get invoice:', error);
      return null;
    }
  }

  // Get payment link for an invoice
  async getPaymentLink(invoiceId: string): Promise<string | null> {
    try {
      const response = await safeApiRequest<{ paymentUrl: string }>(
        `${this.apiUrl}/invoices/${invoiceId}/payment-link`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Bill-API-Version': '3.0',
          },
        }
      );

      return response.paymentUrl;
    } catch (error) {
      console.error('Failed to get payment link:', error);
      return null;
    }
  }

  // Helper: Increment attempt counter
  private async incrementAttemptCounter(proposalId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase.rpc('increment', {
      table_name: 'proposals',
      column_name: 'billcom_creation_attempts',
      row_id: proposalId,
    }).throwOnError();
  }

  // Helper: Mark proposal as unsafe to retry
  private async markUnsafeToRetry(proposalId: string, error: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('proposals')
      .update({
        billcom_safe_to_retry: false,
        billcom_last_error: error,
      })
      .eq('id', proposalId);
  }

  // Check for duplicate invoice number (defensive)
  private async checkDuplicateInvoiceNumber(invoiceNumber: string): Promise<boolean> {
    // This would need to be implemented based on your tracking system
    // For now, we'll just check our database
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('billcom_audit_log')
      .select('id')
      .eq('action', 'create_invoice')
      .ilike('request_data->invoiceNumber', invoiceNumber)
      .not('error_message', 'is', null)
      .limit(1);

    return !!(data && data.length > 0);
  }

  // NO UPDATE METHODS - keeping it safe
  // NO DELETE METHODS - never touch existing data
  // NO CUSTOMER MANAGEMENT - let Bill.com handle it
}

// Monitoring function to check system health
export async function monitorBillcomHealth(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const supabase = await createClient();
  const issues: string[] = [];

  // Check for stuck invoices
  const { data: healthData } = await supabase
    .from('billcom_health_monitor')
    .select('*')
    .single();

  if (healthData) {
    if (healthData.stuck_proposals > 0) {
      issues.push(`${healthData.stuck_proposals} proposals need manual review`);
    }
    
    if (healthData.max_attempts_reached > 0) {
      issues.push(`${healthData.max_attempts_reached} proposals reached max attempts`);
    }
  }

  // Check for recent failures
  const { data: recentFailures } = await supabase
    .from('billcom_audit_log')
    .select('*')
    .not('error_message', 'is', null)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(10);

  if (recentFailures && recentFailures.length > 5) {
    issues.push(`High failure rate: ${recentFailures.length} errors in last hour`);
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}

// Export singleton instance
let client: SafeBillcomClient | null = null;

export function getSafeBillcomClient(): SafeBillcomClient {
  if (!client) {
    client = new SafeBillcomClient();
  }
  return client;
}