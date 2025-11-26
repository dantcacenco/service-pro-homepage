'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Proposal {
  id: string
  proposal_number: string
  title: string
  total: number
  status: string
  customers: Array<{ name: string; email: string }> | null
}

interface ProposalsCardProps {
  proposals: Proposal[]
}

export default function ProposalsCard({ proposals }: ProposalsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'deposit paid': 'bg-blue-100 text-blue-800',
      'rough-in paid': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      paid: 'bg-emerald-100 text-emerald-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Proposals</CardTitle>
          <Link href="/proposals" className="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/proposals/${proposal.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    #{proposal.proposal_number}
                  </Link>
                  <p className="text-sm text-gray-600 truncate">{proposal.title}</p>
                  <p className="text-xs text-gray-500">
                    {proposal.customers?.[0]?.name || 'No customer'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-medium">{formatCurrency(proposal.total)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No proposals yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
