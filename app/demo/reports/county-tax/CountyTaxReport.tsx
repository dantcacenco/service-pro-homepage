'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SystemPayment {
  id: string
  amount: number
  subtotal: number
  state_tax_amount: number
  county_tax_amount: number
  county: string
  payment_stage: string
  created_at: string
  proposals: {
    id: string
    proposal_number: string
    customers: {
      name: string
      address: string
    } | null
  }
}

interface BillcomInvoice {
  id: string
  billcom_invoice_id: string
  invoice_number: string
  invoice_date: string
  customer_name: string
  customer_address: string | null
  amount: number
  subtotal: number
  state_tax_amount: number
  county_tax_amount: number
  county: string | null
  payment_status: string
  paid_date: string | null
  is_test_invoice: boolean
  exclude_from_reports: boolean
  exclusion_reason: string | null
  created_in_system: boolean
  source: string
}

interface UnifiedInvoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_address: string | null
  date: string
  amount: number
  subtotal: number
  state_tax_amount: number
  county_tax_amount: number
  county: string
  source: 'system' | 'billcom'
  is_test: boolean
  payment_stage?: string
}

interface CountyTaxReportProps {
  systemPayments: SystemPayment[]
  billcomInvoices: BillcomInvoice[]
  lastSyncTime: string | null
}

export default function CountyTaxReport({
  systemPayments,
  billcomInvoices,
  lastSyncTime
}: CountyTaxReportProps) {
  // Debug: Log data received
  console.log('[TAX REPORT] Component mounted/updated')
  console.log('[TAX REPORT] System payments:', systemPayments?.length || 0)
  console.log('[TAX REPORT] Bill.com invoices:', billcomInvoices?.length || 0)
  console.log('[TAX REPORT] Last sync time:', lastSyncTime)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [excludeTest, setExcludeTest] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'system' | 'billcom'>('all')
  const [isSyncing, setIsSyncing] = useState(false)

  // Merge both data sources into unified format
  const allInvoices = useMemo((): UnifiedInvoice[] => {
    const unified: UnifiedInvoice[] = []

    // Add system payments
    systemPayments.forEach(p => {
      unified.push({
        id: p.id,
        invoice_number: p.proposals?.proposal_number || 'N/A',
        customer_name: p.proposals?.customers?.name || 'N/A',
        customer_address: p.proposals?.customers?.address || null,
        date: p.created_at,
        amount: Number(p.amount) || 0,
        subtotal: Number(p.subtotal) || 0,
        state_tax_amount: Number(p.state_tax_amount) || 0,
        county_tax_amount: Number(p.county_tax_amount) || 0,
        county: p.county || 'Unknown',
        source: 'system',
        is_test: false,
        payment_stage: p.payment_stage
      })
    })

    // Add Bill.com invoices (only those not already in system)
    billcomInvoices.forEach(inv => {
      // Skip if no county data
      if (!inv.county) return

      // Skip if already in system (linked_proposal_id exists)
      if (inv.created_in_system) return

      unified.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        customer_address: inv.customer_address,
        date: inv.paid_date || inv.invoice_date,
        amount: Number(inv.amount) || 0,
        subtotal: Number(inv.subtotal) || 0,
        state_tax_amount: Number(inv.state_tax_amount) || 0,
        county_tax_amount: Number(inv.county_tax_amount) || 0,
        county: inv.county,
        source: 'billcom',
        is_test: inv.is_test_invoice || inv.exclude_from_reports
      })
    })

    return unified
  }, [systemPayments, billcomInvoices])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      // Date range filter
      const invoiceDate = new Date(inv.date)
      const from = dateFrom ? new Date(dateFrom) : null
      const to = dateTo ? new Date(dateTo) : null

      if (from && invoiceDate < from) return false
      if (to) {
        const toEndOfDay = new Date(to)
        toEndOfDay.setHours(23, 59, 59, 999)
        if (invoiceDate > toEndOfDay) return false
      }

      // County filter
      if (selectedCounty && inv.county !== selectedCounty) return false

      // Test invoice filter
      if (excludeTest && inv.is_test) return false

      // Source filter
      if (sourceFilter !== 'all' && inv.source !== sourceFilter) return false

      return true
    })
  }, [allInvoices, dateFrom, dateTo, selectedCounty, excludeTest, sourceFilter])

  // Calculate county summaries
  const countySummaries = useMemo(() => {
    const summaries = new Map<string, {
      county: string
      invoiceCount: number
      totalStateTax: number
      totalCountyTax: number
      totalRevenue: number
    }>()

    filteredInvoices.forEach(inv => {
      const county = inv.county || 'Unknown County'
      const existing = summaries.get(county) || {
        county,
        invoiceCount: 0,
        totalStateTax: 0,
        totalCountyTax: 0,
        totalRevenue: 0
      }

      existing.invoiceCount++
      existing.totalStateTax += inv.state_tax_amount
      existing.totalCountyTax += inv.county_tax_amount
      existing.totalRevenue += inv.amount

      summaries.set(county, existing)
    })

    return Array.from(summaries.values()).sort((a, b) =>
      b.totalCountyTax - a.totalCountyTax
    )
  }, [filteredInvoices])

  const grandTotals = useMemo(() => {
    return countySummaries.reduce((acc, county) => ({
      invoiceCount: acc.invoiceCount + county.invoiceCount,
      totalStateTax: acc.totalStateTax + county.totalStateTax,
      totalCountyTax: acc.totalCountyTax + county.totalCountyTax,
      totalRevenue: acc.totalRevenue + county.totalRevenue
    }), {
      invoiceCount: 0,
      totalStateTax: 0,
      totalCountyTax: 0,
      totalRevenue: 0
    })
  }, [countySummaries])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const exportToCSV = () => {
    const headers = ['Invoice #', 'Date', 'Customer', 'County', 'Subtotal', 'State Tax', 'County Tax', 'Total', 'Source', 'Is Test']
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      formatDate(inv.date),
      inv.customer_name,
      inv.county,
      inv.subtotal.toFixed(2),
      inv.state_tax_amount.toFixed(2),
      inv.county_tax_amount.toFixed(2),
      inv.amount.toFixed(2),
      inv.source,
      inv.is_test ? 'Yes' : 'No'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `county-tax-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleSyncNow = async () => {
    console.log('===== SYNC NOW BUTTON CLICKED =====')
    console.log('[TAX REPORT] Starting batched Bill.com sync...')
    console.log('[TAX REPORT] Current time:', new Date().toISOString())

    setIsSyncing(true)
    toast.info('Starting Bill.com sync...')

    try {
      let offset = 0
      let hasMore = true
      let totalSynced = 0
      let totalNew = 0
      let totalUpdated = 0
      let totalFailed = 0
      let batchCount = 0

      // Process batches until no more invoices
      while (hasMore) {
        batchCount++
        console.log(`\n[TAX REPORT] 📦 Processing batch ${batchCount} (offset: ${offset})...`)

        toast.info(`Syncing batch ${batchCount}... (${totalSynced} processed so far)`)

        const response = await fetch(
          `/api/cron/sync-billcom-invoices?batch_size=10&offset=${offset}`
        )

        console.log('[TAX REPORT] Response status:', response.status, response.statusText)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('[TAX REPORT] Batch result:', data)

        if (!data.success) {
          throw new Error(data.error || 'Sync failed')
        }

        // Accumulate totals
        totalSynced += data.batch_synced || 0
        totalNew += data.batch_new || 0
        totalUpdated += data.batch_updated || 0
        totalFailed += data.batch_failed || 0

        console.log('[TAX REPORT] Running totals:', {
          totalSynced,
          totalNew,
          totalUpdated,
          totalFailed
        })

        // Check if more batches needed
        hasMore = data.has_more
        offset = data.next_offset || (offset + 10)

        console.log('[TAX REPORT] Has more:', hasMore)
        console.log('[TAX REPORT] Next offset:', offset)

        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      console.log('\n' + '='.repeat(80))
      console.log('[TAX REPORT] ✅ ALL BATCHES COMPLETE!')
      console.log(`[TAX REPORT] Total synced: ${totalSynced}`)
      console.log(`[TAX REPORT] Total new: ${totalNew}`)
      console.log(`[TAX REPORT] Total updated: ${totalUpdated}`)
      console.log(`[TAX REPORT] Total failed: ${totalFailed}`)
      console.log(`[TAX REPORT] Batches processed: ${batchCount}`)
      console.log('='.repeat(80))

      toast.success(
        `Sync complete! ${totalSynced} invoices synced (${totalNew} new, ${totalUpdated} updated) in ${batchCount} batches`
      )

      // Reload the page to show new data
      console.log('[TAX REPORT] Reloading page to show new data...')
      window.location.reload()
    } catch (error: any) {
      console.error('===== ERROR CAUGHT =====')
      console.error('[TAX REPORT] ❌ Sync error:', error)
      console.error('[TAX REPORT] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })

      toast.error(`Sync failed: ${error?.message || 'Unknown error'}`)
    } finally {
      console.log('[TAX REPORT] Sync complete, resetting state')
      setIsSyncing(false)
    }
  }

  const setCurrentQuarter = () => {
    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3)
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
    const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0)

    setDateFrom(quarterStart.toISOString().split('T')[0])
    setDateTo(quarterEnd.toISOString().split('T')[0])
  }

  const setCurrentMonth = () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDateFrom(monthStart.toISOString().split('T')[0])
    setDateTo(monthEnd.toISOString().split('T')[0])
  }

  const setCurrentYear = () => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)

    setDateFrom(yearStart.toISOString().split('T')[0])
    setDateTo(yearEnd.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">County Tax Report</h1>
          <p className="text-gray-600 mt-1">Track tax collections by county for accounting and remittance</p>
          {lastSyncTime && (
            <p className="text-sm text-gray-500 mt-1">
              Last synced: {formatDateTime(lastSyncTime)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              console.log('[TEST] Testing Bill.com connection...')
              try {
                const response = await fetch('/api/test-billcom')
                const data = await response.json()
                console.log('[TEST] Bill.com response:', data)
                if (data.success) {
                  alert(`Bill.com connected! Found ${data.invoice_count} invoices. Check console for details.`)
                } else {
                  alert(`Bill.com error: ${data.error}`)
                }
              } catch (error) {
                console.error('[TEST] Error:', error)
                alert('Test failed!')
              }
            }}
            variant="ghost"
            size="sm"
          >
            Test Bill.com
          </Button>
          <Button onClick={handleSyncNow} variant="outline" disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium mb-1">Quick Select</label>
                <div className="flex gap-2">
                  <Button onClick={setCurrentMonth} variant="outline" size="sm">
                    This Month
                  </Button>
                  <Button onClick={setCurrentQuarter} variant="outline" size="sm">
                    This Quarter
                  </Button>
                  <Button onClick={setCurrentYear} variant="outline" size="sm">
                    This Year
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {/* Exclude Test Invoices */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="excludeTest"
                  checked={excludeTest}
                  onChange={(e) => setExcludeTest(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="excludeTest" className="ml-2 text-sm font-medium text-gray-700">
                  Exclude test invoices (Danny, Test Customer, etc.)
                </label>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Source</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSourceFilter('all')}
                    variant={sourceFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                  >
                    All Sources
                  </Button>
                  <Button
                    onClick={() => setSourceFilter('system')}
                    variant={sourceFilter === 'system' ? 'default' : 'outline'}
                    size="sm"
                  >
                    System Only
                  </Button>
                  <Button
                    onClick={() => setSourceFilter('billcom')}
                    variant={sourceFilter === 'billcom' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Bill.com Only
                  </Button>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(dateFrom || dateTo || selectedCounty || !excludeTest || sourceFilter !== 'all') && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setSelectedCounty(null)
                    setExcludeTest(true)
                    setSourceFilter('all')
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invoices Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{grandTotals.invoiceCount}</p>
            <p className="text-sm text-gray-600 mt-1">
              {allInvoices.filter(i => i.source === 'system').length} system, {allInvoices.filter(i => i.source === 'billcom').length} external
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">State Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(grandTotals.totalStateTax)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">County Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(grandTotals.totalCountyTax)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(grandTotals.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Invoice Warning */}
      {!excludeTest && allInvoices.some(i => i.is_test) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Test Invoices Included</h3>
                <p className="text-sm text-orange-700 mt-1">
                  You are currently viewing test invoices. Enable "Exclude test invoices" filter for accurate tax reporting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* County Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>County Breakdown</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Tax collections by county - {countySummaries.length} counties
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>County</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="text-right">State Tax</TableHead>
                <TableHead className="text-right">County Tax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countySummaries.map((summary) => (
                <TableRow
                  key={summary.county}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedCounty(selectedCounty === summary.county ? null : summary.county)}
                >
                  <TableCell className="font-medium">
                    {summary.county}
                    {selectedCounty === summary.county && (
                      <Badge className="ml-2" variant="secondary">Selected</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{summary.invoiceCount}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(summary.totalStateTax)}</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(summary.totalCountyTax)}</TableCell>
                </TableRow>
              ))}
              {countySummaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No invoices found for selected filters
                  </TableCell>
                </TableRow>
              )}
              {countySummaries.length > 0 && (
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{grandTotals.invoiceCount}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(grandTotals.totalStateTax)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(grandTotals.totalCountyTax)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual Invoices (when county selected) */}
      {selectedCounty && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices Collected in {selectedCounty}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">State Tax</TableHead>
                  <TableHead className="text-right">County Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices
                  .filter(inv => inv.county === selectedCounty)
                  .map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                        {invoice.is_test && (
                          <Badge className="ml-2" variant="outline">Test</Badge>
                        )}
                      </TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.source === 'system' ? 'default' : 'secondary'}>
                          {invoice.source === 'system' ? 'System' : 'Bill.com'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.state_tax_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.county_tax_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
