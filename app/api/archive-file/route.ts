import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file info from request body
    const { fileId, fileType } = await request.json()
    
    if (!fileId || !fileType) {
      return NextResponse.json({ error: 'Missing file ID or type' }, { status: 400 })
    }

    // Determine which table to archive
    const tableName = fileType === 'photo' ? 'job_photos' : 'job_files'
    
    // Soft delete - just mark as archived
    const { error: archiveError } = await supabase
      .from(tableName)
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user.id
      })
      .eq('id', fileId)
    
    if (archiveError) {
      console.error('Archive error:', archiveError)
      return NextResponse.json({ error: 'Failed to archive file' }, { status: 500 })
    }
    
    // Note: We're NOT deleting from R2 immediately - it will be deleted after 30 days
    
    return NextResponse.json({ 
      success: true, 
      message: 'File archived successfully (will be permanently deleted in 30 days)' 
    })
    
  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json(
      { error: 'Failed to archive file' },
      { status: 500 }
    )
  }
}

// Restore archived file endpoint
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'boss') {
      return NextResponse.json({ error: 'Only admins can restore archived files' }, { status: 403 })
    }

    // Get the file info from request body
    const { fileId, fileType } = await request.json()
    
    if (!fileId || !fileType) {
      return NextResponse.json({ error: 'Missing file ID or type' }, { status: 400 })
    }

    // Determine which table to restore from
    const tableName = fileType === 'photo' ? 'job_photos' : 'job_files'
    
    // Restore - remove archived timestamp
    const { error: restoreError } = await supabase
      .from(tableName)
      .update({
        archived_at: null,
        archived_by: null
      })
      .eq('id', fileId)
    
    if (restoreError) {
      console.error('Restore error:', restoreError)
      return NextResponse.json({ error: 'Failed to restore file' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'File restored successfully' 
    })
    
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore file' },
      { status: 500 }
    )
  }
}