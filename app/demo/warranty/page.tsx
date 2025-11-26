'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, FileText, Wrench, TrendingUp, Mail } from 'lucide-react'
import PlansAndPricing from './PlansAndPricing'
import ActiveContracts from './ActiveContracts'
import ServiceCalls from './ServiceCalls'
import Profitability from './Profitability'
import MaintenanceGlobalSettings from './MaintenanceGlobalSettings'

export default function WarrantyPage() {
  const [activeTab, setActiveTab] = useState('plans')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Warranty & Maintenance</h1>
        <p className="text-gray-600 mt-1">
          Manage warranty contracts, maintenance schedules, and profitability tracking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Plans & Pricing</span>
            <span className="sm:hidden">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Active Contracts</span>
            <span className="sm:hidden">Contracts</span>
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Service Calls</span>
            <span className="sm:hidden">Service</span>
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Profitability</span>
            <span className="sm:hidden">Profit</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email Builder</span>
            <span className="sm:hidden">Email</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlansAndPricing />
        </TabsContent>

        <TabsContent value="contracts">
          <ActiveContracts />
        </TabsContent>

        <TabsContent value="service">
          <ServiceCalls />
        </TabsContent>

        <TabsContent value="profit">
          <Profitability />
        </TabsContent>

        <TabsContent value="email">
          <MaintenanceGlobalSettings initialSettings={{}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
