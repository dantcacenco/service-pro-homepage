'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FixTaxRatesPage() {
  const [checking, setChecking] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkTaxRate = async () => {
    setChecking(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/fix-proposal-tax', {
        method: 'GET'
      })
      
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  const fixTaxRate = async () => {
    if (!confirm('This will update the proposal tax rate in the database. Continue?')) {
      return
    }

    setFixing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/fix-proposal-tax', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fix Proposal Tax Rate</CardTitle>
          <CardDescription>
            Fix the tax rate for proposal 2313ada2-6d9b-4bd1-b8f4-b5ef5a18d138
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={checkTaxRate}
              disabled={checking}
              variant="outline"
            >
              {checking ? 'Checking...' : 'Check Current Values'}
            </Button>
            
            <Button 
              onClick={fixTaxRate}
              disabled={fixing}
              variant="default"
            >
              {fixing ? 'Fixing...' : 'Fix Tax Rate'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 border rounded p-4">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
