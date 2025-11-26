import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/boss
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['boss', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const itemType = searchParams.get('type') // 'photo' | 'file' | null for all
    const daysLeft = searchParams.get('daysLeft') // filter by days until deletion
    
    // Build query
    let query = supabase
      .from('archived_items')
      .select('*')
      .order('archived_at', { ascending: false })
    
    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId)
    }
    
    if (itemType) {
      query = query.eq('item_type', itemType)
    }
    
    if (daysLeft) {
      const days = parseInt(daysLeft)
      query = query.lte('days_until_permanent_deletion', days)
    }
    
    const { data: archivedItems, error } = await query
    
    if (error) {
      console.error('Error fetching archived items:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch archived items',
        details: error.message 
      }, { status: 500 })
    }
    
    // Get archive statistics
    const { data: stats } = await supabase.rpc('get_archive_stats')
    
    return NextResponse.json({
      items: archivedItems || [],
      stats: stats?.[0] || {
        total_archived_photos: 0,
        total_archived_files: 0,
        photos_pending_deletion: 0,
        files_pending_deletion: 0,
        oldest_archive_date: null,
        estimated_r2_storage_mb: 0
      }
    })
    
  } catch (error) {
    console.error('Error in archived items API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived items' },
      { status: 500 }
    )
  }
}