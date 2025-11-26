import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'

// Initialize R2 client - with better error handling
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'fair-air-hc'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data with better error handling
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (e) {
      console.error('Error parsing form data:', e)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    
    const file = formData.get('file') as File
    const key = formData.get('key') as string
    const jobId = formData.get('jobId') as string
    
    // Debug logging
    console.log('Upload request received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      key: key,
      jobId: jobId
    })
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Missing file in form data',
        debug: {
          formDataKeys: Array.from(formData.keys()),
          fileValue: formData.get('file')
        }
      }, { status: 400 })
    }
    
    if (!key) {
      return NextResponse.json({ 
        error: 'Missing key in form data',
        debug: {
          formDataKeys: Array.from(formData.keys()),
          keyValue: formData.get('key')
        }
      }, { status: 400 })
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      Metadata: {
        originalName: file.name,
        uploadedBy: user.id,
        jobId: jobId || 'test',
        uploadedAt: new Date().toISOString(),
      },
    })
    
    await r2Client.send(uploadCommand)
    
    // Generate a signed URL for accessing the file (valid for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    
    const url = await getSignedUrl(r2Client, getCommand, { 
      expiresIn: 604800 // 7 days in seconds
    })
    
    return NextResponse.json({ 
      success: true, 
      url,
      key,
      message: 'File uploaded successfully to R2' 
    })
    
  } catch (error) {
    console.error('R2 upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file to R2',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'R2 Upload API endpoint',
    status: 'ready',
    bucket: BUCKET_NAME,
    hasCredentials: {
      endpoint: !!process.env.CLOUDFLARE_R2_ENDPOINT,
      accessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    }
  })
}