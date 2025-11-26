/**
 * County Filter Component
 *
 * Features:
 * - Multi-select dropdown of NC counties
 * - Only show counties that have invoices
 * - "Select All" / "Clear All" buttons
 *
 * Created: November 18, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface CountyFilterProps {
  availableCounties: string[]
  onCountiesChange: (selectedCounties: string[]) => void
}

export default function CountyFilter({ availableCounties, onCountiesChange }: CountyFilterProps) {
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    onCountiesChange(selectedCounties)
  }, [selectedCounties])

  const toggleCounty = (county: string) => {
    if (selectedCounties.includes(county)) {
      setSelectedCounties(selectedCounties.filter(c => c !== county))
    } else {
      setSelectedCounties([...selectedCounties, county])
    }
  }

  const selectAll = () => {
    setSelectedCounties([...availableCounties])
  }

  const clearAll = () => {
    setSelectedCounties([])
  }

  if (availableCounties.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">No counties available. Run calculation to see results.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filter by County
      </label>

      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="text-sm text-gray-700">
            {selectedCounties.length === 0
              ? 'All Counties'
              : selectedCounties.length === availableCounties.length
              ? `All Counties (${availableCounties.length})`
              : `${selectedCounties.length} of ${availableCounties.length} selected`}
          </span>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {/* Select All / Clear All */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* County List */}
            {availableCounties.map((county) => (
              <button
                key={county}
                onClick={() => toggleCounty(county)}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100"
              >
                <span className="text-sm text-gray-700">{county} County</span>
                {selectedCounties.includes(county) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Counties Display */}
      {selectedCounties.length > 0 && selectedCounties.length < availableCounties.length && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {selectedCounties.map((county) => (
              <div
                key={county}
                className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span>{county}</span>
                <button
                  onClick={() => toggleCounty(county)}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filter Button */}
      {selectedCounties.length > 0 && selectedCounties.length < availableCounties.length && (
        <button
          onClick={clearAll}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Clear County Filter
        </button>
      )}
    </div>
  )
}
