import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsList from './JobsList'
import JobsListHeader from './JobsListHeader'

const JOBS_PER_PAGE = 20

export default async function JobsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string; date_from?: string; date_to?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'technician'

  // Get all filter params from URL
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))
  const statusFilter = params.status || 'all'
  const searchQuery = params.search || ''
  const dateFrom = params.date_from || ''
  const dateTo = params.date_to || ''
  const offset = (currentPage - 1) * JOBS_PER_PAGE

  console.log('JobsPage - User role:', userRole, 'User ID:', user.id, 'Page:', currentPage, 'Search:', searchQuery, 'DateFrom:', dateFrom, 'DateTo:', dateTo)

  let jobs = []
  let totalCount = 0

  if (userRole === 'technician') {
    // First, get job IDs assigned to this technician
    const { data: assignments, error: assignmentError } = await supabase
      .from('job_technicians')
      .select('job_id')
      .eq('technician_id', user.id)

    console.log('Technician assignments:', assignments, 'Error:', assignmentError)

    if (assignments && assignments.length > 0) {
      const jobIds = assignments.map(a => a.job_id)

      // Build query with all filters
      let query = supabase
        .from('jobs')
        .select(`
          *,
          customers!customer_id (
            name,
            email,
            phone,
            address
          ),
          proposals!proposal_id (
            id,
            status
          )
        `, { count: 'exact' })
        .in('id', jobIds)

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom + 'T00:00:00')
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59')
      }

      // Apply search filter (searches job_number, service_address, and customer name via OR)
      if (searchQuery) {
        query = query.or(`job_number.ilike.%${searchQuery}%,service_address.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
      }

      // Get total count with filters
      const { count } = await query
      totalCount = count || 0

      // Then fetch paginated jobs
      const { data: techJobs, error: jobsError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + JOBS_PER_PAGE - 1)

      console.log('Technician jobs:', techJobs?.length, 'Error:', jobsError)
      jobs = techJobs || []
    }
  } else {
    // Boss/admin sees all jobs - build query with all filters
    let countQuery = supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      countQuery = countQuery.eq('status', statusFilter)
    }

    // Apply date filters
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom + 'T00:00:00')
    }
    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo + 'T23:59:59')
    }

    // Apply search filter
    if (searchQuery) {
      countQuery = countQuery.or(`job_number.ilike.%${searchQuery}%,service_address.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
    }

    const { count } = await countQuery
    totalCount = count || 0

    // Then fetch paginated jobs
    let dataQuery = supabase
      .from('jobs')
      .select(`
        *,
        customers!customer_id (
          name,
          email,
          phone,
          address
        ),
        proposals!proposal_id (
          id,
          status
        )
      `)

    // Apply same filters
    if (statusFilter !== 'all') {
      dataQuery = dataQuery.eq('status', statusFilter)
    }

    if (dateFrom) {
      dataQuery = dataQuery.gte('created_at', dateFrom + 'T00:00:00')
    }
    if (dateTo) {
      dataQuery = dataQuery.lte('created_at', dateTo + 'T23:59:59')
    }

    if (searchQuery) {
      dataQuery = dataQuery.or(`job_number.ilike.%${searchQuery}%,service_address.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
    }

    const { data: allJobs, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + JOBS_PER_PAGE - 1)

    console.log('All jobs for boss/admin:', allJobs?.length, 'Total:', totalCount, 'Error:', error)
    jobs = allJobs || []
  }

  const totalPages = Math.ceil(totalCount / JOBS_PER_PAGE)

  return (
    <div className="container mx-auto py-6 px-4">
      <JobsListHeader userRole={userRole} />
      {userRole === 'technician' && jobs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No jobs assigned to you yet.</p>
          <p className="text-sm text-yellow-600 mt-1">Jobs will appear here once your supervisor assigns them to you.</p>
        </div>
      ) : (
        <JobsList 
          jobs={jobs} 
          userRole={userRole}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
