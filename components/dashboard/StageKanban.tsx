/**
 * StageKanban Component
 * Main kanban board with 4 stage columns
 */

'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { StageColumn } from '@/components/stages/StageColumn'
import { StageCard } from '@/components/stages/StageCard'
import { type JobStage, STAGES_IN_ORDER, type StepStatus } from '@/lib/stages/definitions'
import { Card, CardContent } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'

// Helper function to get the start and end of the current week (Sunday to Saturday)
function getCurrentWeek() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday

  // Get Sunday of current week
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - dayOfWeek)
  sunday.setHours(0, 0, 0, 0)

  // Get Saturday of current week
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(23, 59, 59, 999)

  return { sunday, saturday }
}

// Format date to YYYY-MM-DD for input[type="date"]
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Job {
  id: string
  job_number: string
  title: string
  stage: JobStage
  stage_steps: Record<string, StepStatus>
  service_address: string | null
  scheduled_date: string | null
  created_at: string
  customers?: { name: string }
  assigned_technician?: { full_name: string }
}

interface StageKanbanProps {
  initialJobs: Job[]
}

export default function StageKanban({ initialJobs }: StageKanbanProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Initialize with current week
  const { sunday, saturday } = getCurrentWeek()
  const [dateFrom, setDateFrom] = useState<string>(formatDateForInput(sunday))
  const [dateTo, setDateTo] = useState<string>(formatDateForInput(saturday))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filterJobsByDate = (jobs: Job[]) => {
    if (!dateFrom && !dateTo) return jobs

    return jobs.filter((job) => {
      const jobDate = new Date(job.created_at)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null

      // Set time to end of day for toDate
      if (toDate) {
        toDate.setHours(23, 59, 59, 999)
      }

      // Set time to start of day for fromDate
      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0)
      }

      if (fromDate && toDate) {
        return jobDate >= fromDate && jobDate <= toDate
      } else if (fromDate) {
        return jobDate >= fromDate
      } else if (toDate) {
        return jobDate <= toDate
      }

      return true
    })
  }

  const getJobsByStage = (stage: JobStage) => {
    const filtered = filterJobsByDate(jobs)
    return filtered
      .filter((job) => job.stage === stage)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 7) // Max 7 jobs per column
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const jobId = active.id as string
    const newStage = over.id as JobStage

    // Find the job being moved
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    // Optimistic update
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, stage: newStage } : job))
    )

    // Update on server
    try {
      const response = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, stage: newStage }),
      })

      if (!response.ok) throw new Error('Failed to update job stage')

      const data = await response.json()

      // Update with server response (includes synced status)
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? { ...job, ...data.job } : job))
      )

      toast.success('Job moved to new stage')
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job stage')

      // Revert on error
      setJobs(initialJobs)
    }
  }

  const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null

  // Only show active stages (not completed)
  const activeStages = STAGES_IN_ORDER.filter((stage) => stage !== 'completed')

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm font-medium text-gray-700">
            Date From:
          </label>
          <input
            type="date"
            id="date-from"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm font-medium text-gray-700">
            Date To:
          </label>
          <input
            type="date"
            id="date-to"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const { sunday, saturday } = getCurrentWeek()
            setDateFrom(formatDateForInput(sunday))
            setDateTo(formatDateForInput(saturday))
          }}
        >
          This Week
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {activeStages.map((stage) => {
            const stageJobs = getJobsByStage(stage)

            return (
              <StageColumn key={stage} stage={stage} jobCount={stageJobs.length}>
                {stageJobs.map((job) => (
                  <StageCard key={job.id} job={job} />
                ))}
              </StageColumn>
            )
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeJob ? (
            <Card className="cursor-grabbing shadow-lg">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activeJob.job_number}</p>
                    <p className="text-xs text-gray-600">{activeJob.title}</p>
                  </div>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
