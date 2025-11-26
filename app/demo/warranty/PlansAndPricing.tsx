'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, ChevronDown, ChevronUp, Shield, Wrench, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WarrantySettings {
  maintenance_only_price: number
  warranty_only_price: number
  both_bundled_price: number
  warranty_terms: string
  maintenance_scope: string
  exclusions: string
}

export default function PlansAndPricing() {
  const supabase = createClient()
  const [settings, setSettings] = useState<WarrantySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [showResearch, setShowResearch] = useState(false)
  const [showExclusions, setShowExclusions] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('warranty_settings')
        .select('*')
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error loading warranty settings:', error)
      toast.error('Failed to load warranty settings')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrice = (plan: string, currentPrice: number) => {
    setEditingPlan(plan)
    setEditPrice(currentPrice.toString())
  }

  const handleSavePrice = async () => {
    if (!editingPlan || !settings) return

    const newPrice = parseFloat(editPrice)
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price')
      return
    }

    try {
      const updateData: any = {}
      updateData[editingPlan] = newPrice

      const { error } = await supabase
        .from('warranty_settings')
        .update(updateData)
        .eq('id', 'a0000000-0000-0000-0000-000000000001')

      if (error) throw error

      setSettings({
        ...settings,
        [editingPlan]: newPrice
      })

      toast.success('Price updated successfully')
      setEditingPlan(null)
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Failed to update price')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">No warranty settings found. Please contact support.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Fair Air HC Warranty Programs
          </CardTitle>
          <p className="text-sm text-gray-600">
            Editable pricing for your warranty and maintenance offerings
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Maintenance Only */}
            <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold">Maintenance Only</h3>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600">
                  ${settings.maintenance_only_price.toFixed(2)}/year
                </div>
                <div className="text-sm text-gray-600">
                  ${(settings.maintenance_only_price / 12).toFixed(2)}/month
                </div>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>2 visits/year</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Complete inspection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Filter replacement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Coil cleaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Refrigerant check</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Priority scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>10% repair discount</span>
                </li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEditPrice('maintenance_only_price', settings.maintenance_only_price)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Pricing
              </Button>
            </div>

            {/* Extended Warranty */}
            <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-400 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-bold">Extended Warranty</h3>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600">
                  ${settings.warranty_only_price.toFixed(2)}/year
                </div>
                <div className="text-sm text-gray-600">
                  ${(settings.warranty_only_price / 12).toFixed(2)}/month
                </div>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>All parts covered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>All labor covered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Unlimited service calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>2 maintenance visits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>No deductible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>24/7 emergency service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Transferable</span>
                </li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEditPrice('warranty_only_price', settings.warranty_only_price)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Pricing
              </Button>
            </div>

            {/* Premium Protection */}
            <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold">Premium Protection</h3>
              </div>
              <Badge className="mb-4" variant="secondary">Best Value</Badge>
              <div className="mb-4">
                <div className="text-3xl font-bold text-purple-600">
                  ${settings.both_bundled_price.toFixed(2)}/year
                </div>
                <div className="text-sm text-gray-600">
                  ${(settings.both_bundled_price / 12).toFixed(2)}/month
                </div>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>4 visits/year</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>All parts & labor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Unlimited service calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Annual duct inspection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Filter program (4/year)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Thermostat coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>4-hour emergency response</span>
                </li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEditPrice('both_bundled_price', settings.both_bundled_price)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Pricing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Research */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowResearch(!showResearch)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📊 Industry Research & Benchmarks (2025)
            </CardTitle>
            {showResearch ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {showResearch && (
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Industry Average Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Maintenance Contracts (Bi-Annual):</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Low end: $150/year</li>
                    <li>• Average: $150-$300/year</li>
                    <li>• High end (quarterly): Up to $700/year</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Extended Warranties (Parts + Labor):</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Monthly plans: $45-$62/month ($540-$744/year)</li>
                    <li>• Annual plans: $300-$500/year</li>
                    <li>• Service fees per claim: $65-$150</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What's Typically Covered</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Replacement parts for mechanical failures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Labor costs (extended warranties only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Compressor, evaporator coil, condenser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Blower motor, fan motor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Control boards and electrical components</span>
                </li>
              </ul>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              <p className="font-medium mb-1">Sources:</p>
              <ul className="space-y-0.5">
                <li>• Trinity Warranty (Extended Service Agreements)</li>
                <li>• HVAC.com (Preventative Maintenance Guide)</li>
                <li>• NerdWallet (Best HVAC Home Warranties 2025)</li>
                <li>• EcoWatch (HVAC Maintenance Cost Guide)</li>
              </ul>
              <p className="mt-2">Last Updated: November 13, 2025</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exclusions */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowExclusions(!showExclusions)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              ⚠️ Fair Air HC Warranty Exclusions
            </CardTitle>
            {showExclusions ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {showExclusions && (
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              Our Extended Warranty and Premium Protection plans do NOT cover:
            </p>
            <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
              {settings.exclusions}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowTerms(!showTerms)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📋 Warranty Terms & Conditions
            </CardTitle>
            {showTerms ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {showTerms && (
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Maintenance Visit Scope</h3>
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                {settings.maintenance_scope}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Renewal & Cancellation</h3>
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                {settings.warranty_terms}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edit Price Dialog */}
      <Dialog open={editingPlan !== null} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan Pricing</DialogTitle>
            <DialogDescription>
              Update the annual price for this warranty plan
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Annual Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {editPrice && !isNaN(parseFloat(editPrice)) && (
              <p className="text-sm text-gray-600 mt-2">
                Monthly equivalent: ${(parseFloat(editPrice) / 12).toFixed(2)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
