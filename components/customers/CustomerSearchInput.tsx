'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface CustomerSearchInputProps {
  customers: Customer[]
  value: Customer | null
  onChange: (customer: Customer | null) => void
  placeholder?: string
  required?: boolean
}

export default function CustomerSearchInput({
  customers,
  value,
  onChange,
  placeholder = 'Search customer',
  required = false
}: CustomerSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filter customers when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
      setFilteredCustomers(filtered)
      setShowDropdown(true)
    } else {
      setFilteredCustomers([])
      setShowDropdown(false)
    }
  }, [searchTerm, customers])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleClearSelection = () => {
    onChange(null)
    setSearchTerm('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      {value ? (
        // Selected customer display (blue badge)
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-blue-900">{value.name}</div>
            <div className="text-sm text-blue-700">{value.email}</div>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      ) : (
        // Search input
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={required}
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500 mt-1">{customer.phone}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No customers found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
