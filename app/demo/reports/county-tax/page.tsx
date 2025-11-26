/**
 * County Tax Report Page (On-Demand)
 *
 * Completely redesigned tax reporting system:
 * - Manual sync from Bill.com
 * - On-demand tax calculation with progress tracking
 * - Comprehensive filters (date, county, customer)
 * - Real-time progress updates
 * - Expandable results table
 *
 * Created: November 18, 2025
 */

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CountyTaxReportClient from './CountyTaxReportClient'

export default async function CountyTaxPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // Check user role - only admin/boss can view this
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'boss') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">This report is only available to administrators.</p>
      </div>
    )
  }

  // Get latest calculation run status
  const { data: latestRun } = await supabase
    .from('tax_calculation_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get sync statistics
  const { count: totalInvoicesSynced } = await supabase
    .from('billcom_invoices_sync')
    .select('*', { count: 'exact', head: true })

  const { count: paidInvoicesCount } = await supabase
    .from('billcom_invoices_sync')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'paid')

  return (
    <CountyTaxReportClient
      userId={user.id}
      latestRun={latestRun || null}
      totalInvoicesSynced={totalInvoicesSynced || 0}
      paidInvoicesCount={paidInvoicesCount || 0}
    />
  )
}
