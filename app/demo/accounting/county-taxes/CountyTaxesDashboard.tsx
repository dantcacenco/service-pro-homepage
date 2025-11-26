'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InvoiceDetail {
  id: string
  billcom_invoice_id: string | null
  county_tax_amount: number
  amount: number
  paid_at: string
  customer_address: string
  customer_name: string
}

interface CountyTaxData {
  county: string
  total_county_tax: number
  invoice_count: number
  invoices: InvoiceDetail[]
}

type DateRange = 'current_month' | 'last_month' | 'current_quarter' | 'ytd' | 'custom'

export default function CountyTaxesDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countyData, setCountyData] = useState<CountyTaxData[]>([])
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange>('current_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const supabase = createClient()

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (dateRange) {
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        if (startDate && endDate) {
          return {
            start: startDate,
            end: endDate
          }
        }
        // Default to current month if custom dates not set
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    fetchCountyTaxData()
  }, [dateRange, startDate, endDate])

  const fetchCountyTaxData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { start, end } = getDateRange()

      // Fetch paid invoices with county tax data
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          billcom_invoice_id,
          county,
          county_tax_amount,
          amount,
          paid_at,
          customers (
            name,
            address
          )
        `)
        .eq('status', 'paid')
        .gte('paid_at', start)
        .lte('paid_at', end)
        .not('county', 'is', null)
        .not('county_tax_amount', 'is', null)
        .order('paid_at', { ascending: false })

      if (invoicesError) {
        throw invoicesError
      }

      // Group by county and calculate totals
      const countyMap = new Map<string, CountyTaxData>()

      invoices?.forEach((invoice: any) => {
        const county = invoice.county || 'Unknown'
        const countyTax = Number(invoice.county_tax_amount) || 0

        if (!countyMap.has(county)) {
          countyMap.set(county, {
            county,
            total_county_tax: 0,
            invoice_count: 0,
            invoices: []
          })
        }

        const countyData = countyMap.get(county)!
        countyData.total_county_tax += countyTax
        countyData.invoice_count += 1
        countyData.invoices.push({
          id: invoice.id,
          billcom_invoice_id: invoice.billcom_invoice_id,
          county_tax_amount: countyTax,
          amount: Number(invoice.amount) || 0,
          paid_at: invoice.paid_at,
          customer_address: invoice.customers?.address || 'N/A',
          customer_name: invoice.customers?.name || 'N/A'
        })
      })

      // Convert to array and sort by total tax collected
      const sortedData = Array.from(countyMap.values()).sort(
        (a, b) => b.total_county_tax - a.total_county_tax
      )

      setCountyData(sortedData)
    } catch (err) {
      console.error('Error fetching county tax data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const toggleCounty = (county: string) => {
    setExpandedCounties(prev => {
      const newSet = new Set(prev)
      if (newSet.has(county)) {
        newSet.delete(county)
      } else {
        newSet.add(county)
      }
      return newSet
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBillcomUrl = (invoiceId: string | null) => {
    if (!invoiceId) return null
    return `https://app.bill.com/invoice/${invoiceId}`
  }

  const getTotalTaxCollected = () => {
    return countyData.reduce((sum, county) => sum + county.total_county_tax, 0)
  }

  const getTotalInvoiceCount = () => {
    return countyData.reduce((sum, county) => sum + county.invoice_count, 0)
  }

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange()
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading county tax data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchCountyTaxData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          County Tax Dashboard
        </h1>
        <p className="text-gray-600">
          Track county tax collections from paid invoices
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Date Range:</span>
          </div>

          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="current_quarter">Current Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <div className="text-sm text-gray-600 ml-auto">
            {getDateRangeLabel()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="text-blue-600 text-sm font-medium mb-1">
            Total County Tax Collected
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrency(getTotalTaxCollected())}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
          <div className="text-green-600 text-sm font-medium mb-1">
            Total Paid Invoices
          </div>
          <div className="text-3xl font-bold text-green-900">
            {getTotalInvoiceCount()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="text-purple-600 text-sm font-medium mb-1">
            Counties
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {countyData.length}
          </div>
        </div>
      </div>

      {/* County Tax Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tax Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number of Invoices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {countyData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No paid invoices found for the selected date range
                  </td>
                </tr>
              ) : (
                countyData.map((county) => (
                  <>
                    {/* County Summary Row */}
                    <tr
                      key={county.county}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleCounty(county.county)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {county.county}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(county.total_county_tax)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {county.invoice_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCounty(county.county)
                          }}
                        >
                          {expandedCounties.has(county.county) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded Invoice Details */}
                    {expandedCounties.has(county.county) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Invoice Details
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      Customer
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      Address
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      Job Total
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      County Tax
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      Paid Date
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                      Invoice
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {county.invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {invoice.customer_name}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {invoice.customer_address}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {formatCurrency(invoice.amount)}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                                        {formatCurrency(invoice.county_tax_amount)}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatDate(invoice.paid_at)}
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        {invoice.billcom_invoice_id ? (
                                          <a
                                            href={getBillcomUrl(invoice.billcom_invoice_id) || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            View
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        ) : (
                                          <span className="text-gray-400">N/A</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
