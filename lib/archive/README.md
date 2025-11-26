# Archive System - Production Module

## 📚 Overview

The Archive System provides **soft delete functionality** for photos and files in the Service Pro HVAC Management System. Instead of permanently deleting items immediately, they are marked as "archived" and retained for **30 days** before permanent deletion.

This prevents accidental data loss and allows for recovery if needed.

## 🎯 Key Features

- ✅ **Soft Delete**: Archive photos and files instead of permanent deletion
- ✅ **30-Day Retention**: Archived items are kept for 30 days before cleanup
- ✅ **Restore Capability**: Recover archived items before permanent deletion
- ✅ **Statistics**: Track archived items and storage usage
- ✅ **Cleanup Simulation**: Preview what would be deleted without actual deletion
- ✅ **Role-Based Access**: Users can archive their own uploads, admins can archive anything

## 📦 Installation

The archive system is already set up! The database migration has been applied:
- Migration file: `/database_migrations/add_archive_system.sql`
- Module location: `/lib/archive/index.ts`

## 🚀 Quick Start

### Import the module:

```typescript
import {
  archivePhoto,
  archiveFile,
  restorePhoto,
  restoreFile,
  getArchiveStats,
  simulateCleanup,
} from '@/lib/archive';
```

### Archive a photo:

```typescript
const result = await archivePhoto(
  'photo-uuid-here',
  'user-uuid-here',
  'User clicked delete button'
);

if (result.success) {
  console.log(result.message); // "Photo archived successfully"
  console.log(result.details); // "Photo will be permanently deleted after 30 days"
}
```

### Archive a file:

```typescript
const result = await archiveFile(
  'file-uuid-here',
  'user-uuid-here',
  'Duplicate file removed'
);
```

### Restore an archived photo:

```typescript
const result = await restorePhoto('photo-uuid-here');

if (result.success) {
  console.log(result.message); // "Photo restored successfully"
}
```

### Get archive statistics:

```typescript
const stats = await getArchiveStats();

if (stats) {
  console.log(`Total archived photos: ${stats.total_archived_photos}`);
  console.log(`Total archived files: ${stats.total_archived_files}`);
  console.log(`Storage used: ${stats.estimated_r2_storage_mb.toFixed(2)} MB`);
}
```

### Simulate cleanup (see what would be deleted):

```typescript
const simulation = await simulateCleanup();

console.log(simulation.message);
// "12 items would be permanently deleted (8 photos, 4 files)"
```

## 📖 API Reference

### Core Functions

#### `archivePhoto(photoId, userId, reason?, supabase?)`
Archive a photo (soft delete)

**Parameters:**
- `photoId` (string): UUID of the photo to archive
- `userId` (string): UUID of the user performing the action
- `reason` (string, optional): Reason for archiving (default: "User deleted")
- `supabase` (SupabaseClient, optional): Custom Supabase client

**Returns:** `Promise<ArchiveResult>`

#### `archiveFile(fileId, userId, reason?, supabase?)`
Archive a file (soft delete)

**Parameters:** Same as `archivePhoto`

**Returns:** `Promise<ArchiveResult>`

#### `restorePhoto(photoId, supabase?)`
Restore an archived photo

**Parameters:**
- `photoId` (string): UUID of the photo to restore
- `supabase` (SupabaseClient, optional): Custom Supabase client

**Returns:** `Promise<ArchiveResult>`

#### `restoreFile(fileId, supabase?)`
Restore an archived file

**Parameters:** Same as `restorePhoto`

**Returns:** `Promise<ArchiveResult>`

### Statistics & Monitoring

#### `getArchiveStats(supabase?)`
Get archive statistics

**Returns:** `Promise<ArchiveStats | null>`

```typescript
interface ArchiveStats {
  total_archived_photos: number;
  total_archived_files: number;
  photos_pending_deletion: number;  // Items > 25 days old
  files_pending_deletion: number;
  oldest_archive_date: string | null;
  estimated_r2_storage_mb: number;
}
```

#### `simulateCleanup(supabase?)`
Simulate cleanup without actually deleting

**Returns:** `Promise<CleanupSimulationResult>`

```typescript
interface CleanupSimulationResult {
  photos_to_delete: number;
  files_to_delete: number;
  message: string;
}
```

### Helper Functions

#### `isArchived(itemType, itemId, supabase?)`
Check if an item is archived

**Parameters:**
- `itemType` ('photo' | 'file'): Type of item
- `itemId` (string): UUID of the item

**Returns:** `Promise<boolean>`

#### `getDaysUntilDeletion(archivedAt)`
Calculate days remaining until permanent deletion

**Parameters:**
- `archivedAt` (string): ISO timestamp when archived

**Returns:** `number` (negative if overdue)

#### `formatArchiveStats(stats)`
Format stats for display

**Parameters:**
- `stats` (ArchiveStats): Statistics object

**Returns:** `string` - Formatted display string

## 🗄️ Database Structure

### Tables Modified
- `job_photos`: Added `archived_at`, `archived_by`, `archive_reason`
- `job_files`: Added `archived_at`, `archived_by`, `archive_reason`

### Database Functions
- `archive_job_photo(photo_id, user_id, reason)`
- `archive_job_file(file_id, user_id, reason)`
- `restore_job_photo(photo_id)`
- `restore_job_file(file_id)`
- `get_archive_stats()`
- `cleanup_old_archived_items()` (for cron job)

### Views
- `active_job_photos`: Non-archived photos only
- `active_job_files`: Non-archived files only
- `archived_items`: All archived items (admin view)

## 🔐 Security

### Row Level Security (RLS)
- Users can archive their own uploads
- Admins/bosses can archive any item
- Only archived items can be restored

### Policies
- `"Authenticated users can archive photos they uploaded or admins"`
- `"Authenticated users can archive files they uploaded or admins"`

## 🔄 Automatic Cleanup

**Important**: The 30-day cleanup is NOT automatic yet. You need to:

1. Create a cron job/scheduled task
2. Call the database function: `cleanup_old_archived_items()`
3. Use the returned URLs to delete from R2 storage

**Example cron implementation** (future):
```typescript
// /app/api/cron/cleanup-archives/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('cleanup_old_archived_items');
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // Delete files from R2 using the returned URLs
  // ... R2 deletion logic here ...
  
  return Response.json({ 
    deleted_photos: data.deleted_photos,
    deleted_files: data.deleted_files,
  });
}
```

## 📋 Usage Examples

### In a Delete Button Component

```typescript
'use client';

import { useState } from 'react';
import { archivePhoto } from '@/lib/archive';
import { useUser } from '@/hooks/useUser';

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await archivePhoto(photoId, user.id, 'User deleted photo');
    setLoading(false);

    if (result.success) {
      alert('Photo deleted. Can be restored within 30 days.');
      // Refresh the page or update state
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete Photo'}
    </button>
  );
}
```

### In an Admin Dashboard

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getArchiveStats, type ArchiveStats } from '@/lib/archive';

export function ArchiveStatsCard() {
  const [stats, setStats] = useState<ArchiveStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getArchiveStats();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="stats-card">
      <h3>Archive Statistics</h3>
      <p>Archived Photos: {stats.total_archived_photos}</p>
      <p>Archived Files: {stats.total_archived_files}</p>
      <p>Pending Deletion: {stats.photos_pending_deletion + stats.files_pending_deletion}</p>
      <p>Storage: {stats.estimated_r2_storage_mb.toFixed(2)} MB</p>
    </div>
  );
}
```

## 🧪 Testing

Test page available at: `/app/(authenticated)/test-features/tests/ArchiveSystemTests.tsx`

Run tests:
1. Navigate to `http://localhost:3002/test-features`
2. Click "Archive System Tests"
3. Test each function individually

## 📝 Migration History

- **December 20, 2024**: Initial archive system migration created
- **October 14, 2025**: Production module extracted and documented

## 🔗 Related Files

- Database: `/database_migrations/add_archive_system.sql`
- Module: `/lib/archive/index.ts`
- Tests: `/app/(authenticated)/test-features/tests/ArchiveSystemTests.tsx`
- Docs: `/lib/archive/README.md` (this file)

---

**Questions or Issues?**  
Check the test page or refer to the database migration file for implementation details.
