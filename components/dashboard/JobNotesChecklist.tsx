'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock, MapPin, Calendar, User, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { JobNote } from '@/app/types'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

interface JobNoteWithMeta extends JobNote {
  job_number: string
  service_address?: string
  technician_name?: string
}

interface JobNotesChecklistProps {
  initialNotes: JobNoteWithMeta[]
}

type FilterType = 'all' | 'undone' | 'in_progress' | 'done'
type DateFilterType = 'all' | '7days' | '30days' | '90days'

export default function JobNotesChecklist({ initialNotes }: JobNotesChecklistProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [notes, setNotes] = useState<JobNoteWithMeta[]>(initialNotes)
  const [filter, setFilter] = useState<FilterType>('undone')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [currentPage, setCurrentPage] = useState(() => {
    // Initialize from URL or default to 1
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })
  const [updatingNotes, setUpdatingNotes] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  const ITEMS_PER_PAGE = 5

  // Sync current page to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (currentPage > 1) {
      params.set('page', currentPage.toString())
    } else {
      params.delete('page')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [currentPage, router, searchParams])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filteredNotes = notes.filter(note => {
    // Status filter
    if (filter !== 'all' && note.status !== filter) return false

    // Date filter
    if (dateFilter !== 'all') {
      const noteDate = new Date(note.created_at).getTime()
      const now = Date.now()
      const dayInMs = 24 * 60 * 60 * 1000

      if (dateFilter === '7days' && now - noteDate > 7 * dayInMs) return false
      if (dateFilter === '30days' && now - noteDate > 30 * dayInMs) return false
      if (dateFilter === '90days' && now - noteDate > 90 * dayInMs) return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredNotes.length / ITEMS_PER_PAGE)

  // Adjust current page if it's out of bounds after filtering
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedNotes = filteredNotes.slice(startIndex, endIndex)

  const getStatusCounts = () => {
    return {
      all: notes.length,
      undone: notes.filter(n => n.status === 'undone').length,
      in_progress: notes.filter(n => n.status === 'in_progress').length,
      done: notes.filter(n => n.status === 'done').length,
    }
  }

  const counts = getStatusCounts()

  const handleStatusChange = async (noteId: string, newStatus: 'undone' | 'in_progress' | 'done') => {
    console.log('Updating note status:', noteId, 'to', newStatus)

    // Optimistic update FIRST - update note status immediately
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId
          ? { ...note, status: newStatus, updated_at: new Date().toISOString() }
          : note
      )
    )

    // Don't reset page - stay on current page
    // The useEffect will auto-adjust if the page goes out of bounds

    const statusLabel = newStatus === 'undone' ? 'not started' : newStatus === 'in_progress' ? 'started' : 'done'
    toast.success(`Note marked as ${statusLabel}`)

    // Then update backend
    setUpdatingNotes(prev => new Set(prev).add(noteId))

    try {
      const response = await fetch('/api/jobs/notes/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, status: newStatus })
      })

      const data = await response.json()
      console.log('API response:', data)

      if (!response.ok) {
        // Revert on error
        setNotes(prev =>
          prev.map(note =>
            note.id === noteId && note.status === newStatus
              ? { ...note, status: note.status, updated_at: note.updated_at }
              : note
          )
        )
        throw new Error(data.error || 'Failed to update note status')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update note status')
    } finally {
      setUpdatingNotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(noteId)
        return newSet
      })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const note = notes.find(n => n.id === event.active.id)
    console.log('Drag started:', { noteId: event.active.id, currentStatus: note?.status })
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    console.log('=== DRAG END ===')
    console.log('Active ID:', active.id)
    console.log('Over:', over)

    // Check if dropped over a valid droppable zone
    if (!over) {
      console.log('❌ No drop target - drag cancelled')
      return
    }

    // Validate it's a filter button
    const validStatuses = ['undone', 'in_progress', 'done']
    if (!validStatuses.includes(over.id as string)) {
      console.log('⚠️ Invalid drop target:', over.id)
      return
    }

    const noteId = active.id as string
    const newStatus = over.id as 'undone' | 'in_progress' | 'done'

    console.log('Target status:', newStatus)

    // Find the note
    const note = notes.find(n => n.id === noteId)
    console.log('Found note:', note ? `Yes (current status: ${note.status})` : 'No')

    if (!note) {
      console.error('❌ Note not found with ID:', noteId)
      return
    }

    if (note.status === newStatus) {
      console.log('⚠️ Status unchanged (already ' + newStatus + '), no action needed')
      return
    }

    console.log('✅ Updating status from', note.status, 'to', newStatus)
    handleStatusChange(noteId, newStatus)
  }

  const getStatusIcon = (status: string, noteId: string) => {
    const isUpdating = updatingNotes.has(noteId)

    switch (status) {
      case 'done':
        return <CheckCircle className={`h-5 w-5 text-green-600 ${isUpdating ? 'animate-spin' : ''}`} />
      case 'in_progress':
        return <Clock className={`h-5 w-5 text-orange-500 ${isUpdating ? 'animate-spin' : ''}`} />
      default:
        return <Circle className={`h-5 w-5 text-gray-400 ${isUpdating ? 'animate-spin' : ''}`} />
    }
  }

  const activeNote = activeId ? notes.find(n => n.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Filter Buttons - Droppable Zones */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Status Filters */}
          <div className="flex gap-2 items-center">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter('all')
                setCurrentPage(1)
              }}
            >
              All ({counts.all})
            </Button>
            <DroppableFilterButton id="undone" isActive={filter === 'undone'} count={counts.undone} onClick={() => { setFilter('undone'); setCurrentPage(1) }}>
              Not started
            </DroppableFilterButton>
            <DroppableFilterButton id="in_progress" isActive={filter === 'in_progress'} count={counts.in_progress} onClick={() => { setFilter('in_progress'); setCurrentPage(1) }}>
              Started
            </DroppableFilterButton>
            <DroppableFilterButton id="done" isActive={filter === 'done'} count={counts.done} onClick={() => { setFilter('done'); setCurrentPage(1) }}>
              Done
            </DroppableFilterButton>
          </div>

          {/* Date Filters */}
          <div className="flex gap-2 items-center border-l pl-4">
            <span className="text-xs text-gray-500 mr-1">Date:</span>
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('all')
                setCurrentPage(1)
              }}
            >
              All time
            </Button>
            <Button
              variant={dateFilter === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('7days')
                setCurrentPage(1)
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant={dateFilter === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('30days')
                setCurrentPage(1)
              }}
            >
              Last 30 days
            </Button>
            <Button
              variant={dateFilter === '90days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('90days')
                setCurrentPage(1)
              }}
            >
              Last 90 days
            </Button>
          </div>
        </div>

      {/* Notes List */}
      <div className="space-y-2">
        {paginatedNotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No notes found for this filter
            </CardContent>
          </Card>
        ) : (
          paginatedNotes.map(note => {
            return <DraggableNoteCard key={note.id} note={note} isUpdating={updatingNotes.has(note.id)} onStatusChange={handleStatusChange} />
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>

            {(() => {
              const getPageNumbers = () => {
                const pages: (number | 'ellipsis')[] = []
                const maxVisible = 5

                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  pages.push(1)

                  if (currentPage > 3) {
                    pages.push('ellipsis')
                  }

                  const start = Math.max(2, currentPage - 1)
                  const end = Math.min(totalPages - 1, currentPage + 1)

                  for (let i = start; i <= end; i++) {
                    pages.push(i)
                  }

                  if (currentPage < totalPages - 2) {
                    pages.push('ellipsis')
                  }

                  pages.push(totalPages)
                }

                return pages
              }

              return getPageNumbers().map((page, index) => (
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              ))
            })()}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      </div>
    </DndContext>
  )
}

// Droppable Filter Button Component - Drop zone on button itself
function DroppableFilterButton({ id, isActive, count, onClick, children }: {
  id: string
  isActive: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'filter-button',
      status: id
    }
  })

  console.log(`DroppableFilterButton ${id}:`, { isOver })

  return (
    <Button
      ref={setNodeRef}
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`transition-all ${
        isOver
          ? 'ring-4 ring-blue-500 ring-offset-2 scale-110 shadow-lg bg-blue-100 border-blue-500'
          : ''
      }`}
    >
      {children} ({count})
    </Button>
  )
}

// Draggable Note Card Component
function DraggableNoteCard({ note, isUpdating, onStatusChange }: {
  note: JobNoteWithMeta
  isUpdating: boolean
  onStatusChange: (noteId: string, status: 'undone' | 'in_progress' | 'done') => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  const isDone = note.status === 'done'

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className={`h-5 w-5 text-green-600 ${isUpdating ? 'animate-spin' : ''}`} />
      case 'in_progress':
        return <Clock className={`h-5 w-5 text-orange-500 ${isUpdating ? 'animate-spin' : ''}`} />
      default:
        return <Circle className={`h-5 w-5 text-gray-400 ${isUpdating ? 'animate-spin' : ''}`} />
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-500 ${
        isDone ? 'opacity-60 bg-gray-50' : 'opacity-100'
      } ${isUpdating ? 'animate-pulse' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded mt-1"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

          {/* Status Checkbox - Click to mark as Done */}
          <button
            onClick={() => onStatusChange(note.id, 'done')}
            disabled={isUpdating}
            className="flex-shrink-0 mt-1 hover:scale-110 transition-transform disabled:opacity-50"
          >
            {getStatusIcon(note.status)}
          </button>

          {/* Note Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <p
                className={`text-sm font-medium flex-1 ${
                  isDone ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
              >
                {note.note_text}
              </p>
              {/* Show "Recently Updated" badge if synced in last 48 hours */}
              {note.synced_at && new Date(note.synced_at).getTime() > Date.now() - 48 * 60 * 60 * 1000 && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-0 shrink-0">
                  Recently Updated
                </Badge>
              )}
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap gap-2 text-xs">
              {/* Address */}
              {note.service_address && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {note.service_address}
                </Badge>
              )}

              {/* Technician */}
              {note.technician_name && (
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  {note.technician_name}
                </Badge>
              )}

              {/* Date */}
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {new Date(note.created_at).toLocaleDateString()} at{' '}
                {new Date(note.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>

              {/* Status Badge */}
              {note.status === 'in_progress' && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                  Started
                </Badge>
              )}
              {note.status === 'done' && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Done
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Actions - Only Start button, blue color */}
          {note.status !== 'done' && note.status !== 'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(note.id, 'in_progress')}
              disabled={isUpdating}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
