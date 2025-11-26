'use client';

import { useState } from 'react';
import Link from 'next/link';

// TypeScript interfaces
interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp?: string;
  disabled?: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  userType?: string;
  role?: string[];
}

interface FormSubmission {
  id: string;
  submissionTimestamp: number;
  employee?: string;
  jobAddress?: string;
  startTime?: string;
  endTime?: string;
  jobType?: string[];
}

interface AddressMatch {
  jobId: string;
  jobAddress: string;
  score: number;
  method: 'exact' | 'fuzzy' | 'manual';
}

interface Photo {
  url: string;
  type: 'before' | 'after';
}

export default function ConnecteamTestPage() {
  // State for test results
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  
  // State for test data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [addressMatches, setAddressMatches] = useState<AddressMatch[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // State for inputs
  const [submissionLimit, setSubmissionLimit] = useState(10);
  const [testAddress, setTestAddress] = useState('');
  const [materialsText, setMaterialsText] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Diagnostic data
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  // Helper to add test result
  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({
      ...prev,
      [testName]: {
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));
  };

  // Helper to set loading state
  const setLoadingState = (testName: string, isLoading: boolean) => {
    setLoading((prev) => ({ ...prev, [testName]: isLoading }));
  };

  // COMPREHENSIVE DIAGNOSTIC TEST
  const runDiagnostic = async () => {
    setLoadingState('diagnostic', true);
    setDiagnosticData(null);
    
    try {
      const response = await fetch('/api/connecteam/diagnostic');
      const data = await response.json();

      setDiagnosticData(data);

      const hasErrors = data.tests?.some((test: any) => test.status === 'ERROR' || test.status === 'FAILED');

      addResult('diagnostic', {
        success: !hasErrors,
        message: hasErrors ? 'Some diagnostic tests failed' : 'All diagnostic tests passed',
        details: data,
      });

    } catch (error) {
      console.error('Diagnostic error:', error);
      addResult('diagnostic', {
        success: false,
        message: 'Error running diagnostic',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingState('diagnostic', false);
    }
  };

  // Test functions
  const testFetchEmployees = async () => {
    setLoadingState('employees', true);
    setEmployees([]);
    
    try {
      const response = await fetch('/api/connecteam/employees');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      // Update state with employee data
      setEmployees(data.employees || []);

      addResult('employees', {
        success: true,
        message: `Successfully fetched ${data.total} employees`,
        details: data,
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      addResult('employees', {
        success: false,
        message: 'Error fetching employees',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingState('employees', false);
    }
  };

  const testFetchSubmissions = async () => {
    setLoadingState('submissions', true);
    setSubmissions([]);
    
    try {
      const response = await fetch(`/api/connecteam/submissions?offset=0&limit=${submissionLimit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      setSubmissions(data.submissions || []);

      addResult('submissions', {
        success: true,
        message: `Fetched ${data.submissions?.length || 0} form submissions`,
        details: {
          pagination: data.pagination,
          timestamp: data.timestamp,
        },
      });
    } catch (error: any) {
      addResult('submissions', {
        success: false,
        message: error.message || 'Unknown error',
      });
    } finally {
      setLoadingState('submissions', false);
    }
  };

  const testAddressMatch = async () => {
    if (!testAddress || testAddress.trim() === '') {
      addResult('addressMatch', {
        success: false,
        message: 'Please enter an address to test',
      });
      return;
    }

    setLoadingState('addressMatch', true);
    setAddressMatches([]);
    
    try {
      // Test with findAll to see all potential matches
      const response = await fetch('/api/connecteam/match-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: testAddress,
          findAll: true,
          minScore: 0.7, // Lower threshold to see more results
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to match address');
      }

      setAddressMatches(data.matches || []);

      addResult('addressMatch', {
        success: true,
        message: `Found ${data.matches?.length || 0} potential matches`,
        details: {
          normalized: data.query?.normalized,
          totalJobs: data.totalJobs,
          timestamp: data.timestamp,
        },
      });

    } catch (error) {
      console.error('Error matching address:', error);
      addResult('addressMatch', {
        success: false,
        message: 'Error matching address',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingState('addressMatch', false);
    }
  };

  const testParseMaterials = async () => {
    addResult('materials', {
      success: false,
      message: 'Not implemented yet',
    });
  };

  const testPhotos = async () => {
    setLoadingState('photos', true);
    setPhotos([]);
    
    try {
      // Fetch submissions to get photos
      const response = await fetch('/api/connecteam/submissions?offset=0&limit=5');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      // Extract all photos from submissions
      const allPhotos: Photo[] = [];
      
      data.submissions?.forEach((submission: any) => {
        // Before photos
        if (submission.beforePhotos && Array.isArray(submission.beforePhotos)) {
          submission.beforePhotos.forEach((url: string) => {
            allPhotos.push({ url, type: 'before' });
          });
        }
        
        // After photos
        if (submission.afterPhotos && Array.isArray(submission.afterPhotos)) {
          submission.afterPhotos.forEach((url: string) => {
            allPhotos.push({ url, type: 'after' });
          });
        }
      });

      setPhotos(allPhotos);

      addResult('photos', {
        success: true,
        message: `Loaded ${allPhotos.length} photos from ${data.submissions?.length || 0} submissions`,
        details: {
          before: allPhotos.filter(p => p.type === 'before').length,
          after: allPhotos.filter(p => p.type === 'after').length,
        },
      });

    } catch (error) {
      console.error('Error loading photos:', error);
      addResult('photos', {
        success: false,
        message: 'Error loading photos',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingState('photos', false);
    }
  };

  const testIncrementalSync = async () => {
    addResult('sync', {
      success: false,
      message: 'Not implemented yet',
    });
  };

  // NEW: Full sync to database
  const testFullSync = async () => {
    setLoadingState('fullSync', true);
    
    try {
      const response = await fetch('/api/connecteam/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncAll: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      addResult('fullSync', {
        success: data.success,
        message: data.success 
          ? `Sync completed in ${(data.duration / 1000).toFixed(2)}s` 
          : 'Sync completed with errors',
        details: data,
      });

    } catch (error) {
      console.error('Sync error:', error);
      addResult('fullSync', {
        success: false,
        message: 'Error during sync',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingState('fullSync', false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* DISABLED BANNER */}
        <div className="mb-6 p-4 bg-amber-100 border-2 border-amber-400 rounded-lg">
          <div className="flex items-start">
            <span className="text-3xl mr-3">⚠️</span>
            <div>
              <h2 className="text-xl font-bold text-amber-800 mb-2">
                ConnectTeam Integration Disabled
              </h2>
              <p className="text-amber-700 mb-2">
                <strong>Reason:</strong> ConnectTeam API requires a premium subscription plan to access the API.
              </p>
              <p className="text-amber-700 mb-2">
                The current ConnectTeam subscription does not include API access. To enable sync functionality:
              </p>
              <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                <li>Upgrade to ConnectTeam premium plan with API access</li>
                <li>Contact ConnectTeam support to enable API features</li>
                <li>Once upgraded, contact developer to re-enable sync functionality</li>
              </ul>
              <p className="text-amber-700 mt-3 text-sm">
                <strong>Note:</strong> All test buttons below will return disabled status until the subscription is upgraded.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link href="/test-features" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Test Features
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔗 ConnectTeam API Test Page <span className="text-amber-600 text-2xl">(DISABLED)</span>
          </h1>
          <p className="text-gray-600">
            Test all ConnectTeam API endpoints with real data
          </p>
        </div>

        {/* Test Sections Container */}
        <div className="space-y-6">

          {/* Test 0: COMPREHENSIVE DIAGNOSTIC */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-red-700">
              <span className="mr-2">🔍</span>
              COMPREHENSIVE API DIAGNOSTIC
            </h2>
            <p className="text-gray-700 mb-4 font-semibold">
              Tests ALL ConnectTeam endpoints and dumps raw responses. Click here FIRST!
            </p>
            
            <button
              onClick={runDiagnostic}
              disabled={loading.diagnostic}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg"
            >
              {loading.diagnostic ? 'Running Diagnostic...' : '🔍 RUN FULL DIAGNOSTIC'}
            </button>

            {/* Test Result */}
            {testResults.diagnostic && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.diagnostic.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.diagnostic.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.diagnostic.message}</p>
                    {testResults.diagnostic.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.diagnostic.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Data Display */}
            {diagnosticData && (
              <div className="mt-4 space-y-4">
                <h3 className="font-bold text-lg">Diagnostic Results:</h3>
                {diagnosticData.tests?.map((test: any, index: number) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{test.name}</h4>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${
                        test.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        test.status === 'FAILED' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    
                    {test.httpStatus && (
                      <p className="text-sm text-gray-600 mb-2">
                        HTTP Status: {test.httpStatus} {test.httpStatusText}
                      </p>
                    )}
                    
                    {test.url && (
                      <p className="text-sm text-gray-600 mb-2">
                        URL: <code className="bg-gray-100 px-2 py-1 rounded">{test.url}</code>
                      </p>
                    )}
                    
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">
                        View Raw Response Data
                      </summary>
                      <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                        {JSON.stringify(test, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
                
                <details className="border border-gray-300 rounded-lg p-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">
                    View Complete Diagnostic JSON
                  </summary>
                  <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                    {JSON.stringify(diagnosticData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Test 1: Fetch Employees */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Test 1: Fetch Employees
            </h2>
            <p className="text-gray-600 mb-4">
              Fetch all employees from ConnectTeam API
            </p>
            
            <button
              onClick={testFetchEmployees}
              disabled={loading.employees}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.employees ? 'Fetching...' : 'Fetch Employees'}
            </button>

            {/* Test Result */}
            {testResults.employees && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.employees.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.employees.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.employees.message}</p>
                    {testResults.employees.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.employees.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Employee List */}
            {employees.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Employees ({employees.length}):</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(employees, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Test 2: Fetch Form Submissions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Test 2: Fetch Form Submissions
            </h2>
            <p className="text-gray-600 mb-4">
              Fetch form submissions with pagination (Form ID: 11221823)
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Limit:</label>
              <input
                type="number"
                value={submissionLimit}
                onChange={(e) => setSubmissionLimit(parseInt(e.target.value) || 10)}
                className="border border-gray-300 rounded px-3 py-2 w-24"
                min="1"
                max="50"
              />
              <button
                onClick={testFetchSubmissions}
                disabled={loading.submissions}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading.submissions ? 'Fetching...' : 'Fetch Submissions'}
              </button>
            </div>

            {/* Test Result */}
            {testResults.submissions && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.submissions.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.submissions.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.submissions.message}</p>
                    {testResults.submissions.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.submissions.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Submissions List */}
            {submissions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Submissions ({submissions.length}):</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(submissions, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Test 3: Test Address Matching */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">📍</span>
              Test 3: Test Address Matching
            </h2>
            <p className="text-gray-600 mb-4">
              Test address matching algorithm with confidence scores
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium block mb-2">ConnectTeam Address:</label>
                <input
                  type="text"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  placeholder="e.g., 23 Griffing Blvd, Asheville, NC 28804"
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
              <button
                onClick={testAddressMatch}
                disabled={loading.addressMatch || !testAddress}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading.addressMatch ? 'Matching...' : 'Match Address'}
              </button>
            </div>


            {/* Test Result */}
            {testResults.addressMatch && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.addressMatch.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.addressMatch.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.addressMatch.message}</p>
                    {testResults.addressMatch.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.addressMatch.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Match Results */}
            {addressMatches.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-3">Matches Found ({addressMatches.length}):</h3>
                <div className="space-y-3">
                  {addressMatches.map((match, index) => (
                    <div 
                      key={index} 
                      className={`border-2 rounded-lg p-4 ${
                        match.score >= 0.9 ? 'border-green-300 bg-green-50' :
                        match.score >= 0.7 ? 'border-yellow-300 bg-yellow-50' :
                        'border-orange-300 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            #{index + 1} - Job ID: {match.jobId}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Address:</span> {match.jobAddress}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-2xl font-bold ${
                            match.score >= 0.9 ? 'text-green-600' :
                            match.score >= 0.7 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {(match.score * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs uppercase font-semibold mt-1">
                            {match.score >= 0.9 ? 'HIGH' : match.score >= 0.7 ? 'MEDIUM' : 'LOW'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {match.method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {addressMatches.length === 0 && testResults.addressMatch?.success && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  ⚠️ No matches found above the threshold. Try adjusting the address or lowering the minimum score.
                </p>
              </div>
            )}
          </div>


          {/* Test 4: Parse Materials */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              Test 4: Parse Materials
            </h2>
            <p className="text-gray-600 mb-4">
              Parse "Parts/materials needed" field from form submissions
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium block mb-2">Materials Text:</label>
                <textarea
                  value={materialsText}
                  onChange={(e) => setMaterialsText(e.target.value)}
                  placeholder="Paste materials text here...&#10;e.g.,&#10;• Carrier 3-ton condenser&#10;• Programmable thermostat&#10;• 20ft flex ductwork"
                  className="border border-gray-300 rounded px-3 py-2 w-full h-32"
                />
              </div>
              <button
                onClick={testParseMaterials}
                disabled={loading.materials || !materialsText}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading.materials ? 'Parsing...' : 'Parse Materials'}
              </button>
            </div>

            {/* Test Result */}
            {testResults.materials && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.materials.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.materials.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.materials.message}</p>
                    {testResults.materials.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.materials.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Parsed Materials */}
            {materials.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Parsed Items ({materials.length}):</h3>
                <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {materials.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Test 5: Load Photos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">📸</span>
              Test 5: Load Photos
            </h2>
            <p className="text-gray-600 mb-4">
              Load before/after photos from latest submission
            </p>
            
            <button
              onClick={testPhotos}
              disabled={loading.photos}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading.photos ? 'Loading...' : 'Load Photos'}
            </button>

            {/* Test Result */}
            {testResults.photos && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.photos.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.photos.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.photos.message}</p>
                    {testResults.photos.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.photos.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Photos ({photos.length}):</h3>
                
                {/* Before Photos */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">BEFORE:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {photos.filter(p => p.type === 'before').map((photo, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={photo.url}
                          alt={`Before ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* After Photos */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">AFTER:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {photos.filter(p => p.type === 'after').map((photo, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={photo.url}
                          alt={`After ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Test 6: Test Incremental Sync */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">🔄</span>
              Test 6: Test Incremental Sync
            </h2>
            <p className="text-gray-600 mb-4">
              Test fetching only new submissions since last sync
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium block mb-2">Last Sync Time:</label>
                <input
                  type="datetime-local"
                  value={lastSyncTime}
                  onChange={(e) => setLastSyncTime(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only fetch submissions after this timestamp
                </p>
              </div>
              <button
                onClick={testIncrementalSync}
                disabled={loading.sync || !lastSyncTime}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading.sync ? 'Syncing...' : 'Test Sync'}
              </button>
            </div>

            {/* Test Result */}
            {testResults.sync && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.sync.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {testResults.sync.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{testResults.sync.message}</p>
                    {testResults.sync.timestamp && (
                      <p className="text-sm text-gray-500">
                        {testResults.sync.timestamp}
                      </p>
                    )}
                    {testResults.sync.details && (
                      <div className="mt-2 text-sm">
                        <p>New submissions: {testResults.sync.details.count}</p>
                        <p>API calls: {testResults.sync.details.apiCalls}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test 7: FULL SYNC TO DATABASE */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border-2 border-green-300">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">💾</span>
              Test 7: Full Sync to Database ⭐
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>Sync all data from ConnectTeam API → Database</strong>
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <h3 className="font-bold text-lg mb-2">What This Does:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Syncs all 9 employees → <code className="bg-gray-100 px-1 rounded">connecteam_employees</code></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Syncs form submissions → <code className="bg-gray-100 px-1 rounded">connecteam_form_submissions</code></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Extracts and stores photos → <code className="bg-gray-100 px-1 rounded">connecteam_photos</code></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Parses materials → <code className="bg-gray-100 px-1 rounded">materials_checklist</code></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Auto-matches addresses to jobs (fuzzy matching)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Logs all matches → <code className="bg-gray-100 px-1 rounded">connecteam_address_matches</code></span>
                </li>
              </ul>
            </div>

            <button
              onClick={testFullSync}
              disabled={loading.fullSync}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold text-lg shadow-md"
            >
              {loading.fullSync ? '⏳ Syncing...' : '🚀 Run Full Sync'}
            </button>

            {/* Test Result */}
            {testResults.fullSync && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResults.fullSync.success ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
              }`}>
                <div className="flex items-start">
                  <span className="text-3xl mr-3">
                    {testResults.fullSync.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{testResults.fullSync.message}</p>
                    {testResults.fullSync.timestamp && (
                      <p className="text-sm text-gray-600 mt-1">
                        {testResults.fullSync.timestamp}
                      </p>
                    )}
                    
                    {/* Detailed Results */}
                    {testResults.fullSync.details && (
                      <div className="mt-4 space-y-3">
                        {/* Employees */}
                        {testResults.fullSync.details.employees && (
                          <div className="bg-white rounded p-3 border border-gray-200">
                            <h4 className="font-bold text-blue-700 mb-2">👥 Employees:</h4>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Synced:</span>
                                <span className="ml-2 font-semibold">{testResults.fullSync.details.employees.synced}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Created:</span>
                                <span className="ml-2 font-semibold text-green-600">{testResults.fullSync.details.employees.created}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Updated:</span>
                                <span className="ml-2 font-semibold text-blue-600">{testResults.fullSync.details.employees.updated}</span>
                              </div>
                            </div>
                            {testResults.fullSync.details.employees.errors?.length > 0 && (
                              <div className="mt-2 text-xs text-red-600">
                                <p className="font-semibold">Errors:</p>
                                <ul className="list-disc list-inside">
                                  {testResults.fullSync.details.employees.errors.map((err: string, i: number) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Submissions */}
                        {testResults.fullSync.details.submissions && (
                          <div className="bg-white rounded p-3 border border-gray-200">
                            <h4 className="font-bold text-green-700 mb-2">📋 Submissions:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Synced:</span>
                                <span className="ml-2 font-semibold">{testResults.fullSync.details.submissions.synced}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Created:</span>
                                <span className="ml-2 font-semibold text-green-600">{testResults.fullSync.details.submissions.created}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Photos:</span>
                                <span className="ml-2 font-semibold text-purple-600">{testResults.fullSync.details.submissions.photosCreated}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Materials:</span>
                                <span className="ml-2 font-semibold text-orange-600">{testResults.fullSync.details.submissions.materialsCreated}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Jobs Matched:</span>
                                <span className="ml-2 font-semibold text-blue-600">{testResults.fullSync.details.submissions.jobsMatched}</span>
                              </div>
                            </div>
                            {testResults.fullSync.details.submissions.errors?.length > 0 && (
                              <div className="mt-2 text-xs text-red-600">
                                <p className="font-semibold">Errors:</p>
                                <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                                  {testResults.fullSync.details.submissions.errors.map((err: string, i: number) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
