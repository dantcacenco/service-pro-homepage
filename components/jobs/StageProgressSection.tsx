/**
 * StageProgressSection Component
 * Comprehensive stage progress UI for job detail pages
 * Shows current stage, checklist, history, and allows stage management
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  History,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type JobStage,
  type StepStatus,
  getStageSteps,
  areRequiredStepsComplete,
  getNextStage,
  STAGES_IN_ORDER,
  getStageDefinition,
} from '@/lib/stages/definitions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface StageHistoryEntry {
  stage: JobStage
  entered_at: string
  completed_at?: string
  completed_by?: string
  notes?: string
}

interface StageProgressSectionProps {
  jobId: string
  stage: JobStage
  stageSteps: Record<string, StepStatus>
  stageHistory?: StageHistoryEntry[]
  userRole?: string
  onStageChange?: () => void
}

export default function StageProgressSection({
  jobId,
  stage,
  stageSteps,
  stageHistory = [],
  userRole = 'technician',
  onStageChange,
}: StageProgressSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)
  const [showManualOverride, setShowManualOverride] = useState(false)
  const [selectedStage, setSelectedStage] = useState<JobStage>(stage)
  const [overrideNotes, setOverrideNotes] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const steps = getStageSteps(stage)
  const allRequiredComplete = areRequiredStepsComplete(stage, stageSteps)
  const nextStage = getNextStage(stage)
  const currentStageDefinition = getStageDefinition(stage)
  const isBoss = userRole === 'boss'

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

      if (onStageChange) {
        onStageChange()
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

      if (onStageChange) {
        onStageChange()
      }
    } catch (error) {
      console.error('Error advancing stage:', error)
      toast.error('Failed to advance to next stage')
    } finally {
      setAdvancing(false)
    }
  }

  const handleManualOverride = async () => {
    if (!isBoss) return

    const currentStageIndex = STAGES_IN_ORDER.indexOf(stage)
    const targetStageIndex = STAGES_IN_ORDER.indexOf(selectedStage)
    const isMovingBackward = targetStageIndex < currentStageIndex

    try {
      const response = await fetch(`/api/jobs/${jobId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_override',
          target_stage: selectedStage,
          notes: overrideNotes || (isMovingBackward ? 'Manual override - moved backward' : 'Manual override'),
        }),
      })

      if (!response.ok) throw new Error('Failed to override stage')

      const data = await response.json()

      toast.success(data.message)
      setShowManualOverride(false)
      setOverrideNotes('')

      if (onStageChange) {
        onStageChange()
      }
    } catch (error) {
      console.error('Error overriding stage:', error)
      toast.error('Failed to override stage')
    }
  }

  const getStageColor = (stageKey: JobStage) => {
    const colors: Record<JobStage, string> = {
      beginning: 'bg-blue-100 text-blue-800 border-blue-300',
      rough_in: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      trim_out: 'bg-orange-100 text-orange-800 border-orange-300',
      closing: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[stageKey] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const completedStepsCount = steps.filter((step) => stageSteps[step.id]?.completed).length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Current Stage Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Stage Progress</CardTitle>
              <Badge className={getStageColor(stage)}>
                {currentStageDefinition.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isBoss && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualOverride(true)}
                >
                  <Unlock className="h-4 w-4 mr-1" />
                  Override
                </Button>
              )}
              {stageHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {currentStageDefinition.description}
          </p>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                {completedStepsCount} of {totalSteps} steps completed
              </span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Step Checklist */}
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
          {nextStage && stage !== 'completed' && (
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

          {stage === 'completed' && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Job Completed</span>
              </div>
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

      {/* Stage History */}
      {showHistory && stageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Stage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageHistory.map((entry, index) => {
                const stageDef = getStageDefinition(entry.stage)
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stageDef.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {STAGES_IN_ORDER.indexOf(entry.stage) + 1}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Entered: {new Date(entry.entered_at).toLocaleString()}
                      </p>
                      {entry.completed_at && (
                        <p className="text-xs text-gray-600">
                          Completed: {new Date(entry.completed_at).toLocaleString()}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Override Dialog */}
      <Dialog open={showManualOverride} onOpenChange={setShowManualOverride}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Stage Override</DialogTitle>
            <DialogDescription>
              As an admin, you can manually move this job to any stage. Use with caution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Stage Info */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Current Stage:</p>
              <p className="font-medium">{currentStageDefinition.name}</p>
            </div>

            {/* Target Stage Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Move to Stage:</label>
              <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as JobStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES_IN_ORDER.map((stageKey) => {
                    const stageDef = getStageDefinition(stageKey)
                    const isCurrentStage = stageKey === stage
                    return (
                      <SelectItem key={stageKey} value={stageKey} disabled={isCurrentStage}>
                        {stageDef.name} {isCurrentStage && '(current)'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Warning for backward movement */}
            {STAGES_IN_ORDER.indexOf(selectedStage) < STAGES_IN_ORDER.indexOf(stage) && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Moving Backward</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You are moving this job to an earlier stage. This may cause data inconsistencies.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional):</label>
              <textarea
                className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                placeholder="Reason for manual override..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualOverride(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleManualOverride}
              disabled={selectedStage === stage}
            >
              <Lock className="h-4 w-4 mr-2" />
              Override Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
