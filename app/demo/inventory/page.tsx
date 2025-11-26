'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  barcode?: string | null
  category?: string | null
  quantity_on_hand: number
  low_stock_threshold: number
  reorder_point: number
  max_stock_level?: number | null
  warehouse_location?: string | null
  warehouse_zone?: string | null
  unit_cost?: number | null
  retail_price?: number | null
  vendor_name?: string | null
  vendor_sku?: string | null
  vendor_contact?: string | null
  emoji?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

interface Technician {
  id: string
  full_name: string
  email: string
}

interface CartItem extends InventoryItem {
  quantity: number
}

export default function InventoryPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentMode, setCurrentMode] = useState<'checkout' | 'return'>('checkout')
  const [selectedTech, setSelectedTech] = useState('')
  const [showAddTechModal, setShowAddTechModal] = useState(false)
  const [newTechName, setNewTechName] = useState('')
  const [techList, setTechList] = useState<Technician[]>([])
  const [showScanSuccess, setShowScanSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch inventory items
  useEffect(() => {
    fetchInventory()
  }, [])

  // Fetch technicians
  useEffect(() => {
    fetchTechnicians()
  }, [])

  // Load selected tech from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedTech')
    if (saved) setSelectedTech(saved)
  }, [])

  // Save selected tech to localStorage
  useEffect(() => {
    if (selectedTech) {
      localStorage.setItem('selectedTech', selectedTech)
    }
  }, [selectedTech])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/inventory/items')
      const result = await response.json()

      if (result.success && result.data) {
        setInventoryData(result.data)
      } else {
        toast.error('Failed to load inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/profiles')
      const result = await response.json()

      if (result.success && result.profiles) {
        setTechList(result.profiles)
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }

  const simulateScan = () => {
    if (!selectedTech) {
      alert('Please select a technician first!')
      return
    }

    // Simulate scanning a random item
    const randomItem = inventoryData[Math.floor(Math.random() * inventoryData.length)]
    addToCart(randomItem)

    // Show success feedback
    setShowScanSuccess(true)
    setTimeout(() => setShowScanSuccess(false), 1000)
    playBeep()
  }

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      console.log('Audio not available')
    }
  }

  const addToCart = (item: InventoryItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id)
      if (existingItem) {
        return prevCart.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === itemId)
      if (!item) return prevCart

      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) {
        return prevCart.filter(i => i.id !== itemId)
      }

      return prevCart.map(i =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      )
    })
  }

  const handleCheckout = async () => {
    if (!selectedTech) {
      toast.error('Please select a technician first!')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty!')
      return
    }

    try {
      setIsProcessing(true)

      const endpoint = currentMode === 'checkout'
        ? '/api/inventory/checkout'
        : '/api/inventory/return'

      const items = cart.map(item => ({
        inventory_item_id: item.id,
        quantity: item.quantity
      }))

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          technician_id: selectedTech,
          notes: `${currentMode === 'checkout' ? 'Checkout' : 'Return'} via mobile app`
        })
      })

      const result = await response.json()

      if (result.success) {
        const action = currentMode === 'checkout' ? 'checked out' : 'returned'
        const techName = techList.find(t => t.id === selectedTech)?.full_name || selectedTech

        toast.success(`Successfully ${action} ${cart.length} item(s) for ${techName}!`)
        setCart([])

        // Refresh inventory to show updated stock levels
        fetchInventory()
      } else {
        toast.error(result.error || `Failed to ${currentMode}`)
      }
    } catch (error) {
      console.error(`Error processing ${currentMode}:`, error)
      toast.error(`Failed to process ${currentMode}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const addTechnician = () => {
    // Note: In production, this would create a new profile via API
    // For now, we just close the modal and suggest using admin panel
    toast.info('Please add new technicians through the admin panel')
    setShowAddTechModal(false)
    setNewTechName('')
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">📦 Inventory Tracking</h1>
        <div className="flex gap-2 items-center">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 cursor-pointer"
          >
            <option value="">Select Technician...</option>
            {techList.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.full_name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddTechModal(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="p-5 bg-white m-4 rounded-xl shadow-sm">
        <button
          onClick={simulateScan}
          className="w-full p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition active:scale-98"
        >
          <span className="text-3xl">📷</span>
          <span>Scan Barcode</span>
        </button>

        <div className="flex items-center my-5 text-sm text-gray-500">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items manually..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Search Results */}
        {searchQuery && !isLoading && (
          <div className="mt-3 max-h-64 overflow-y-auto">
            {inventoryData
              .filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 5)
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!selectedTech) {
                      toast.error('Please select a technician first!')
                      return
                    }
                    addToCart(item)
                    setSearchQuery('')
                    playBeep()
                  }}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg mb-2 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                >
                  <div className="text-2xl">{item.emoji || '📦'}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      {item.warehouse_location && `📍 ${item.warehouse_location} • `}
                      Stock: {item.quantity_on_hand}
                    </div>
                  </div>
                  <div className="text-blue-500 text-xl">+</div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="px-5">
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">📦</div>
            <div className="text-gray-500">Loading inventory...</div>
          </div>
        </div>
      )}

      {/* Cart Section */}
      {!isLoading && (
        <div className="px-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Cart</h2>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
              <div className="text-5xl mb-3">🛒</div>
              <div>No items scanned yet</div>
            </div>
          ) : (
          <div className="flex flex-col gap-3">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 flex gap-3 shadow-sm animate-slide-in">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                  {item.emoji || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 mb-1">{item.name}</div>
                  {item.warehouse_location && (
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <span>📍</span>
                      <span>{item.warehouse_location}</span>
                    </div>
                  )}
                  <div className={`text-xs mt-1 font-medium ${item.quantity_on_hand <= item.low_stock_threshold ? 'text-red-600' : 'text-green-600'}`}>
                    {item.quantity_on_hand} in stock {item.quantity_on_hand <= item.low_stock_threshold && '⚠️'}
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-xl p-1 hover:text-red-700"
                  >
                    🗑️
                  </button>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 bg-white rounded-md text-blue-500 font-semibold flex items-center justify-center hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-semibold min-w-[24px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 bg-white rounded-md text-blue-500 font-semibold flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          <button
            onClick={() => setCurrentMode('checkout')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${
              currentMode === 'checkout'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600'
            }`}
          >
            📤 Checkout
          </button>
          <button
            onClick={() => setCurrentMode('return')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${
              currentMode === 'return'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600'
            }`}
          >
            📥 Return
          </button>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full py-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-lg transition active:scale-98"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : (
            currentMode === 'checkout' ? 'Complete Checkout' : 'Complete Return'
          )}
        </button>
      </div>

      {/* Add Technician Modal */}
      {showAddTechModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-xl font-semibold mb-5 text-gray-900">Add New Technician</div>
            <input
              type="text"
              value={newTechName}
              onChange={(e) => setNewTechName(e.target.value)}
              placeholder="Technician Name"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm mb-4 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addTechnician()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddTechModal(false)
                  setNewTechName('')
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addTechnician}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showScanSuccess && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-5 rounded-2xl text-lg font-semibold shadow-2xl z-[300] animate-success-pulse">
          ✓ Item Added!
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes success-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s;
        }
        .animate-slide-up {
          animation: slide-up 0.3s;
        }
        .animate-success-pulse {
          animation: success-pulse 0.5s ease-out;
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}
