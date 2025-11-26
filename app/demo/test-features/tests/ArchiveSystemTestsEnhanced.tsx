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

export default function ArchiveSystemTests({ userId }: ArchiveSystemTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);
  const supabase = createClient();

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };
  // Create test data for archive testing
  const createTestData = async () => {
    setLoading(true);
    try {
      // First, we need a test job to attach photos/files to
      // Check if we have any jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .limit(1);
      
      let jobId: string;
      
      if (!jobs || jobs.length === 0) {
        // Create a test job first
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .limit(1)
          .single();
        
        if (!customer) {
          addResult('createTestData', {
            success: false,
            message: 'No customers found to create test job',
            details: 'Please create a customer first'
          });
          return;
        }
        
        const { data: newJob, error: jobError } = await supabase
          .from('jobs')
          .insert({
            customer_id: customer.id,
            job_number: `TEST-${Date.now()}`,
            status: 'scheduled',
            scheduled_date: new Date().toISOString(),
            job_type: 'service',
            description: 'Test job for archive system testing'
          })
          .select('id')
          .single();
        
        if (jobError) throw jobError;
        jobId = newJob.id;
      } else {
        jobId = jobs[0].id;
      }
      
      // Create test photo entries
      const { data: testPhoto, error: photoError } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          photo_url: `https://test-photo-${Date.now()}.jpg`,
          photo_type: 'before',
          caption: 'Test photo for archive system',
          uploaded_by: userId
        })
        .select('id')
        .single();
      
      if (photoError) throw photoError;
      
      // Create test file entries
      const { data: testFile, error: fileError } = await supabase
        .from('job_files')
        .insert({
          job_id: jobId,
          file_url: `https://test-file-${Date.now()}.pdf`,
          file_name: 'test-document.pdf',
          file_type: 'application/pdf',
          file_size: 1024000, // 1MB
          uploaded_by: userId
        })
        .select('id')
        .single();
      
      if (fileError) throw fileError;
      
      addResult('createTestData', {
        success: true,
        message: 'Test data created successfully',
        details: `Created photo ID: ${testPhoto.id}, file ID: ${testFile.id} for job ID: ${jobId}`
      });
      
    } catch (error) {
      addResult('createTestData', {
        success: false,
        message: 'Error creating test data',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }
  // Return JSX
  return (
    <div className="test-component archive-system-tests">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Archive System Tests Enhanced</h2>
      
      {/* Create Test Data */}
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Test Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create test photo and file entries for testing archive functionality
        </p>
        <button
          onClick={createTestData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Test Data'}
        </button>
        {testResults['createTestData'] && (
          <div className={`mt-2 p-3 rounded-md ${
            testResults['createTestData'].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={testResults['createTestData'].success ? 'text-green-800' : 'text-red-800'}>
              {testResults['createTestData'].message}
            </p>
            {testResults['createTestData'].details && (
              <p className="text-sm mt-1 text-gray-600">{testResults['createTestData'].details}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Archive Stats */}
      {archiveStats && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Archived Photos:</p>
              <p className="text-lg font-bold">{archiveStats.total_archived_photos}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Archived Files:</p>
              <p className="text-lg font-bold">{archiveStats.total_archived_files}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Photos Pending Deletion:</p>
              <p className="text-lg font-bold text-orange-600">{archiveStats.photos_pending_deletion}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Files Pending Deletion:</p>
              <p className="text-lg font-bold text-orange-600">{archiveStats.files_pending_deletion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
