'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Briefcase, Loader2 } from 'lucide-react'

interface CreateJobButtonProps {
  proposal: any
}

export default function CreateJobButton({ proposal }: CreateJobButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreateJob = async () => {
    const confirmed = window.confirm('Create a job from this proposal?')
    if (!confirmed) return

    setIsCreating(true)
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate job number
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      
      // Get count of jobs created today
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .ilike('job_number', `JOB-${dateStr}-%`)

      const jobNumber = `JOB-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`

      // Get customer info - handle both array and object format
      const customer = Array.isArray(proposal.customers) 
        ? proposal.customers[0] 
        : proposal.customers

      if (!customer) {
        throw new Error('No customer data found for this proposal')
      }

      console.log('Creating job with data:', {
        job_number: jobNumber,
        customer_id: proposal.customer_id,
        customer_name: customer.name,
        proposal_id: proposal.id
      })

      // Create the job with all required fields
      const jobData = {
        job_number: jobNumber,
        customer_id: proposal.customer_id,
        proposal_id: proposal.id,
        title: proposal.title || 'Job from Proposal',
        description: `Created from Proposal #${proposal.proposal_number}`,
        job_type: 'installation', // Default type
        status: 'not_scheduled',
        service_address: customer.address || '',
        service_city: customer.city || '',
        service_state: customer.state || '',
        service_zip: customer.zip || '',
        total_value: proposal.total || 0,
        created_by: user.id,
        // Denormalized customer fields
        customer_name: customer.name || '',
        customer_email: customer.email || '',
        customer_phone: customer.phone || ''
      }

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single()

      if (jobError) {
        console.error('Job creation error:', jobError)
        throw new Error(jobError.message || 'Failed to create job')
      }

      // Update proposal to mark job as created
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ job_created: true })
        .eq('id', proposal.id)

      if (updateError) {
        console.error('Error updating proposal:', updateError)
      }

      toast.success(`Job ${jobNumber} created successfully!`)
      router.push(`/jobs/${job.id}`)
    } catch (error: any) {
      console.error('Error creating job:', error)
      toast.error(error.message || 'Failed to create job')
    } finally {
      setIsCreating(false)
    }
  }

  // Don't show button if job already created or proposal not approved
  if (proposal.job_created || proposal.status !== 'approved') {
    return null
  }

  return (
    <button
      onClick={handleCreateJob}
      disabled={isCreating}
      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Briefcase className="h-4 w-4" />
          Create Job
        </>
      )}
    </button>
  )
}
