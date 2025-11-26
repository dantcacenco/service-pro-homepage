/**
 * Customer Search Filter Component for Tax Calculation
 *
 * Allows searching and selecting customers for inclusion/exclusion from tax calculation
 * Searches by name and address only (not email/phone like EnhancedCustomerSearch)
 *
 * Features:
 * - Search Bill.com customers by name and address
 * - Include-only toggle
 * - Show selected customers in a list with Remove buttons
 * - Return selected customer IDs to parent
 *
 * Created: November 18, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, X, Building2 } from 'lucide-react'

interface Customer {
  id: string
  name: string
  address: string
  billcom_id?: string
}

interface CustomerSearchFilterProps {
  onCustomersChange: (customerIds: string[], includeMode: 'exclude' | 'include_only') => void
}

export default function CustomerSearchFilter({ onCustomersChange }: CustomerSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [includeMode, setIncludeMode] = useState<'exclude' | 'include_only'>('exclude')
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search Bill.com when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  // Notify parent when selected customers or mode changes
  useEffect(() => {
    const customerIds = selectedCustomers.map(c => c.billcom_id || c.id).filter(Boolean)
    onCustomersChange(customerIds, includeMode)
  }, [selectedCustomers, includeMode])

  const searchCustomers = async () => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/billcom-test/search-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, source: 'billcom' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.billcom && Array.isArray(data.billcom)) {
          const customers = data.billcom.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            address: c.address || '',
            billcom_id: c.id
          }))
          setSearchResults(customers)
        }
      }
    } catch (error) {
      console.error('[TAX CUSTOMER FILTER] Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    // Check if already selected
    const alreadySelected = selectedCustomers.some(
      c => (c.billcom_id || c.id) === (customer.billcom_id || customer.id)
    )

    if (alreadySelected) {
      console.log('[TAX CUSTOMER FILTER] Customer already selected:', customer.name)
      return
    }

    // Add to selected list
    setSelectedCustomers([...selectedCustomers, customer])

    // Clear search
    setSearchTerm('')
    setSearchResults([])
  }

  const handleRemoveCustomer = (customerId: string) => {
    setSelectedCustomers(selectedCustomers.filter(c => (c.billcom_id || c.id) !== customerId))
  }

  return (
    <div className="space-y-4">
      {/* Include/Exclude Toggle */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="text-sm font-medium text-gray-700">Filter Mode:</label>
        <div className="flex space-x-2">
          <button
            onClick={() => setIncludeMode('exclude')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              includeMode === 'exclude'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Exclude Selected
          </button>
          <button
            onClick={() => setIncludeMode('include_only')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              includeMode === 'include_only'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Include Only Selected
          </button>
        </div>
      </div>

      {/* Customer Search */}
      <div className="relative">
        <label htmlFor="customer-filter-search" className="block text-sm font-medium text-gray-700 mb-1">
          {includeMode === 'exclude' ? 'Search Customers to Exclude' : 'Search Customers to Include'}
        </label>
        <div className="relative">
          <input
            id="customer-filter-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>

        {/* Search Results */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {/* Bill.com Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-blue-50 border-b border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-1" />
                    Bill.com Customers
                  </div>
                </div>
                {searchResults.map((customer) => (
                  <button
                    key={customer.billcom_id || customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100"
                  >
                    <div className="font-medium">{customer.name}</div>
                    {customer.address && (
                      <div className="text-sm text-gray-500 mt-1">
                        {customer.address}
                      </div>
                    )}
                    <div className="text-xs text-blue-600 mt-1">Click to select</div>
                  </button>
                ))}
              </div>
            )}

            {/* Searching indicator */}
            {isSearching && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Searching Bill.com...
              </div>
            )}

            {/* No results */}
            {!isSearching && searchResults.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No customers found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Customers List */}
      {selectedCustomers.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {includeMode === 'exclude' ? 'Excluded Customers' : 'Included Customers'} ({selectedCustomers.length})
          </h3>
          <div className="space-y-2">
            {selectedCustomers.map((customer) => (
              <div
                key={customer.billcom_id || customer.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  includeMode === 'exclude'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{customer.name}</div>
                  {customer.address && (
                    <div className="text-xs text-gray-600 mt-1">{customer.address}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCustomer(customer.billcom_id || customer.id)}
                  className="ml-3 p-1 hover:bg-white rounded-md transition-colors"
                  title="Remove"
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info text */}
      {selectedCustomers.length === 0 && (
        <p className="text-sm text-gray-500">
          {includeMode === 'exclude'
            ? 'No customers excluded. All customers will be included in tax calculation.'
            : 'No customers selected. You must select at least one customer to use include-only mode.'}
        </p>
      )}
    </div>
  )
}
