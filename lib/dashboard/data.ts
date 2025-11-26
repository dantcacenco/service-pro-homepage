/**
 * Dashboard Data Fetching
 * Handles all Supabase queries for dashboard data
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Fetch proposals with customer data
 */
export async function fetchProposals() {
  const supabase = await createClient()
  
  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      *,
      customers (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  return proposals || []
}

/**
 * Fetch jobs for kanban board (not archived/cancelled)
 * Includes stage data for stage-based kanban system
 */
export async function fetchJobs() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      title,
      status,
      stage,
      stage_steps,
      stage_history,
      service_address,
      scheduled_date,
      created_at,
      customers (name),
      assigned_technician:assigned_technician_id (full_name)
    `)
    .not('status', 'in', '("archived", "cancelled")')
    .order('created_at', { ascending: false })
    .limit(200)

  return jobs || []
}

/**
 * Fetch all jobs with notes for aggregation
 */
export async function fetchJobsWithNotes() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      service_address,
      boss_notes_status,
      additional_notes_status,
      materials_notes_status
    `)
    .not('status', 'in', '("archived", "cancelled")')

  return jobs || []
}

/**
 * Fetch recent jobs for activity feed
 */
export async function fetchRecentJobs() {
  const supabase = await createClient()
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, customers(name)')
    .order('updated_at', { ascending: false })
    .limit(20)

  return jobs || []
}

/**
 * Fetch technician assignments for activity feed
 */
export async function fetchTechAssignments() {
  const supabase = await createClient()
  
  const { data: assignments } = await supabase
    .from('job_technicians')
    .select(`
      *,
      jobs:job_id (job_number),
      profiles:technician_id (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return assignments || []
}
