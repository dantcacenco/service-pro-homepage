'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Building2 } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  billcom_id?: string
  source?: 'local' | 'billcom'
}

interface EnhancedCustomerSearchProps {
  customers: Customer[]
  onCustomerSelect: (customer: Customer) => void
  onCustomerAdded: (customer: Customer) => void
  userId: string
}

export default function EnhancedCustomerSearch({ 
  customers, 
  onCustomerSelect, 
  onCustomerAdded, 
  userId 
}: EnhancedCustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddNew, setShowAddNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [billcomResults, setBillcomResults] = useState<Customer[]>([])
  const [isSearchingBillcom, setIsSearchingBillcom] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const supabase = createClient()

  // Search only Bill.com when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchBillcomCustomers()
    } else {
      setBillcomResults([])
    }
  }, [searchTerm])

  const searchBillcomCustomers = async () => {
    // Only search Bill.com (removed local search)
    setIsSearchingBillcom(true)
    try {
      const response = await fetch('/api/billcom-test/search-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, source: 'billcom' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.billcom && Array.isArray(data.billcom)) {
          const billcomCustomers = data.billcom.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '', // FIXED: use c.address (API returns full formatted address)
            billcom_id: c.id,
            source: 'billcom' as const
          }))
          setBillcomResults(billcomCustomers)
        }
      }
    } catch (error) {
      console.error('Bill.com search error:', error)
    } finally {
      setIsSearchingBillcom(false)
    }
  }

  const handleSelectCustomer = async (customer: Customer) => {
    // If it's a Bill.com customer, ALWAYS sync it locally to get a proper database ID
    if (customer.source === 'billcom') {
      setIsLoading(true)
      try {
        // Check if customer already exists locally by billcom_id
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('billcom_id', customer.billcom_id)
          .single()

        if (existingCustomer) {
          // Customer already synced, use the local version with proper DB id
          onCustomerSelect(existingCustomer)
        } else {
          // Create new local customer from Bill.com data
          const { data, error } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              billcom_id: customer.billcom_id,
              created_by: userId
            })
            .select()
            .single()

          if (error) {
            console.error('Error syncing customer:', error)
            alert('Failed to sync customer from Bill.com. Please try again.')
            setIsLoading(false)
            return
          }

          // Successfully created, notify parent and select
          onCustomerAdded(data)
          onCustomerSelect(data)
        }
      } catch (error) {
        console.error('Error syncing customer:', error)
        alert('Failed to sync customer from Bill.com. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Local customer, select directly
      onCustomerSelect(customer)
    }
    
    // Clear search
    setSearchTerm('')
    setBillcomResults([])
  }

  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      alert('Please fill in name and email')
      return
    }

    setIsLoading(true)

    try {
      // Create customer locally
      const { data: localCustomer, error: localError } = await supabase
        .from('customers')
        .insert({
          ...newCustomer,
          created_by: userId
        })
        .select()
        .single()

      if (localError) throw localError

      // Sync to Bill.com
      try {
        const syncResponse = await fetch('/api/billcom-test/sync-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: localCustomer.id
          })
        })

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json()
          
          // Update local customer with Bill.com ID
          await supabase
            .from('customers')
            .update({ 
              billcom_id: syncResult.billcomId,
              billcom_sync_at: new Date().toISOString()
            })
            .eq('id', localCustomer.id)

          localCustomer.billcom_id = syncResult.billcomId
        }
      } catch (billcomError) {
        console.error('Bill.com sync error:', billcomError)
        // Continue even if Bill.com sync fails
      }

      onCustomerAdded(localCustomer)
      onCustomerSelect(localCustomer)
      
      // Reset form
      setNewCustomer({ name: '', email: '', phone: '', address: '' })
      setShowAddNew(false)
      setSearchTerm('')
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Failed to add customer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Customer
        </label>
        <div className="relative">
          <input
            id="customer-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>

        {/* Search Results */}
        {(billcomResults.length > 0 || isSearchingBillcom) && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {/* Bill.com Results */}
            {billcomResults.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-blue-50 border-b border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-1" />
                    Bill.com Customers
                  </div>
                </div>
                {billcomResults.map((customer) => (
                  <button
                    key={`billcom-${customer.billcom_id}`}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">
                      {customer.email} {customer.phone && `• ${customer.phone}`}
                    </div>
                    {customer.address && (
                      <div className="text-sm text-gray-500 mt-1">
                        📍 {customer.address}
                      </div>
                    )}
                    <div className="text-xs text-blue-600 mt-1">Click to select from Bill.com</div>
                  </button>
                ))}
              </div>
            )}

            {/* Searching indicator */}
            {isSearchingBillcom && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Searching Bill.com...
              </div>
            )}

            {/* No results */}
            {!isSearchingBillcom && billcomResults.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No customers found in Bill.com
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Customer Button */}
      <button
        type="button"
        onClick={() => setShowAddNew(!showAddNew)}
        className="flex items-center text-blue-600 hover:text-blue-700"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add New Customer
      </button>

      {/* Add New Customer Form */}
      {showAddNew && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3">New Customer</h3>
          <form onSubmit={handleAddNewCustomer} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email *"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add & Sync to Bill.com'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(false)
                  setNewCustomer({ name: '', email: '', phone: '', address: '' })
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
