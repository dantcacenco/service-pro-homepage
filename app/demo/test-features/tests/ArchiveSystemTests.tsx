'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  archivePhoto as archivePhotoFn,
  archiveFile as archiveFileFn,
  restorePhoto as restorePhotoFn,
  restoreFile as restoreFileFn,
  getArchiveStats as getArchiveStatsFn,
  simulateCleanup,
} from '@/lib/archive';

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
  autoCleanup?: boolean;
}

export default function ArchiveSystemTests({ userId, autoCleanup = true }: ArchiveSystemTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);
  const supabase = createClient();

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testArchivePhoto = async () => {
    setLoading(true);
    try {
      // First, try to get a non-archived photo to test with
      const { data: photos } = await supabase
        .from('job_photos')
        .select('id')
        .is('archived_at', null)
        .limit(1);

      if (!photos || photos.length === 0) {
        addResult('archivePhoto', {
          success: false,
          message: 'No active photos found to test archiving',
          details: 'Create a test photo first or restore an archived one',
        });
        return;
      }

      const photoId = photos[0].id;

      // Archive the photo using production module
      const result = await archivePhotoFn(photoId, userId, 'Test archive from feature tests');

      if (result.success) {
        addResult('archivePhoto', {
          success: true,
          message: result.message,
          details: `${result.details}\nPhoto ID: ${photoId}`,
        });
      } else {
        addResult('archivePhoto', {
          success: false,
          message: result.message,
          details: result.details || 'Photo may already be archived',
        });
      }
    } catch (error) {
      addResult('archivePhoto', {
        success: false,
        message: 'Error archiving photo',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testArchiveFile = async () => {
    setLoading(true);
    try {
      // First, try to get a non-archived file to test with
      const { data: files } = await supabase
        .from('job_files')
        .select('id')
        .is('archived_at', null)
        .limit(1);

      if (!files || files.length === 0) {
        addResult('archiveFile', {
          success: false,
          message: 'No active files found to test archiving',
          details: 'Create a test file first or restore an archived one',
        });
        return;
      }

      const fileId = files[0].id;

      // Archive the file using production module
      const result = await archiveFileFn(fileId, userId, 'Test archive from feature tests');

      if (result.success) {
        addResult('archiveFile', {
          success: true,
          message: result.message,
          details: `${result.details}\nFile ID: ${fileId}`,
        });
      } else {
        addResult('archiveFile', {
          success: false,
          message: result.message,
          details: result.details || 'File may already be archived',
        });
      }
    } catch (error) {
      addResult('archiveFile', {
        success: false,
        message: 'Error archiving file',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testRestorePhoto = async () => {
    setLoading(true);
    try {
      // Get an archived photo to restore
      const { data: photos } = await supabase
        .from('job_photos')
        .select('id')
        .not('archived_at', 'is', null)
        .limit(1);

      if (!photos || photos.length === 0) {
        addResult('restorePhoto', {
          success: false,
          message: 'No archived photos found to restore',
          details: 'Archive a photo first',
        });
        return;
      }

      const photoId = photos[0].id;

      // Restore the photo using production module
      const result = await restorePhotoFn(photoId);

      if (result.success) {
        addResult('restorePhoto', {
          success: true,
          message: result.message,
          details: `${result.details}\nPhoto ID: ${photoId}`,
        });
      } else {
        addResult('restorePhoto', {
          success: false,
          message: result.message,
          details: result.details || 'Photo may not be archived',
        });
      }
    } catch (error) {
      addResult('restorePhoto', {
        success: false,
        message: 'Error restoring photo',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testRestoreFile = async () => {
    setLoading(true);
    try {
      // Get an archived file to restore
      const { data: files } = await supabase
        .from('job_files')
        .select('id')
        .not('archived_at', 'is', null)
        .limit(1);

      if (!files || files.length === 0) {
        addResult('restoreFile', {
          success: false,
          message: 'No archived files found to restore',
          details: 'Archive a file first',
        });
        return;
      }

      const fileId = files[0].id;

      // Restore the file using production module
      const result = await restoreFileFn(fileId);

      if (result.success) {
        addResult('restoreFile', {
          success: true,
          message: result.message,
          details: `${result.details}\nFile ID: ${fileId}`,
        });
      } else {
        addResult('restoreFile', {
          success: false,
          message: result.message,
          details: result.details || 'File may not be archived',
        });
      }
    } catch (error) {
      addResult('restoreFile', {
        success: false,
        message: 'Error restoring file',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testCleanupSimulation = async () => {
    setLoading(true);
    try {
      // Use production module's simulation function
      const result = await simulateCleanup();

      addResult('cleanupSimulation', {
        success: true,
        message: result.message,
        details: `Found ${result.photos_to_delete} photos and ${result.files_to_delete} files older than 30 days that would be deleted`,
      });
    } catch (error) {
      addResult('cleanupSimulation', {
        success: false,
        message: 'Error in cleanup simulation',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadArchiveStats = async () => {
    setLoading(true);
    try {
      // Use production module's stats function
      const stats = await getArchiveStatsFn();

      if (stats) {
        setArchiveStats(stats);
        addResult('archiveStats', {
          success: true,
          message: 'Archive stats loaded successfully',
        });
      } else {
        addResult('archiveStats', {
          success: false,
          message: 'No stats returned',
        });
      }
    } catch (error) {
      addResult('archiveStats', {
        success: false,
        message: 'Error loading archive stats',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const ResultIndicator = ({ result }: { result?: TestResult }) => {
    if (!result) return null;

    return (
      <div
        className={`mt-2 p-3 rounded-md ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className={`flex items-start gap-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          <span className="text-lg">{result.success ? '✓' : '✗'}</span>
          <div className="flex-1">
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <p className="text-sm mt-1 opacity-80">{result.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Archive System Tests</h2>
        <p className="text-gray-600">
          Test soft delete functionality for photos and files with 30-day cleanup period
        </p>
      </div>

      {/* Archive Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-blue-900">Archive Statistics</h3>
          <button
            onClick={loadArchiveStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Loading...' : 'Load Stats'}
          </button>
        </div>

        {archiveStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Archived Photos</p>
              <p className="text-2xl font-bold text-gray-900">{archiveStats.total_archived_photos}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Archived Files</p>
              <p className="text-2xl font-bold text-gray-900">{archiveStats.total_archived_files}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Pending Deletion (Photos)</p>
              <p className="text-2xl font-bold text-orange-600">{archiveStats.photos_pending_deletion}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Pending Deletion (Files)</p>
              <p className="text-2xl font-bold text-orange-600">{archiveStats.files_pending_deletion}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Estimated Storage (MB)</p>
              <p className="text-2xl font-bold text-gray-900">
                {archiveStats.estimated_r2_storage_mb.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Oldest Archive</p>
              <p className="text-sm font-medium text-gray-900">
                {archiveStats.oldest_archive_date
                  ? new Date(archiveStats.oldest_archive_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}

        <ResultIndicator result={testResults['archiveStats']} />
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Archive Photo Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive Photo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test soft delete functionality using archive_job_photo RPC
          </p>
          <button
            onClick={testArchivePhoto}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running...' : 'Test Archive Photo'}
          </button>
          <ResultIndicator result={testResults['archivePhoto']} />
        </div>

        {/* Archive File Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive File</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test soft delete functionality using archive_job_file RPC
          </p>
          <button
            onClick={testArchiveFile}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running...' : 'Test Archive File'}
          </button>
          <ResultIndicator result={testResults['archiveFile']} />
        </div>

        {/* Restore Photo Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Restore Photo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test restore functionality using restore_job_photo RPC
          </p>
          <button
            onClick={testRestorePhoto}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running...' : 'Test Restore Photo'}
          </button>
          <ResultIndicator result={testResults['restorePhoto']} />
        </div>

        {/* Restore File Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Restore File</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test restore functionality using restore_job_file RPC
          </p>
          <button
            onClick={testRestoreFile}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running...' : 'Test Restore File'}
          </button>
          <ResultIndicator result={testResults['restoreFile']} />
        </div>

        {/* Cleanup Simulation */}
        <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">30-Day Cleanup Simulation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Simulate the cleanup process that would delete items archived more than 30 days ago (read-only simulation)
          </p>
          <button
            onClick={testCleanupSimulation}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running...' : 'Simulate Cleanup'}
          </button>
          <ResultIndicator result={testResults['cleanupSimulation']} />
        </div>
      </div>
    </div>
  );
}
