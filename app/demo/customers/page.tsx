'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Users, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import AddCustomerModal from './AddCustomerModal'
import { toast } from 'sonner'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [importStats, setImportStats] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUserId(user.id)
    }
  }

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerAdded = (newCustomer: any) => {
    setCustomers([...customers, newCustomer])
    setShowAddModal(false)
  }

  const handleImportFromBillcom = async () => {
    setIsImporting(true)
    setImportStats(null)
    
    toast.info('Starting Bill.com import...', {
      description: 'This may take a minute for large customer lists'
    })

    try {
      const response = await fetch('/api/customers/import-from-billcom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setImportStats(data.stats)
        
        toast.success('Import completed!', {
          description: `${data.stats.new_imports} new, ${data.stats.updated} updated, ${data.stats.skipped} skipped`
        })

        // Refresh customer list
        await fetchCustomers()
      } else {
        throw new Error(data.message || 'Import failed')
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error('Import failed', {
        description: error.message
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-gray-500">Loading customers...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleImportFromBillcom}
            disabled={isImporting}
            variant="outline"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import from Bill.com
              </>
            )}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Import Stats Card */}
      {importStats && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Import Completed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Fetched</div>
                <div className="text-2xl font-bold text-gray-900">{importStats.total_fetched}</div>
              </div>
              <div>
                <div className="text-gray-600">New Imports</div>
                <div className="text-2xl font-bold text-green-600">{importStats.new_imports}</div>
              </div>
              <div>
                <div className="text-gray-600">Updated</div>
                <div className="text-2xl font-bold text-blue-600">{importStats.updated}</div>
              </div>
              <div>
                <div className="text-gray-600">Skipped</div>
                <div className="text-2xl font-bold text-gray-500">{importStats.skipped}</div>
              </div>
              <div>
                <div className="text-gray-600">Errors</div>
                <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
              </div>
            </div>
            
            {importStats.errors > 0 && importStats.error_details?.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-red-800 mb-2">Error Details:</div>
                <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
                  {importStats.error_details.map((err: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-600 mb-1">
                      {err.customer}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => setImportStats(null)}
              variant="ghost"
              size="sm"
              className="mt-4"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Customers ({customers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Address</th>
                  <th className="text-center py-3 px-4">Synced</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  return (
                    <tr 
                      key={customer.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link 
                          href={`/customers/${customer.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>{customer.address || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {customer.billcom_id ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Bill.com
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Local Only
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {customers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No customers yet. Click "Add Customer" or "Import from Bill.com" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerAdded={handleCustomerAdded}
        userId={userId}
      />
    </div>
  )
}
