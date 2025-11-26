'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProfitabilityReportTabProps {
  contracts: any[]
}

export default function ProfitabilityReportTab({ contracts }: ProfitabilityReportTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600'
    if (profit < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getProfitMargin = (totalPaid: number, netProfit: number) => {
    if (totalPaid === 0) return 0
    return ((netProfit / totalPaid) * 100).toFixed(1)
  }

  // Calculate totals
  const totals = contracts.reduce(
    (acc, contract) => {
      const totalPaid = Number(contract.total_paid || 0)
      const serviceCosts = Number(contract.total_service_costs || 0)
      const partsCosts = Number(contract.total_parts_costs || 0)
      const netProfit = Number(contract.net_profit || 0)

      return {
        totalRevenue: acc.totalRevenue + totalPaid,
        totalServiceCosts: acc.totalServiceCosts + serviceCosts,
        totalPartsCosts: acc.totalPartsCosts + partsCosts,
        totalNetProfit: acc.totalNetProfit + netProfit
      }
    },
    { totalRevenue: 0, totalServiceCosts: 0, totalPartsCosts: 0, totalNetProfit: 0 }
  )

  const overallMargin = getProfitMargin(totals.totalRevenue, totals.totalNetProfit)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Service Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.totalServiceCosts)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parts Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.totalPartsCosts)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(totals.totalNetProfit)}`}>
              {formatCurrency(totals.totalNetProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallMargin}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Profitability Details</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contracts to analyze.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Service Costs</TableHead>
                    <TableHead>Parts Costs</TableHead>
                    <TableHead>Total Costs</TableHead>
                    <TableHead>Net Profit</TableHead>
                    <TableHead>Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const totalPaid = Number(contract.total_paid || 0)
                    const serviceCosts = Number(contract.total_service_costs || 0)
                    const partsCosts = Number(contract.total_parts_costs || 0)
                    const totalCosts = serviceCosts + partsCosts
                    const netProfit = Number(contract.net_profit || 0)
                    const margin = getProfitMargin(totalPaid, netProfit)

                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.contract_number}
                        </TableCell>
                        <TableCell>
                          {contract.customers?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(totalPaid)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(serviceCosts)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(partsCosts)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(totalCosts)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getProfitColor(netProfit)}`}>
                            {formatCurrency(netProfit)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getProfitColor(netProfit)}>
                            {margin}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
