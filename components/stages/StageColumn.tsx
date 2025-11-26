/**
 * StageColumn Component
 * Renders a single stage column in the kanban board
 */

'use client'

import { useDroppable } from '@dnd-kit/core'
import { type JobStage, getStageDefinition } from '@/lib/stages/definitions'

interface StageColumnProps {
  stage: JobStage
  jobCount: number
  children: React.ReactNode
}

export function StageColumn({ stage, jobCount, children }: StageColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage,
  })

  const definition = getStageDefinition(stage)

  // Color mapping for stage columns - progressively darker shades of blue
  const colorClasses = {
    beginning: 'bg-blue-50 border-blue-200',
    rough_in: 'bg-blue-100 border-blue-300',
    trim_out: 'bg-blue-200 border-blue-400',
    closing: 'bg-blue-300 border-blue-500',
    completed: 'bg-gray-100 border-gray-300',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`p-3 rounded-t-lg border-2 ${colorClasses[stage]}`}>
        <h3 className="font-semibold text-sm">{definition.name}</h3>
        <p className="text-xs text-gray-600 mt-1">{definition.description}</p>
        <span className="text-xs text-gray-700 font-medium mt-2 block">
          {jobCount} {jobCount === 1 ? 'job' : 'jobs'}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 bg-gray-50 border-2 border-t-0 rounded-b-lg min-h-[200px] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  )
}
