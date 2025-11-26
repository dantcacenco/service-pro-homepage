/**
 * StageCard Component
 * Individual job card within a stage column
 */

'use client'

import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, User, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { StageProgress } from './StageProgress'
import { type JobStage, type StepStatus, getStageSteps } from '@/lib/stages/definitions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface StageCardProps {
  job: {
    id: string
    job_number: string
    title: string
    stage: JobStage
    stage_steps: Record<string, StepStatus>
    service_address: string | null
    scheduled_date: string | null
    customers?: { name: string }
    assigned_technician?: { full_name: string }
  }
  onExpand?: (jobId: string) => void
}

export function StageCard({ job, onExpand }: StageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on drag handle or chevron
    if ((e.target as HTMLElement).closest('[data-drag-handle]') || (e.target as HTMLElement).closest('[data-chevron]')) {
      return
    }
    router.push(`/jobs/${job.id}`)
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
    if (onExpand && !isExpanded) {
      onExpand(job.id)
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header with drag handle - only show drag handle, no job number/title */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Customer Name - moved to top */}
            {job.customers?.name && (
              <p className="font-medium text-sm text-gray-900 truncate">
                {job.customers.name}
              </p>
            )}
          </div>
          <div
            {...listeners}
            {...attributes}
            data-drag-handle
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Service Address */}
        {job.service_address && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{job.service_address}</span>
          </div>
        )}

        {/* Progress Indicator */}
        <StageProgress
          stage={job.stage}
          stageSteps={job.stage_steps || {}}
          variant="dots"
        />

        {/* Scheduled Date */}
        {job.scheduled_date && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Assigned Technician */}
        {job.assigned_technician?.full_name && (
          <Badge variant="secondary" className="text-xs">
            {job.assigned_technician.full_name}
          </Badge>
        )}

        {/* Expand/Collapse Indicator */}
        <div
          className="flex items-center justify-center pt-1 border-t cursor-pointer hover:bg-gray-50"
          data-chevron
          onClick={handleChevronClick}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {/* Expanded Content - Full Checklist */}
        {isExpanded && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs font-medium text-gray-700 mb-2">Steps:</p>
            {getStageSteps(job.stage).map((step) => {
              const stepStatus = job.stage_steps?.[step.id] || { completed: false }
              return (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                      stepStatus.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {stepStatus.completed && (
                      <svg
                        className="w-2 h-2 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className={stepStatus.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                    {step.label}
                  </span>
                </div>
              )
            })}
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/jobs/${job.id}`)
              }}
              className="text-xs text-blue-600 hover:underline block pt-2"
            >
              View job details →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
