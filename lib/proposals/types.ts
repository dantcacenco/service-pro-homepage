/**
 * Shared types for proposal approval automation
 */

export interface ProposalCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  billcom_id?: string
  billcom_customer_id?: string
}

export interface ProposalItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
  is_addon: boolean
  is_selected: boolean
  tier_id?: string
}

export interface ProposalTier {
  id: string
  tier_level: number
  tier_name: string
  is_selected: boolean
}

export interface Proposal {
  id: string
  proposal_number: string
  customer_id: string
  title: string
  tier_mode: 'single' | 'multi'
  subtotal: number
  total: number
  tax_rate: number
  county?: string
  status: string
  job_id?: string
  job_auto_created?: boolean
  billcom_deposit_invoice_id?: string
  billcom_deposit_invoice_link?: string
  billcom_deposit_status?: string
  billcom_customer_id?: string
  customer_view_token?: string
  customers?: ProposalCustomer
  proposal_items?: ProposalItem[]
  proposal_tiers?: ProposalTier[]
}

export interface InvoiceCreationResult {
  success: boolean
  invoiceId?: string
  invoiceLink?: string
  dbInvoiceId?: string
  error?: string
}

export interface JobCreationResult {
  success: boolean
  jobId?: string
  jobNumber?: string
  merged?: boolean
  error?: string
}

export interface EmailNotificationResult {
  success: boolean
  customerEmailSent: boolean
  businessEmailSent: boolean
  error?: string
}
