'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Printer, Send, Edit, ChevronLeft, Plus, Link2, Check, FileText } from 'lucide-react'
import Link from 'next/link'
import { PaymentStages } from './PaymentStages'
import SendProposal from './SendProposal'
import CreateJobModal from './CreateJobModal'
import PaymentSummary from '@/components/PaymentSummary'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ProposalViewProps {
  proposal: any
  userRole: string
}

export default function ProposalView({ proposal, userRole }: ProposalViewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [showPrintView, setShowPrintView] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'sent': return 'bg-blue-500'
      case 'viewed': return 'bg-purple-500'
      case 'approved':
      case 'accepted': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const handlePrint = () => {
    setShowPrintView(true)
    setTimeout(() => {
      window.print()
      setShowPrintView(false)
    }, 100)
  }

  const handleSendSuccess = () => {
    toast.success('Proposal sent successfully!')
    router.refresh()
  }

  const handleCopyCustomerLink = async () => {
    let token = proposal.customer_view_token

    // If no token exists (old proposals), generate one now
    if (!token) {
      token = crypto.randomUUID()
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('proposals')
          .update({ customer_view_token: token })
          .eq('id', proposal.id)
      } catch (error) {
        console.error('Failed to generate customer token:', error)
        toast.error('Failed to generate customer link')
        return
      }
    }

    const customerUrl = `${window.location.origin}/proposal/view/${token}`
    navigator.clipboard.writeText(customerUrl)
    setShowCopiedTooltip(true)
    setTimeout(() => setShowCopiedTooltip(false), 2000)
  }

  // Check if a job can be created (no existing job for this proposal)
  const canCreateJob = !proposal.has_existing_job

  // Check if Bill.com invoice has been created (check both multi-stage and legacy fields)
  const hasBillcomInvoice =
    (proposal.billcom_deposit_invoice_id && proposal.billcom_deposit_invoice_link) || // Multi-stage: deposit invoice
    (proposal.billcom_invoice_id && proposal.billcom_invoice_link) // Legacy: single invoice

  // Show admin controls for boss or admin roles
  const isAdmin = userRole === 'admin' || userRole === 'boss'
  
  return (
    <div className="space-y-6">
      {/* Action Buttons for Admin/Boss */}
      {isAdmin && (
        <div className="flex justify-between mb-6">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex gap-2">
            <Link href={`/proposals/${proposal.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button 
              onClick={() => setShowSendModal(true)} 
              variant="outline" 
              size="sm"
              disabled={!proposal.customers?.email}
            >
              <Send className="h-4 w-4 mr-1" />
              Send to Customer
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <div className="relative">
              <Button 
                onClick={handleCopyCustomerLink} 
                variant="outline" 
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-1" />
                Customer Link
              </Button>
              {showCopiedTooltip && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in-out">
                  Copied to clipboard
                </div>
              )}
            </div>
            <Button 
              onClick={() => setShowCreateJobModal(true)} 
              variant="default" 
              size="sm"
              disabled={!canCreateJob}
              title={!canCreateJob ? "A job already exists for this proposal" : ""}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Job
            </Button>
            {proposal.status === 'approved' && hasBillcomInvoice && (
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Deposit Invoice Created
              </Badge>
            )}
            {proposal.status === 'approved' && !hasBillcomInvoice && !proposal.customers?.address && (
              <Badge className="bg-blue-100 text-blue-800">
                <FileText className="h-3 w-3 mr-1" />
                Add Address for Invoice
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div>
        <Badge className={`${getStatusColor(proposal.status)} text-white`}>
          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
        </Badge>
        {proposal.sent_at && (
          <span className="ml-2 text-sm text-gray-500">
            Sent on {formatDate(proposal.sent_at)}
          </span>
        )}
      </div>

      {/* Proposal Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Proposal Title</p>
              <p className="font-medium">{proposal.title || 'Untitled Proposal'}</p>
            </div>
            {proposal.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{proposal.customers?.name || 'No customer'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{proposal.customers?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{proposal.customers?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{proposal.customers?.address || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services - Multi-Tier or Traditional Display */}
      {proposal.tier_mode === 'multi' ? (
        // Multi-Tier Display (Read-Only)
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Package Tiers</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Customer will choose one of these packages</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {organizeTiers(proposal).map((tier: any) => (
                  <div
                    key={tier.id}
                    className={`border-2 rounded-lg p-6 ${
                      tier.isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {/* Tier Header */}
                    <div className={`text-center mb-4 pb-3 border-b-2 ${
                      tier.isSelected ? 'border-green-500' : 'border-gray-200'
                    }`}>
                      {tier.isSelected && (
                        <div className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
                          SELECTED BY CUSTOMER
                        </div>
                      )}
                      <h3 className="text-xl font-bold uppercase tracking-wide">
                        {tier.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Tier {tier.level}</p>
                    </div>

                    {/* Services List */}
                    <div className="mb-4 min-h-[150px]">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Includes:</p>
                      <ul className="space-y-2">
                        {tier.services.map((service: any, idx: number) => (
                          <li key={idx} className="text-xs flex items-start justify-between gap-2">
                            <span className="flex items-center flex-1 gap-1">
                              <span className={tier.isSelected ? 'text-green-500 mr-1' : 'text-blue-500 mr-1'}>•</span>
                              <span>{service.name}</span>
                              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] ml-1">
                                ×{service.count}
                              </span>
                            </span>
                            <span className="font-semibold text-gray-700 whitespace-nowrap text-xs">
                              {formatCurrency(service.totalPrice)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {tier.addons.length > 0 && (
                        <p className="text-xs text-gray-500 mt-3">
                          + {tier.addons.length} optional add-on{tier.addons.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>

                    {/* Base Price */}
                    <div className={`text-center py-3 rounded-lg ${
                      tier.isSelected ? 'bg-white border border-green-300' : 'bg-gray-50'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1">Base Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(tier.basePrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Show selected tier's add-ons if any */}
          {organizeTiers(proposal).some((tier: any) => tier.isSelected && tier.addons.length > 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Selected Add-ons</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  For {organizeTiers(proposal).find((t: any) => t.isSelected)?.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizeTiers(proposal)
                    .find((tier: any) => tier.isSelected)
                    ?.addons.filter((addon: any) => addon.is_selected)
                    .map((addon: any) => (
                      <div key={addon.id} className="flex justify-between items-start border-l-4 border-green-500 pl-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{addon.name}</h4>
                          {addon.description && (
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          )}
                          <p className="text-sm text-gray-500">Qty: {addon.quantity} × {formatCurrency(addon.unit_price)}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(addon.total_price)}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        // Traditional Single-Tier Display
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.proposal_items?.filter((item: any) => !item.is_addon).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Add-ons */}
          {proposal.proposal_items?.some((item: any) => item.is_addon) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Optional Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposal.proposal_items.filter((item: any) => item.is_addon).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Totals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(proposal.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({((proposal.tax_rate || 0) * 100).toFixed(1)}%):</span>
              <span>{formatCurrency(proposal.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(proposal.total || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary - Show for approved proposals */}
      {(proposal.status === 'approved' || proposal.status === 'deposit paid' || 
        proposal.status === 'rough-in paid' || proposal.status === 'final paid' || 
        proposal.status === 'completed') && (
        <PaymentSummary
          proposalId={proposal.id}
          total={proposal.total}
          billcomInvoiceId={proposal.billcom_invoice_id}
          billcomInvoiceLink={proposal.billcom_invoice_link}
        />
      )}

      {/* Send Proposal Modal */}
      {showSendModal && (
        <SendProposal
          proposalId={proposal.id}
          proposalNumber={proposal.proposal_number}
          customerEmail={proposal.customers?.email}
          customerName={proposal.customers?.name}
          total={proposal.total}
          onClose={() => setShowSendModal(false)}
          onSuccess={handleSendSuccess}
        />
      )}

      {/* Create Job Modal */}
      {showCreateJobModal && (
        <CreateJobModal
          proposal={proposal}
          isOpen={showCreateJobModal}
          onClose={() => setShowCreateJobModal(false)}
        />
      )}
    </div>
  )
}


// Helper function to group duplicate items by name
function groupDuplicateItems(items: any[]) {
  const grouped = new Map<string, { name: string; count: number; totalPrice: number; unitPrice: number }>()
  
  items.forEach(item => {
    const key = item.name
    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      existing.count += 1
      existing.totalPrice += item.total_price || 0
    } else {
      grouped.set(key, {
        name: item.name,
        count: 1,
        totalPrice: item.total_price || 0,
        unitPrice: item.total_price || 0
      })
    }
  })
  
  return Array.from(grouped.values())
}

// Helper function to organize tiers
function organizeTiers(proposal: any) {
  console.log('🔍 ADMIN: organizeTiers called')
  console.log('🔍 ADMIN: proposal object keys:', Object.keys(proposal))
  
  if (!proposal.proposal_tiers || proposal.proposal_tiers.length === 0) {
    console.error('❌ ADMIN: No proposal_tiers data!', {
      hasTiers: !!proposal.proposal_tiers,
      tiersLength: proposal.proposal_tiers?.length
    })
    return []
  }

  if (!proposal.proposal_items || proposal.proposal_items.length === 0) {
    console.error('❌ ADMIN: No proposal_items data!', {
      hasItems: !!proposal.proposal_items,
      itemsLength: proposal.proposal_items?.length
    })
    return []
  }

  console.log('✅ ADMIN: Data exists')
  console.log('📊 ADMIN: Tiers count:', proposal.proposal_tiers.length)
  console.log('📊 ADMIN: Items count:', proposal.proposal_items.length)
  console.log('📊 ADMIN: Sample items:', proposal.proposal_items.slice(0, 3))

  return proposal.proposal_tiers.map((tier: any) => {
    console.log(`🔍 ADMIN: Processing tier ${tier.tier_level} (${tier.tier_name})`)
    console.log(`🔍 ADMIN: Looking for items with tier_id = ${tier.id}`)
    
    const tierItems = proposal.proposal_items.filter(
      (item: any) => item.tier_id === tier.id
    )
    
    console.log(`📦 ADMIN: Found ${tierItems.length} items for tier ${tier.tier_name}`)
    if (tierItems.length > 0) {
      console.log('📦 ADMIN: Sample tier item:', tierItems[0])
    }
    
    const services = tierItems.filter((i: any) => !i.is_addon)
    const addons = tierItems.filter((i: any) => i.is_addon)
    
    // Group duplicate services
    const groupedServices = groupDuplicateItems(services)
    const groupedAddons = groupDuplicateItems(addons)
    
    const basePrice = services.reduce((sum: number, i: any) => sum + (i.total_price || 0), 0)

    console.log(`✅ ADMIN: Tier ${tier.tier_level} result:`, {
      services: groupedServices.length,
      addons: groupedAddons.length,
      basePrice
    })

    return {
      id: tier.id,
      name: tier.tier_name,
      level: tier.tier_level,
      isSelected: tier.is_selected,
      services: groupedServices,
      addons: groupedAddons,
      basePrice
    }
  })
}
