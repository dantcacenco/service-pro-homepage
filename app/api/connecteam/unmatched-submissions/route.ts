/**
 * Fetch unmatched ConnectTeam submissions
 * GET /api/connecteam/unmatched-submissions
 * 
 * Query params:
 * - limit: number (default 20)
 * - offset: number (default 0)
 * - search: string (optional - search by address)
 * 
 * Returns: { submissions: [], total: number }
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔍 [API] Fetching unmatched submissions...')
  
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    console.log('✅ [API] Using admin client')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    // Build query
    let query = supabase
      .from('connecteam_form_submissions')
      .select('id, submission_timestamp, job_address, work_description, employee_id', { count: 'exact' })
      .is('linked_job_id', null)
      .order('submission_timestamp', { ascending: false })

    // Add search filter if provided
    if (search) {
      query = query.ilike('job_address', `%${search}%`)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: submissions, error, count } = await query
    
    console.log('📊 [API] Query results:', { 
      count, 
      submissionsCount: submissions?.length || 0,
      error: error?.message 
    })

    if (error) {
      console.error('❌ [API] Database error fetching unmatched submissions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    // Fetch photo counts for each submission
    const submissionsWithPhotos = await Promise.all(
      (submissions || []).map(async (sub) => {
        const { count: photoCount } = await supabase
          .from('connecteam_photos')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', sub.id)

        return {
          ...sub,
          photos_count: photoCount || 0
        }
      })
    )
    
    console.log('✅ [API] Returning', submissionsWithPhotos.length, 'submissions, total:', count)

    return NextResponse.json({
      success: true,
      submissions: submissionsWithPhotos,
      total: count || 0
    })

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
