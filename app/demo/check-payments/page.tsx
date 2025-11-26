'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function CheckPaymentsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const supabase = createClient()

  const checkAllPayments = async () => {
    setLoading(true)
    setResults([])

    try {
      // Get all proposals with Bill.com invoices
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, proposal_number, billcom_invoice_id, billcom_invoice_link, billcom_amount_paid, total')
        .not('billcom_invoice_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!proposals) return
      const checkResults = []

      for (const proposal of proposals) {
        try {
          const response = await fetch('/api/billcom/check-payment-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposalId: proposal.id })
          })

          const data = await response.json()
          checkResults.push({
            proposalNumber: proposal.proposal_number,
            invoiceLink: proposal.billcom_invoice_link,
            total: proposal.total,
            amountPaid: data.amountPaid || 0,
            percentage: data.paymentPercentage || 0,
            stage: data.paymentStage || 'unknown',
            status: data.invoiceStatus || 'unknown',
            success: data.success
          })
        } catch (error) {
          checkResults.push({
            proposalNumber: proposal.proposal_number,
            error: 'Failed to check status'
          })
        }
      }
      setResults(checkResults)
    } catch (error) {
      console.error('Error checking payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Check Bill.com Payment Status</CardTitle>
          <p className="text-sm text-gray-600">
            Manually check payment status for all proposals with Bill.com invoices
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkAllPayments} 
            disabled={loading}
            className="mb-4"
          >            {loading ? 'Checking...' : 'Check All Payments'}
          </Button>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Proposal #{result.proposalNumber}</h3>
                      {result.error ? (
                        <p className="text-red-500">{result.error}</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            Status: <span className="font-medium">{result.status}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Stage: <span className="font-medium">{result.stage}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Paid: <span className="font-medium">
                              {formatCurrency(result.amountPaid)} of {formatCurrency(result.total)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Progress: <span className="font-medium">{result.percentage?.toFixed(1)}%</span>
                          </p>
                        </>
                      )}
                    </div>                    {result.invoiceLink && (
                      <a
                        href={result.invoiceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Open in Bill.com
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}