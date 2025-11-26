'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, User, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Job {
  id: string
  job_number: string
  title: string
  status: string
  service_address: string | null
  scheduled_date: string | null
  created_at: string
  customer?: { name: string }
  assigned_technician?: { full_name: string }
}

interface JobsKanbanProps {
  initialJobs: Job[]
}

const STATUS_COLUMNS = [
  { id: 'not_scheduled', label: 'Not Scheduled', color: 'bg-gray-100 border-gray-300' },
  { id: 'estimate', label: 'Estimate', color: 'bg-blue-100 border-blue-300' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-purple-100 border-purple-300' },
  { id: 'ask_vadim', label: 'Ask Vadim', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'start_up', label: 'Start Up', color: 'bg-cyan-100 border-cyan-300' },
  { id: 'working_on_it', label: 'Working On It', color: 'bg-orange-100 border-orange-300' },
  { id: 'parts_needed', label: 'Parts Needed', color: 'bg-red-100 border-red-300' },
  { id: 'done', label: 'Done', color: 'bg-green-100 border-green-300' },
]

export default function JobsKanban({ initialJobs }: JobsKanbanProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('30days')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filterJobsByDate = (jobs: Job[]) => {
    if (dateFilter === 'all') return jobs

    const now = new Date()
    const cutoffDate = new Date()

    switch (dateFilter) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30days':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90days':
        cutoffDate.setDate(now.getDate() - 90)
        break
    }

    return jobs.filter(job => {
      const jobDate = new Date(job.created_at)
      return jobDate >= cutoffDate
    })
  }

  const getJobsByStatus = (status: string) => {
    const filtered = filterJobsByDate(jobs)
    return filtered
      .filter(job => job.status === status)
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
    const newStatus = over.id as string

    // Optimistic update
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    )

    // Update on server
    try {
      const response = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update job status')

      toast.success('Job status updated')
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job status')

      // Revert on error
      setJobs(initialJobs)
    }
  }

  const activeJob = activeId ? jobs.find(j => j.id === activeId) : null

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <div className="flex gap-2">
        <Button
          variant={dateFilter === '7days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('7days')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateFilter === '30days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('30days')}
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateFilter === '90days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('90days')}
        >
          Last 90 Days
        </Button>
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('all')}
        >
          All Time
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
          {STATUS_COLUMNS.map(column => {
            const columnJobs = getJobsByStatus(column.id)

            return (
              <div
                key={column.id}
                className="flex flex-col"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg border-2 ${column.color}`}>
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <span className="text-xs text-gray-600">{columnJobs.length} jobs</span>
                </div>

                {/* Drop Zone */}
                <DroppableColumn id={column.id}>
                  {columnJobs.map(job => (
                    <DraggableJobCard key={job.id} job={job} />
                  ))}
                </DroppableColumn>
              </div>
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
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-sm">{activeJob.job_number}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activeJob.title}</p>
                  </div>
                </div>

                {activeJob.customer && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span className="truncate">{activeJob.customer.name}</span>
                  </div>
                )}

                {activeJob.service_address && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{activeJob.service_address}</span>
                  </div>
                )}

                {activeJob.scheduled_date && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(activeJob.scheduled_date).toLocaleDateString()}</span>
                  </div>
                )}

                {activeJob.assigned_technician && (
                  <Badge variant="outline" className="text-xs">
                    {activeJob.assigned_technician.full_name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex-1 p-2 bg-gray-50 rounded-b-lg border-2 border-t-0 border-gray-200 min-h-[400px] space-y-2"
    >
      {children}
    </div>
  )
}

function DraggableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/jobs/${job.id}`} onClick={(e) => isDragging && e.preventDefault()}>
        <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-sm">{job.job_number}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{job.title}</p>
              </div>
            </div>

            {job.customer && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span className="truncate">{job.customer.name}</span>
              </div>
            )}

            {job.service_address && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{job.service_address}</span>
              </div>
            )}

            {job.scheduled_date && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
              </div>
            )}

            {job.assigned_technician && (
              <Badge variant="outline" className="text-xs">
                {job.assigned_technician.full_name}
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
