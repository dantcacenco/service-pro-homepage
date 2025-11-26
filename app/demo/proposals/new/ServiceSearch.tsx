'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import EditPricingItemModal from '@/components/proposals/EditPricingItemModal'

interface PricingItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  unit: string
  is_active: boolean
}

interface ServiceSearchProps {
  pricingItems: PricingItem[]
  onAddItem: (item: PricingItem, isAddon: boolean) => void
  onClose: () => void
  onShowAddNew: () => void
  onItemsChanged: () => void
}

export default function ServiceSearch({ pricingItems, onAddItem, onClose, onShowAddNew, onItemsChanged }: ServiceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const supabase = createClient()

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(pricingItems.map(item => item.category)))]

  // Filter items based on search and category
  const filteredItems = pricingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const addItemToProposal = (item: PricingItem, isAddon: boolean) => {
    onAddItem(item, isAddon)
    // Don't close the search - let user add multiple items
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this pricing item? This action cannot be undone.')) {
      return
    }

    setDeletingItemId(itemId)

    try {
      const { error } = await supabase
        .from('pricing_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Refresh the items list
      onItemsChanged()
    } catch (error) {
      console.error('Error deleting pricing item:', error)
      alert('Error deleting item. Please try again.')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleItemUpdated = () => {
    onItemsChanged()
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Add Service or Material</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowAddNew}
              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Search and Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services and materials..."
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 relative group">
                  {/* Semi-transparent Edit/Delete buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-30 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Edit item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingItemId === item.id}
                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      title="Delete item"
                    >
                      {deletingItemId === item.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-start pr-20">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                        <span>per {item.unit}</span>
                        <span className="font-bold text-green-600">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => addItemToProposal(item, false)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Add Service
                      </button>
                      <button
                        onClick={() => addItemToProposal(item, true)}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                      >
                        Add as Add-on
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No items found. Try a different search term or category.'
                  : 'No services available. Click "Add New" to create one.'
                }
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            💡 <strong>Tip:</strong> Hover over items to see edit/delete buttons. Add multiple items by clicking "Add Service" or "Add as Add-on". Close when done.
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditPricingItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </>
  )
}
