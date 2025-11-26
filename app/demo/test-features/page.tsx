import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TestFeaturesClient from './TestFeaturesClient';

export default async function TestFeaturesPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Auth error in test-features:', authError);
    redirect('/auth/login');
  }

  // Check user role - only boss can view test features (no admin role exists)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    redirect('/dashboard');
  }

  if (profile?.role !== 'boss') {
    console.log('Access denied for role:', profile?.role);
    redirect('/dashboard');
  }

  return <TestFeaturesClient userId={user.id} userName={profile?.full_name || 'Unknown'} />;
}
