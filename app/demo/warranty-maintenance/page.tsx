import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WarrantyDashboard from './WarrantyDashboard'

export default async function WarrantyMaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'technician'

  // Fetch warranty contracts with customer info
  const { data: contracts } = await supabase
    .from('warranty_contracts')
    .select(`
      *,
      customers!customer_id (
        name,
        email,
        phone,
        address
      ),
      jobs!original_job_id (
        job_number,
        status
      )
    `)
    .order('created_at', { ascending: false })

  // Fetch maintenance schedules
  const { data: maintenanceSchedules } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      warranty_contracts!warranty_contract_id (
        contract_number,
        contract_type
      ),
      customers!customer_id (
        name,
        email,
        phone
      ),
      profiles!technician_id (
        full_name
      )
    `)
    .order('due_date', { ascending: true })

  // Fetch service calls
  const { data: serviceCalls } = await supabase
    .from('warranty_service_calls')
    .select(`
      *,
      warranty_contracts!warranty_contract_id (
        contract_number,
        contract_type
      ),
      customers!customer_id (
        name,
        email,
        phone
      ),
      profiles!technician_id (
        full_name
      )
    `)
    .order('call_date', { ascending: false })

  // Fetch warranty settings
  const { data: settings } = await supabase
    .from('warranty_settings')
    .select('*')
    .single()

  // Calculate summary metrics
  const activeContracts = contracts?.filter(c => c.status === 'active') || []
  const totalAnnualRevenue = activeContracts.reduce((sum, c) => sum + Number(c.annual_price || 0), 0)

  // Calculate net profit YTD
  const currentYear = new Date().getFullYear()
  const ytdContracts = activeContracts.filter(c => {
    const startYear = new Date(c.start_date).getFullYear()
    return startYear === currentYear
  })
  const netProfitYTD = ytdContracts.reduce((sum, c) => sum + Number(c.net_profit || 0), 0)

  // Upcoming renewals (30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const upcomingRenewals = activeContracts.filter(c => {
    if (!c.next_renewal_date) return false
    const renewalDate = new Date(c.next_renewal_date)
    return renewalDate <= thirtyDaysFromNow && renewalDate >= new Date()
  })

  // Pending maintenance visits
  const pendingMaintenance = maintenanceSchedules?.filter(
    m => m.status === 'scheduled' || m.status === 'customer_contacted'
  ) || []

  const summaryData = {
    activeContractsCount: activeContracts.length,
    totalAnnualRevenue,
    netProfitYTD,
    upcomingRenewalsCount: upcomingRenewals.length,
    pendingMaintenanceCount: pendingMaintenance.length
  }

  return (
    <WarrantyDashboard
      contracts={contracts || []}
      maintenanceSchedules={maintenanceSchedules || []}
      serviceCalls={serviceCalls || []}
      settings={settings}
      summaryData={summaryData}
      userRole={userRole}
    />
  )
}
