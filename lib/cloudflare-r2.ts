// Cloudflare R2 Configuration and Helper Functions
// This replaces Supabase Storage for files (photos, PDFs, documents)

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client (S3 compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'fair-air-hc';

// File upload to R2
export async function uploadFileToR2(
  file: File | Buffer,
  key: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const Body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body,
      Metadata: metadata,
      ContentType: file instanceof File ? file.type : 'application/octet-stream',
    });
    
    await r2Client.send(command);
    
    // Generate a signed URL (valid for 7 days)
    const url = await getSignedUrl(r2Client, new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }), { expiresIn: 604800 }); // 7 days
    
    return { success: true, url };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Get signed URL for file access
export async function getR2FileUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error getting R2 URL:', error);
    return null;
  }
}

// Delete file from R2
export async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

// List files in a directory
export async function listR2Files(
  prefix: string,
  maxKeys: number = 100
): Promise<{ key: string; size: number; lastModified: Date }[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    
    const response = await r2Client.send(command);
    
    return (response.Contents || []).map(item => ({
      key: item.Key!,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));
  } catch (error) {
    console.error('Error listing R2 files:', error);
    return [];
  }
}

// Helper to generate file paths
export function generateR2Path(
  category: 'jobs' | 'proposals' | 'invoices' | 'customers',
  id: string,
  filename: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${category}/${id}/${timestamp}_${random}_${safeName}`;
}

// Migration helper: Move file from Supabase to R2
export async function migrateFileFromSupabase(
  supabaseUrl: string,
  targetKey: string
): Promise<boolean> {
  try {
    // Fetch file from Supabase
    const response = await fetch(supabaseUrl);
    if (!response.ok) throw new Error('Failed to fetch from Supabase');
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: targetKey,
      Body: buffer,
      ContentType: contentType,
    });
    
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error migrating file:', error);
    return false;
  }
}

// Batch migration helper
export async function batchMigrateFiles(
  files: { supabaseUrl: string; targetKey: string }[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  for (const file of files) {
    const success = await migrateFileFromSupabase(file.supabaseUrl, file.targetKey);
    if (success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push(`Failed: ${file.targetKey}`);
    }
  }
  
  return results;
}

// Export all functions for use in other parts of the app
export default {
  uploadFileToR2,
  getR2FileUrl,
  deleteFileFromR2,
  listR2Files,
  generateR2Path,
  migrateFileFromSupabase,
  batchMigrateFiles,
};