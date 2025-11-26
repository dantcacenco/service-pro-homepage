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

interface MaintenanceScheduleTabProps {
  schedules: any[]
}

export default function MaintenanceScheduleTab({ schedules }: MaintenanceScheduleTabProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (datetime: string | null) => {
    if (!datetime) return 'Not scheduled'
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      customer_contacted: { variant: 'outline', label: 'Customer Contacted' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      completed: { variant: 'default', label: 'Completed' },
      missed: { variant: 'destructive', label: 'Missed' },
      cancelled: { variant: 'outline', label: 'Cancelled' }
    }
    const statusInfo = variants[status] || { variant: 'outline', label: status }
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    )
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed' || status === 'cancelled') return false
    return new Date(dueDate) < new Date()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No maintenance visits scheduled.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Visit #</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => {
                  const overdue = isOverdue(schedule.due_date, schedule.status)
                  return (
                    <TableRow key={schedule.id} className={overdue ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">
                        {schedule.schedule_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{schedule.customers?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.customers?.phone || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {schedule.warranty_contracts?.contract_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        Visit {schedule.visit_number}
                      </TableCell>
                      <TableCell>
                        <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(schedule.due_date)}
                          {overdue && <span className="ml-1">(Overdue)</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(schedule.scheduled_datetime)}
                      </TableCell>
                      <TableCell>
                        {schedule.profiles?.full_name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(schedule.status)}
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
  )
}
