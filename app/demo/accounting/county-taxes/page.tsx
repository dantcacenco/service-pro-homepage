import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CountyTaxesDashboard from './CountyTaxesDashboard'

export default async function CountyTaxesPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/sign-in')
  }

  // Get user profile - check for boss/admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'boss' && profile?.role !== 'admin') {
    redirect('/')
  }

  return <CountyTaxesDashboard />
}
