/**
 * Dashboard Metrics Calculation
 * Handles proposal metrics, revenue, and conversion rates
 */

interface Proposal {
  status: string
  created_at: string
  deposit_amount?: number
  deposit_paid_at?: string
  progress_payment_amount?: number
  progress_paid_at?: string
  final_payment_amount?: number
  final_paid_at?: string
}

export interface DashboardMetrics {
  totalProposals: number
  totalRevenue: number
  approvedProposals: number
  conversionRate: number
  paymentRate: number
}

export interface StatusCounts {
  draft: number
  sent: number
  viewed: number
  approved: number
  rejected: number
  paid: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  proposals: number
}

/**
 * Calculate all dashboard metrics from proposals
 */
export function calculateMetrics(proposals: Proposal[]): DashboardMetrics {
  const totalRevenue = proposals.reduce((total, proposal) => {
    let proposalRevenue = 0
    if (proposal.deposit_paid_at && proposal.deposit_amount) {
      proposalRevenue += Number(proposal.deposit_amount)
    }
    if (proposal.progress_paid_at && proposal.progress_payment_amount) {
      proposalRevenue += Number(proposal.progress_payment_amount)
    }
    if (proposal.final_paid_at && proposal.final_payment_amount) {
      proposalRevenue += Number(proposal.final_payment_amount)
    }
    return total + proposalRevenue
  }, 0)

  const approvedProposals = proposals.filter(p => 
    p.status === 'approved' || p.status === 'accepted'
  ).length
  
  const paidProposals = proposals.filter(p => 
    p.deposit_paid_at || p.progress_paid_at || p.final_paid_at
  ).length
  
  const conversionRate = proposals.length > 0 
    ? (approvedProposals / proposals.length) * 100 
    : 0
    
  const paymentRate = approvedProposals > 0 
    ? (paidProposals / approvedProposals) * 100 
    : 0

  return {
    totalProposals: proposals.length,
    totalRevenue: Math.round(totalRevenue),
    approvedProposals,
    conversionRate: Math.round(conversionRate),
    paymentRate: Math.round(paymentRate)
  }
}

/**
 * Calculate status counts from proposals
 */
export function calculateStatusCounts(proposals: Proposal[]): StatusCounts {
  const paidCount = proposals.filter(p => 
    p.deposit_paid_at || p.progress_paid_at || p.final_paid_at
  ).length

  return {
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    viewed: proposals.filter(p => p.status === 'viewed').length,
    approved: proposals.filter(p => p.status === 'approved' || p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    paid: paidCount
  }
}

/**
 * Calculate monthly revenue for the last 6 months
 */
export function calculateMonthlyRevenue(proposals: Proposal[]): MonthlyRevenue[] {
  const monthlyRevenue: MonthlyRevenue[] = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toLocaleDateString('en-US', { month: 'short' })
    
    const monthProposals = proposals.filter(p => {
      const created = new Date(p.created_at)
      return created.getMonth() === date.getMonth() && 
             created.getFullYear() === date.getFullYear()
    })
    
    const revenue = monthProposals.reduce((total, proposal) => {
      let rev = 0
      if (proposal.deposit_paid_at) rev += Number(proposal.deposit_amount || 0)
      if (proposal.progress_paid_at) rev += Number(proposal.progress_payment_amount || 0)
      if (proposal.final_paid_at) rev += Number(proposal.final_payment_amount || 0)
      return total + rev
    }, 0)
    
    monthlyRevenue.push({
      month: monthStr,
      revenue: Math.round(revenue),
      proposals: monthProposals.length
    })
  }

  return monthlyRevenue
}
