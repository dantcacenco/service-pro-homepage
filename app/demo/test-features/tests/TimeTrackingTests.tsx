'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface TimeEntry {
  date: string;
  hours: number;
  jobId?: string;
  description: string;
}

interface PayrollCalculation {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  bonuses: number;
  totalPay: number;
}

export default function TimeTrackingTests() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [payrollCalc, setPayrollCalc] = useState<PayrollCalculation | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [bonusAmount, setBonusAmount] = useState<number>(100);

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const createSampleTimeEntries = () => {
    setLoading(true);
    try {
      const entries: TimeEntry[] = [
        { date: '2025-10-01', hours: 8, jobId: 'job-001', description: 'HVAC installation' },
        { date: '2025-10-02', hours: 9, jobId: 'job-002', description: 'Service call' },
        { date: '2025-10-03', hours: 8, jobId: 'job-003', description: 'Diagnostic work' },
        { date: '2025-10-04', hours: 10, jobId: 'job-001', description: 'HVAC installation cont.' },
        { date: '2025-10-05', hours: 8, jobId: 'job-004', description: 'Maintenance' },
        { date: '2025-10-06', hours: 4, description: 'Training/Admin' },
      ];

      setTimeEntries(entries);

      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

      addResult('createEntries', {
        success: true,
        message: 'Sample time entries created',
        details: `Created ${entries.length} entries with ${totalHours} total hours for the week`,
      });
    } catch (error) {
      addResult('createEntries', {
        success: false,
        message: 'Error creating time entries',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOvertimeTest = () => {
    setLoading(true);
    try {
      const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(totalHours - 40, 0);

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime

      const calculation: PayrollCalculation = {
        regularHours,
        overtimeHours,
        regularPay,
        overtimePay,
        bonuses: bonusAmount,
        totalPay: regularPay + overtimePay + bonusAmount,
      };

      setPayrollCalc(calculation);

      if (overtimeHours > 0) {
        addResult('overtime', {
          success: true,
          message: 'Overtime calculation successful',
          details: `${regularHours} regular hours + ${overtimeHours} overtime hours (1.5x rate) = $${calculation.totalPay.toFixed(2)}`,
        });
      } else {
        addResult('overtime', {
          success: true,
          message: 'No overtime hours',
          details: `Total ${totalHours} hours (all within regular 40hr/week)`,
        });
      }
    } catch (error) {
      addResult('overtime', {
        success: false,
        message: 'Error calculating overtime',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testJobLinking = () => {
    setLoading(true);
    try {
      const entriesWithJobs = timeEntries.filter(entry => entry.jobId);
      const jobHours = entriesWithJobs.reduce((acc, entry) => {
        if (!entry.jobId) return acc;
        acc[entry.jobId] = (acc[entry.jobId] || 0) + entry.hours;
        return acc;
      }, {} as Record<string, number>);

      const jobCount = Object.keys(jobHours).length;
      const totalJobHours = Object.values(jobHours).reduce((sum, hours) => sum + hours, 0);

      addResult('jobLinking', {
        success: true,
        message: 'Job linking test successful',
        details: `${entriesWithJobs.length} entries linked to ${jobCount} jobs (${totalJobHours} hours total)`,
      });
    } catch (error) {
      addResult('jobLinking', {
        success: false,
        message: 'Error testing job linking',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testBonusTracking = () => {
    setLoading(true);
    try {
      if (!payrollCalc) {
        addResult('bonusTracking', {
          success: false,
          message: 'Please calculate payroll first',
        });
        return;
      }

      const bonusPercentage = (bonusAmount / payrollCalc.totalPay) * 100;

      addResult('bonusTracking', {
        success: true,
        message: 'Bonus tracking test successful',
        details: `Bonus: $${bonusAmount.toFixed(2)} (${bonusPercentage.toFixed(1)}% of total pay)`,
      });
    } catch (error) {
      addResult('bonusTracking', {
        success: false,
        message: 'Error testing bonus tracking',
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Time Tracking Tests</h2>
        <p className="text-gray-600">
          Test regular vs overtime (40hr/week), time entries linked to jobs, bonus tracking, and weekly payroll calculations
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bonus Amount ($)
            </label>
            <input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Time Entries */}
      {timeEntries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Time Entries (Week of Oct 1-7, 2025)</h3>
          <div className="space-y-2">
            {timeEntries.map((entry, idx) => (
              <div key={idx} className="bg-white rounded p-3 flex items-center justify-between border border-blue-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{entry.date}</span>
                    {entry.jobId && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        {entry.jobId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                </div>
                <div className="text-lg font-bold text-blue-600">{entry.hours}h</div>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-white rounded p-3 border border-blue-300">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Hours:</span>
              <span className="text-xl font-bold text-blue-600">
                {timeEntries.reduce((sum, entry) => sum + entry.hours, 0)}h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Calculation */}
      {payrollCalc && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Weekly Payroll Calculation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Regular Hours</p>
              <p className="text-2xl font-bold text-gray-900">{payrollCalc.regularHours}h</p>
              <p className="text-sm text-green-600">${payrollCalc.regularPay.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Overtime Hours (1.5x)</p>
              <p className="text-2xl font-bold text-orange-600">{payrollCalc.overtimeHours}h</p>
              <p className="text-sm text-orange-600">${payrollCalc.overtimePay.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Bonuses</p>
              <p className="text-2xl font-bold text-purple-600">${payrollCalc.bonuses.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded p-3 md:col-span-3 border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-1">Total Weekly Pay</p>
              <p className="text-3xl font-bold text-green-600">${payrollCalc.totalPay.toFixed(2)}</p>
              <div className="mt-2 text-xs text-gray-500">
                <div>Regular: ${payrollCalc.regularPay.toFixed(2)}</div>
                <div>Overtime: ${payrollCalc.overtimePay.toFixed(2)}</div>
                <div>Bonuses: ${payrollCalc.bonuses.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Sample Entries */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Sample Time Entries</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate sample time entries for a week (including overtime)
          </p>
          <button
            onClick={createSampleTimeEntries}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Sample Entries'}
          </button>
          <ResultIndicator result={testResults['createEntries']} />
        </div>

        {/* Calculate Overtime */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculate Regular vs Overtime</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test overtime calculation (40hr/week threshold, 1.5x rate)
          </p>
          <button
            onClick={calculateOvertimeTest}
            disabled={loading || timeEntries.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Calculating...' : 'Calculate Overtime'}
          </button>
          <ResultIndicator result={testResults['overtime']} />
        </div>

        {/* Test Job Linking */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Job Linking</h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify time entries are properly linked to jobs
          </p>
          <button
            onClick={testJobLinking}
            disabled={loading || timeEntries.length === 0}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Job Linking'}
          </button>
          <ResultIndicator result={testResults['jobLinking']} />
        </div>

        {/* Test Bonus Tracking */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Bonus Tracking</h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify bonus amounts are included in payroll
          </p>
          <button
            onClick={testBonusTracking}
            disabled={loading || !payrollCalc}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Bonus Tracking'}
          </button>
          <ResultIndicator result={testResults['bonusTracking']} />
        </div>
      </div>
    </div>
  );
}
