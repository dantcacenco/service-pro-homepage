import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const logs: string[] = []
  
  try {
    logs.push('=== JOB CREATION TEST STARTED ===')
    
    // Create service role client
    logs.push('Creating service role client...')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    logs.push('✅ Service client created')
    
    // Get the most recent approved proposal without a job
    logs.push('Fetching most recent approved proposal without job...')
    const { data: proposals, error: proposalError } = await serviceSupabase
      .from('proposals')
      .select('id, proposal_number, customer_id, title, total, customers(address)')
      .eq('status', 'approved')
      .is('job_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (proposalError) {
      logs.push(`❌ Error fetching proposal: ${proposalError.message}`)
      return NextResponse.json({ success: false, logs, error: proposalError })
    }
    
    if (!proposals || proposals.length === 0) {
      logs.push('⚠️ No approved proposals without jobs found')
      return NextResponse.json({ success: false, logs, message: 'No proposals to test with' })
    }
    
    const proposal: any = proposals[0]
    logs.push(`✅ Found proposal: ${proposal.proposal_number} (ID: ${proposal.id})`)
    logs.push(`   Customer ID: ${proposal.customer_id}`)
    logs.push(`   Title: ${proposal.title}`)
    logs.push(`   Total: $${proposal.total}`)
    
    // Get customer address
    const customerAddress = proposal.customers?.[0]?.address || proposal.customers?.address || ''
    
    // Generate job number
    logs.push('Generating job number...')
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const { data: lastJob } = await serviceSupabase
      .from('jobs')
      .select('job_number')
      .like('job_number', `JOB-${today}-%`)
      .order('job_number', { ascending: false })
      .limit(1)
      .single()
    
    let nextNumber = 1
    if (lastJob) {
      const match = lastJob.job_number.match(/JOB-\d{8}-(\d{3})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
      logs.push(`   Last job: ${lastJob.job_number}`)
    }
    
    const jobNumber = `JOB-${today}-${nextNumber.toString().padStart(3, '0')}`
    logs.push(`✅ Generated job number: ${jobNumber}`)
    
    // Get the first boss/admin user for created_by field (required foreign key)
    logs.push('Fetching admin user for created_by field...')
    const { data: adminUser } = await serviceSupabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'boss')
      .limit(1)
      .single()
    
    const createdBy = adminUser?.id || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac' // Fallback
    logs.push(`✅ Using created_by: ${createdBy} (${adminUser?.email || 'fallback admin'})`)
    
    // Test 1: Try to create job
    logs.push('TEST 1: Creating job with service role client...')
    const jobData = {
      job_number: jobNumber,
      proposal_id: proposal.id,
      customer_id: proposal.customer_id,
      title: proposal.title || `Job from Proposal #${proposal.proposal_number}`,
      job_type: 'installation',
      status: 'scheduled',
      service_address: customerAddress,
      notes: `Test job creation from ${proposal.proposal_number}`,
      created_by: createdBy
    }
    
    logs.push(`Job data: ${JSON.stringify(jobData, null, 2)}`)
    
    const { data: newJob, error: jobError } = await serviceSupabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
    
    if (jobError) {
      logs.push(`❌ Job creation failed: ${jobError.message}`)
      logs.push(`   Error code: ${jobError.code}`)
      logs.push(`   Error details: ${JSON.stringify(jobError, null, 2)}`)
      return NextResponse.json({ success: false, logs, error: jobError })
    }
    
    logs.push(`✅ Job created successfully!`)
    logs.push(`   Job ID: ${newJob.id}`)
    logs.push(`   Job Number: ${newJob.job_number}`)
    
    // Test 2: Update proposal with job_id
    logs.push('TEST 2: Updating proposal with job_id...')
    const { error: updateError } = await serviceSupabase
      .from('proposals')
      .update({ 
        job_auto_created: true,
        job_id: newJob.id
      })
      .eq('id', proposal.id)
    
    if (updateError) {
      logs.push(`❌ Proposal update failed: ${updateError.message}`)
      return NextResponse.json({ success: false, logs, error: updateError, jobCreated: true, jobId: newJob.id })
    }
    
    logs.push(`✅ Proposal updated successfully!`)
    logs.push('=== JOB CREATION TEST COMPLETED ===')
    
    return NextResponse.json({ 
      success: true, 
      logs,
      jobId: newJob.id,
      jobNumber: newJob.job_number,
      proposalId: proposal.id,
      proposalNumber: proposal.proposal_number
    })
    
  } catch (error: any) {
    logs.push(`❌ EXCEPTION: ${error.message}`)
    logs.push(`   Stack: ${error.stack}`)
    return NextResponse.json({ success: false, logs, error: error.message })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to test job creation',
    instructions: 'Send POST request to this endpoint to test job creation for most recent approved proposal without a job'
  })
}
