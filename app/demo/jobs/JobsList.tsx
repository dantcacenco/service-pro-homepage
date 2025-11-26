'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getUnifiedDisplayStatus, STATUS_COLORS } from '@/lib/status-sync'

interface JobsListProps {
  jobs: any[]
  userRole: string
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function JobsList({ 
  jobs, 
  userRole,
  currentPage,
  totalPages,
  totalCount
}: JobsListProps) {
  const router = useRouter()

  const getStatusColor = (jobStatus: string) => {
    // Use the centralized STATUS_COLORS mapping
    // If status not found, return default gray
    return STATUS_COLORS[jobStatus] || 'bg-gray-100 text-gray-800'
  }

  const handleRowClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  // Calculate pagination range
  const startItem = totalCount > 0 ? (currentPage - 1) * 20 + 1 : 0
  const endItem = Math.min(currentPage * 20, totalCount)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No jobs found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalCount} jobs
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Job #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    onClick={() => handleRowClick(job.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-blue-600">
                        {job.job_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{job.customer_name || job.customers?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{job.customer_phone || job.customers?.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{job.service_address || 'No address'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const displayStatus = getUnifiedDisplayStatus(
                          job.status, 
                          job.proposals?.status || ''
                        )
                        return (
                          <Badge className={getStatusColor(job.status)}>
                            {displayStatus}
                          </Badge>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls - Only show if more than 1 page */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href={currentPage > 1 ? `/jobs?page=${currentPage - 1}` : '#'}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={`/jobs?page=${page}`}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href={currentPage < totalPages ? `/jobs?page=${currentPage + 1}` : '#'}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
