'use client';

import { useState } from 'react';
import {
  COMPANY_INFO,
  PROPOSAL_DISCLAIMERS,
  INVOICE_DISCLAIMERS,
  getProposalExpirationDate,
  isProposalExpired,
  getProposalDisclaimers,
  DisclaimerSection,
} from '@/lib/legal-disclaimers';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

export default function LegalDisclaimerTests() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [proposalDate, setProposalDate] = useState<Date>(new Date());
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testCompanyInfo = () => {
    setLoading(true);
    try {
      const hasLicense = COMPANY_INFO.licenseNumber === '34182';
      const hasName = COMPANY_INFO.businessName === 'Fair Air Heating & Cooling';
      const hasState = COMPANY_INFO.state === 'NC';

      if (hasLicense && hasName && hasState) {
        addResult('companyInfo', {
          success: true,
          message: 'Company information verified',
          details: `License #${COMPANY_INFO.licenseNumber}, ${COMPANY_INFO.businessName}, ${COMPANY_INFO.state}`,
        });
      } else {
        addResult('companyInfo', {
          success: false,
          message: 'Company information incomplete',
          details: 'Missing required fields',
        });
      }
    } catch (error) {
      addResult('companyInfo', {
        success: false,
        message: 'Error checking company info',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testProposalExpiration = () => {
    setLoading(true);
    try {
      const expDate = getProposalExpirationDate(proposalDate);
      const expired = isProposalExpired(proposalDate);

      setExpirationDate(expDate);
      setIsExpired(expired);

      const expectedDays = PROPOSAL_DISCLAIMERS.header.expirationDays;
      const actualDays = Math.round(
        (expDate.getTime() - proposalDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (actualDays === expectedDays) {
        addResult('proposalExpiration', {
          success: true,
          message: 'Proposal expiration calculation correct',
          details: `Expires in ${expectedDays} days. Status: ${expired ? 'EXPIRED' : 'VALID'}`,
        });
      } else {
        addResult('proposalExpiration', {
          success: false,
          message: 'Expiration calculation incorrect',
          details: `Expected ${expectedDays} days, got ${actualDays} days`,
        });
      }
    } catch (error) {
      addResult('proposalExpiration', {
        success: false,
        message: 'Error testing proposal expiration',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentTerms = () => {
    setLoading(true);
    try {
      const standardTerms = PROPOSAL_DISCLAIMERS.footer.standard;
      const paymentTermLine = standardTerms.find((term) =>
        term.includes('Payment terms')
      );

      if (
        paymentTermLine?.includes('50%') &&
        paymentTermLine?.includes('30%') &&
        paymentTermLine?.includes('20%')
      ) {
        addResult('paymentTerms', {
          success: true,
          message: 'Payment terms verified',
          details: '50% deposit, 30% rough-in, 20% completion',
        });
      } else {
        addResult('paymentTerms', {
          success: false,
          message: 'Payment terms not found or incorrect',
        });
      }
    } catch (error) {
      addResult('paymentTerms', {
        success: false,
        message: 'Error testing payment terms',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testServiceDisclaimers = () => {
    setLoading(true);
    try {
      const serviceDisclaimers = getProposalDisclaimers('service');
      const installationDisclaimers = getProposalDisclaimers('installation');

      const hasServiceSpecific = serviceDisclaimers.some((d) =>
        d.includes('diagnostic and repair services')
      );
      const hasStandard = serviceDisclaimers.some((d) => d.includes('valid for'));

      if (hasServiceSpecific && hasStandard) {
        addResult('serviceDisclaimers', {
          success: true,
          message: 'Service disclaimers generated correctly',
          details: `Service: ${serviceDisclaimers.length} items, Installation: ${installationDisclaimers.length} items`,
        });
      } else {
        addResult('serviceDisclaimers', {
          success: false,
          message: 'Service disclaimers missing required content',
        });
      }
    } catch (error) {
      addResult('serviceDisclaimers', {
        success: false,
        message: 'Error testing service disclaimers',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testInvoiceTerms = () => {
    setLoading(true);
    try {
      const paymentTerms = INVOICE_DISCLAIMERS.footer.paymentTerms;
      const legalNotice = INVOICE_DISCLAIMERS.footer.legalNotice;

      const hasFinanceCharge = paymentTerms.some((term) =>
        term.includes('1.5% monthly finance charge')
      );
      const hasMechanicsLien = legalNotice.some((notice) =>
        notice.includes('mechanic\'s lien')
      );

      if (hasFinanceCharge && hasMechanicsLien) {
        addResult('invoiceTerms', {
          success: true,
          message: 'Invoice terms verified',
          details: 'Payment terms and legal notices present',
        });
      } else {
        addResult('invoiceTerms', {
          success: false,
          message: 'Invoice terms incomplete',
        });
      }
    } catch (error) {
      addResult('invoiceTerms', {
        success: false,
        message: 'Error testing invoice terms',
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Disclaimer Tests</h2>
        <p className="text-gray-600">
          Test license #34182, proposal expiration (30 days), payment terms, and disclaimer formatting
        </p>
      </div>

      {/* Company Info Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-3">
            <p className="text-sm text-gray-600">Business Name</p>
            <p className="font-semibold text-gray-900">{COMPANY_INFO.businessName}</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-sm text-gray-600">License Number</p>
            <p className="font-semibold text-gray-900">#{COMPANY_INFO.licenseNumber}</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-sm text-gray-600">State</p>
            <p className="font-semibold text-gray-900">{COMPANY_INFO.state}</p>
          </div>
        </div>
      </div>

      {/* Proposal Expiration Test */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">Proposal Expiration Calculator</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Date
            </label>
            <input
              type="date"
              value={proposalDate.toISOString().split('T')[0]}
              onChange={(e) => setProposalDate(new Date(e.target.value))}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {expirationDate && (
            <div className="bg-white rounded p-4 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Proposal Date</p>
                  <p className="font-semibold text-gray-900">
                    {proposalDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiration Date (30 days)</p>
                  <p className="font-semibold text-gray-900">
                    {expirationDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Status</p>
                  <p
                    className={`text-lg font-bold ${
                      isExpired ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {isExpired ? '❌ EXPIRED' : '✓ VALID'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Info Verification</h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify license #34182 and company details
          </p>
          <button
            onClick={testCompanyInfo}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Company Info'}
          </button>
          <ResultIndicator result={testResults['companyInfo']} />
        </div>

        {/* Proposal Expiration Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposal Expiration</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test 30-day expiration calculation
          </p>
          <button
            onClick={testProposalExpiration}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Expiration'}
          </button>
          <ResultIndicator result={testResults['proposalExpiration']} />
        </div>

        {/* Payment Terms Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Terms</h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify 50% / 30% / 20% payment structure
          </p>
          <button
            onClick={testPaymentTerms}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Payment Terms'}
          </button>
          <ResultIndicator result={testResults['paymentTerms']} />
        </div>

        {/* Service Disclaimers Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Disclaimers</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test service vs installation disclaimer differences
          </p>
          <button
            onClick={testServiceDisclaimers}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Disclaimers'}
          </button>
          <ResultIndicator result={testResults['serviceDisclaimers']} />
        </div>

        {/* Invoice Terms Test */}
        <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Terms & Legal Notices</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test invoice payment terms and legal notices (finance charges, mechanic's lien)
          </p>
          <button
            onClick={testInvoiceTerms}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Invoice Terms'}
          </button>
          <ResultIndicator result={testResults['invoiceTerms']} />
        </div>
      </div>

      {/* Disclaimer Component Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Disclaimer Component Previews</h3>

        {/* Proposal Disclaimer */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Proposal Disclaimer (Installation)</h4>
          <div className="bg-gray-50 p-4 rounded">
            <DisclaimerSection type="proposal" jobType="installation" />
          </div>
        </div>

        {/* Service Proposal Disclaimer */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Proposal Disclaimer (Service)</h4>
          <div className="bg-gray-50 p-4 rounded">
            <DisclaimerSection type="proposal" jobType="service" />
          </div>
        </div>

        {/* Invoice Disclaimer */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Invoice Disclaimer</h4>
          <div className="bg-gray-50 p-4 rounded">
            <DisclaimerSection type="invoice" />
          </div>
        </div>
      </div>
    </div>
  );
}
