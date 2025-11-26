'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Download } from 'lucide-react'

export default function ActiveContracts() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Active Warranty Contracts
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Annual Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Profit YTD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">$0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Renewals Due</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-gray-600">next 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Empty State */}
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first warranty contract
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Contract
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
