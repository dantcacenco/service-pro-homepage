/**
 * Progress Bar Component for Tax Calculation
 *
 * Polls /api/reports/tax-calculation/status/[runId] every 2 seconds
 * Displays:
 * - Progress percentage (0-100%)
 * - Current status message
 * - Items processed / total items
 * - Current batch / total batches
 * - Success/error state when complete
 *
 * Stops polling when status is 'completed' or 'failed'
 *
 * Created: November 18, 2025
 */

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ProgressStatus {
  runId: string
  runType: 'sync' | 'calculate'
  status: 'in_progress' | 'completed' | 'failed'
  currentStatus: string
  totalItems: number
  itemsProcessed: number
  itemsSucceeded: number
  itemsFailed: number
  itemsSkipped: number
  currentBatch: number
  totalBatches: number
  percentage: number
  errorMessage?: string
}

interface ProgressBarProps {
  runId: string | null
  onComplete?: () => void
  onError?: (error: string) => void
}

export default function ProgressBar({ runId, onComplete, onError }: ProgressBarProps) {
  const [status, setStatus] = useState<ProgressStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!runId) {
      setStatus(null)
      setIsPolling(false)
      return
    }

    // Start polling
    setIsPolling(true)
    const pollInterval = setInterval(() => {
      fetchStatus()
    }, 2000) // Poll every 2 seconds

    // Fetch immediately
    fetchStatus()

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [runId])

  const fetchStatus = async () => {
    if (!runId) return

    try {
      const response = await fetch(`/api/reports/tax-calculation/status/${runId}`)

      if (!response.ok) {
        console.error('[TAX PROGRESS] Failed to fetch status:', response.status)
        return
      }

      const data = await response.json()

      if (data.success) {
        setStatus(data)

        // Stop polling if completed or failed
        if (data.status === 'completed') {
          setIsPolling(false)
          if (onComplete) {
            onComplete()
          }
        } else if (data.status === 'failed') {
          setIsPolling(false)
          if (onError) {
            onError(data.errorMessage || 'Operation failed')
          }
        }
      }
    } catch (error: any) {
      console.error('[TAX PROGRESS] Error fetching status:', error)
    }
  }

  if (!runId || !status) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {status.runType === 'sync' ? 'Syncing Invoices from Bill.com' : 'Calculating County Taxes'}
        </h3>
        {status.status === 'in_progress' && (
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        )}
        {status.status === 'completed' && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {status.status === 'failed' && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{status.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              status.status === 'completed'
                ? 'bg-green-600'
                : status.status === 'failed'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${status.percentage}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">{status.currentStatus}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Processed</div>
          <div className="text-lg font-semibold text-gray-900">
            {status.itemsProcessed} / {status.totalItems}
          </div>
        </div>

        {status.runType === 'calculate' && (
          <>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-700 mb-1">Counted</div>
              <div className="text-lg font-semibold text-green-900">{status.itemsSucceeded}</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-xs text-yellow-700 mb-1">Skipped</div>
              <div className="text-lg font-semibold text-yellow-900">{status.itemsSkipped}</div>
            </div>

            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xs text-red-700 mb-1">Failed</div>
              <div className="text-lg font-semibold text-red-900">{status.itemsFailed}</div>
            </div>
          </>
        )}

        {status.runType === 'sync' && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-700 mb-1">Synced</div>
            <div className="text-lg font-semibold text-blue-900">{status.itemsSucceeded}</div>
          </div>
        )}
      </div>

      {/* Batch Info (for calculate only) */}
      {status.runType === 'calculate' && status.totalBatches > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          Batch {status.currentBatch} of {status.totalBatches}
        </div>
      )}

      {/* Error Message */}
      {status.status === 'failed' && status.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-red-900 mb-1">Operation Failed</div>
              <div className="text-sm text-red-700">{status.errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {status.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-green-900 mb-1">Operation Completed Successfully</div>
              <div className="text-sm text-green-700">
                {status.runType === 'sync'
                  ? `Successfully synced ${status.itemsSucceeded} invoices from Bill.com`
                  : `Successfully calculated taxes for ${status.itemsSucceeded} invoices (${status.itemsSkipped} skipped, ${status.itemsFailed} failed)`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
