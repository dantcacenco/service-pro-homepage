import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Test the complete automation flow: Approval → Job → Invoice
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logs: any[] = [];
  
  const log = (message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    console.log(`[${logEntry.timestamp}] ${message}`, data || '');
    logs.push(logEntry);
  };
  
  try {
    const { proposalId } = await request.json();
    
    if (!proposalId) {
      return NextResponse.json({
        success: false,
        message: 'Proposal ID is required'
      }, { status: 400 });
    }
    
    log('🚀 FULL AUTOMATION TEST STARTED', { proposalId });
    
    const supabase = await createClient();
    const results = {
      proposalUpdate: null as any,
      jobCreation: null as any,
      invoiceCreation: null as any,
      finalStatus: null as any
    };

    // STEP 1: Fetch and validate proposal
    log('\n📋 STEP 1: Fetching proposal...');
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address,
          billcom_id
        )
      `)
      .eq('id', proposalId)
      .single();
    
    if (proposalError || !proposal) {
      log('❌ Proposal not found', proposalError);
      return NextResponse.json({
        success: false,
        message: 'Proposal not found',
        error: proposalError,
        logs,
        duration: Date.now() - startTime
      }, { status: 404 });
    }
    
    log('✅ Proposal found', {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      customer: proposal.customers?.name,
      total: proposal.total
    });

    // STEP 2: Update proposal to approved status
    log('\n✅ STEP 2: Approving proposal...');
    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();
    
    if (updateError) {
      log('❌ Failed to approve proposal', updateError);
      results.proposalUpdate = { success: false, error: updateError.message };
    } else {
      log('✅ Proposal approved', { status: updatedProposal.status });
      results.proposalUpdate = { success: true, data: updatedProposal };
    }
    
    // STEP 3: Create job from proposal
    log('\n🔧 STEP 3: Creating job...');
    
    // Check if job already exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('proposal_id', proposalId)
      .single();
    
    if (existingJob) {
      log('ℹ️ Job already exists', { jobNumber: existingJob.job_number });
      results.jobCreation = { 
        success: true, 
        data: existingJob, 
        alreadyExisted: true 
      };
    } else {
      // Generate job number
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const { data: lastJob } = await supabase
        .from('jobs')
        .select('job_number')
        .like('job_number', `JOB-${today}-%`)
        .order('job_number', { ascending: false })
        .limit(1)
        .single();
      
      let nextNumber = 1;
      if (lastJob) {
        const match = lastJob.job_number.match(/JOB-\d{8}-(\d{3})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      const jobNumber = `JOB-${today}-${String(nextNumber).padStart(3, '0')}`;
      
      const customer = proposal.customers || {};
      const jobData = {
        job_number: jobNumber,
        customer_id: proposal.customer_id,
        proposal_id: proposalId,
        title: proposal.title || 'Test Job',
        description: proposal.description || 'Created via automation test',
        job_type: 'installation',
        status: 'scheduled',
        service_address: customer.address || '',
        service_city: '',
        service_state: '',
        service_zip: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        notes: 'Created via automation test',
        customer_name: customer.name || '',
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        total_value: proposal.total || 0
      };
      
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();
      
      if (jobError) {
        log('❌ Job creation failed', jobError);
        results.jobCreation = { success: false, error: jobError.message };
      } else {
        log('✅ Job created', { jobNumber: newJob.job_number });
        results.jobCreation = { success: true, data: newJob };
        
        // Update proposal with job number
        await supabase
          .from('proposals')
          .update({ job_number: jobNumber })
          .eq('id', proposalId);
      }
    }

    // STEP 4: Create Bill.com invoice
    log('\n💰 STEP 4: Creating Bill.com invoice...');
    
    try {
      // Use the correct Bill.com API URL from environment
      const apiUrl = process.env.BILLCOM_API_ENDPOINT || process.env.BILLCOM_API_URL || 'https://api.bill.com/api/v2';
      const loginUrl = `${apiUrl}/Login.json`;
      
      log('📡 Logging into Bill.com...', { url: loginUrl });
      
      const loginPayload = {
        userName: process.env.BILLCOM_USERNAME!,
        password: process.env.BILLCOM_PASSWORD!,
        devKey: process.env.BILLCOM_DEV_KEY!,
        orgId: process.env.BILLCOM_ORG_ID || ''
      };
      
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(loginPayload).toString()
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.response_status !== 0) {
        throw new Error(`Bill.com login failed: ${loginData.response_message}`);
      }
      
      const sessionId = loginData.response_data.sessionId;
      log('✅ Bill.com login successful', { sessionId });
      
      // Create invoice
      log('📄 Creating invoice...');
      const createUrl = `${apiUrl}/Create.json`;
      
      const customer = proposal.customers || {};
      const customerBillcomId = customer.billcom_id || 'CASH_CUSTOMER';
      const invoiceNumber = `INV-${Date.now()}`;
      const currentDate = new Date().toISOString().split('T')[0];
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      const dueDate = dueDateObj.toISOString().split('T')[0];
      
      const invoicePayload = {
        sessionId: sessionId,
        devKey: process.env.BILLCOM_DEV_KEY!,
        data: JSON.stringify([{
          entity: 'Invoice',
          customerId: customerBillcomId,
          invoiceNumber: invoiceNumber,
          invoiceDate: currentDate,
          dueDate: dueDate,
          description: proposal.title || 'Service Invoice',
          amount: (proposal.total || 100).toString(),
          items: [{
            entity: 'InvoiceLineItem',
            amount: (proposal.total || 100).toString(),
            description: proposal.title || 'Service',
            quantity: 1,
            price: (proposal.total || 100).toString()
          }]
        }])
      };
      
      log('Sending invoice payload...', { 
        customerId: customerBillcomId,
        amount: proposal.total,
        invoiceNumber 
      });
      
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(invoicePayload).toString()
      });
      
      const createData = await createResponse.json();
      
      if (createData.response_status === 0 && createData.response_data && createData.response_data.length > 0) {
        const invoice = createData.response_data[0];
        const paymentLink = `https://app.bill.com/CustomerPayment?id=${invoice.id}`;
        
        log('✅ Invoice created', { 
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          paymentLink 
        });
        
        // Update proposal with invoice details
        await supabase
          .from('proposals')
          .update({
            billcom_invoice_id: invoice.id,
            billcom_invoice_number: invoice.invoiceNumber,
            billcom_payment_link: paymentLink
          })
          .eq('id', proposalId);
        
        results.invoiceCreation = {
          success: true,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            paymentLink: paymentLink,
            amount: invoice.amount
          }
        };
      } else {
        throw new Error(createData.response_message || 'Failed to create invoice');
      }
    } catch (invoiceError: any) {
      log('❌ Invoice creation failed', invoiceError.message);
      results.invoiceCreation = { 
        success: false, 
        error: invoiceError.message 
      };
    }
    
    // STEP 5: Final status check
    log('\n📊 STEP 5: Final status check...');
    const { data: finalProposal } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (name, email),
        jobs!proposals_id_fkey (job_number, status)
      `)
      .eq('id', proposalId)
      .single();
    
    results.finalStatus = finalProposal;
    
    // Determine overall success
    const overallSuccess = 
      results.proposalUpdate?.success && 
      results.jobCreation?.success && 
      results.invoiceCreation?.success;
    
    log(overallSuccess ? '✅ AUTOMATION TEST COMPLETED SUCCESSFULLY' : '⚠️ AUTOMATION TEST COMPLETED WITH ISSUES');
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Full automation test completed successfully!' 
        : 'Automation test completed with some issues',
      results,
      logs,
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    log('🚨 AUTOMATION TEST FAILED', error);
    return NextResponse.json({
      success: false,
      message: 'Automation test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      logs,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}
