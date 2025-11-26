import { createAdminClient } from '@/lib/supabase/admin';

export interface PaymentData {
  billcomInvoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  billcomPaymentId?: string;
  status?: string;
}

export interface ProposalPaymentStages {
  deposit_amount: number;
  progress_payment_amount: number;
  final_payment_amount: number;
  total: number;
}

/**
 * Identify which payment stage based on amount with tolerance
 */
export function identifyPaymentStage(
  proposal: any,
  paidAmount: number,
  tolerance: number = 5
): 'deposit' | 'rough_in' | 'final' | 'partial' {
  // Check deposit
  if (Math.abs(paidAmount - (proposal.deposit_amount || 0)) <= tolerance) {
    return 'deposit';
  }
  
  // Check rough-in/progress payment
  if (Math.abs(paidAmount - (proposal.progress_payment_amount || 0)) <= tolerance) {
    return 'rough_in';
  }
  
  // Check final payment
  if (Math.abs(paidAmount - (proposal.final_payment_amount || 0)) <= tolerance) {
    return 'final';
  }
  
  // If no match, it's a partial or custom payment
  return 'partial';
}

/**
 * Determine the next payment stage status based on current stage
 */
export function getNextPaymentStage(currentStage: string): {
  payment_stage: string;
  current_payment_stage: string;
} {
  switch (currentStage) {
    case 'deposit':
      return {
        payment_stage: 'deposit_paid',
        current_payment_stage: 'rough_in'
      };
    case 'rough_in':
      return {
        payment_stage: 'rough_in_paid',
        current_payment_stage: 'final'
      };
    case 'final':
      return {
        payment_stage: 'paid_in_full',
        current_payment_stage: 'complete'
      };
    default:
      return {
        payment_stage: 'partial_payment',
        current_payment_stage: currentStage
      };
  }
}

/**
 * Calculate payment stages based on proposal total
 */
export function calculatePaymentStages(
  total: number,
  depositPercentage: number = 50,
  progressPercentage: number = 30,
  finalPercentage: number = 20
): ProposalPaymentStages {
  const deposit = Math.round((total * depositPercentage / 100) * 100) / 100;
  const progress = Math.round((total * progressPercentage / 100) * 100) / 100;
  const final = Math.round((total * finalPercentage / 100) * 100) / 100;
  
  // Adjust for rounding to ensure total matches
  const calculatedTotal = deposit + progress + final;
  const difference = total - calculatedTotal;
  
  return {
    deposit_amount: deposit,
    progress_payment_amount: progress,
    final_payment_amount: final + difference, // Add any rounding difference to final
    total: total
  };
}

/**
 * Process a payment and update all related records
 */
export async function processPayment(
  proposalId: string,
  paymentData: PaymentData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  
  try {
    // Get the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();
    
    if (proposalError || !proposal) {
      return { 
        success: false, 
        error: 'Proposal not found' 
      };
    }
    
    // Identify the payment stage
    const stage = identifyPaymentStage(proposal, paymentData.amount);
    
    // Get the next stage information
    const nextStage = getNextPaymentStage(stage);
    
    // Prepare proposal updates
    const proposalUpdates: any = {
      total_paid: (proposal.total_paid || 0) + paymentData.amount,
      ...nextStage,
      billcom_last_sync_at: new Date().toISOString()
    };
    
    // Add stage-specific updates
    switch (stage) {
      case 'deposit':
        proposalUpdates.deposit_paid_at = paymentData.paymentDate;
        proposalUpdates.billcom_deposit_status = 'PAID';
        break;
      case 'rough_in':
        proposalUpdates.progress_paid_at = paymentData.paymentDate;
        proposalUpdates.billcom_roughin_status = 'PAID';
        break;
      case 'final':
        proposalUpdates.final_paid_at = paymentData.paymentDate;
        proposalUpdates.billcom_final_status = 'PAID';
        break;
    }
    
    // Update the proposal
    const { error: updateError } = await supabase
      .from('proposals')
      .update(proposalUpdates)
      .eq('id', proposalId);
    
    if (updateError) {
      return { 
        success: false, 
        error: `Failed to update proposal: ${updateError.message}` 
      };
    }
    
    // Update the job if it exists
    if (proposal.job_id) {
      await supabase
        .from('jobs')
        .update({
          payment_status: proposalUpdates.payment_stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.job_id);
    }
    
    // Log the payment
    await supabase.from('billcom_payment_log').insert({
      proposal_id: proposalId,
      billcom_invoice_id: paymentData.billcomInvoiceId,
      payment_stage: stage,
      amount_paid: paymentData.amount,
      payment_date: paymentData.paymentDate,
      billcom_payment_id: paymentData.billcomPaymentId,
      payment_method: paymentData.paymentMethod || 'bill.com'
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error processing payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Validate payment amount against expected stage amount
 */
export function validatePaymentAmount(
  expectedAmount: number,
  actualAmount: number,
  tolerance: number = 5
): { valid: boolean; difference: number } {
  const difference = Math.abs(expectedAmount - actualAmount);
  return {
    valid: difference <= tolerance,
    difference: actualAmount - expectedAmount
  };
}

/**
 * Get Bill.com invoice ID for a specific payment stage
 */
export function getBillcomInvoiceIdForStage(
  proposal: any,
  stage: 'deposit' | 'rough_in' | 'final'
): string | null {
  switch (stage) {
    case 'deposit':
      return proposal.billcom_deposit_invoice_id;
    case 'rough_in':
      return proposal.billcom_roughin_invoice_id;
    case 'final':
      return proposal.billcom_final_invoice_id;
    default:
      return null;
  }
}

/**
 * Get all Bill.com invoice IDs from a proposal
 */
export function getAllBillcomInvoiceIds(proposal: any): string[] {
  const ids: string[] = [];
  
  if (proposal.billcom_deposit_invoice_id) {
    ids.push(proposal.billcom_deposit_invoice_id);
  }
  if (proposal.billcom_roughin_invoice_id) {
    ids.push(proposal.billcom_roughin_invoice_id);
  }
  if (proposal.billcom_final_invoice_id) {
    ids.push(proposal.billcom_final_invoice_id);
  }
  
  return ids;
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pending',
    'deposit_paid': 'Deposit Paid',
    'rough_in_paid': 'Rough-in Paid',
    'paid_in_full': 'Paid in Full',
    'partial_payment': 'Partial Payment',
    'PAID': 'Paid',
    'PENDING': 'Pending',
    'OVERDUE': 'Overdue',
    'CANCELLED': 'Cancelled'
  };
  
  return statusMap[status] || status;
}

/**
 * Check if a proposal is fully paid
 */
export function isProposalFullyPaid(proposal: any): boolean {
  return proposal.payment_stage === 'paid_in_full' ||
         proposal.current_payment_stage === 'complete' ||
         (proposal.total_paid >= proposal.total);
}

/**
 * Get the current payment due for a proposal
 */
export function getCurrentPaymentDue(proposal: any): {
  stage: string;
  amount: number;
  invoiceId: string | null;
} {
  // Check what hasn't been paid yet
  if (!proposal.deposit_paid_at) {
    return {
      stage: 'deposit',
      amount: proposal.deposit_amount || 0,
      invoiceId: proposal.billcom_deposit_invoice_id
    };
  }
  
  if (!proposal.progress_paid_at) {
    return {
      stage: 'rough_in',
      amount: proposal.progress_payment_amount || 0,
      invoiceId: proposal.billcom_roughin_invoice_id
    };
  }
  
  if (!proposal.final_paid_at) {
    return {
      stage: 'final',
      amount: proposal.final_payment_amount || 0,
      invoiceId: proposal.billcom_final_invoice_id
    };
  }
  
  // Everything is paid
  return {
    stage: 'complete',
    amount: 0,
    invoiceId: null
  };
}