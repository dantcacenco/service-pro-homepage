/**
 * Archive System - Production Module
 * 
 * Provides soft delete functionality for photos and files with 30-day retention.
 * Files are marked as archived, then permanently deleted after 30 days.
 * 
 * Database functions are defined in: /database_migrations/add_archive_system.sql
 * Reference implementation: /app/(authenticated)/test-features/tests/ArchiveSystemTests.tsx
 * 
 * @module lib/archive
 */

import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Statistics about archived items in the system
 */
export interface ArchiveStats {
  total_archived_photos: number;
  total_archived_files: number;
  photos_pending_deletion: number;
  files_pending_deletion: number;
  oldest_archive_date: string | null;
  estimated_r2_storage_mb: number;
}

/**
 * Result of an archive operation
 */
export interface ArchiveResult {
  success: boolean;
  message: string;
  details?: string;
}

/**
 * Items that will be deleted in cleanup simulation
 */
export interface CleanupSimulationResult {
  photos_to_delete: number;
  files_to_delete: number;
  message: string;
}

// ============================================================================
// ARCHIVE FUNCTIONS
// ============================================================================

/**
 * Archive a photo (soft delete)
 * 
 * @param photoId - UUID of the photo to archive
 * @param userId - UUID of the user performing the action
 * @param reason - Optional reason for archiving
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Archive result with success status
 */
export async function archivePhoto(
  photoId: string,
  userId: string,
  reason: string = 'User deleted',
  supabase?: SupabaseClient
): Promise<ArchiveResult> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client.rpc('archive_job_photo', {
      photo_id: photoId,
      user_id: userId,
      reason: reason,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to archive photo',
        details: error.message,
      };
    }

    if (data === true) {
      return {
        success: true,
        message: 'Photo archived successfully',
        details: `Photo will be permanently deleted after 30 days`,
      };
    } else {
      return {
        success: false,
        message: 'Photo not archived',
        details: 'Photo may already be archived or not found',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error archiving photo',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Archive a file (soft delete)
 * 
 * @param fileId - UUID of the file to archive
 * @param userId - UUID of the user performing the action
 * @param reason - Optional reason for archiving
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Archive result with success status
 */
export async function archiveFile(
  fileId: string,
  userId: string,
  reason: string = 'User deleted',
  supabase?: SupabaseClient
): Promise<ArchiveResult> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client.rpc('archive_job_file', {
      file_id: fileId,
      user_id: userId,
      reason: reason,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to archive file',
        details: error.message,
      };
    }

    if (data === true) {
      return {
        success: true,
        message: 'File archived successfully',
        details: `File will be permanently deleted after 30 days`,
      };
    } else {
      return {
        success: false,
        message: 'File not archived',
        details: 'File may already be archived or not found',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error archiving file',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// RESTORE FUNCTIONS
// ============================================================================

/**
 * Restore an archived photo
 * 
 * @param photoId - UUID of the photo to restore
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Archive result with success status
 */
export async function restorePhoto(
  photoId: string,
  supabase?: SupabaseClient
): Promise<ArchiveResult> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client.rpc('restore_job_photo', {
      photo_id: photoId,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to restore photo',
        details: error.message,
      };
    }

    if (data === true) {
      return {
        success: true,
        message: 'Photo restored successfully',
        details: 'Photo is now active again',
      };
    } else {
      return {
        success: false,
        message: 'Photo not restored',
        details: 'Photo may not be archived or not found',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error restoring photo',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Restore an archived file
 * 
 * @param fileId - UUID of the file to restore
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Archive result with success status
 */
export async function restoreFile(
  fileId: string,
  supabase?: SupabaseClient
): Promise<ArchiveResult> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client.rpc('restore_job_file', {
      file_id: fileId,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to restore file',
        details: error.message,
      };
    }

    if (data === true) {
      return {
        success: true,
        message: 'File restored successfully',
        details: 'File is now active again',
      };
    } else {
      return {
        success: false,
        message: 'File not restored',
        details: 'File may not be archived or not found',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error restoring file',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * Get archive statistics
 * 
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Archive statistics or null if error
 */
export async function getArchiveStats(
  supabase?: SupabaseClient
): Promise<ArchiveStats | null> {
  const client = supabase || createClient();

  try {
    const { data, error } = await client.rpc('get_archive_stats');

    if (error) {
      console.error('Failed to load archive stats:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as ArchiveStats;
    }

    return null;
  } catch (error) {
    console.error('Error loading archive stats:', error);
    return null;
  }
}

/**
 * Simulate cleanup to see what would be deleted
 * Does NOT actually delete anything - read-only operation
 * 
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns Simulation result with count of items that would be deleted
 */
export async function simulateCleanup(
  supabase?: SupabaseClient
): Promise<CleanupSimulationResult> {
  const client = supabase || createClient();

  try {
    // Calculate the cutoff date (30 days ago)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Count old archived photos
    const { data: oldPhotos, error: photoError } = await client
      .from('job_photos')
      .select('id, archived_at', { count: 'exact', head: true })
      .not('archived_at', 'is', null)
      .lt('archived_at', cutoffDate);

    if (photoError) throw photoError;

    // Count old archived files
    const { data: oldFiles, error: fileError } = await client
      .from('job_files')
      .select('id, archived_at', { count: 'exact', head: true })
      .not('archived_at', 'is', null)
      .lt('archived_at', cutoffDate);

    if (fileError) throw fileError;

    const photoCount = oldPhotos?.length || 0;
    const fileCount = oldFiles?.length || 0;
    const totalCount = photoCount + fileCount;

    return {
      photos_to_delete: photoCount,
      files_to_delete: fileCount,
      message: totalCount === 0 
        ? 'No items ready for permanent deletion'
        : `${totalCount} items would be permanently deleted (${photoCount} photos, ${fileCount} files)`,
    };
  } catch (error) {
    return {
      photos_to_delete: 0,
      files_to_delete: 0,
      message: `Error in cleanup simulation: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an item is archived
 * 
 * @param itemType - Type of item ('photo' or 'file')
 * @param itemId - UUID of the item
 * @param supabase - Optional Supabase client (creates new if not provided)
 * @returns True if archived, false otherwise
 */
export async function isArchived(
  itemType: 'photo' | 'file',
  itemId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || createClient();

  try {
    const table = itemType === 'photo' ? 'job_photos' : 'job_files';
    
    const { data, error } = await client
      .from(table)
      .select('archived_at')
      .eq('id', itemId)
      .single();

    if (error) return false;
    
    return data?.archived_at !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get days until permanent deletion for an archived item
 * 
 * @param archivedAt - ISO timestamp when item was archived
 * @returns Days remaining until permanent deletion (negative if overdue)
 */
export function getDaysUntilDeletion(archivedAt: string): number {
  const archivedDate = new Date(archivedAt);
  const now = new Date();
  const daysArchived = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));
  return 30 - daysArchived;
}

/**
 * Format archive stats for display
 * 
 * @param stats - Archive statistics
 * @returns Formatted string for display
 */
export function formatArchiveStats(stats: ArchiveStats): string {
  const total = stats.total_archived_photos + stats.total_archived_files;
  const pending = stats.photos_pending_deletion + stats.files_pending_deletion;
  const storage = stats.estimated_r2_storage_mb.toFixed(2);
  
  return `${total} archived items (${pending} pending deletion) • ${storage} MB storage`;
}
