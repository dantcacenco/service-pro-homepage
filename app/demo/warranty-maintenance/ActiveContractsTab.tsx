'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ActiveContractsTabProps {
  contracts: any[]
}

export default function ActiveContractsTab({ contracts }: ActiveContractsTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      cancelled: 'outline'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getContractTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      maintenance_only: 'Maintenance Only',
      warranty_only: 'Warranty Only',
      both: 'Maintenance + Warranty'
    }
    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    )
  }

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600'
    if (profit < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Warranty Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No warranty contracts found. Create your first contract to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Annual Price</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.customers?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.customers?.email || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getContractTypeBadge(contract.contract_type)}
                    </TableCell>
                    <TableCell>
                      Year {contract.current_year} of {contract.max_years}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(contract.annual_price || 0))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(contract.total_paid || 0))}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getProfitColor(Number(contract.net_profit || 0))}`}>
                        {formatCurrency(Number(contract.net_profit || 0))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDate(contract.next_renewal_date)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
