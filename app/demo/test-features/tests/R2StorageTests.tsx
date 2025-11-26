'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface R2StorageTestsProps {
  userId: string;
}

export default function R2StorageTests({ userId }: R2StorageTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const supabase = createClient();

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testFileUpload = async () => {
    if (!selectedFile) {
      addResult('fileUpload', {
        success: false,
        message: 'Please select a file first',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a unique key for R2
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = selectedFile.name.split('.').pop();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `test-uploads/${timestamp}_${random}_${safeName}`;
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('key', r2Key);  // Use 'key' instead of 'folder'
      formData.append('jobId', 'test-job');  // Add a test job ID

      const response = await fetch('/api/upload-file-r2', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setUploadedFileUrl(data.url);
        addResult('fileUpload', {
          success: true,
          message: 'File uploaded successfully to R2',
          details: `URL: ${data.url}`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      addResult('fileUpload', {
        success: false,
        message: 'Error uploading file to R2',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testSignedUrlGeneration = async () => {
    if (!uploadedFileUrl) {
      addResult('signedUrl', {
        success: false,
        message: 'Please upload a file first',
      });
      return;
    }

    setLoading(true);
    try {
      // Extract the file path from the URL
      const urlParts = uploadedFileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // In a real implementation, you would call an API endpoint to generate a signed URL
      // For this test, we'll simulate it
      const { data, error } = await supabase.storage
        .from('job-files')
        .createSignedUrl(`test-uploads/${fileName}`, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        addResult('signedUrl', {
          success: true,
          message: 'Signed URL generated successfully',
          details: 'URL expires in 1 hour',
        });
      } else {
        throw new Error('Failed to generate signed URL');
      }
    } catch (error) {
      addResult('signedUrl', {
        success: false,
        message: 'Error generating signed URL',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testFileDeletion = async () => {
    if (!uploadedFileUrl) {
      addResult('fileDeletion', {
        success: false,
        message: 'Please upload a file first',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/delete-file-r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadedFileUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addResult('fileDeletion', {
          success: true,
          message: 'File deleted successfully from R2',
          details: 'File has been removed from storage (but archived in database)',
        });
        setUploadedFileUrl(null);
        setSignedUrl(null);
      } else {
        throw new Error(data.error || 'Deletion failed');
      }
    } catch (error) {
      addResult('fileDeletion', {
        success: false,
        message: 'Error deleting file from R2',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testStorageMetrics = async () => {
    setLoading(true);
    try {
      // Get storage metrics from database
      const { data: photos, error: photosError } = await supabase
        .from('job_photos')
        .select('file_size_bytes');

      const { data: files, error: filesError } = await supabase
        .from('job_files')
        .select('file_size');

      if (photosError || filesError) {
        throw new Error('Error fetching storage metrics');
      }

      const totalPhotoSize = (photos || []).reduce(
        (sum, p) => sum + (p.file_size_bytes || 0),
        0
      );
      const totalFileSize = (files || []).reduce(
        (sum, f) => sum + (f.file_size || 0),
        0
      );

      const totalSizeMB = (totalPhotoSize + totalFileSize) / (1024 * 1024);
      const photoCount = photos?.length || 0;
      const fileCount = files?.length || 0;

      addResult('storageMetrics', {
        success: true,
        message: 'Storage metrics retrieved',
        details: `${photoCount} photos + ${fileCount} files = ${totalSizeMB.toFixed(2)} MB total`,
      });
    } catch (error) {
      addResult('storageMetrics', {
        success: false,
        message: 'Error retrieving storage metrics',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
              <p className="text-sm mt-1 opacity-80 break-all">{result.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">R2 Storage Tests</h2>
        <p className="text-gray-600">
          Test file upload to R2 via API, signed URL generation, and file deletion with archive system
        </p>
      </div>

      {/* File Selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Test File</h3>
        <input
          type="file"
          onChange={handleFileSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedFile && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
            <p className="text-sm text-gray-600">Selected file:</p>
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </div>

      {/* Upload Status */}
      {uploadedFileUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Uploaded File</h3>
          <div className="bg-white rounded p-3 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">File URL:</p>
            <p className="text-sm font-mono text-blue-600 break-all">{uploadedFileUrl}</p>
          </div>
        </div>
      )}

      {/* Signed URL */}
      {signedUrl && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Signed URL (1 hour expiry)</h3>
          <div className="bg-white rounded p-3 border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Temporary Access URL:</p>
            <p className="text-sm font-mono text-purple-600 break-all mb-3">{signedUrl}</p>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">File Upload to R2</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test file upload via /api/upload-file-r2 endpoint
          </p>
          <button
            onClick={testFileUpload}
            disabled={loading || !selectedFile}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload to R2'}
          </button>
          <ResultIndicator result={testResults['fileUpload']} />
        </div>

        {/* Signed URL Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Signed URL Generation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate temporary signed URL for secure access
          </p>
          <button
            onClick={testSignedUrlGeneration}
            disabled={loading || !uploadedFileUrl}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Signed URL'}
          </button>
          <ResultIndicator result={testResults['signedUrl']} />
        </div>

        {/* File Deletion Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">File Deletion (with Archive)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test file deletion from R2 via archive system
          </p>
          <button
            onClick={testFileDeletion}
            disabled={loading || !uploadedFileUrl}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete from R2'}
          </button>
          <ResultIndicator result={testResults['fileDeletion']} />
        </div>

        {/* Storage Metrics Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage Metrics</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get total storage usage across all files and photos
          </p>
          <button
            onClick={testStorageMetrics}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Loading...' : 'Get Storage Metrics'}
          </button>
          <ResultIndicator result={testResults['storageMetrics']} />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">📋 Test Flow</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
          <li>Select a test file using the file input above</li>
          <li>Click "Upload to R2" to upload the file</li>
          <li>Click "Generate Signed URL" to create a temporary access link</li>
          <li>Click "Delete from R2" to test deletion (file will be archived for 30 days)</li>
          <li>Click "Get Storage Metrics" to see total storage usage</li>
        </ol>
      </div>
    </div>
  );
}
