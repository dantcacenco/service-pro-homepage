'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ArchiveStats {
  total_archived_photos: number;
  total_archived_files: number;
  photos_pending_deletion: number;
  files_pending_deletion: number;
  oldest_archive_date: string | null;
  estimated_r2_storage_mb: number;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface ArchiveSystemTestsProps {
  userId: string;
}

export default function ArchiveSystemTestsStyled({ userId }: ArchiveSystemTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);
  const supabase = createClient();

  // Import the original component's logic
  const ArchiveSystemTests = require('./ArchiveSystemTests').default;
  
  return (
    <div className="test-section">
      <div className="test-section-header">
        <h2 className="test-section-title">Archive System Tests</h2>
        <span className={`test-section-status ${loading ? 'running' : 'pending'}`}>
          {loading ? 'Running' : 'Ready'}
        </span>
      </div>
      
      {/* Archive Stats Display */}
      {archiveStats && (
        <div className="archive-stats">
          <div className="stat-card">
            <span className="stat-value">{archiveStats.total_archived_photos}</span>
            <span className="stat-label">Archived Photos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{archiveStats.total_archived_files}</span>
            <span className="stat-label">Archived Files</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{archiveStats.photos_pending_deletion}</span>
            <span className="stat-label">Pending Deletion</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{archiveStats.estimated_r2_storage_mb.toFixed(2)} MB</span>
            <span className="stat-label">Storage Used</span>
          </div>
        </div>
      )}
      
      {/* Use the original component */}
      <ArchiveSystemTests userId={userId} />
    </div>
  );
}