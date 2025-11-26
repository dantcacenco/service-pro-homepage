'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import ActiveContractsTab from './ActiveContractsTab'
import MaintenanceScheduleTab from './MaintenanceScheduleTab'
import ServiceCallsTab from './ServiceCallsTab'
import ProfitabilityReportTab from './ProfitabilityReportTab'
import WarrantySettingsTab from './WarrantySettingsTab'

interface WarrantyDashboardProps {
  contracts: any[]
  maintenanceSchedules: any[]
  serviceCalls: any[]
  settings: any
  summaryData: {
    activeContractsCount: number
    totalAnnualRevenue: number
    netProfitYTD: number
    upcomingRenewalsCount: number
    pendingMaintenanceCount: number
  }
  userRole: string
}

export default function WarrantyDashboard({
  contracts,
  maintenanceSchedules,
  serviceCalls,
  settings,
  summaryData,
  userRole
}: WarrantyDashboardProps) {
  const [activeTab, setActiveTab] = useState('contracts')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warranty & Maintenance</h1>
          <p className="text-muted-foreground">
            Manage contracts, schedules, and recurring revenue tracking
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.activeContractsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Annual Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.totalAnnualRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summaryData.netProfitYTD >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(summaryData.netProfitYTD)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.upcomingRenewalsCount}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.pendingMaintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Visits to schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Active Contracts</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
          <TabsTrigger value="service">Service Calls</TabsTrigger>
          <TabsTrigger value="profitability">Profitability Report</TabsTrigger>
          {userRole === 'boss' || userRole === 'admin' ? (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="contracts">
          <ActiveContractsTab contracts={contracts} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceScheduleTab schedules={maintenanceSchedules} />
        </TabsContent>

        <TabsContent value="service">
          <ServiceCallsTab serviceCalls={serviceCalls} />
        </TabsContent>

        <TabsContent value="profitability">
          <ProfitabilityReportTab contracts={contracts} />
        </TabsContent>

        {userRole === 'boss' || userRole === 'admin' ? (
          <TabsContent value="settings">
            <WarrantySettingsTab settings={settings} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
