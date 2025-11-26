'use client'

import StageKanban from '@/components/dashboard/StageKanban'
import JobNotesChecklist from '@/components/dashboard/JobNotesChecklist'
import ProposalsCard from '@/components/dashboard/ProposalsCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import InvoiceStatsCards from '@/components/InvoiceStatsCards'
import ConnectTeamUpload from '@/components/dashboard/ConnectTeamUpload'

interface DashboardData {
  metrics: {
    totalProposals: number
    totalRevenue: number
    approvedProposals: number
    conversionRate: number
    paymentRate: number
  }
  monthlyRevenue: Array<{
    month: string
    revenue: number
    proposals: number
  }>
  statusCounts: {
    draft: number
    sent: number
    viewed: number
    approved: number
    rejected: number
    paid: number
  }
  recentProposals: Array<{
    id: string
    proposal_number: string
    title: string
    total: number
    status: string
    created_at: string
    customers: Array<{ name: string; email: string }> | null
  }>
  recentActivities: Array<{
    id: string
    activity_type: string
    description: string
    created_at: string
  }>
  jobs: any[]
  notes: any[]
}

interface DashboardContentProps {
  data: DashboardData
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const { recentProposals, recentActivities, jobs, notes } = data

  return (
    <div className="space-y-6">
      {/* Bill.com Invoice Stats - At the top for visibility */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Bill.com Invoice Overview</h2>
        <InvoiceStatsCards />
      </div>

      {/* Jobs Kanban Board - Stage-Based */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Jobs by Stage</h2>
        <StageKanban initialJobs={jobs} />
      </div>

      {/* Job Notes Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Job Notes & Tasks</h2>
          <ConnectTeamUpload />
        </div>
        <JobNotesChecklist initialNotes={notes} />
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProposalsCard proposals={recentProposals} />
        <ActivityFeed activities={recentActivities} />
      </div>
    </div>
  )
}
