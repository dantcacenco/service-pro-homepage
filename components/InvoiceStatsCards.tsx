'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, DollarSign, AlertCircle, Loader2 } from 'lucide-react'

interface InvoiceStats {
  total: number
  paid: number
  unpaid: number
  overdue: number
  loading: boolean
  error?: string
}

export default function InvoiceStatsCards() {
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    loading: true
  })

  useEffect(() => {
    fetchInvoiceStats()
  }, [])

  const fetchInvoiceStats = async () => {
    try {
      const response = await fetch('/api/billcom/dashboard-stats')
      const data = await response.json()
      
      if (data.success) {
        setStats({
          total: data.total,
          paid: data.paid,
          unpaid: data.unpaid,
          overdue: data.overdue,
          loading: false
        })
      } else {
        setStats({
          total: 0,
          paid: 0,
          unpaid: 0,
          overdue: 0,
          loading: false,
          error: data.error
        })
      }
    } catch (error) {
      setStats({
        total: 0,
        paid: 0,
        unpaid: 0,
        overdue: 0,
        loading: false,
        error: 'Failed to load invoice stats'
      })
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    loading 
  }: { 
    title: string
    value: number
    icon: any
    color: string
    loading: boolean
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {title === 'Unpaid Invoices' && value > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Needs collection
              </p>
            )}
            {title === 'Paid Invoices' && value > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Completed
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (stats.error && !stats.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-gray-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Unable to load invoice stats from Bill.com</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Invoices"
        value={stats.total}
        icon={FileText}
        color="text-blue-600"
        loading={stats.loading}
      />
      <StatCard
        title="Unpaid Invoices"
        value={stats.unpaid}
        icon={AlertCircle}
        color="text-orange-600"
        loading={stats.loading}
      />
      <StatCard
        title="Paid Invoices"
        value={stats.paid}
        icon={DollarSign}
        color="text-green-600"
        loading={stats.loading}
      />
    </div>
  )
}