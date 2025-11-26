import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { syncStatusAndStage, type JobStatus } from '@/lib/stages/sync'
import { type JobStage } from '@/lib/stages/definitions'
import { initializeJobStage } from '@/lib/stages/auto-complete'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Create service role client (bypasses RLS)
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
    
    // Validate required fields
    if (!body.customer_id || !body.title) {
      return NextResponse.json(
        { error: 'Customer ID and title are required' },
        { status: 400 }
      )
    }
    
    // Generate job number
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
    }
    
    const jobNumber = `JOB-${today}-${nextNumber.toString().padStart(3, '0')}`
    
    // Get the admin user for created_by field
    const { data: adminUser } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('role', 'boss')
      .limit(1)
      .single()
    
    const createdBy = adminUser?.id || 'd59c31b1-ccce-4fe8-be8d-7295ec41f7ac' // Fallback
    
    // Create job data
    const jobData = {
      job_number: jobNumber,
      customer_id: body.customer_id,
      proposal_id: body.proposal_id || null,
      title: body.title,
      description: body.description || null,
      job_type: body.job_type || 'repair',
      status: body.status || 'scheduled',
      service_address: body.service_address || null,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      total_value: body.total_value || 0,
      notes: body.notes || null,
      created_by: createdBy
    }
    
    // Create the job
    const { data: newJob, error: jobError } = await serviceSupabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
    
    if (jobError) {
      console.error('Job creation error:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError.message },
        { status: 500 }
      )
    }
    
    // If technicians were selected, create job_technicians records
    if (body.technicianIds && body.technicianIds.length > 0) {
      const technicianAssignments = body.technicianIds.map((techId: string) => ({
        job_id: newJob.id,
        technician_id: techId,
        assigned_at: new Date().toISOString()
      }))
      
      const { error: techError } = await serviceSupabase
        .from('job_technicians')
        .insert(technicianAssignments)
      
      if (techError) {
        console.error('Technician assignment error:', techError)
        // Don't fail the whole request, just log the error
      }
    }
    
    // If linked to a proposal, update the proposal
    if (body.proposal_id) {
      await serviceSupabase
        .from('proposals')
        .update({
          job_id: newJob.id,
          job_auto_created: false // This is a manual job creation
        })
        .eq('id', body.proposal_id)
    }

    // Initialize stage data for the new job
    await initializeJobStage(newJob.id, !!body.proposal_id)

    // Fetch the updated job with stage data
    const { data: finalJob } = await serviceSupabase
      .from('jobs')
      .select('*')
      .eq('id', newJob.id)
      .single()

    return NextResponse.json({
      success: true,
      job: finalJob || newJob
    })
    
  } catch (error: any) {
    console.error('Job creation exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Job creation endpoint',
    method: 'POST',
    requiredFields: ['customer_id', 'title'],
    optionalFields: [
      'proposal_id', 'description', 'job_type', 'status',
      'service_address', 'scheduled_date', 'scheduled_time',
      'total_value', 'notes', 'technicianIds'
    ]
  })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Create service role client (bypasses RLS)
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

    // Fetch current job data
    const { data: currentJob, error: fetchError } = await serviceSupabase
      .from('jobs')
      .select('id, status, stage, stage_steps')
      .eq('id', body.jobId)
      .single()

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: 'Job not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Handle status update with stage sync
    if (body.status && body.status !== currentJob.status) {
      const syncResult = syncStatusAndStage(
        body.status as JobStatus,
        currentJob.stage as JobStage,
        currentJob.stage_steps || {},
        'status'
      )
      updateData.status = syncResult.status
      updateData.stage = syncResult.stage
    }

    // Handle stage update with status sync
    if (body.stage && body.stage !== currentJob.stage) {
      const syncResult = syncStatusAndStage(
        currentJob.status as JobStatus,
        body.stage as JobStage,
        body.stage_steps || currentJob.stage_steps || {},
        'stage'
      )
      updateData.status = syncResult.status
      updateData.stage = syncResult.stage
    }

    // Handle stage_steps update
    if (body.stage_steps) {
      updateData.stage_steps = body.stage_steps
    }

    // Handle stage_history update (append, don't replace)
    if (body.stage_history) {
      updateData.stage_history = body.stage_history
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update job
    const { data: updatedJob, error: updateError } = await serviceSupabase
      .from('jobs')
      .update(updateData)
      .eq('id', body.jobId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Job update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      job: updatedJob
    })

  } catch (error: any) {
    console.error('Job update exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
