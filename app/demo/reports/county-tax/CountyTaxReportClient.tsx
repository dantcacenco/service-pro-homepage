/**
 * County Tax Report Client Component
 *
 * Main client-side component that orchestrates:
 * - Sync button → calls sync endpoint → polls progress
 * - Calculate button → calls calculate endpoint → polls progress
 * - Filters (date, county, customer) → fetches filtered results
 * - Results display with table
 *
 * Created: November 18, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Calculator, AlertCircle } from 'lucide-react'
import ProgressBar from './ProgressBar'
import TaxResultsTable from './TaxResultsTable'
import DateRangePicker from './DateRangePicker'
import CountyFilter from './CountyFilter'
import CustomerSearchFilter from './CustomerSearchFilter'

interface CountyTaxReportClientProps {
  userId: string
  latestRun: any
  totalInvoicesSynced: number
  paidInvoicesCount: number
}

export default function CountyTaxReportClient({
  userId,
  latestRun,
  totalInvoicesSynced,
  paidInvoicesCount
}: CountyTaxReportClientProps) {
  // State management
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])
  const [customerIds, setCustomerIds] = useState<string[]>([])
  const [includeMode, setIncludeMode] = useState<'exclude' | 'include_only'>('exclude')

  // Results
  const [resultsData, setResultsData] = useState<any>(null)
  const [availableCounties, setAvailableCounties] = useState<string[]>([])

  // Fetch results on filter change
  useEffect(() => {
    fetchResults()
  }, [startDate, endDate, selectedCounties])

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams({
        groupBy: 'county'
      })

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedCounties.length > 0) {
        // Note: County filter applies to specific counties, not all
        // For now, we'll fetch all and filter client-side
      }

      const response = await fetch(`/api/reports/tax-calculation/results?${params}`)

      if (!response.ok) {
        console.error('[TAX REPORT] Failed to fetch results:', response.status)
        return
      }

      const data = await response.json()

      if (data.success) {
        setResultsData(data)

        // Extract available counties from results
        const counties = data.counties.map((c: any) => c.county)
        setAvailableCounties(counties)
      }
    } catch (error: any) {
      console.error('[TAX REPORT] Error fetching results:', error)
    }
  }

  const handleSync = async () => {
    setError(null)
    setIsSyncing(true)

    try {
      const response = await fetch('/api/reports/tax-calculation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        console.log('[TAX REPORT] Sync started:', data.runId)
        setCurrentRunId(data.runId)
      } else {
        setError(data.error || 'Sync failed')
        setIsSyncing(false)
      }
    } catch (error: any) {
      console.error('[TAX REPORT] Sync error:', error)
      setError('Failed to start sync. Please try again.')
      setIsSyncing(false)
    }
  }

  const handleCalculate = async () => {
    setError(null)
    setIsCalculating(true)

    try {
      // Build filters
      const filters: any = {}
      if (customerIds.length > 0) {
        filters.includeMode = includeMode
        filters.customerIds = customerIds
      }

      const response = await fetch('/api/reports/tax-calculation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })

      const data = await response.json()

      if (data.success) {
        console.log('[TAX REPORT] Calculation started:', data.runId)
        setCurrentRunId(data.runId)
      } else {
        setError(data.error || 'Calculation failed')
        setIsCalculating(false)
      }
    } catch (error: any) {
      console.error('[TAX REPORT] Calculation error:', error)
      setError('Failed to start calculation. Please try again.')
      setIsCalculating(false)
    }
  }

  const handleProgressComplete = () => {
    console.log('[TAX REPORT] Operation completed')
    setIsSyncing(false)
    setIsCalculating(false)
    setCurrentRunId(null)

    // Refresh results
    fetchResults()
  }

  const handleProgressError = (errorMessage: string) => {
    console.error('[TAX REPORT] Operation failed:', errorMessage)
    setError(errorMessage)
    setIsSyncing(false)
    setIsCalculating(false)
    setCurrentRunId(null)
  }

  const handleCustomersChange = (ids: string[], mode: 'exclude' | 'include_only') => {
    setCustomerIds(ids)
    setIncludeMode(mode)
  }

  // Filter results by selected counties (client-side)
  const filteredCounties = resultsData?.counties?.filter((c: any) => {
    if (selectedCounties.length === 0) return true
    return selectedCounties.includes(c.county)
  }) || []

  // Recalculate grand totals for filtered counties
  const filteredGrandTotals = filteredCounties.reduce(
    (acc: any, c: any) => ({
      subtotal: acc.subtotal + c.totalSubtotal,
      stateTax: acc.stateTax + c.totalStateTax,
      countyTax: acc.countyTax + c.totalCountyTax,
      totalTax: acc.totalTax + c.totalTax
    }),
    { subtotal: 0, stateTax: 0, countyTax: 0, totalTax: 0 }
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">County Tax Report (On-Demand)</h1>
        <p className="text-gray-600 mt-2">
          Sync invoices from Bill.com and calculate county taxes for paid invoices
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-medium">Invoices Synced</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{totalInvoicesSynced}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700 font-medium">Paid Invoices</div>
          <div className="text-2xl font-bold text-green-900 mt-1">{paidInvoicesCount}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-medium">Last Run</div>
          <div className="text-lg font-semibold text-purple-900 mt-1">
            {latestRun
              ? new Date(latestRun.created_at).toLocaleString()
              : 'Never'}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <div className="font-medium text-red-900">Error</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* Section 1: Sync & Calculate Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Sync & Calculate</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSync}
            disabled={isSyncing || isCalculating}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Invoices from Bill.com'}
          </button>

          <button
            onClick={handleCalculate}
            disabled={isSyncing || isCalculating || totalInvoicesSynced === 0}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Calculator className={`h-5 w-5 mr-2 ${isCalculating ? 'animate-pulse' : ''}`} />
            {isCalculating ? 'Calculating...' : 'Calculate County Taxes'}
          </button>
        </div>

        {totalInvoicesSynced === 0 && (
          <p className="text-sm text-gray-500 mt-3">
            ℹ️ You must sync invoices before calculating taxes
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {currentRunId && (
        <ProgressBar
          runId={currentRunId}
          onComplete={handleProgressComplete}
          onError={handleProgressError}
        />
      )}

      {/* Section 2: Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Step 2: Filter Results</h2>

        {/* Date Range Picker */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Date Range</h3>
          <DateRangePicker
            onDateChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
            }}
          />
        </div>

        {/* County Filter */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Counties</h3>
          <CountyFilter
            availableCounties={availableCounties}
            onCountiesChange={setSelectedCounties}
          />
        </div>

        {/* Customer Filter */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Customer Include/Exclude</h3>
          <CustomerSearchFilter onCustomersChange={handleCustomersChange} />
        </div>
      </div>

      {/* Section 3: Results Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: View Results</h2>

        {resultsData ? (
          <TaxResultsTable
            counties={filteredCounties}
            grandTotalSubtotal={filteredGrandTotals.subtotal}
            grandTotalStateTax={filteredGrandTotals.stateTax}
            grandTotalCountyTax={filteredGrandTotals.countyTax}
            grandTotalTax={filteredGrandTotals.totalTax}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No results yet. Run sync and calculation to see tax data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
