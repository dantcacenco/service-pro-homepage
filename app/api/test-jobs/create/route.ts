import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Test endpoint to create a job from a proposal
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { proposalId } = await request.json();
    
    if (!proposalId) {
      return NextResponse.json({
        success: false,
        message: 'Proposal ID is required'
      }, { status: 400 });
    }
    
    console.log('🔧 Job Creation Test Started');
    console.log('Proposal ID:', proposalId);
    
    const supabase = await createClient();
    
    // Step 1: Check if proposal exists
    console.log('\n📋 Step 1: Fetching proposal...');
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('❌ Proposal not found:', proposalError);
      return NextResponse.json({
        success: false,
        message: 'Proposal not found',
        error: proposalError?.message || 'Proposal does not exist',
        duration: Date.now() - startTime
      }, { status: 404 });
    }
    
    console.log('✅ Proposal found:', {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      customer: proposal.customers?.name
    });
    
    // Step 2: Check if job already exists for this proposal
    console.log('\n🔍 Step 2: Checking for existing job...');
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('proposal_id', proposalId)
      .single();
    
    if (existingJob) {
      console.log('ℹ️ Job already exists for this proposal');
      return NextResponse.json({
        success: true,
        message: 'Job already exists for this proposal',
        data: {
          job: existingJob,
          alreadyExisted: true
        },
        duration: Date.now() - startTime
      });
    }

    // Step 3: Generate job number
    console.log('\n🔢 Step 3: Generating job number...');
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
    console.log('📝 Generated job number:', jobNumber);
    
    // Step 4: Prepare job data
    console.log('\n📦 Step 4: Preparing job data...');
    const customer = proposal.customers || {};
    const jobData = {
      job_number: jobNumber,
      customer_id: proposal.customer_id,
      proposal_id: proposalId,
      title: proposal.title || 'Test Job',
      description: proposal.description || 'Created via test dashboard',
      job_type: 'installation',
      status: 'scheduled',
      service_address: customer.address || '',
      service_city: '',
      service_state: '',
      service_zip: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      notes: 'Created via test dashboard',
      // Denormalized fields for quick access
      customer_name: customer.name || '',
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
      total_value: proposal.total || 0
    };

    console.log('Job data prepared:', jobData);
    
    // Step 5: Create the job
    console.log('\n💾 Step 5: Creating job in database...');
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();
    
    if (jobError) {
      console.error('❌ Job creation failed:', jobError);
      return NextResponse.json({
        success: false,
        message: 'Failed to create job',
        error: jobError.message,
        details: jobError,
        duration: Date.now() - startTime
      }, { status: 500 });
    }
    
    console.log('✅ Job created successfully!');
    
    // Step 6: Update proposal status if needed
    if (proposal.status !== 'job_created') {
      console.log('\n🔄 Step 6: Updating proposal status...');
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ 
          status: 'job_created',
          job_number: jobNumber
        })
        .eq('id', proposalId);
      
      if (updateError) {
        console.warn('⚠️ Failed to update proposal status:', updateError);
      } else {
        console.log('✅ Proposal status updated');
      }
    }
    
    // Return success response with job details
    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      data: {
        job: newJob,
        jobNumber: jobNumber,
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          customer: customer.name
        }
      },
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}