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

interface ServiceCallsTabProps {
  serviceCalls: any[]
}

export default function ServiceCallsTab({ serviceCalls }: ServiceCallsTabProps) {
  const formatDateTime = (datetime: string | null) => {
    if (!datetime) return 'N/A'
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      reported: { variant: 'secondary', label: 'Reported' },
      scheduled: { variant: 'outline', label: 'Scheduled' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'default', label: 'Completed' },
      parts_ordered: { variant: 'secondary', label: 'Parts Ordered' },
      denied: { variant: 'destructive', label: 'Denied' }
    }
    const statusInfo = variants[status] || { variant: 'outline', label: status }
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warranty Service Calls</CardTitle>
      </CardHeader>
      <CardContent>
        {serviceCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No service calls recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Call Date</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      {call.call_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.customers?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {call.customers?.phone || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.warranty_contracts?.contract_number || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={call.issue_description}>
                        {call.issue_description}
                      </div>
                      {call.status === 'denied' && call.denial_reason && (
                        <div className="text-xs text-red-600 mt-1">
                          Denied: {call.denial_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(call.call_date)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(call.scheduled_datetime)}
                    </TableCell>
                    <TableCell>
                      {call.profiles?.full_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(call.total_cost || 0))}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(call.status)}
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
