'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateTax } from '@/lib/tax-calculator'
import EnhancedCustomerSearch from './EnhancedCustomerSearch'
import ServiceSearch from './ServiceSearch'
import AddNewPricingItem from './AddNewPricingItem'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface PricingItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  unit: string
  is_active: boolean
}

interface ProposalItem {
  id: string
  name: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  is_addon: boolean
  is_selected: boolean
}

// NEW: Tier interface for multi-tier mode
interface Tier {
  tempId: string
  tier_level: 1 | 2 | 3
  tier_name: 'Standard' | 'Upgrade' | 'Premium'
  items: ProposalItem[]
}

interface ProposalBuilderProps {
  customers: Customer[]
  pricingItems: PricingItem[]
  userId: string
}

export default function ProposalBuilder({ customers: initialCustomers, pricingItems: initialPricingItems, userId }: ProposalBuilderProps) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [pricingItems, setPricingItems] = useState(initialPricingItems)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [proposalTitle, setProposalTitle] = useState('')
  const [proposalDescription, setProposalDescription] = useState('')
  
  // NEW: Tier mode state
  const [tierMode, setTierMode] = useState<'single' | 'multi'>('single')
  
  // EXISTING: Single-tier items (used when tierMode === 'single')
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([])
  
  // NEW: Multi-tier state (used when tierMode === 'multi')
  const [tiers, setTiers] = useState<Tier[]>([])
  const [activeTierIndex, setActiveTierIndex] = useState(0)
  
  const [taxRate, setTaxRate] = useState(0.07) // 7% default (NC average), will be updated based on customer address
  const [stateTaxRate, setStateTaxRate] = useState(0.0475) // 4.75% NC State tax
  const [countyTaxRate, setCountyTaxRate] = useState(0.0225) // 2.25% default county tax
  const [county, setCounty] = useState<string | undefined>(undefined) // County name from tax calculator
  const [isLoading, setIsLoading] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddNewPricing, setShowAddNewPricing] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Calculate tax rate when customer is selected
  useEffect(() => {
    const fetchTaxRate = async () => {
      if (!selectedCustomer || !selectedCustomer.address) {
        setTaxRate(0.07) // Default NC rate
        return
      }

      try {
        // Parse customer address
        // Address format could be: "123 Main St, Asheville, NC 28801" or various formats
        const addressParts = selectedCustomer.address.split(',').map(s => s.trim())
        
        let street = ''
        let city = ''
        let state = 'NC'
        let zip = ''

        if (addressParts.length >= 2) {
          street = addressParts[0]
          city = addressParts[1]
          
          // Try to extract state and ZIP from last part
          if (addressParts.length >= 3) {
            const lastPart = addressParts[addressParts.length - 1]
            const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/)
            if (stateZipMatch) {
              state = stateZipMatch[1]
              zip = stateZipMatch[2]
              // City might be in the second-to-last part
              if (addressParts.length >= 3) {
                city = addressParts[addressParts.length - 2]
              }
            }
          }
        }

        // Calculate tax using the tax calculator
        const taxCalc = await calculateTax(0, {
          street,
          city,
          state,
          zip
        })

        if (taxCalc && taxCalc.totalTax) {
          setTaxRate(taxCalc.totalTax)
          setStateTaxRate(taxCalc.stateTax)
          setCountyTaxRate(taxCalc.countyTax)
          setCounty(taxCalc.county)
          console.log(`Tax rate calculated for ${city}, ${state}: ${(taxCalc.totalTax * 100).toFixed(2)}% (County: ${(taxCalc.countyTax * 100).toFixed(2)}%, State: ${(taxCalc.stateTax * 100).toFixed(2)}%)`)
          console.log(`County determined: ${taxCalc.county}`)
        } else {
          console.warn('Could not calculate tax rate, using default 7%')
          setTaxRate(0.07)
          setStateTaxRate(0.0475)
          setCountyTaxRate(0.0225)
          setCounty(undefined)
        }
      } catch (error) {
        console.error('Error calculating tax rate:', error)
        setTaxRate(0.07) // Fallback to default
        setStateTaxRate(0.0475)
        setCountyTaxRate(0.0225)
        setCounty(undefined)
      }
    }

    fetchTaxRate()
  }, [selectedCustomer])


  // Calculate totals (single-tier mode only)
  const subtotal = proposalItems
    .filter(item => item.is_selected)
    .reduce((sum, item) => sum + item.total_price, 0)
  const taxAmount = subtotal * taxRate
  const stateTaxAmount = subtotal * stateTaxRate
  const countyTaxAmount = subtotal * countyTaxRate
  const total = subtotal + taxAmount
  // ============================================================================
  // TIER MANAGEMENT FUNCTIONS (Multi-Tier Mode)
  // ============================================================================

  // Add new tier (max 3 tiers)
  const addTier = () => {
    if (tiers.length >= 3) {
      alert('Maximum 3 tiers allowed')
      return
    }
    
    const nextLevel = (tiers.length + 1) as 1 | 2 | 3
    const tierNames: ('Standard' | 'Upgrade' | 'Premium')[] = ['Standard', 'Upgrade', 'Premium']
    
    const newTier: Tier = {
      tempId: `tier-${Date.now()}`,
      tier_level: nextLevel,
      tier_name: tierNames[nextLevel - 1],
      items: []
    }
    
    setTiers([...tiers, newTier])
    setActiveTierIndex(tiers.length) // Switch to new tier
  }

  // Remove tier
  const removeTier = (tierTempId: string) => {
    const updatedTiers = tiers.filter(t => t.tempId !== tierTempId)
    setTiers(updatedTiers)
    
    // Adjust active tier index if needed
    if (activeTierIndex >= updatedTiers.length) {
      setActiveTierIndex(Math.max(0, updatedTiers.length - 1))
    }
  }

  // Get active tier
  const getActiveTier = (): Tier | null => {
    return tiers[activeTierIndex] || null
  }

  // Calculate tier base price (excluding add-ons)
  const getTierBasePrice = (tier: Tier): number => {
    return tier.items
      .filter(item => !item.is_addon)
      .reduce((sum, item) => sum + item.total_price, 0)
  }

  // Calculate tier total with selected add-ons
  const getTierTotal = (tier: Tier): number => {
    return tier.items
      .filter(item => !item.is_addon || item.is_selected)
      .reduce((sum, item) => sum + item.total_price, 0)
  }

  // ============================================================================
  // ITEM MANAGEMENT FUNCTIONS (Works for both Single & Multi-Tier)
  // ============================================================================

  // Add new pricing item to the list
  const handleNewPricingItemAdded = (newItem: PricingItem) => {
    setPricingItems([...pricingItems, newItem])
    setShowAddNewPricing(false)
    setShowAddItem(true) // Go back to the service search
  }

  // Refresh pricing items from database (after edit/delete)
  const refreshPricingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_items')
        .select('*')
        .eq('is_active', true)
        .order('category, name')

      if (error) throw error
      
      if (data) {
        setPricingItems(data)
      }
    } catch (error) {
      console.error('Error refreshing pricing items:', error)
    }
  }

  // Add item to proposal (single-tier) or to active tier (multi-tier)
  const addItem = (item: PricingItem, isAddon: boolean) => {
    const newItem: ProposalItem = {
      id: `temp-${Date.now()}`,
      name: item.name,
      description: item.description,
      quantity: 1,
      unit_price: item.price,
      total_price: item.price,
      is_addon: isAddon,
      is_selected: !isAddon // Main items selected by default, add-ons not selected
    }
    
    if (tierMode === 'single') {
      // Single-tier mode: Add to proposalItems array
      setProposalItems([...proposalItems, newItem])
    } else {
      // Multi-tier mode: Add to active tier's items
      const activeTier = getActiveTier()
      if (activeTier) {
        setTiers(tiers.map(tier =>
          tier.tempId === activeTier.tempId
            ? { ...tier, items: [...tier.items, newItem] }
            : tier
        ))
      }
    }
    // Don't close the search - let user add multiple items
  }

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (tierMode === 'single') {
      setProposalItems(proposalItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, total_price: item.unit_price * quantity }
          : item
      ))
    } else {
      const activeTier = getActiveTier()
      if (activeTier) {
        setTiers(tiers.map(tier =>
          tier.tempId === activeTier.tempId
            ? {
                ...tier,
                items: tier.items.map(item =>
                  item.id === itemId
                    ? { ...item, quantity, total_price: item.unit_price * quantity }
                    : item
                )
              }
            : tier
        ))
      }
    }
  }

  // Remove item
  const removeItem = (itemId: string) => {
    if (tierMode === 'single') {
      setProposalItems(proposalItems.filter(item => item.id !== itemId))
    } else {
      const activeTier = getActiveTier()
      if (activeTier) {
        setTiers(tiers.map(tier =>
          tier.tempId === activeTier.tempId
            ? { ...tier, items: tier.items.filter(item => item.id !== itemId) }
            : tier
        ))
      }
    }
  }

  // Toggle addon selection
  const toggleAddon = (itemId: string) => {
    if (tierMode === 'single') {
      setProposalItems(proposalItems.map(item =>
        item.id === itemId
          ? { ...item, is_selected: !item.is_selected }
          : item
      ))
    } else {
      const activeTier = getActiveTier()
      if (activeTier) {
        setTiers(tiers.map(tier =>
          tier.tempId === activeTier.tempId
            ? {
                ...tier,
                items: tier.items.map(item =>
                  item.id === itemId
                    ? { ...item, is_selected: !item.is_selected }
                    : item
                )
              }
            : tier
        ))
      }
    }
  }

  // ============================================================================
  // SAVE PROPOSAL (Handles both Single & Multi-Tier)
  // ============================================================================

  const saveProposal = async () => {
    // Validation
    if (!selectedCustomer || !proposalTitle.trim()) {
      alert('Please fill in all required fields.')
      return
    }

    if (tierMode === 'single' && proposalItems.length === 0) {
      alert('Please add at least one item to the proposal.')
      return
    }

    if (tierMode === 'multi') {
      if (tiers.length < 2) {
        alert('Multi-tier proposals must have at least 2 tiers.')
        return
      }
      
      const hasItemsInAllTiers = tiers.every(tier => tier.items.length > 0)
      if (!hasItemsInAllTiers) {
        alert('Each tier must have at least one item.')
        return
      }
    }

    setIsLoading(true)

    try {
      console.log('=== SAVE PROPOSAL DEBUG ===')
      console.log('Tier Mode:', tierMode)
      console.log('Proposal Items Count:', proposalItems.length)
      console.log('Proposal Items:', proposalItems)
      console.log('Tiers Count:', tiers.length)
      
      // Generate professional proposal number (PROP-YYYYMMDD-XXX)
      const today = new Date()
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0')
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const proposalNumber = `PROP-${dateStr}-${randomNum}`

      console.log('Creating proposal:', proposalNumber)

      // Create proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          proposal_number: proposalNumber,
          customer_id: selectedCustomer.id,
          title: proposalTitle.trim(),
          description: proposalDescription.trim(),
          tier_mode: tierMode,  // NEW: 'single' or 'multi'
          // For single-tier: calculate totals now
          // For multi-tier: totals calculated after customer selects tier
          subtotal: tierMode === 'single' ? subtotal : 0,
          tax_rate: taxRate,
          tax_amount: tierMode === 'single' ? taxAmount : 0,
          county: county, // County name from tax calculator
          state_tax_amount: tierMode === 'single' ? stateTaxAmount : 0, // NC State tax amount
          county_tax_amount: tierMode === 'single' ? countyTaxAmount : 0, // County tax amount
          total: tierMode === 'single' ? total : 0,
          status: 'draft',
          customer_view_token: crypto.randomUUID(), // Generate customer view link immediately
          created_by: userId
        })
        .select()
        .single()

      if (proposalError) {
        console.error('Proposal creation error:', proposalError)
        throw proposalError
      }
      
      console.log('Proposal created successfully:', proposal.id)

      if (tierMode === 'single') {
        // ========== SINGLE-TIER MODE ==========
        console.log('Inserting single-tier items...')
        
        // Insert items with tier_id = NULL (existing behavior)
        const itemsToInsert = proposalItems.map(item => ({
          proposal_id: proposal.id,
          tier_id: null,  // Single-tier items
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_addon: item.is_addon,
          is_selected: item.is_selected
        }))

        console.log('Items to insert:', itemsToInsert)

        const { error: itemsError } = await supabase
          .from('proposal_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Items insertion error:', itemsError)
          throw itemsError
        }
        
        console.log('Items inserted successfully')

      } else {
        // ========== MULTI-TIER MODE ==========
        
        // Step 1: Create tiers
        const tiersToInsert = tiers.map(tier => ({
          proposal_id: proposal.id,
          tier_level: tier.tier_level,
          tier_name: tier.tier_name,
          is_selected: false  // Customer hasn't selected yet
        }))
        
        const { data: createdTiers, error: tiersError } = await supabase
          .from('proposal_tiers')
          .insert(tiersToInsert)
          .select()
        
        if (tiersError) throw tiersError
        
        // Step 2: Insert items for each tier
        const allItems: any[] = []
        
        tiers.forEach((tier, index) => {
          const tierDbId = createdTiers[index].id
          
          const tierItems = tier.items.map(item => ({
            proposal_id: proposal.id,
            tier_id: tierDbId,  // Link to specific tier
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            is_addon: item.is_addon,
            is_selected: item.is_selected
          }))
          
          allItems.push(...tierItems)
        })
        
        if (allItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('proposal_items')
            .insert(allItems)
          
          if (itemsError) throw itemsError
        }
      }

      // Log the creation
      await supabase
        .from('proposal_activities')
        .insert({
          proposal_id: proposal.id,
          activity_type: 'created',
          description: tierMode === 'single' 
            ? 'Proposal created'
            : `Multi-tier proposal created with ${tiers.length} tiers`,
          metadata: {
            tier_mode: tierMode,
            total_amount: tierMode === 'single' ? total : 0,
            items_count: tierMode === 'single' ? proposalItems.length : tiers.reduce((sum, t) => sum + t.items.length, 0),
            tiers_count: tierMode === 'multi' ? tiers.length : 0
          }
        })

      router.push(`/proposals/${proposal.id}`)

    } catch (error: any) {
      console.error('=== SAVE PROPOSAL ERROR ===')
      console.error('Error object:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      console.error('Error code:', error.code)
      
      // Show detailed error message
      const errorMessage = error.message || 'Unknown error occurred'
      const errorDetails = error.details ? `\n\nDetails: ${error.details}` : ''
      const errorHint = error.hint ? `\n\nHint: ${error.hint}` : ''
      
      alert(`Error saving proposal: ${errorMessage}${errorDetails}${errorHint}\n\nCheck console for full details.`)
    } finally {
      setIsLoading(false)
    }
  }

  // Get current items list (depends on mode)
  const getCurrentItems = (): ProposalItem[] => {
    if (tierMode === 'single') {
      return proposalItems
    } else {
      const activeTier = getActiveTier()
      return activeTier ? activeTier.items : []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Proposal</h1>
          <p className="text-gray-600 mt-2">Build a detailed proposal for your customer</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Customer Information</h2>
              {selectedCustomer ? (
                <div className="flex justify-between items-start p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    {selectedCustomer.address && (
                      <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Change Customer
                  </button>
                </div>
              ) : (
                <EnhancedCustomerSearch
                  customers={customers}
                  onCustomerSelect={setSelectedCustomer}
                  onCustomerAdded={(newCustomer) => {
                    setCustomers([...customers, newCustomer])
                    setSelectedCustomer(newCustomer)
                  }}
                  userId={userId}
                />
              )}
            </div>

            {/* Proposal Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Proposal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="e.g., HVAC System Installation"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    rows={3}
                    placeholder="Project overview and scope of work..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* NEW: Tier Mode Toggle */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Proposal Type</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setTierMode('single')
                    // Optionally clear multi-tier state when switching to single
                  }}
                  className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                    tierMode === 'single'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-semibold">Single Package</div>
                    <div className="text-xs mt-1 opacity-75">One pricing option</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setTierMode('multi')
                    // Initialize with 2 tiers if switching to multi and no tiers exist
                    if (tiers.length === 0) {
                      setTiers([
                        {
                          tempId: `tier-${Date.now()}-1`,
                          tier_level: 1,
                          tier_name: 'Standard',
                          items: []
                        },
                        {
                          tempId: `tier-${Date.now()}-2`,
                          tier_level: 2,
                          tier_name: 'Upgrade',
                          items: []
                        }
                      ])
                      setActiveTierIndex(0)
                    }
                  }}
                  className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                    tierMode === 'multi'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-semibold">Multiple Tiers</div>
                    <div className="text-xs mt-1 opacity-75">2-3 pricing options</div>
                  </div>
                </button>
              </div>
              
              {tierMode === 'multi' && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                  <strong>Tip:</strong> Create 2-3 packages (Standard/Upgrade/Premium) with different services and pricing. Customer will choose one.
                </div>
              )}
            </div>

            {/* Multi-Tier Tabs (only show in multi-tier mode) */}
            {tierMode === 'multi' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Tier Packages</h2>
                  {tiers.length < 3 && (
                    <button
                      onClick={addTier}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      + Add Tier
                    </button>
                  )}
                </div>
                
                {/* Tier Tabs */}
                <div className="flex gap-2 border-b">
                  {tiers.map((tier, index) => (
                    <button
                      key={tier.tempId}
                      onClick={() => setActiveTierIndex(index)}
                      className={`px-4 py-2 font-medium transition-colors relative ${
                        activeTierIndex === index
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tier.tier_name}
                      {tier.items.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {tier.items.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Active Tier Content */}
                {getActiveTier() && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{getActiveTier()!.tier_name} Tier</h3>
                        <p className="text-sm text-gray-600">Tier {getActiveTier()!.tier_level} of {tiers.length}</p>
                      </div>
                      {tiers.length > 2 && (
                        <button
                          onClick={() => removeTier(getActiveTier()!.tempId)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Tier
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Tier Base Price:</span>
                        <span className="font-bold text-green-600">
                          ${getTierBasePrice(getActiveTier()!).toFixed(2)}
                        </span>
                      </div>
                      {getActiveTier()!.items.filter(i => i.is_addon).length > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium">Available Add-ons:</span>
                          <span className="text-gray-600">
                            ${getActiveTier()!.items.filter(i => i.is_addon).reduce((sum, i) => sum + i.total_price, 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  {tierMode === 'multi' ? `${getActiveTier()?.tier_name} Tier - Services & Materials` : 'Services & Materials'}
                </h2>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>

              {/* Add New Pricing Item Section */}
              {showAddNewPricing && (
                <AddNewPricingItem
                  onPricingItemAdded={handleNewPricingItemAdded}
                  onCancel={() => {
                    setShowAddNewPricing(false)
                    setShowAddItem(true) // Go back to service search
                  }}
                  userId={userId}
                />
              )}

              {/* Add Item Section */}
              {showAddItem && !showAddNewPricing && (
                <ServiceSearch
                  pricingItems={pricingItems}
                  onAddItem={addItem}
                  onClose={() => setShowAddItem(false)}
                  onShowAddNew={() => {
                    setShowAddItem(false)
                    setShowAddNewPricing(true)
                  }}
                  onItemsChanged={refreshPricingItems}
                />
              )}

              {/* Current Items */}
              <div className="space-y-3">
                {getCurrentItems().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items added yet. Click Add Item to get started.</p>
                ) : (
                  <>
                    {/* Main Services */}
                    {getCurrentItems().filter(item => !item.is_addon).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Services & Materials:</h4>
                        {getCurrentItems().filter(item => !item.is_addon).map(item => (
                          <div key={item.id} className="border rounded-lg p-4 border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                      className="w-16 p-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <span className="text-sm">@ ${item.unit_price.toFixed(2)}</span>
                                  <span className="font-bold text-green-600">${item.total_price.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 ml-4"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add-ons */}
                    {getCurrentItems().filter(item => item.is_addon).length > 0 && (
                      <div className="space-y-3 mt-6">
                        <h4 className="font-medium text-gray-900">Add-ons:</h4>
                        {getCurrentItems().filter(item => item.is_addon).map(item => (
                          <div key={item.id} className="border rounded-lg p-4 border-orange-200 bg-orange-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={item.is_selected}
                                    onChange={() => toggleAddon(item.id)}
                                    className="w-4 h-4"
                                  />
                                  <h4 className="font-medium">{item.name}</h4>
                                  <span className="text-xs bg-orange-200 px-2 py-1 rounded">Add-on</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 ml-6">{item.description}</p>
                                
                                <div className="flex items-center gap-4 mt-2 ml-6">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                      className="w-16 p-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <span className="text-sm">@ ${item.unit_price.toFixed(2)}</span>
                                  <span className="font-bold text-green-600">${item.total_price.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 ml-4"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals - Single-Tier Mode */}
            {tierMode === 'single' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">Proposal Total</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 text-xs border border-gray-300 rounded"
                      />
                      <span className="text-sm">({(taxRate * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Amount:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Totals - Multi-Tier Mode */}
            {tierMode === 'multi' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">Tier Summary</h3>
                <div className="space-y-3">
                  {tiers.map(tier => (
                    <div key={tier.tempId} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-sm">{tier.tier_name}</div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">Base Price:</span>
                        <span className="font-semibold">${getTierBasePrice(tier).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Items:</span>
                        <span>{tier.items.length} items</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Note:</strong> Final total calculated after customer selects tier and add-ons.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={saveProposal}
                  disabled={isLoading || !selectedCustomer || !proposalTitle.trim() || 
                    (tierMode === 'single' && proposalItems.length === 0) ||
                    (tierMode === 'multi' && tiers.length < 2)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Saving...' : 'Save Proposal'}
                </button>
                <button
                  onClick={() => router.push('/proposals')}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Back to Proposals
                </button>
              </div>
              
              {/* Validation Messages */}
              {tierMode === 'multi' && tiers.length < 2 && (
                <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Multi-tier proposals need at least 2 tiers
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
