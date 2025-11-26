'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface RLSSecurityTestsProps {
  userId: string;
}

export default function RLSSecurityTests({ userId }: RLSSecurityTestsProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const supabase = createClient();

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const loadCurrentRole = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setCurrentRole(data.role);
      addResult('loadRole', {
        success: true,
        message: `Current user role: ${data.role}`,
      });
    } catch (error) {
      addResult('loadRole', {
        success: false,
        message: 'Error loading user role',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testJobsAccess = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact' });

      if (error) {
        // Error could mean RLS is blocking access
        addResult('jobsAccess', {
          success: false,
          message: 'Jobs table access restricted',
          details: `RLS policy may be blocking: ${error.message}`,
        });
      } else {
        addResult('jobsAccess', {
          success: true,
          message: `Jobs table accessible (${currentRole})`,
          details: `Can access ${count || 0} jobs`,
        });
      }
    } catch (error) {
      addResult('jobsAccess', {
        success: false,
        message: 'Error testing jobs access',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testCustomersAccess = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });

      if (error) {
        addResult('customersAccess', {
          success: false,
          message: 'Customers table access restricted',
          details: `RLS policy may be blocking: ${error.message}`,
        });
      } else {
        addResult('customersAccess', {
          success: true,
          message: `Customers table accessible (${currentRole})`,
          details: `Can access ${count || 0} customers`,
        });
      }
    } catch (error) {
      addResult('customersAccess', {
        success: false,
        message: 'Error testing customers access',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testProposalsAccess = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact' });

      if (error) {
        addResult('proposalsAccess', {
          success: false,
          message: 'Proposals table access restricted',
          details: `RLS policy may be blocking: ${error.message}`,
        });
      } else {
        addResult('proposalsAccess', {
          success: true,
          message: `Proposals table accessible (${currentRole})`,
          details: `Can access ${count || 0} proposals`,
        });
      }
    } catch (error) {
      addResult('proposalsAccess', {
        success: false,
        message: 'Error testing proposals access',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testTimeEntriesAccess = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('time_entries')
        .select('*', { count: 'exact' });

      if (error) {
        addResult('timeEntriesAccess', {
          success: false,
          message: 'Time entries table access restricted',
          details: `RLS policy may be blocking: ${error.message}`,
        });
      } else {
        // Boss/admin should see all, technicians should only see their own
        addResult('timeEntriesAccess', {
          success: true,
          message: `Time entries table accessible (${currentRole})`,
          details: `Can access ${count || 0} time entries`,
        });
      }
    } catch (error) {
      addResult('timeEntriesAccess', {
        success: false,
        message: 'Error testing time entries access',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testWritePermissions = async () => {
    setLoading(true);
    try {
      // Try to create a test customer (should work for boss/admin, fail for technician)
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: 'RLS Test Customer',
          email: 'rls-test@example.com',
          phone: '555-0100',
        })
        .select()
        .single();

      if (error) {
        addResult('writePermissions', {
          success: false,
          message: 'Write access denied by RLS',
          details: `Cannot create customer: ${error.message}`,
        });
      } else {
        // Clean up - delete the test customer
        await supabase.from('customers').delete().eq('id', data.id);

        addResult('writePermissions', {
          success: true,
          message: `Write access allowed (${currentRole})`,
          details: 'Successfully created and deleted test customer',
        });
      }
    } catch (error) {
      addResult('writePermissions', {
        success: false,
        message: 'Error testing write permissions',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testArchivePermissions = async () => {
    setLoading(true);
    try {
      // Try to access archived items view
      const { data, error, count } = await supabase
        .from('archived_items')
        .select('*', { count: 'exact' });

      if (error) {
        addResult('archivePermissions', {
          success: false,
          message: 'Archived items view access restricted',
          details: `RLS policy blocking: ${error.message}`,
        });
      } else {
        addResult('archivePermissions', {
          success: true,
          message: `Archived items accessible (${currentRole})`,
          details: `Can view ${count || 0} archived items`,
        });
      }
    } catch (error) {
      addResult('archivePermissions', {
        success: false,
        message: 'Error testing archive permissions',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    await loadCurrentRole();
    await testJobsAccess();
    await testCustomersAccess();
    await testProposalsAccess();
    await testTimeEntriesAccess();
    await testWritePermissions();
    await testArchivePermissions();
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">RLS Security Tests</h2>
        <p className="text-gray-600">
          Test role-based access for boss/technician/customer roles on protected tables and verify RLS policies are enforced
        </p>
      </div>

      {/* Current Role Display */}
      {currentRole && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Current User Role</h3>
              <p className="text-sm text-blue-700 mt-1">
                Testing RLS policies with this role
              </p>
            </div>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-lg">
              {currentRole.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Run All Tests Button */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 transition-colors font-semibold"
        >
          {loading ? 'Running All Tests...' : '🚀 Run All RLS Security Tests'}
        </button>
      </div>

      {/* Individual Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Load Current Role */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Load User Role</h3>
          <p className="text-sm text-gray-600 mb-4">
            Retrieve current user's role from profiles table
          </p>
          <button
            onClick={loadCurrentRole}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Loading...' : 'Load Role'}
          </button>
          <ResultIndicator result={testResults['loadRole']} />
        </div>

        {/* Jobs Access Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Jobs Table Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test read access to jobs table based on role
          </p>
          <button
            onClick={testJobsAccess}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Jobs Access'}
          </button>
          <ResultIndicator result={testResults['jobsAccess']} />
        </div>

        {/* Customers Access Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers Table Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test read access to customers table based on role
          </p>
          <button
            onClick={testCustomersAccess}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Customers Access'}
          </button>
          <ResultIndicator result={testResults['customersAccess']} />
        </div>

        {/* Proposals Access Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposals Table Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test read access to proposals table based on role
          </p>
          <button
            onClick={testProposalsAccess}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Proposals Access'}
          </button>
          <ResultIndicator result={testResults['proposalsAccess']} />
        </div>

        {/* Time Entries Access Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Entries Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test access to time entries (boss/admin: all, tech: own)
          </p>
          <button
            onClick={testTimeEntriesAccess}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Time Entries Access'}
          </button>
          <ResultIndicator result={testResults['timeEntriesAccess']} />
        </div>

        {/* Write Permissions Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Write Permissions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test create/update/delete permissions based on role
          </p>
          <button
            onClick={testWritePermissions}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Write Permissions'}
          </button>
          <ResultIndicator result={testResults['writePermissions']} />
        </div>

        {/* Archive Permissions Test */}
        <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive View Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test access to archived_items view (typically admin/boss only)
          </p>
          <button
            onClick={testArchivePermissions}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Archive Permissions'}
          </button>
          <ResultIndicator result={testResults['archivePermissions']} />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔒 RLS Policy Expectations</h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>
            <span className="font-semibold">Boss/Admin:</span> Full access to all tables (read/write)
          </div>
          <div>
            <span className="font-semibold">Technician:</span> Read access to jobs/customers, write own time entries
          </div>
          <div>
            <span className="font-semibold">Customer:</span> Limited access to own data only
          </div>
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <span className="font-semibold">Note:</span> Failed tests may indicate RLS policies are working correctly by blocking unauthorized access.
          </div>
        </div>
      </div>
    </div>
  );
}
