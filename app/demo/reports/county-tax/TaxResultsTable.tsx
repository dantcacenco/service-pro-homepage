/**
 * Tax Results Table Component
 *
 * Displays counties with tax breakdowns:
 * - County name
 * - Number of invoices
 * - Total subtotal
 * - State tax (4.75%)
 * - County tax (varies)
 * - Total tax owed
 *
 * Features:
 * - Hide counties with $0 (no invoices)
 * - Sortable columns
 * - Expandable rows to see individual invoices per county
 * - Export to CSV button
 *
 * Created: November 18, 2025
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  paid_date: string
  customer_name: string
  customer_address: string
  subtotal: number
  state_tax_amount: number
  county_tax_amount: number
  total_tax: number
}

interface CountyData {
  county: string
  invoiceCount: number
  totalSubtotal: number
  totalStateTax: number
  totalCountyTax: number
  totalTax: number
  avgCountyTaxRate: number
  invoices: Invoice[]
}

interface TaxResultsTableProps {
  counties: CountyData[]
  grandTotalSubtotal: number
  grandTotalStateTax: number
  grandTotalCountyTax: number
  grandTotalTax: number
}

type SortField = 'county' | 'invoiceCount' | 'totalSubtotal' | 'totalStateTax' | 'totalCountyTax' | 'totalTax'
type SortDirection = 'asc' | 'desc'

export default function TaxResultsTable({
  counties,
  grandTotalSubtotal,
  grandTotalStateTax,
  grandTotalCountyTax,
  grandTotalTax
}: TaxResultsTableProps) {
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('totalTax')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleCountyExpanded = (countyName: string) => {
    const newExpanded = new Set(expandedCounties)
    if (newExpanded.has(countyName)) {
      newExpanded.delete(countyName)
    } else {
      newExpanded.add(countyName)
    }
    setExpandedCounties(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sort counties
  const sortedCounties = [...counties].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    // Handle string sorting for county name
    if (sortField === 'county') {
      aVal = (aVal as string).toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const exportToCSV = () => {
    // Build CSV content
    const headers = ['County', 'Invoices', 'Subtotal', 'State Tax (4.75%)', 'County Tax', 'Total Tax', 'Avg County Rate']
    const rows = sortedCounties.map(county => [
      county.county,
      county.invoiceCount,
      county.totalSubtotal.toFixed(2),
      county.totalStateTax.toFixed(2),
      county.totalCountyTax.toFixed(2),
      county.totalTax.toFixed(2),
      `${(county.avgCountyTaxRate * 100).toFixed(2)}%`
    ])

    // Add grand totals
    rows.push([
      'TOTAL',
      counties.reduce((sum, c) => sum + c.invoiceCount, 0).toString(),
      grandTotalSubtotal.toFixed(2),
      grandTotalStateTax.toFixed(2),
      grandTotalCountyTax.toFixed(2),
      grandTotalTax.toFixed(2),
      ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `county-tax-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>
    }
    return <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (counties.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <p className="text-gray-500">No tax results to display. Run the calculation to see results.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('county')}
              >
                <div className="flex items-center space-x-1">
                  <span>County</span>
                  <SortIcon field="county" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('invoiceCount')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Invoices</span>
                  <SortIcon field="invoiceCount" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalSubtotal')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Subtotal</span>
                  <SortIcon field="totalSubtotal" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalStateTax')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>State Tax (4.75%)</span>
                  <SortIcon field="totalStateTax" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalCountyTax')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>County Tax</span>
                  <SortIcon field="totalCountyTax" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalTax')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total Tax</span>
                  <SortIcon field="totalTax" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCounties.map((county) => (
              <>
                {/* County Row */}
                <tr
                  key={county.county}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleCountyExpanded(county.county)}
                >
                  <td className="px-4 py-3 text-center">
                    {expandedCounties.has(county.county) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{county.county} County</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-700">{county.invoiceCount}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-700">${county.totalSubtotal.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-700">${county.totalStateTax.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-700">
                    ${county.totalCountyTax.toFixed(2)}
                    <span className="text-xs text-gray-500 ml-1">
                      ({(county.avgCountyTaxRate * 100).toFixed(2)}%)
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">${county.totalTax.toFixed(2)}</td>
                </tr>

                {/* Expanded Invoice Details */}
                {expandedCounties.has(county.county) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 bg-gray-50">
                      <div className="ml-8">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Invoice #</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Customer</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Paid Date</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Subtotal</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">State Tax</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">County Tax</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody>
                            {county.invoices.map((invoice) => (
                              <tr key={invoice.id} className="border-b border-gray-200">
                                <td className="px-3 py-2 text-gray-700">{invoice.invoice_number}</td>
                                <td className="px-3 py-2 text-gray-700">{invoice.customer_name}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {new Date(invoice.paid_date).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">${invoice.subtotal.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-gray-700">${invoice.state_tax_amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-gray-700">${invoice.county_tax_amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">${invoice.total_tax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {/* Grand Totals Row */}
            <tr className="bg-blue-50 font-semibold">
              <td className="px-4 py-3"></td>
              <td className="px-6 py-3 text-sm text-gray-900">TOTAL</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900">
                {counties.reduce((sum, c) => sum + c.invoiceCount, 0)}
              </td>
              <td className="px-6 py-3 text-sm text-right text-gray-900">${grandTotalSubtotal.toFixed(2)}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900">${grandTotalStateTax.toFixed(2)}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900">${grandTotalCountyTax.toFixed(2)}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900">${grandTotalTax.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
