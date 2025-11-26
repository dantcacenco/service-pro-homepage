import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file info from request body
    const { fileId, fileType, reason } = await request.json()
    
    if (!fileId || !fileType) {
      return NextResponse.json({ error: 'Missing file ID or type' }, { status: 400 })
    }

    // Determine which archive function to call
    const functionName = fileType === 'photo' ? 'archive_job_photo' : 'archive_job_file'
    
    // Archive the file instead of deleting it
    // This marks it as archived but keeps it in R2 for 30 days
    const { data, error: archiveError } = await supabase.rpc(functionName, {
      [fileType === 'photo' ? 'photo_id' : 'file_id']: fileId,
      user_id: user.id,
      reason: reason || 'User deleted'
    })
    
    if (archiveError) {
      console.error('Archive error:', archiveError)
      return NextResponse.json({ 
        error: 'Failed to archive file',
        details: archiveError.message 
      }, { status: 500 })
    }
    
    // Check if the archive was successful
    if (!data) {
      return NextResponse.json({ 
        error: 'File not found or already archived' 
      }, { status: 404 })
    }
    
    // NOTE: We do NOT delete from R2 storage here anymore
    // The file remains in R2 and will be cleaned up after 30 days
    // by the cleanup_old_archived_items() function
    
    return NextResponse.json({ 
      success: true, 
      message: 'File archived successfully. It will be permanently deleted in 30 days.',
      archived: true
    })
    
  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json(
      { error: 'Failed to archive file' },
      { status: 500 }
    )
  }
}