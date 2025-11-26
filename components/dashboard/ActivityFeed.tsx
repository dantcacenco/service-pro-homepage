'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Activity {
  id: string
  activity_type: string
  description: string
  created_at: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      if (diffInMinutes < 1) return 'just now'
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'proposal_created':
        return '📄'
      case 'proposal_sent':
        return '📧'
      case 'proposal_approved':
        return '✅'
      case 'proposal_rejected':
        return '❌'
      case 'payment_received':
        return '💰'
      case 'job_created':
        return '🔧'
      case 'job_scheduled':
        return '📅'
      case 'job_started':
        return '🚀'
      case 'job_completed':
        return '✨'
      case 'technician_assigned':
        return '👷'
      case 'job_updated':
        return '📝'
      default:
        return '📋'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Activities</CardTitle>
          <span className="text-xs text-gray-500">Last 7 days</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {activities.length > 0 ? (
            activities.slice(0, 20).map((activity, index) => (
              <div 
                key={`${activity.activity_type}-${activity.id}-${index}`} 
                className="flex items-start space-x-3 pb-3 border-b last:border-0 hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <span className="text-xl mt-0.5 flex-shrink-0">{getActivityIcon(activity.activity_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 break-words">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No recent activities</p>
              <p className="text-xs text-gray-400 mt-2">Activities will appear here as you create proposals, receive payments, and manage jobs.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
