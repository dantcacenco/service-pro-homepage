'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import CustomerSearchInput from '@/components/customers/CustomerSearchInput'
import { STATUS_LABELS } from '@/lib/status-sync'
import { STAGES_IN_ORDER, getStageDefinition, type JobStage } from '@/lib/stages/definitions'

interface EditJobModalProps {
  job: any
  isOpen: boolean
  onClose: () => void
  onJobUpdated: () => void
}

export function EditJobModal({ job, isOpen, onClose, onJobUpdated }: EditJobModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [formData, setFormData] = useState({
    customer_id: job.customer_id || '',
    service_address: job.service_address || '',
    status: job.status || 'scheduled',
    stage: job.stage || 'beginning',
    proposal_links: job.proposal_links || [],
    invoice_links: job.invoice_links || [],
    openphone_links: job.openphone_links || []
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    // Set initial selected customer when customers are loaded
    if (customers.length > 0 && formData.customer_id) {
      const customer = customers.find(c => c.id === formData.customer_id)
      if (customer) {
        setSelectedCustomer(customer)
      }
    }
  }, [customers, formData.customer_id])

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')

    if (!error && data) {
      setCustomers(data)
    }
  }

  // Proposal link management
  const addProposalLink = () => {
    setFormData({
      ...formData,
      proposal_links: [...formData.proposal_links, '']
    })
  }

  const updateProposalLink = (index: number, value: string) => {
    const updatedLinks = [...formData.proposal_links]
    updatedLinks[index] = value
    setFormData({ ...formData, proposal_links: updatedLinks })
  }

  const removeProposalLink = (index: number) => {
    setFormData({
      ...formData,
      proposal_links: formData.proposal_links.filter((_: any, i: number) => i !== index)
    })
  }

  // Invoice link management
  const addInvoiceLink = () => {
    setFormData({
      ...formData,
      invoice_links: [...formData.invoice_links, { url: '', stage: 'deposit', quantity: 0.5 }]
    })
  }

  const updateInvoiceLink = (index: number, field: 'url' | 'stage' | 'quantity', value: any) => {
    const updatedLinks = [...formData.invoice_links]
    updatedLinks[index][field] = value
    setFormData({ ...formData, invoice_links: updatedLinks })
  }

  const removeInvoiceLink = (index: number) => {
    setFormData({
      ...formData,
      invoice_links: formData.invoice_links.filter((_: any, i: number) => i !== index)
    })
  }

  // OpenPhone link management
  const addOpenPhoneLink = () => {
    setFormData({
      ...formData,
      openphone_links: [...formData.openphone_links, { url: '', label: '' }]
    })
  }

  const updateOpenPhoneLink = (index: number, field: 'url' | 'label', value: string) => {
    const updatedLinks = [...formData.openphone_links]
    updatedLinks[index][field] = value
    setFormData({ ...formData, openphone_links: updatedLinks })
  }

  const removeOpenPhoneLink = (index: number) => {
    setFormData({
      ...formData,
      openphone_links: formData.openphone_links.filter((_: any, i: number) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update job data
      const jobUpdates: any = {
        customer_id: formData.customer_id,
        service_address: formData.service_address,
        status: formData.status,
        stage: formData.stage,
        proposal_links: formData.proposal_links.filter((link: string) => link.trim()), // Only save non-empty links
        invoice_links: formData.invoice_links.filter((link: any) => link.url.trim()), // Only save links with URLs
        openphone_links: formData.openphone_links.filter((link: any) => link.url.trim()) // Only save links with URLs
      }

      const { error: jobError } = await supabase
        .from('jobs')
        .update(jobUpdates)
        .eq('id', job.id)

      if (jobError) throw jobError

      toast.success('Job updated successfully')
      onJobUpdated()
      onClose()
    } catch (error: any) {
      console.error('Error updating:', error)
      toast.error(error.message || 'Failed to update')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Job</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer (Bill.com)
            </label>
            <CustomerSearchInput
              customers={customers}
              value={selectedCustomer}
              onChange={(customer) => {
                setSelectedCustomer(customer)
                setFormData({ ...formData, customer_id: customer?.id || '' })
              }}
              placeholder="Search customer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Customers are synced from Bill.com. To add a new customer, create them in Bill.com first.
            </p>
          </div>

          {/* Service Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Address
            </label>
            <input
              type="text"
              placeholder="123 Main St, Canton, NC 28716"
              value={formData.service_address}
              onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Job Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <optgroup label="Planning">
                <option value="not_scheduled">Not Scheduled</option>
                <option value="estimate">Estimate 🟣</option>
                <option value="scheduled">Scheduled</option>
                <option value="ask_vadim">Ask Vadim ⚠️</option>
              </optgroup>

              <optgroup label="Active Work">
                <option value="start_up">Start Up</option>
                <option value="working_on_it">Working On It</option>
                <option value="parts_needed">Parts Needed</option>
              </optgroup>

              <optgroup label="Completion">
                <option value="done">Done</option>
                <option value="sent_invoice">Sent Invoice</option>
                <option value="warranty">Warranty</option>
                <option value="warranty_no_charge">Warranty/No Charge</option>
              </optgroup>

              <optgroup label="Final">
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
                <option value="cancelled">Cancelled</option>
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Current: {STATUS_LABELS[formData.status as keyof typeof STATUS_LABELS] || formData.status}
            </p>
          </div>

          {/* Job Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              {STAGES_IN_ORDER.map((stageKey) => {
                const stageDef = getStageDefinition(stageKey as JobStage)
                return (
                  <option key={stageKey} value={stageKey}>
                    {stageDef.name}
                  </option>
                )
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getStageDefinition(formData.stage as JobStage).description}
            </p>
          </div>

          {/* Proposal Links */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Proposals</h3>
              <button
                type="button"
                onClick={addProposalLink}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
              >
                <Plus className="h-4 w-4" />
                Add Link
              </button>
            </div>
            
            {formData.proposal_links.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No proposal links added yet.</p>
            ) : (
              <div className="space-y-2">
                {formData.proposal_links.map((link: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://fairairhc.service-pro.app/proposal/view/..."
                      value={link}
                      onChange={(e) => updateProposalLink(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeProposalLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Links */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Invoices</h3>
              <button
                type="button"
                onClick={addInvoiceLink}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
              >
                <Plus className="h-4 w-4" />
                Add Link
              </button>
            </div>
            
            {formData.invoice_links.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No invoice links added yet.</p>
            ) : (
              <div className="space-y-4">
                {formData.invoice_links.map((invoice: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        placeholder="https://app02.us.bill.com/..."
                        value={invoice.url}
                        onChange={(e) => updateInvoiceLink(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={invoice.stage}
                          onChange={(e) => updateInvoiceLink(index, 'stage', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="deposit">Deposit</option>
                          <option value="rough-in">Rough-In</option>
                          <option value="final">Final</option>
                        </select>
                        <select
                          value={invoice.quantity}
                          onChange={(e) => updateInvoiceLink(index, 'quantity', parseFloat(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="0.5">50%</option>
                          <option value="0.3">30%</option>
                          <option value="0.2">20%</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInvoiceLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OpenPhone Links */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">OpenPhone</h3>
              <button
                type="button"
                onClick={addOpenPhoneLink}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
              >
                <Plus className="h-4 w-4" />
                Add Link
              </button>
            </div>
            
            {formData.openphone_links.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No OpenPhone links added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.openphone_links.map((link: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Label (e.g., Initial Call)"
                        value={link.label}
                        onChange={(e) => updateOpenPhoneLink(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://app.openphone.com/calls/..."
                        value={link.url}
                        onChange={(e) => updateOpenPhoneLink(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOpenPhoneLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
