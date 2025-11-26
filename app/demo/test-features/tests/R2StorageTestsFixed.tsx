'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface R2StorageTestsProps {
  userId: string;
}

export default function R2StorageTestsFixed({ userId }: R2StorageTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testFileUpload = async () => {
    const fileInput = fileInputRef.current;
    const selectedFile = fileInput?.files?.[0];
    
    if (!selectedFile) {
      addResult('fileUpload', {
        success: false,
        message: 'Please select a file first',
        details: 'Click "Choose File" and select an image or document'
      });
      return;
    }

    setLoading(true);
    addResult('fileUpload', {
      success: false,
      message: 'Uploading...',
      details: `Uploading ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`
    });

    try {
      // Generate a unique key for R2
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = selectedFile.name.split('.').pop() || 'bin';
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `test-uploads/${timestamp}_${random}_${safeName}`;
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('key', r2Key);
      formData.append('jobId', 'test-job-' + timestamp);

      console.log('Uploading to R2:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        key: r2Key
      });

      const response = await fetch('/api/upload-file-r2', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok && data.url) {
        setUploadedFileUrl(data.url);
        addResult('fileUpload', {
          success: true,
          message: 'File uploaded successfully to R2!',
          details: `File stored at key: ${data.key}`
        });
      } else {
        throw new Error(data.error || data.details || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      addResult('fileUpload', {
        success: false,
        message: 'Error uploading file to R2',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testDeleteWithArchive = async () => {
    if (!uploadedFileUrl) {
      addResult('deleteFile', {
        success: false,
        message: 'Please upload a file first',
      });
      return;
    }

    setLoading(true);
    try {
      // First, we need to create a database record for this file
      // Get a job to attach it to
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .limit(1);
      
      if (!jobs || jobs.length === 0) {
        throw new Error('No jobs found. Please create a job first.');
      }

      // Create a job_files record
      const { data: fileRecord, error: insertError } = await supabase
        .from('job_files')
        .insert({
          job_id: jobs[0].id,
          file_url: uploadedFileUrl,
          file_name: 'test-file.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          uploaded_by: userId
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Now test the archive-based deletion
      const response = await fetch('/api/delete-file-r2', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileRecord.id,
          fileType: 'file',
          reason: 'Test deletion from feature tests'
        }),
      });

      const data = await response.json();

      if (response.ok && data.archived) {
        addResult('deleteFile', {
          success: true,
          message: 'File archived successfully (soft delete)',
          details: 'File will be permanently deleted in 30 days',
        });
      } else {
        throw new Error(data.error || 'Archive failed');
      }
    } catch (error) {
      addResult('deleteFile', {
        success: false,
        message: 'Error archiving file',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkR2Config = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/upload-file-r2', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      addResult('r2Config', {
        success: data.status === 'ready',
        message: 'R2 Configuration Status',
        details: `Bucket: ${data.bucket}, Endpoint: ${data.hasCredentials?.endpoint ? '✓' : '✗'}, Keys: ${data.hasCredentials?.accessKey && data.hasCredentials?.secretKey ? '✓' : '✗'}`
      });
    } catch (error) {
      addResult('r2Config', {
        success: false,
        message: 'Failed to check R2 configuration',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const ResultIndicator = ({ result }: { result?: TestResult }) => {
    if (!result) return null;

    return (
      <div className={`result-item ${result.success ? 'success' : 'error'}`}>
        <div>
          <span className="result-label">Result:</span>
          <span className="result-value">{result.message}</span>
        </div>
        {result.details && (
          <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', opacity: 0.8 }}>
            {result.details}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="test-section">
      <div className="test-section-header">
        <h2 className="test-section-title">R2 Storage Tests</h2>
        <span className={`test-section-status ${loading ? 'running' : 'pending'}`}>
          {loading ? 'Running' : 'Ready'}
        </span>
      </div>

      {/* Check Configuration First */}
      <div className="test-input-group">
        <button
          onClick={checkR2Config}
          disabled={loading}
          className="test-button secondary"
        >
          Check R2 Configuration
        </button>
        {testResults['r2Config'] && <ResultIndicator result={testResults['r2Config']} />}
      </div>

      {/* File Selection */}
      <div className="test-input-group">
        <label className="test-input-label">Select Test File</label>
        <input
          ref={fileInputRef}
          type="file"
          className="test-input"
          accept="image/*,.pdf,.doc,.docx"
        />
      </div>

      <div className="test-button-group">
        <button
          onClick={testFileUpload}
          disabled={loading}
          className="test-button"
        >
          {loading && <span className="loading-spinner"></span>}
          Test Upload to R2
        </button>
        
        {uploadedFileUrl && (
          <button
            onClick={testDeleteWithArchive}
            disabled={loading}
            className="test-button secondary"
          >
            Test Archive (Soft Delete)
          </button>
        )}
      </div>

      {/* Display test results */}
      {Object.keys(testResults).length > 0 && (
        <div className="test-results">
          {Object.entries(testResults)
            .filter(([key]) => key !== 'r2Config')
            .map(([testName, result]) => (
              <ResultIndicator key={testName} result={result} />
            ))}
        </div>
      )}

      {/* Display uploaded file URL */}
      {uploadedFileUrl && (
        <div className="test-input-group">
          <label className="test-input-label">Uploaded File URL (Signed, 7-day expiry)</label>
          <textarea
            className="test-input"
            value={uploadedFileUrl}
            readOnly
            rows={3}
            style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
          />
        </div>
      )}
    </div>
  );
}