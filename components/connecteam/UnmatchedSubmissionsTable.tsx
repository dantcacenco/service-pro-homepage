'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Image, 
  Search, 
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  User
} from 'lucide-react'

interface UnmatchedSubmission {
  id: string
  submission_timestamp: string
  job_address: string
  work_description: string
  employee_id: string
  photos_count?: number
}

interface UnmatchedSubmissionsTableProps {
  onImportComplete?: () => void
}

export default function UnmatchedSubmissionsTable({ 
  onImportComplete 
}: UnmatchedSubmissionsTableProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<UnmatchedSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    fetchUnmatchedSubmissions()
  }, [page])

  const fetchUnmatchedSubmissions = async () => {
    try {
      setLoading(true)
      
      // Build query with pagination
      const offset = (page - 1) * ITEMS_PER_PAGE
      let url = `/api/connecteam/unmatched-submissions?limit=${ITEMS_PER_PAGE}&offset=${offset}`
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions')
      }

      setSubmissions(data.submissions || [])
      setTotalCount(data.total || 0)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load unmatched submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1) // Reset to first page
    fetchUnmatchedSubmissions()
  }

  const handleImport = async (submissionId: string) => {
    try {
      setImporting(submissionId)
      
      const response = await fetch('/api/connecteam/import-to-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      // Show success message
      if (data.linked) {
        toast.success('Submission linked to existing job! (duplicate address detected)')
      } else {
        toast.success(`Job created successfully! Job #${data.jobNumber}`)
      }

      // Refresh the list
      fetchUnmatchedSubmissions()
      
      // Notify parent component if callback provided
      if (onImportComplete) {
        onImportComplete()
      }

      // Redirect to job detail page after 1 second
      setTimeout(() => {
        router.push(`/jobs/${data.jobId}`)
      }, 1000)

    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import submission')
    } finally {
      setImporting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return 'No description'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Unmatched Submissions ({totalCount})</span>
          </div>
          <Button
            onClick={fetchUnmatchedSubmissions}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && submissions.length === 0 && (
          <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-semibold text-green-800 mb-2">
              All submissions matched!
            </p>
            <p className="text-sm text-green-600">
              {searchQuery 
                ? 'No results found for your search.' 
                : 'All ConnectTeam submissions have been linked to jobs.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && submissions.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date/Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Photos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(submission.submission_timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-sm">
                            {submission.job_address || 'No address'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {truncateText(submission.work_description)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Image className="h-3 w-3" />
                          {submission.photos_count || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => handleImport(submission.id)}
                          disabled={importing === submission.id}
                          size="sm"
                        >
                          {importing === submission.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Job'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} submissions
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
