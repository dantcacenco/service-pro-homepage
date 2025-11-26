import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * TODO: Implement ReceivedPay API for payment tracking
 *
 * Bill.com's ReceivedPay object records when payments are received from customers.
 * We should use this to mark the 50%, 30%, and 20% invoices as paid.
 *
 * API Endpoint: /v2/Crud/Read/ReceivedPay.json
 *
 * Example:
 * POST https://api.bill.com/api/v2/Crud/Read/ReceivedPay.json
 * Body: {
 *   devKey: "...",
 *   sessionId: "...",
 *   data: { id: "0rp..." } // ReceivedPay ID begins with 0rp
 * }
 *
 * Response includes:
 * - receivedPay.status: "0" (Paid), "1" (Void), etc.
 * - receivedPay.invoicePays: Array of invoices paid
 *   - invoicePays[].invoiceId: Invoice ID (begins with 00e)
 *   - invoicePays[].amount: Amount paid
 *   - invoicePays[].paymentDate: Payment date
 *
 * Use this to:
 * 1. Check if deposit invoice (50%) is paid
 * 2. Check if rough-in invoice (30%) is paid
 * 3. Check if final invoice (20%) is paid
 * 4. Update proposal payment stages accordingly
 */

// CRITICAL SAFETY SETTINGS
const CUTOFF_DATE = '2025-09-16T00:00:00Z'; // Only process invoices created after this date
const DRY_RUN = process.env.REMINDER_DRY_RUN === 'true'; // Set to false in production
const CRON_SECRET = process.env.CRON_SECRET;

// Email timing (in days)
const INITIAL_REMINDER_DAYS = 0; // Send immediately when job stage complete
const FOLLOWUP_REMINDER_DAYS = 7; // 7 days after job completion
const BOSS_NOTIFICATION_DAYS = 14; // 14 days after job completion

// Note: Cron runs once daily at 8 AM (Hobby plan limitation)

// Bill.com API credentials using sync token (no password needed)
const BILLCOM_AUTH = {
  devKey: process.env.BILLCOM_DEV_KEY,
  syncToken: process.env.BILLCOM_SYNC_TOKEN || '02NDQ-RPKOE-FQ2uz-y3XB7-KTDpR-vXJua-pUKql-8Zasr-v',
  orgId: process.env.BILLCOM_ORG_ID,
  apiUrl: process.env.BILLCOM_API_URL || 'https://app02.us.bill.com/api'
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing
// Main cron job handler
export async function GET(request: NextRequest) {
  console.log('=== Bill.com Payment Polling Cron Job Started ===');
  console.log(`DRY RUN MODE: ${DRY_RUN ? 'ENABLED' : 'DISABLED'}`);
  console.log(`CUTOFF DATE: ${CUTOFF_DATE}`);
  
  const startTime = Date.now();
  
  // Security check for cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createAdminClient();
  
  // Initialize tracking variables
  let invoicesChecked = 0;
  let paymentsFound = 0;
  let remindersSent = 0;
  const errors: any[] = [];
  
  try {
    // Step 1: Get all proposals that need checking
    // CRITICAL: Only get proposals with invoices created after cutoff date
    const { data: proposals, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .gte('billcom_invoices_created_at', CUTOFF_DATE) // SAFETY FILTER
      .or('billcom_deposit_status.neq.PAID,billcom_roughin_status.neq.PAID,billcom_final_status.neq.PAID')
      .order('created_at', { ascending: false });
    
    if (proposalError) {
      throw new Error(`Failed to fetch proposals: ${proposalError.message}`);
    }
    
    console.log(`Found ${proposals?.length || 0} proposals to check (after ${CUTOFF_DATE})`);
    
    // Step 2: Authenticate with Bill.com using sync token
    const sessionId = await authenticateWithBillcom();
    if (!sessionId) {
      throw new Error('Failed to authenticate with Bill.com');
    }
    
    // Step 3: Process each proposal
    for (const proposal of proposals || []) {
      try {
        // Additional safety check
        if (!proposal.billcom_invoices_created_at || 
            new Date(proposal.billcom_invoices_created_at) < new Date(CUTOFF_DATE)) {
          console.log(`Skipping proposal ${proposal.id} - created before cutoff date`);
          continue;
        }
        
        // Fetch customer and job data
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', proposal.customer_id)
          .single();
        
        const { data: job } = proposal.job_id ? await supabase
          .from('jobs')
          .select('*')
          .eq('id', proposal.job_id)
          .single() : { data: null };
        
        // Attach to proposal for consistency
        proposal.customer = customer;
        proposal.job = job;
        
        invoicesChecked++;
        
        // Check each payment stage
        const stages = [
          { 
            invoiceId: proposal.billcom_deposit_invoice_id,
            status: proposal.billcom_deposit_status,
            stage: 'deposit',
            reminderSentField: 'deposit_reminder_sent_at',
            followupSentField: 'deposit_followup_sent_at',
            bossSentField: 'deposit_boss_notified_at',
            amount: proposal.deposit_amount
          },
          {
            invoiceId: proposal.billcom_roughin_invoice_id,
            status: proposal.billcom_roughin_status,
            stage: 'roughin',
            reminderSentField: 'roughin_reminder_sent_at',
            followupSentField: 'roughin_followup_sent_at',
            bossSentField: 'roughin_boss_notified_at',
            amount: proposal.progress_payment_amount,
            requiresCompletion: 'roughin_completed_at'
          }          ,{
            invoiceId: proposal.billcom_final_invoice_id,
            status: proposal.billcom_final_status,
            stage: 'final',
            reminderSentField: 'final_reminder_sent_at',
            followupSentField: 'final_followup_sent_at',
            bossSentField: 'final_boss_notified_at',
            amount: proposal.final_payment_amount,
            requiresCompletion: 'final_completed_at'
          }
        ];
        
        for (const stageInfo of stages) {
          if (!stageInfo.invoiceId || stageInfo.status === 'PAID') {
            continue;
          }
          
          // Check payment status in Bill.com
          const { isPaid, invoice } = await checkInvoiceStatus(sessionId, stageInfo.invoiceId);

          if (isPaid && invoice) {
            // Update payment status in database and create payment record
            paymentsFound++;
            await updatePaymentStatus(supabase, proposal, stageInfo.stage, invoice);
          } else {
            // Check if we need to send reminders
            if (stageInfo.requiresCompletion && proposal.job) {
              const completedAt = proposal.job[stageInfo.requiresCompletion];
              if (completedAt) {
                await processReminders(
                  supabase,
                  proposal,
                  stageInfo,
                  completedAt,
                  remindersSent
                );
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing proposal ${proposal.id}:`, error);
        errors.push({
          proposal_id: proposal.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Step 4: Log the polling results
    const duration = Date.now() - startTime;
    
    await supabase.from('billcom_polling_log').insert({
      polled_at: new Date().toISOString(),
      invoices_checked: invoicesChecked,
      payments_found: paymentsFound,
      reminders_sent: remindersSent,
      cutoff_filter_applied: true,
      dry_run: DRY_RUN,
      duration_ms: duration,
      errors: errors.length > 0 ? errors : null
    });
    
    // Step 5: Cleanup old logs (older than 72 hours)
    // This runs occasionally to keep the log table clean
    if (Math.random() < 0.1) { // Run cleanup 10% of the time
      const cleanupResult = await supabase
        .from('billcom_polling_log')
        .delete()
        .lt('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());
      
      if (cleanupResult.error) {
        console.log('Cleanup error:', cleanupResult.error);
      } else {
        console.log('Cleaned up old polling logs');
      }
    }
    
    console.log('=== Polling Complete ===');
    console.log(`Invoices checked: ${invoicesChecked}`);
    console.log(`Payments found: ${paymentsFound}`);
    console.log(`Reminders sent: ${remindersSent}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Errors: ${errors.length}`);
    
    return NextResponse.json({
      success: true,
      invoices_checked: invoicesChecked,
      payments_found: paymentsFound,
      reminders_sent: remindersSent,
      duration_ms: duration,
      dry_run: DRY_RUN,
      errors: errors.length
    });
    
  } catch (error) {
    console.error('Cron job failed:', error);
    
    // Log the error
    await supabase.from('billcom_polling_log').insert({
      polled_at: new Date().toISOString(),
      invoices_checked: invoicesChecked,
      payments_found: paymentsFound,
      reminders_sent: remindersSent,
      cutoff_filter_applied: true,
      dry_run: DRY_RUN,
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }]
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function: Authenticate with Bill.com
async function authenticateWithBillcom(): Promise<string | null> {
  try {
    console.log('Authenticating with Bill.com...');
    
    // Using regular authentication until sync token is properly configured
    const response = await fetch(`${BILLCOM_AUTH.apiUrl}/v2/Login.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_AUTH.devKey!,
        userName: process.env.BILLCOM_USERNAME!,
        password: process.env.BILLCOM_PASSWORD!,
        orgId: BILLCOM_AUTH.orgId!
      }).toString()
    });
    
    const result = await response.json();
    
    if (result.response_status === 0) {
      console.log('Bill.com authentication successful');
      return result.response_data.sessionId;
    } else {
      console.error('Bill.com authentication failed:', result);
      return null;
    }
  } catch (error) {
    console.error('Error authenticating with Bill.com:', error);
    return null;
  }
}

// Helper function: Check invoice payment status in Bill.com and return full invoice data
async function checkInvoiceStatus(sessionId: string, invoiceId: string): Promise<{ isPaid: boolean; invoice: any | null }> {
  try {
    // Use List/Invoice.json instead of GetInvoice.json to avoid "Access restricted" error (BDC_1210)
    // List endpoint returns full invoice objects including invoiceLineItems array
    const response = await fetch(`${BILLCOM_AUTH.apiUrl}/v2/List/Invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        devKey: BILLCOM_AUTH.devKey!,
        sessionId: sessionId,
        data: JSON.stringify({
          start: 0,
          max: 1,
          filters: [
            { field: 'id', op: '=', value: invoiceId }
          ]
        })
      }).toString()
    });

    const result = await response.json();

    if (result.response_status === 0 && result.response_data && result.response_data.length > 0) {
      const invoice = result.response_data[0];
      // Check if invoice is paid (paymentStatus 4 = Paid in Bill.com)
      const isPaid = invoice.paymentStatus === '4' ||
                     invoice.paymentStatus === 'PAID' ||
                     invoice.amountDue === 0;

      return { isPaid, invoice };
    }

    return { isPaid: false, invoice: null };
  } catch (error) {
    console.error(`Error checking invoice ${invoiceId}:`, error);
    return { isPaid: false, invoice: null };
  }
}

// Helper function: Extract tax data from Bill.com invoice line items
function extractTaxFromInvoice(invoice: any): {
  subtotal: number;
  stateTaxAmount: number;
  countyTaxAmount: number;
  totalAmount: number;
} {
  // Bill.com invoice structure:
  // - invoiceLineItems: array of line items
  // - Each item has: amount, description, entity (could be "State Tax", "County Tax", etc.)

  let subtotal = 0;
  let stateTaxAmount = 0;
  let countyTaxAmount = 0;

  const lineItems = invoice.invoiceLineItems || [];

  for (const item of lineItems) {
    const description = (item.description || '').toLowerCase();
    const amount = Number(item.amount) || 0;

    // Identify tax line items by description
    if (description.includes('state tax') || description.includes('nc state') || description.includes('state sales tax')) {
      stateTaxAmount += amount;
    } else if (description.includes('county tax') || description.includes('county') && description.includes('tax')) {
      countyTaxAmount += amount;
    } else {
      // Non-tax line items contribute to subtotal
      subtotal += amount;
    }
  }

  const totalAmount = Number(invoice.amount) || (subtotal + stateTaxAmount + countyTaxAmount);

  return {
    subtotal,
    stateTaxAmount,
    countyTaxAmount,
    totalAmount
  };
}

// Helper function: Update payment status in database and create payment record
async function updatePaymentStatus(
  supabase: any,
  proposal: any,
  stage: string,
  invoice: any
) {
  console.log(`Payment detected for ${stage} stage of proposal ${proposal.id}`);

  const statusField = `billcom_${stage}_status`;
  const paidAtField = stage === 'roughin' ? 'progress_paid_at' : `${stage}_paid_at`;

  const updates: any = {
    [statusField]: 'PAID',
    [paidAtField]: new Date().toISOString(),
    billcom_last_sync_at: new Date().toISOString()
  };

  // Update payment stage
  if (stage === 'deposit') {
    updates.payment_stage = 'deposit_paid';
    updates.current_payment_stage = 'rough_in';
  } else if (stage === 'roughin') {
    updates.payment_stage = 'rough_in_paid';
    updates.current_payment_stage = 'final';
  } else if (stage === 'final') {
    updates.payment_stage = 'paid_in_full';
    updates.current_payment_stage = 'complete';
  }

  // Calculate new total paid
  const amount = stage === 'deposit' ? proposal.deposit_amount :
                 stage === 'roughin' ? proposal.progress_payment_amount :
                 proposal.final_payment_amount;

  updates.total_paid = (proposal.total_paid || 0) + (amount || 0);

  // Update proposal in database
  const { error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', proposal.id);

  if (error) {
    console.error(`Error updating proposal ${proposal.id}:`, error);
    return;
  }

  console.log(`Proposal ${proposal.id} updated for ${stage} payment`);

  // Extract tax data from Bill.com invoice (source of truth!)
  const taxData = extractTaxFromInvoice(invoice);

  console.log(`Tax extracted from Bill.com invoice:`, taxData);

  // Create payment record in payments table with tax breakdown
  const paymentData = {
    proposal_id: proposal.id,
    amount: taxData.totalAmount,
    subtotal: taxData.subtotal,
    state_tax_amount: taxData.stateTaxAmount,
    county_tax_amount: taxData.countyTaxAmount,
    county: proposal.county || 'Unknown County',
    status: 'completed',
    payment_stage: stage,
    payment_source: 'billcom',
    payment_method: invoice.paymentMethod || 'bill.com',
    billcom_invoice_id: invoice.id,
    billcom_payment_id: invoice.receivedPayId || null,
    billcom_payment_date: new Date().toISOString(),
    customer_email: proposal.customer?.email || null,
    metadata: {
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate,
      paid_via_cron: true,
      stage: stage
    }
  };

  const { error: paymentError, data: paymentRecord } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  if (paymentError) {
    console.error(`Error creating payment record for ${proposal.id}:`, paymentError);
  } else {
    console.log(`✅ Payment record created: ${paymentRecord.id}`);
    console.log(`   - Subtotal: $${taxData.subtotal.toFixed(2)}`);
    console.log(`   - State Tax: $${taxData.stateTaxAmount.toFixed(2)}`);
    console.log(`   - County Tax (${proposal.county}): $${taxData.countyTaxAmount.toFixed(2)}`);
    console.log(`   - Total: $${taxData.totalAmount.toFixed(2)}`);
  }

  // Auto-check payment checkboxes in job's stage_steps
  if (proposal.job_id) {
    await autoCheckPaymentCheckbox(supabase, proposal.job_id, stage);
  }
}

// Helper function: Auto-check payment checkboxes in job's stage_steps
async function autoCheckPaymentCheckbox(
  supabase: any,
  jobId: string,
  stage: string
) {
  try {
    // Fetch current job with stage_steps
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('stage_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.log(`Could not fetch job ${jobId} to update checkbox:`, fetchError);
      return;
    }

    const stageSteps = job.stage_steps || {};

    // Determine which checkbox to check based on payment stage
    const checkboxName = stage === 'deposit' ? 'deposit_invoice_paid' :
                         stage === 'roughin' ? 'roughin_invoice_paid' :
                         stage === 'final' ? 'final_invoice_paid' : null;

    if (!checkboxName) {
      console.log(`Unknown stage for checkbox: ${stage}`);
      return;
    }

    // Check if checkbox exists in stage_steps
    if (!stageSteps[checkboxName]) {
      console.log(`Checkbox "${checkboxName}" not found in job ${jobId} stage_steps`);
      return;
    }

    // Check if already completed
    if (stageSteps[checkboxName].completed) {
      console.log(`Checkbox "${checkboxName}" already checked for job ${jobId}`);
      return;
    }

    // Update the checkbox to completed
    const updatedSteps = {
      ...stageSteps,
      [checkboxName]: {
        ...stageSteps[checkboxName],
        completed: true,
        completed_at: new Date().toISOString(),
        notes: `Auto-completed: Payment detected via Bill.com sync`
      }
    };

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ stage_steps: updatedSteps })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Error updating job ${jobId} checkbox:`, updateError);
    } else {
      console.log(`✅ Auto-checked "${checkboxName}" for job ${jobId}`);
    }
  } catch (error) {
    console.error(`Error in autoCheckPaymentCheckbox:`, error);
  }
}

// Helper function: Process email reminders
async function processReminders(
  supabase: any,
  proposal: any,
  stageInfo: any,
  completedAt: string,
  remindersSent: number
) {
  // Check if customer is blacklisted
  const { data: blacklist } = await supabase
    .from('email_blacklist')
    .select('*')
    .or(`customer_id.eq.${proposal.customer?.id},proposal_id.eq.${proposal.id}`)
    .single();
  
  if (blacklist) {
    console.log(`Customer/proposal blacklisted: ${blacklist.reason}`);
    return;
  }
  
  const daysSinceCompletion = Math.floor(
    (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  console.log(`${stageInfo.stage}: ${daysSinceCompletion} days since completion`);
  
  // Initial reminder (0 days)
  if (daysSinceCompletion >= INITIAL_REMINDER_DAYS && 
      !proposal[stageInfo.reminderSentField]) {
    await sendPaymentReminder(supabase, proposal, stageInfo, 'initial');
    remindersSent++;
  }
  
  // Follow-up reminder (7 days)
  else if (daysSinceCompletion >= FOLLOWUP_REMINDER_DAYS && 
           !proposal[stageInfo.followupSentField]) {
    await sendPaymentReminder(supabase, proposal, stageInfo, 'followup');
    remindersSent++;
  }
  
  // Boss notification (14 days)
  else if (daysSinceCompletion >= BOSS_NOTIFICATION_DAYS && 
           !proposal[stageInfo.bossSentField]) {
    await sendBossNotification(supabase, proposal, stageInfo);
    remindersSent++;
  }
}

// Helper function: Send payment reminder email
async function sendPaymentReminder(
  supabase: any,
  proposal: any,
  stageInfo: any,
  reminderType: 'initial' | 'followup'
) {
  const customer = proposal.customer;
  if (!customer?.email) {
    console.error('No customer email for proposal:', proposal.id);
    return;
  }
  
  const stageName = stageInfo.stage === 'roughin' ? 'Rough-in' : 
                    stageInfo.stage.charAt(0).toUpperCase() + stageInfo.stage.slice(1);
  
  const subject = reminderType === 'initial' 
    ? `Payment Due: ${stageName} Payment for Job #${proposal.job_number || proposal.proposal_number}`
    : `Payment Reminder: ${stageName} Payment Outstanding`;
  
  const paymentLink = stageInfo.stage === 'deposit' ? proposal.billcom_deposit_invoice_link :
                      stageInfo.stage === 'roughin' ? proposal.billcom_roughin_invoice_link :
                      proposal.billcom_final_invoice_link;
  
  const emailContent = reminderType === 'initial' ? `
    <h2>Payment Due</h2>
    <p>Dear ${customer.name || 'Valued Customer'},</p>
    <p>The ${stageName.toLowerCase()} stage of your HVAC project has been completed.</p>
    <p><strong>Amount Due: $${stageInfo.amount?.toFixed(2) || '0.00'}</strong></p>
    <p>Please click the link below to make your payment:</p>
    <p><a href="${paymentLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a></p>
    <p>Thank you for your business!</p>
    <p>Fair Air Heating & Cooling</p>
  ` : `    <h2>Payment Reminder</h2>
    <p>Dear ${customer.name || 'Valued Customer'},</p>
    <p>This is a friendly reminder that your ${stageName.toLowerCase()} payment is still outstanding.</p>
    <p>The ${stageName.toLowerCase()} stage was completed 7 days ago.</p>
    <p><strong>Amount Due: $${stageInfo.amount?.toFixed(2) || '0.00'}</strong></p>
    <p>Please click the link below to make your payment at your earliest convenience:</p>
    <p><a href="${paymentLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a></p>
    <p>If you have any questions or have already made this payment, please contact us immediately.</p>
    <p>Thank you,<br>Fair Air Heating & Cooling</p>
  `;
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send ${reminderType} email to ${customer.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Stage: ${stageName}`);
    console.log(`Amount: $${stageInfo.amount}`);
  } else {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
        to: customer.email,
        replyTo: process.env.REPLY_TO_EMAIL || 'fairairhc@gmail.com',
        subject: subject,
        html: emailContent
      });
      
      console.log(`${reminderType} reminder sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      return; // Don't update database if email failed
    }
  }
  
  // Update database to record reminder sent
  const updateField = reminderType === 'initial' 
    ? stageInfo.reminderSentField 
    : stageInfo.followupSentField;
  
  await supabase
    .from('proposals')
    .update({ [updateField]: new Date().toISOString() })
    .eq('id', proposal.id);
}

// Helper function: Send boss notification
async function sendBossNotification(
  supabase: any,
  proposal: any,
  stageInfo: any
) {
  const customer = proposal.customer;
  const bossEmail = process.env.BUSINESS_EMAIL || 'dantcacenco@gmail.com';
  
  const stageName = stageInfo.stage === 'roughin' ? 'Rough-in' : 
                    stageInfo.stage.charAt(0).toUpperCase() + stageInfo.stage.slice(1);
  
  const subject = `⚠️ ACTION REQUIRED: ${stageName} Payment 14 Days Overdue - ${customer?.name || 'Unknown Customer'}`;
  
  const emailContent = `
    <h2 style="color: #dc2626;">Payment Collection Required</h2>
    <p><strong>Customer:</strong> ${customer?.name || 'Unknown'}</p>
    <p><strong>Email:</strong> ${customer?.email || 'No email'}</p>
    <p><strong>Phone:</strong> ${customer?.phone || 'No phone'}</p>
    <p><strong>Address:</strong> ${customer?.address || 'No address'}</p>
    <hr>
    <p><strong>Job Number:</strong> ${proposal.job_number || proposal.proposal_number}</p>
    <p><strong>Stage:</strong> ${stageName}</p>
    <p><strong>Amount Due:</strong> $${stageInfo.amount?.toFixed(2) || '0.00'}</p>
    <p><strong>Days Overdue:</strong> 14+ days</p>
    <hr>
    <p><strong>Actions Taken:</strong></p>
    <ul>
      <li>Initial reminder sent on completion</li>
      <li>Follow-up reminder sent after 7 days</li>
      <li>This is the final automated notification</li>
    </ul>
    <p><strong>Recommended Actions:</strong></p>
    <ul>
      <li>Call customer directly</li>
      <li>Consider payment plan options</li>
      <li>Review job hold policies</li>
    </ul>
    <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/proposals/${proposal.id}" 
          style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Proposal</a></p>
  `;
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send boss notification for ${customer?.name}`);
    console.log(`To: ${bossEmail}`);
    console.log(`Stage: ${stageName}, Amount: $${stageInfo.amount}`);
  } else {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@fairairhc.service-pro.app',
        to: bossEmail,
        subject: subject,
        html: emailContent
      });
      
      console.log(`Boss notification sent for ${customer?.name}`);
    } catch (error) {
      console.error('Error sending boss notification:', error);
      return;
    }
  }
  
  // Update database
  await supabase
    .from('proposals')
    .update({ [stageInfo.bossSentField]: new Date().toISOString() })
    .eq('id', proposal.id);
}

// POST handler for manual triggering (useful for testing)
export async function POST(request: NextRequest) {
  console.log('Manual trigger of Bill.com payment check');
  return GET(request);
}