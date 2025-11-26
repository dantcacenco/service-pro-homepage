import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBillcomClient } from '@/lib/billcom/client';

export async function POST(request: NextRequest) {
  try {
    const { proposalId, testMode } = await request.json();

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: 'Proposal ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get proposal with customer details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }
    // Check if invoices already exist
    if (proposal.billcom_deposit_invoice_id) {
      return NextResponse.json({
        success: false,
        error: 'Bill.com invoices already exist for this proposal',
        existingInvoices: {
          deposit: proposal.billcom_deposit_invoice_id,
          roughin: proposal.billcom_roughin_invoice_id,
          final: proposal.billcom_final_invoice_id
        }
      }, { status: 400 });
    }

    // Get Bill.com client
    const billcom = getBillcomClient();

    // Create or find customer in Bill.com
    let customerId = proposal.customers?.billcom_id;
    
    if (!customerId && proposal.customers) {
      try {
        const billcomCustomer = await billcom.createOrFindCustomer({
          name: proposal.customers.name,
          email: proposal.customers.email,
          phone: proposal.customers.phone || undefined,
          address: proposal.customers.address || undefined,
        });
        customerId = billcomCustomer.id;
        // Update customer with Bill.com ID
        await supabase
          .from('customers')
          .update({ 
            billcom_id: customerId,
            billcom_sync_at: new Date().toISOString()
          })
          .eq('id', proposal.customers.id);
      } catch (error) {
        console.error('Error creating/finding customer in Bill.com:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to create/find customer in Bill.com'
        }, { status: 500 });
      }
    }

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Unable to get Bill.com customer ID'
      }, { status: 400 });
    }

    // Create the three invoices
    const invoices: any = {};
    const errors: any[] = [];
    const today = new Date();
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    // Create Deposit Invoice (50%)
    if (proposal.deposit_amount > 0) {
      try {
        const depositInvoice = await billcom.createInvoice({
          customerId,
          amount: proposal.deposit_amount,
          description: `Deposit (50%) - ${proposal.proposal_number}`,
          lineItems: [{
            description: `Deposit payment for ${proposal.title || 'HVAC Service'}`,
            amount: proposal.deposit_amount,
            quantity: 1
          }],
          dueDate: dueDate.toISOString(),
          invoiceNumber: `${proposal.proposal_number}-DEPOSIT`,
          sendEmail: false // Don't auto-send for test mode
        });
        
        invoices.deposit = {
          id: depositInvoice.id,
          amount: proposal.deposit_amount,
          link: `https://app02.us.bill.com/invoice/${depositInvoice.id}`
        };
        
        // Update proposal with invoice ID
        await supabase
          .from('proposals')
          .update({ 
            billcom_deposit_invoice_id: depositInvoice.id,
            billcom_deposit_status: 'PENDING'
          })
          .eq('id', proposalId);      } catch (error) {
        console.error('Error creating deposit invoice:', error);
        errors.push({ stage: 'deposit', error: String(error) });
      }
    }

    // Create Rough-in Invoice (30%)
    if (proposal.roughin_amount > 0) {
      try {
        const roughinInvoice = await billcom.createInvoice({
          customerId,
          amount: proposal.roughin_amount,
          description: `Rough-in (30%) - ${proposal.proposal_number}`,
          lineItems: [{
            description: `Rough-in payment for ${proposal.title || 'HVAC Service'}`,
            amount: proposal.roughin_amount,
            quantity: 1
          }],
          dueDate: dueDate.toISOString(),
          invoiceNumber: `${proposal.proposal_number}-ROUGHIN`,
          sendEmail: false
        });
        
        invoices.roughin = {
          id: roughinInvoice.id,
          amount: proposal.roughin_amount,
          link: `https://app02.us.bill.com/invoice/${roughinInvoice.id}`
        };
        
        await supabase
          .from('proposals')          .update({ 
            billcom_roughin_invoice_id: roughinInvoice.id,
            billcom_roughin_status: 'PENDING'
          })
          .eq('id', proposalId);
      } catch (error) {
        console.error('Error creating rough-in invoice:', error);
        errors.push({ stage: 'roughin', error: String(error) });
      }
    }

    // Create Final Invoice (20%)
    if (proposal.final_amount > 0) {
      try {
        const finalInvoice = await billcom.createInvoice({
          customerId,
          amount: proposal.final_amount,
          description: `Final (20%) - ${proposal.proposal_number}`,
          lineItems: [{
            description: `Final payment for ${proposal.title || 'HVAC Service'}`,
            amount: proposal.final_amount,
            quantity: 1
          }],
          dueDate: dueDate.toISOString(),
          invoiceNumber: `${proposal.proposal_number}-FINAL`,
          sendEmail: false
        });
        
        invoices.final = {
          id: finalInvoice.id,
          amount: proposal.final_amount,          link: `https://app02.us.bill.com/invoice/${finalInvoice.id}`
        };
        
        await supabase
          .from('proposals')
          .update({ 
            billcom_final_invoice_id: finalInvoice.id,
            billcom_final_status: 'PENDING'
          })
          .eq('id', proposalId);
      } catch (error) {
        console.error('Error creating final invoice:', error);
        errors.push({ stage: 'final', error: String(error) });
      }
    }

    // Update the invoice creation timestamp (CRITICAL for filtering)
    await supabase
      .from('proposals')
      .update({ 
        billcom_invoices_created_at: new Date().toISOString(),
        billcom_mode: testMode ? 'test' : 'production'
      })
      .eq('id', proposalId);

    // Create test scenario record if in test mode
    if (testMode) {
      await supabase
        .from('billcom_test_scenarios')
        .insert({
          scenario_name: `Invoice Creation - ${proposal.proposal_number}`,
          proposal_id: proposalId,          customer_id: proposal.customer_id,
          test_data: {
            invoices,
            amounts: {
              deposit: proposal.deposit_amount,
              roughin: proposal.roughin_amount,
              final: proposal.final_amount
            }
          },
          test_status: errors.length > 0 ? 'failed' : 'passed'
        });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${Object.keys(invoices).length} invoices in Bill.com`,
      invoices,
      errors: errors.length > 0 ? errors : undefined,
      billcomCustomerId: customerId
    });
    
  } catch (error) {
    console.error('Error in create-staged-invoices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create Bill.com invoices',
        details: String(error)
      },
      { status: 500 }
    );
  }
}