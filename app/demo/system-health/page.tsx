import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SystemHealthDashboard from './SystemHealthDashboard';

export default async function SystemHealthPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Check user role - only admin/boss can view system health
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'boss' && profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get recent logs and stats
  const [maintenanceLogs, emailLogs, billcomLogs] = await Promise.all([
    supabase
      .from('maintenance_reminder_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('email_tracking')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('billcom_polling_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  // Get system stats
  const [customerCount, proposalCount, jobCount] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('proposals').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true })
  ]);

  const systemData = {
    maintenanceLogs: maintenanceLogs.data || [],
    emailLogs: emailLogs.data || [],
    billcomLogs: billcomLogs.data || [],
    stats: {
      customers: customerCount.count || 0,
      proposals: proposalCount.count || 0,
      jobs: jobCount.count || 0
    }
  };

  return <SystemHealthDashboard data={systemData} />;
}
