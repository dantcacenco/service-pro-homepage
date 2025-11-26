import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/app/DashboardContent'
import MaintenanceChecker from '@/components/MaintenanceChecker'
import { InvoiceRetryChecker } from '@/components/InvoiceRetryChecker'

// Import dashboard data modules
import {
  fetchProposals,
  fetchJobs,
  fetchJobsWithNotes,
  fetchRecentJobs,
  fetchTechAssignments
} from '@/lib/dashboard/data'
import {
  calculateMetrics,
  calculateStatusCounts,
  calculateMonthlyRevenue
} from '@/lib/dashboard/metrics'
import {
  generateProposalActivities,
  generateJobActivities,
  generateTechAssignmentActivities,
  combineActivities
} from '@/lib/dashboard/activities'
import { aggregateJobNotes } from '@/lib/dashboard/notes'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check user role - handle missing profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If no profile exists, create a default admin profile for this user
  if (!profile) {
    console.log('No profile found for user, treating as admin')
  } else if (profile.role !== 'boss' && profile.role !== 'admin') {
    // Not an admin or boss
    redirect('/')
  }

  // Fetch all dashboard data using modular functions
  const proposals = await fetchProposals()
  const jobs = await fetchJobs()
  const jobsWithNotes = await fetchJobsWithNotes()
  const recentJobs = await fetchRecentJobs()
  const techAssignments = await fetchTechAssignments()

  // Calculate metrics
  const metrics = calculateMetrics(proposals)
  const statusCounts = calculateStatusCounts(proposals)
  const monthlyRevenue = calculateMonthlyRevenue(proposals)

  // Aggregate notes
  const notes = aggregateJobNotes(jobsWithNotes)

  // Generate activities
  const proposalActivities = generateProposalActivities(proposals)
  const jobActivities = generateJobActivities(recentJobs)
  const techActivities = generateTechAssignmentActivities(techAssignments)
  const recentActivities = combineActivities(proposalActivities, jobActivities, techActivities)

  // Format recent proposals for display
  const recentProposals = proposals.slice(0, 15).map(p => ({
    id: p.id,
    proposal_number: p.proposal_number,
    title: p.title || `Proposal #${p.proposal_number}`,
    total: p.total || 0,
    status: p.status,
    created_at: p.created_at,
    customers: p.customers ? [p.customers] : null
  }))

  // Build dashboard data object
  const dashboardData = {
    metrics,
    monthlyRevenue,
    statusCounts,
    recentProposals,
    recentActivities,
    jobs,
    notes
  }

  return (
    <>
      <MaintenanceChecker />
      <InvoiceRetryChecker />
      <DashboardContent data={dashboardData} />
    </>
  )
}
