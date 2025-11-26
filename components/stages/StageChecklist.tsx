/**
 * StageChecklist Component
 * Detailed checklist for completing stage steps
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  type JobStage,
  type StepStatus,
  getStageSteps,
  areRequiredStepsComplete,
  getNextStage,
} from '@/lib/stages/definitions'

interface StageChecklistProps {
  jobId: string
  stage: JobStage
  stageSteps: Record<string, StepStatus>
  onStepToggle?: (stepId: string, completed: boolean) => void
  onStageAdvance?: () => void
}

export function StageChecklist({
  jobId,
  stage,
  stageSteps,
  onStepToggle,
  onStageAdvance,
}: StageChecklistProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)

  const steps = getStageSteps(stage)
  const allRequiredComplete = areRequiredStepsComplete(stage, stageSteps)
  const nextStage = getNextStage(stage)

  const handleStepToggle = async (stepId: string) => {
    const currentStatus = stageSteps[stepId]
    const newCompleted = !currentStatus?.completed

    setLoading(stepId)

    try {
      const response = await fetch(`/api/jobs/${jobId}/stages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newCompleted ? 'complete_step' : 'uncomplete_step',
          step_id: stepId,
        }),
      })

      if (!response.ok) throw new Error('Failed to update step')

      const data = await response.json()

      toast.success(data.message)

      if (onStepToggle) {
        onStepToggle(stepId, newCompleted)
      }
    } catch (error) {
      console.error('Error updating step:', error)
      toast.error('Failed to update step')
    } finally {
      setLoading(null)
    }
  }

  const handleAdvanceStage = async () => {
    if (!allRequiredComplete || !nextStage) return

    setAdvancing(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advance_stage',
        }),
      })

      if (!response.ok) throw new Error('Failed to advance stage')

      const data = await response.json()

      toast.success(data.message)

      if (onStageAdvance) {
        onStageAdvance()
      }
    } catch (error) {
      console.error('Error advancing stage:', error)
      toast.error('Failed to advance to next stage')
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stage Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const stepStatus = stageSteps[step.id]
          const isCompleted = stepStatus?.completed || false
          const isLoading = loading === step.id

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleStepToggle(step.id)}
                disabled={isLoading}
                className="flex-shrink-0 mt-0.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium text-sm ${
                      isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {step.autoCompletable && (
                    <Badge variant="secondary" className="text-xs">
                      Auto
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                {stepStatus?.completed_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {new Date(stepStatus.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Advance to Next Stage Button */}
        {nextStage && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleAdvanceStage}
              disabled={!allRequiredComplete || advancing}
              className="w-full"
              size="lg"
            >
              {advancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving to Next Stage...
                </>
              ) : (
                <>
                  Move to Next Stage
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {!allRequiredComplete && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Complete all required steps to advance
              </p>
            )}
          </div>
        )}

        {!nextStage && stage !== 'completed' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              This is the final stage. Complete all steps to finish the job.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
