'use client';

import { useState } from 'react';
import { calculateTax, prepareTaxItemsForBillcom, TaxCalculation } from '@/lib/tax-calculator';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface TestAddress {
  street: string;
  city: string;
  state: string;
  zip?: string;
}

export default function TaxCalculatorTests() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [billcomItems, setBillcomItems] = useState<any[] | null>(null);

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testAddresses: TestAddress[] = [
    { street: '101 City Hall Plaza', city: 'Durham', state: 'NC', zip: '27701' },
    { street: '301 N McDowell St', city: 'Charlotte', state: 'NC', zip: '28204' },
    { street: '200 College St', city: 'Asheville', state: 'NC', zip: '28801' },
    { street: '222 N Person St', city: 'Raleigh', state: 'NC', zip: '27601' },
  ];

  const [selectedAddress, setSelectedAddress] = useState<TestAddress>(testAddresses[0]);
  const [subtotal, setSubtotal] = useState<number>(1000);

  const testCountyDetection = async () => {
    setLoading(true);
    try {
      const result = await calculateTax(subtotal, selectedAddress);

      if (result.county) {
        addResult('countyDetection', {
          success: true,
          message: `County detected: ${result.county}`,
          details: `Address: ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}`,
        });
        setTaxCalculation(result);
      } else {
        addResult('countyDetection', {
          success: false,
          message: 'Failed to detect county',
          details: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      addResult('countyDetection', {
        success: false,
        message: 'Error detecting county',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testTaxCalculation = async () => {
    setLoading(true);
    try {
      const result = await calculateTax(subtotal, selectedAddress);

      // Verify NC state tax is 4.75%
      if (result.stateTax === 0.0475) {
        addResult('taxCalculation', {
          success: true,
          message: 'Tax calculation successful',
          details: `State Tax: ${result.stateTaxAmount.toFixed(2)} (4.75%), County Tax: ${result.countyTaxAmount.toFixed(2)} (${(result.countyTax * 100).toFixed(2)}%), Total: ${result.totalTaxAmount.toFixed(2)}`,
        });
        setTaxCalculation(result);
      } else {
        addResult('taxCalculation', {
          success: false,
          message: 'State tax rate is incorrect',
          details: `Expected 4.75%, got ${(result.stateTax * 100).toFixed(2)}%`,
        });
      }
    } catch (error) {
      addResult('taxCalculation', {
        success: false,
        message: 'Error calculating tax',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testBillcomFormatting = async () => {
    setLoading(true);
    try {
      const result = await calculateTax(subtotal, selectedAddress);
      const items = prepareTaxItemsForBillcom(result);

      setBillcomItems(items);

      // Verify the items have the correct structure
      if (
        items.length === 2 &&
        items[0].type === 'TAX' &&
        items[1].type === 'TAX'
      ) {
        addResult('billcomFormatting', {
          success: true,
          message: 'Bill.com tax line items formatted successfully',
          details: `Created ${items.length} tax line items for Bill.com`,
        });
      } else {
        addResult('billcomFormatting', {
          success: false,
          message: 'Bill.com formatting incorrect',
          details: 'Expected 2 tax line items with type=TAX',
        });
      }
    } catch (error) {
      addResult('billcomFormatting', {
        success: false,
        message: 'Error formatting for Bill.com',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testManualCountyOverride = async () => {
    setLoading(true);
    try {
      const result = await calculateTax(
        subtotal,
        selectedAddress,
        'Buncombe County'
      );

      if (result.county === 'Buncombe County' && result.countyTax === 0.0225) {
        addResult('manualOverride', {
          success: true,
          message: 'Manual county override successful',
          details: `County: ${result.county}, County Tax: ${(result.countyTax * 100).toFixed(2)}%`,
        });
        setTaxCalculation(result);
      } else {
        addResult('manualOverride', {
          success: false,
          message: 'Manual override failed',
          details: `Expected Buncombe County with 2.25%, got ${result.county} with ${(result.countyTax * 100).toFixed(2)}%`,
        });
      }
    } catch (error) {
      addResult('manualOverride', {
        success: false,
        message: 'Error with manual override',
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Calculator Tests</h2>
        <p className="text-gray-600">
          Test county detection from addresses, NC state tax (4.75%) + county rates, and Bill.com formatting
        </p>
      </div>

      {/* Test Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtotal Amount
            </label>
            <input
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Address
            </label>
            <select
              value={testAddresses.findIndex(a => a === selectedAddress)}
              onChange={(e) => setSelectedAddress(testAddresses[Number(e.target.value)])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {testAddresses.map((addr, idx) => (
                <option key={idx} value={idx}>
                  {addr.city}, {addr.state} ({addr.zip})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <p className="text-sm text-gray-600">Selected Address:</p>
          <p className="font-medium">
            {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
          </p>
        </div>
      </div>

      {/* Tax Calculation Results */}
      {taxCalculation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tax Calculation Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">County</p>
              <p className="text-lg font-bold text-gray-900">{taxCalculation.county}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">State Tax (4.75%)</p>
              <p className="text-lg font-bold text-gray-900">${taxCalculation.stateTaxAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">County Tax ({(taxCalculation.countyTax * 100).toFixed(2)}%)</p>
              <p className="text-lg font-bold text-gray-900">${taxCalculation.countyTaxAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Total Tax</p>
              <p className="text-lg font-bold text-green-600">${taxCalculation.totalTaxAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bill.com Items */}
      {billcomItems && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Bill.com Line Items</h3>
          <div className="space-y-2">
            {billcomItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded p-3 border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-600">Type: {item.type}</p>
                  </div>
                  <p className="text-lg font-bold text-purple-600">${item.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* County Detection Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">County Detection</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test county detection from address using Census Geocoding API
          </p>
          <button
            onClick={testCountyDetection}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test County Detection'}
          </button>
          <ResultIndicator result={testResults['countyDetection']} />
        </div>

        {/* Tax Calculation Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tax Calculation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test NC state tax (4.75%) + county rates calculation
          </p>
          <button
            onClick={testTaxCalculation}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Tax Calculation'}
          </button>
          <ResultIndicator result={testResults['taxCalculation']} />
        </div>

        {/* Bill.com Formatting Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill.com Formatting</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test Bill.com tax line item formatting
          </p>
          <button
            onClick={testBillcomFormatting}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Bill.com Format'}
          </button>
          <ResultIndicator result={testResults['billcomFormatting']} />
        </div>

        {/* Manual Override Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual County Override</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test manual county override (Buncombe County - 2.25%)
          </p>
          <button
            onClick={testManualCountyOverride}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Manual Override'}
          </button>
          <ResultIndicator result={testResults['manualOverride']} />
        </div>
      </div>
    </div>
  );
}
