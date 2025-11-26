'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Plus, Download } from 'lucide-react'

export default function ServiceCalls() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Warranty Service Calls
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Service Call
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">Reported</Button>
            <Button variant="ghost" size="sm">Scheduled</Button>
            <Button variant="ghost" size="sm">In Progress</Button>
            <Button variant="ghost" size="sm">Completed</Button>
            <Button variant="ghost" size="sm">Denied</Button>
          </div>

          {/* Empty State */}
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service calls yet</h3>
            <p className="text-gray-600 mb-4">
              Service calls will appear here when customers report issues under warranty
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Service Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
