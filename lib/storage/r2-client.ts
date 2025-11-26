/**
 * Cloudflare R2 Storage Client
 * 
 * Provides reusable functions for interacting with R2 storage.
 * Used by API routes and components for file uploads, downloads, and management.
 * 
 * @module lib/storage/r2-client
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface R2UploadOptions {
  key: string;
  file: File | Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface R2Config {
  endpoint: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucket: string;
  isConfigured: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'fair-air-hc';

/**
 * Get R2 configuration status
 */
export function getR2Config(): R2Config {
  return {
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: BUCKET_NAME,
    isConfigured: !!(
      process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ),
  };
}

/**
 * Initialize R2 client
 * Only call this after verifying configuration with getR2Config()
 */
function createR2Client(): S3Client {
  const config = getR2Config();
  
  if (!config.isConfigured) {
    throw new Error('R2 storage is not configured. Missing environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint!,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });
}


// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to R2 storage
 * 
 * @param options - Upload configuration
 * @returns Upload result with signed URL
 */
export async function uploadToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  try {
    const config = getR2Config();
    if (!config.isConfigured) {
      return {
        success: false,
        error: 'R2 storage is not configured',
      };
    }

    const client = createR2Client();
    
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (Buffer.isBuffer(options.file)) {
      buffer = options.file;
    } else {
      // It's a File object
      const arrayBuffer = await options.file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: options.key,
      Body: buffer,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata || {},
    });

    await client.send(uploadCommand);

    // Generate signed URL (7-day expiry)
    const url = await getSignedUrlForKey(options.key, 604800); // 7 days

    return {
      success: true,
      url,
      key: options.key,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}


// ============================================================================
// URL GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate a signed URL for accessing a file in R2
 * 
 * @param key - R2 object key
 * @param expiresIn - Expiry time in seconds (default: 7 days)
 * @returns Signed URL string
 */
export async function getSignedUrlForKey(
  key: string,
  expiresIn: number = 604800 // 7 days default
): Promise<string> {
  const config = getR2Config();
  if (!config.isConfigured) {
    throw new Error('R2 storage is not configured');
  }

  const client = createR2Client();
  
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(client, getCommand, { expiresIn });
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a file from R2 storage
 * NOTE: This permanently deletes. Use archive system for soft deletes.
 * 
 * @param key - R2 object key to delete
 * @returns Success status
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getR2Config();
    if (!config.isConfigured) {
      return {
        success: false,
        error: 'R2 storage is not configured',
      };
    }

    const client = createR2Client();
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await client.send(deleteCommand);

    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique R2 key for file uploads
 * 
 * @param originalName - Original filename
 * @param prefix - Optional prefix (e.g., 'job-photos', 'documents')
 * @returns Unique R2 key
 */
export function generateUniqueKey(originalName: string, prefix: string = 'uploads'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${prefix}/${timestamp}_${random}_${safeName}`;
}

/**
 * Extract the R2 key from a signed URL
 * 
 * @param url - Signed URL or full R2 URL
 * @returns R2 key or null if not found
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and bucket name if present
    const parts = pathname.split('/');
    if (parts[0] === '') parts.shift(); // Remove empty first element
    if (parts[0] === BUCKET_NAME) parts.shift(); // Remove bucket name
    
    return parts.join('/');
  } catch {
    return null;
  }
}

/**
 * Get bucket name (useful for testing)
 */
export function getBucketName(): string {
  return BUCKET_NAME;
}
