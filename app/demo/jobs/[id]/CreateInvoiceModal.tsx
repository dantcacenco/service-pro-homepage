'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  job: any
  stage: 'roughin' | 'final' // Which invoice stage we're creating
  onSuccess?: () => void
}

interface InvoiceItem {
  id: string
  name: string
  description: string
  unit_price: number
  quantity: number // This is the catch-up quantity
  total_price: number
  added_at_stage: 'deposit' | 'roughin' | 'final' // When this item was added to the job
  proposal_item_id?: string // Link back to original proposal item if applicable
}

export default function CreateInvoiceModal({
  open,
  onClose,
  job,
  stage,
  onSuccess
}: CreateInvoiceModalProps) {
  const supabase = createClient()

  // State
  const [loading, setLoading] = useState(false)
  const [proposalItems, setProposalItems] = useState<InvoiceItem[]>([])
  const [newItems, setNewItems] = useState<InvoiceItem[]>([])
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [showServiceSearch, setShowServiceSearch] = useState(false)
  const [county, setCounty] = useState<string>('')
  const [stateTaxRate, setStateTaxRate] = useState(0.0475)
  const [countyTaxRate, setCountyTaxRate] = useState(0.0225)

  // Quantity catch-up multipliers
  const QUANTITY_MULTIPLIERS = {
    deposit: {
      deposit: 0.5,
      roughin: 0,
      final: 0,
    },
    roughin: {
      deposit: 0.3,
      roughin: 0.8,
      final: 0,
    },
    final: {
      deposit: 0.2,
      roughin: 0.2,
      final: 1.0,
    },
  }

  useEffect(() => {
    if (open && job) {
      loadProposalItems()
      loadAvailableServices()
    }
  }, [open, job, stage])

  const loadProposalItems = async () => {
    try {
      console.log('[CREATE INVOICE] Loading proposal items for job:', job.id)

      // Get the proposal associated with this job
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, proposal_items(*)')
        .eq('id', job.proposal_id)
        .single()

      if (proposalError) {
        console.error('[CREATE INVOICE] Error loading proposal:', proposalError)
        throw proposalError
      }

      if (!proposal) {
        console.warn('[CREATE INVOICE] No proposal found for job')
        return
      }

      console.log('[CREATE INVOICE] Proposal loaded:', proposal)
      console.log('[CREATE INVOICE] Proposal items:', proposal.proposal_items)

      // Get county and tax info from proposal
      setCounty(proposal.county || 'Unknown County')

      // Calculate tax rates from proposal
      if (proposal.tax_amount && proposal.subtotal) {
        const totalTaxRate = proposal.tax_amount / proposal.subtotal
        setStateTaxRate(0.0475) // Always 4.75% for NC
        setCountyTaxRate(totalTaxRate - 0.0475)
      }

      // Transform proposal items into invoice items with catch-up quantities
      const items: InvoiceItem[] = proposal.proposal_items.map((item: any) => {
        const multiplier = QUANTITY_MULTIPLIERS[stage].deposit
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          unit_price: item.unit_price,
          quantity: multiplier,
          total_price: item.unit_price * multiplier,
          added_at_stage: 'deposit',
          proposal_item_id: item.id,
        }
      })

      console.log(`[CREATE INVOICE] Items with ${stage} catch-up quantities:`, items)
      setProposalItems(items)
    } catch (error) {
      console.error('[CREATE INVOICE] Error loading proposal items:', error)
      toast.error('Failed to load proposal items')
    }
  }

  const loadAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_items')
        .select('*')
        .order('name')

      if (error) throw error

      setAvailableServices(data || [])
    } catch (error) {
      console.error('[CREATE INVOICE] Error loading services:', error)
    }
  }

  const addNewService = (service: any) => {
    const newItem: InvoiceItem = {
      id: `new-${Date.now()}`,
      name: service.name,
      description: service.description || '',
      unit_price: service.unit_price,
      quantity: QUANTITY_MULTIPLIERS[stage][stage], // Catch-up quantity for new items
      total_price: service.unit_price * QUANTITY_MULTIPLIERS[stage][stage],
      added_at_stage: stage,
    }

    setNewItems([...newItems, newItem])
    setShowServiceSearch(false)
    toast.success(`Added ${service.name}`)
  }

  const removeNewItem = (itemId: string) => {
    setNewItems(newItems.filter(item => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setProposalItems(proposalItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total_price: item.unit_price * newQuantity
        }
      }
      return item
    }))
  }

  // Calculate totals
  const allItems = [...proposalItems, ...newItems]
  const subtotal = allItems.reduce((sum, item) => sum + item.total_price, 0)
  const stateTaxAmount = subtotal * stateTaxRate
  const countyTaxAmount = subtotal * countyTaxRate
  const taxAmount = stateTaxAmount + countyTaxAmount
  const total = subtotal + taxAmount

  const handleCreateInvoice = async () => {
    setLoading(true)
    try {
      console.log('[CREATE INVOICE] Creating invoice for job:', job.id)
      console.log('[CREATE INVOICE] Stage:', stage)
      console.log('[CREATE INVOICE] Items:', allItems)
      console.log('[CREATE INVOICE] Subtotal:', subtotal)
      console.log('[CREATE INVOICE] Tax:', taxAmount)
      console.log('[CREATE INVOICE] Total:', total)

      // Call API to create invoice in Bill.com
      const response = await fetch(`/api/jobs/${job.id}/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: stage,
          items: allItems,
          subtotal: subtotal,
          stateTaxAmount: stateTaxAmount,
          countyTaxAmount: countyTaxAmount,
          totalTaxAmount: taxAmount,
          total: total,
          county: county
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('[CREATE INVOICE] API error:', result.error)
        throw new Error(result.error || 'Failed to create invoice')
      }

      console.log('[CREATE INVOICE] Invoice created successfully!')
      console.log('[CREATE INVOICE] Bill.com Invoice ID:', result.billcomInvoiceId)
      console.log('[CREATE INVOICE] Invoice URL:', result.invoiceUrl)

      toast.success(`${stage === 'roughin' ? 'Rough-in' : 'Final'} invoice created in Bill.com!`)

      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      console.error('[CREATE INVOICE] Error:', error)
      toast.error(error.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create {stage === 'roughin' ? 'Rough-in' : 'Final'} Invoice
          </DialogTitle>
          <DialogDescription>
            {stage === 'roughin'
              ? 'Original items at 30%, new items at 80%'
              : 'Original items at 20%, rough-in items at 20%, final items at 100%'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Job Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Job #:</span>
                <span className="ml-2 font-medium">{job.job_number}</span>
              </div>
              <div>
                <span className="text-gray-600">County:</span>
                <span className="ml-2 font-medium">{county}</span>
              </div>
            </div>
          </div>

          {/* Original Items */}
          <div>
            <h3 className="font-medium mb-3">Original Items (from Proposal)</h3>
            <div className="space-y-2">
              {proposalItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">${item.unit_price.toFixed(2)} × {item.quantity.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${item.total_price.toFixed(2)}</div>
                    <Badge variant="outline" className="mt-1">
                      {(item.quantity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Items */}
          {newItems.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">
                New Items (added at {stage === 'roughin' ? 'rough-in' : 'final'})
              </h3>
              <div className="space-y-2">
                {newItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">${item.unit_price.toFixed(2)} × {item.quantity.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">${item.total_price.toFixed(2)}</div>
                        <Badge className="mt-1">{(item.quantity * 100).toFixed(0)}%</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Service Button */}
          <Button
            variant="outline"
            onClick={() => setShowServiceSearch(!showServiceSearch)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>

          {/* Service Search (simplified for now) */}
          {showServiceSearch && (
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-2">Available Services</h4>
              <div className="space-y-1">
                {availableServices.map((service) => (
                  <Button
                    key={service.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => addNewService(service)}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-600">${service.unit_price}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium mb-3">Invoice Summary</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>NC State Tax (4.75%)</span>
              <span className="font-medium">${stateTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{county} Tax ({(countyTaxRate * 100).toFixed(2)}%)</span>
              <span className="font-medium">${countyTaxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateInvoice} disabled={loading || allItems.length === 0}>
            {loading ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
