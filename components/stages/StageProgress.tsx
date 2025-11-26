/**
 * StageProgress Component
 * Visual progress indicator showing completion percentage
 */

'use client'

import { type JobStage, calculateStageProgress, type StepStatus } from '@/lib/stages/definitions'

interface StageProgressProps {
  stage: JobStage
  stageSteps: Record<string, StepStatus>
  variant?: 'dots' | 'bar' | 'compact'
}

export function StageProgress({ stage, stageSteps, variant = 'dots' }: StageProgressProps) {
  const percentage = calculateStageProgress(stage, stageSteps)

  // Color based on completion percentage
  const getColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-gray-400'
  }

  const getBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600'
    if (percentage >= 50) return 'bg-yellow-600'
    return 'bg-gray-400'
  }

  if (variant === 'bar') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`font-medium ${getColor(percentage)}`}>
            {percentage}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getBgColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <span className={`text-xs font-medium ${getColor(percentage)}`}>
        {percentage}%
      </span>
    )
  }

  // Dots variant (default)
  const totalDots = 7
  const filledDots = Math.round((percentage / 100) * totalDots)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalDots }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors ${
            index < filledDots ? getBgColor(percentage) : 'bg-gray-300'
          }`}
        />
      ))}
      <span className={`text-xs ml-1 font-medium ${getColor(percentage)}`}>
        {percentage}%
      </span>
    </div>
  )
}
