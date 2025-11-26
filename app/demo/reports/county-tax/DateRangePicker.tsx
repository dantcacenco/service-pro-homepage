/**
 * Date Range Picker Component
 *
 * Features:
 * - Start date and end date inputs
 * - Filter by paid_date
 * - Quick presets: "This Month", "Last Month", "This Quarter", "Last Quarter", "This Year"
 *
 * Created: November 18, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  onDateChange: (startDate: string | null, endDate: string | null) => void
}

export default function DateRangePicker({ onDateChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    onDateChange(startDate || null, endDate || null)
  }, [startDate, endDate])

  const getQuarterDates = (year: number, quarter: number): { start: Date; end: Date } => {
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2
    const start = new Date(year, startMonth, 1)
    const end = new Date(year, endMonth + 1, 0) // Last day of endMonth
    return { start, end }
  }

  const applyPreset = (preset: string) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    let start: Date
    let end: Date

    switch (preset) {
      case 'this_month':
        start = new Date(currentYear, currentMonth, 1)
        end = new Date(currentYear, currentMonth + 1, 0)
        break

      case 'last_month':
        start = new Date(currentYear, currentMonth - 1, 1)
        end = new Date(currentYear, currentMonth, 0)
        break

      case 'this_quarter':
        const currentQuarter = Math.floor(currentMonth / 3) + 1
        const thisQ = getQuarterDates(currentYear, currentQuarter)
        start = thisQ.start
        end = thisQ.end
        break

      case 'last_quarter':
        const lastQuarter = Math.floor(currentMonth / 3)
        const lastQ = lastQuarter === 0
          ? getQuarterDates(currentYear - 1, 4)
          : getQuarterDates(currentYear, lastQuarter)
        start = lastQ.start
        end = lastQ.end
        break

      case 'this_year':
        start = new Date(currentYear, 0, 1)
        end = new Date(currentYear, 11, 31)
        break

      case 'all_time':
        setStartDate('')
        setEndDate('')
        return

      default:
        return
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-4">
      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date (Paid Date)
          </label>
          <div className="relative">
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date (Paid Date)
          </label>
          <div className="relative">
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('this_month')}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => applyPreset('last_month')}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            Last Month
          </button>
          <button
            onClick={() => applyPreset('this_quarter')}
            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
          >
            This Quarter
          </button>
          <button
            onClick={() => applyPreset('last_quarter')}
            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
          >
            Last Quarter
          </button>
          <button
            onClick={() => applyPreset('this_year')}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
          >
            This Year
          </button>
          <button
            onClick={() => applyPreset('all_time')}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Clear Button */}
      {(startDate || endDate) && (
        <div>
          <button
            onClick={handleClear}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            Clear Date Filter
          </button>
        </div>
      )}

      {/* Current Selection Display */}
      {(startDate || endDate) && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <span className="font-medium">Selected Range:</span>{' '}
          {startDate || '(no start date)'} to {endDate || '(no end date)'}
        </div>
      )}
    </div>
  )
}
