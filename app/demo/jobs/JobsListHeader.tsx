'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Filter, Search, Calendar, X } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/status-sync'
import { getStatusFilterGroups } from '@/lib/stages/status-stage-mapping'
import { useState, useEffect } from 'react'

interface JobsListHeaderProps {
  userRole?: string
}

export default function JobsListHeader({ userRole = 'technician' }: JobsListHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'
  const currentSearch = searchParams.get('search') || ''
  const currentDateFrom = searchParams.get('date_from') || ''
  const currentDateTo = searchParams.get('date_to') || ''

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [dateFrom, setDateFrom] = useState(currentDateFrom)
  const [dateTo, setDateTo] = useState(currentDateTo)

  // Sync state with URL params
  useEffect(() => {
    setSearchInput(currentSearch)
    setDateFrom(currentDateFrom)
    setDateTo(currentDateTo)
  }, [currentSearch, currentDateFrom, currentDateTo])

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset to page 1 when changing filters
    params.delete('page')

    router.push(`/jobs?${params.toString()}`)
  }

  const handleStatusChange = (status: string) => {
    updateParams({ status })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const handleDateFilter = () => {
    updateParams({ date_from: dateFrom, date_to: dateTo })
  }

  const clearFilters = () => {
    setSearchInput('')
    setDateFrom('')
    setDateTo('')
    router.push('/jobs')
  }

  const hasActiveFilters = currentSearch || currentDateFrom || currentDateTo || currentStatus !== 'all'

  return (
    <div className="space-y-4 mb-6">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {userRole === 'technician' ? 'My Assigned Jobs' : 'Jobs'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* New Job Button */}
          {userRole !== 'technician' && (
            <button
              onClick={() => router.push('/jobs/new')}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2 font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              New Job
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Job #, customer, or address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: null })
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Date From */}
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Apply Date Filter Button */}
        {(dateFrom || dateTo) && (
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            Apply Dates
          </button>
        )}

        {/* Status Filter Dropdown */}
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>

              {getStatusFilterGroups().map(group => (
                <optgroup key={group.stage} label={group.label}>
                  {group.statuses.map(status => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
