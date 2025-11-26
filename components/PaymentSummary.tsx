'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentSummaryProps {
  proposalId: string
  total: number
  billcomInvoiceId?: string | null
  billcomInvoiceLink?: string | null
}

export default function PaymentSummary({ 
  proposalId, 
  total,
  billcomInvoiceId,
  billcomInvoiceLink
}: PaymentSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [amountPaid, setAmountPaid] = useState(0)
  const [invoiceStatus, setInvoiceStatus] = useState<string>('PENDING')

  const checkPaymentStatus = async () => {
    if (!billcomInvoiceId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/billcom/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAmountPaid(data.amountPaid || 0)
          setInvoiceStatus(data.invoiceStatus || 'PENDING')
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkPaymentStatus()
    // Poll every 30 seconds
    const interval = setInterval(checkPaymentStatus, 30000)
    return () => clearInterval(interval)
  }, [proposalId, billcomInvoiceId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const remainingBalance = total - amountPaid
  const completionPercentage = total > 0 ? (amountPaid / total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary (Bill.com)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkPaymentStatus}
              disabled={loading || !billcomInvoiceId}
              title="Refresh payment status"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {billcomInvoiceLink && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={billcomInvoiceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Invoice
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Contract</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(amountPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Balance</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(remainingBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{completionPercentage.toFixed(1)}%</p>
                <span className={`text-sm px-2 py-0.5 rounded-full ${
                  invoiceStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                  invoiceStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-700' :
                  invoiceStatus === 'SENT' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoiceStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {!billcomInvoiceId && (
          <div className="text-sm text-gray-500 text-center">
            No Bill.com invoice created yet. Invoice will be created when customer initiates payment.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
