'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface PaymentStage {
  stage: string;
  percentage: number;
  amount: number;
  description: string;
}

export default function JobWorkflowTests() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [serviceWorkflow, setServiceWorkflow] = useState<any>(null);
  const [constructionWorkflow, setConstructionWorkflow] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState<number>(10000);

  const addResult = (testName: string, result: TestResult) => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  const testServiceWorkflow = () => {
    setLoading(true);
    try {
      // Service job workflow: diagnostic → payment → tech dispatch → conversion
      const workflow = {
        stages: [
          {
            name: 'Diagnostic',
            status: 'pending',
            description: 'Initial diagnostic visit to assess problem',
            actions: ['Schedule appointment', 'Assign technician'],
          },
          {
            name: 'Payment',
            status: 'pending',
            description: 'Collect payment for service',
            actions: ['Send invoice', 'Process payment'],
          },
          {
            name: 'Tech Dispatch',
            status: 'pending',
            description: 'Dispatch technician for repair work',
            actions: ['Assign technician', 'Schedule service'],
          },
          {
            name: 'Conversion',
            status: 'pending',
            description: 'Convert to installation if needed',
            actions: ['Create proposal', 'Convert to installation job'],
          },
        ],
        currentStage: 0,
        jobType: 'service',
      };

      setServiceWorkflow(workflow);

      addResult('serviceWorkflow', {
        success: true,
        message: 'Service workflow created successfully',
        details: `Workflow has ${workflow.stages.length} stages: ${workflow.stages.map(s => s.name).join(' → ')}`,
      });
    } catch (error) {
      addResult('serviceWorkflow', {
        success: false,
        message: 'Error creating service workflow',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testConstructionWorkflow = () => {
    setLoading(true);
    try {
      // New Construction workflow with payment stages
      const depositAmount = totalAmount * 0.5;
      const roughInAmount = totalAmount * 0.3;
      const trimOutAmount = totalAmount * 0.2;

      const workflow = {
        stages: [
          {
            stage: 'Deposit',
            percentage: 50,
            amount: depositAmount,
            description: '50% deposit upon approval',
            status: 'pending',
          },
          {
            stage: 'Rough-in',
            percentage: 30,
            amount: roughInAmount,
            description: '30% after rough-in installation',
            status: 'pending',
          },
          {
            stage: 'Trim-out',
            percentage: 20,
            amount: trimOutAmount,
            description: '20% upon completion',
            status: 'pending',
          },
        ],
        totalAmount,
        jobType: 'new_construction',
      };

      setConstructionWorkflow(workflow);

      // Verify percentages add up to 100%
      const totalPercentage = workflow.stages.reduce((sum, stage) => sum + stage.percentage, 0);
      const totalPayments = workflow.stages.reduce((sum, stage) => sum + stage.amount, 0);

      if (totalPercentage === 100 && Math.abs(totalPayments - totalAmount) < 0.01) {
        addResult('constructionWorkflow', {
          success: true,
          message: 'New Construction workflow created successfully',
          details: `Payment stages: 50% ($${depositAmount.toFixed(2)}) → 30% ($${roughInAmount.toFixed(2)}) → 20% ($${trimOutAmount.toFixed(2)})`,
        });
      } else {
        addResult('constructionWorkflow', {
          success: false,
          message: 'Payment calculation error',
          details: `Total percentage: ${totalPercentage}%, Total payments: $${totalPayments.toFixed(2)}`,
        });
      }
    } catch (error) {
      addResult('constructionWorkflow', {
        success: false,
        message: 'Error creating construction workflow',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const advanceServiceStage = () => {
    if (!serviceWorkflow) return;

    const newWorkflow = { ...serviceWorkflow };
    if (newWorkflow.currentStage < newWorkflow.stages.length - 1) {
      newWorkflow.stages[newWorkflow.currentStage].status = 'completed';
      newWorkflow.currentStage += 1;
      newWorkflow.stages[newWorkflow.currentStage].status = 'in_progress';
      setServiceWorkflow(newWorkflow);

      addResult('advanceStage', {
        success: true,
        message: `Advanced to ${newWorkflow.stages[newWorkflow.currentStage].name}`,
        details: `Stage ${newWorkflow.currentStage + 1} of ${newWorkflow.stages.length}`,
      });
    } else {
      addResult('advanceStage', {
        success: false,
        message: 'Already at final stage',
      });
    }
  };

  const markPaymentStage = (stageIndex: number) => {
    if (!constructionWorkflow) return;

    const newWorkflow = { ...constructionWorkflow };
    newWorkflow.stages[stageIndex].status = 'completed';
    setConstructionWorkflow(newWorkflow);

    const completedPayments = newWorkflow.stages
      .filter((s: any) => s.status === 'completed')
      .reduce((sum: number, s: any) => sum + s.amount, 0);

    addResult('paymentStage', {
      success: true,
      message: `${newWorkflow.stages[stageIndex].stage} payment marked as completed`,
      details: `Total collected: $${completedPayments.toFixed(2)} of $${totalAmount.toFixed(2)}`,
    });
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Workflow Tests</h2>
        <p className="text-gray-600">
          Test Service job flow (diagnostic → payment → tech dispatch → conversion) and New Construction payment stages
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Job Amount (for payment calculations)
          </label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Service Workflow */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Service Job Workflow</h3>
          <button
            onClick={testServiceWorkflow}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Service Workflow'}
          </button>
        </div>

        {serviceWorkflow && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {serviceWorkflow.stages.map((stage: any, idx: number) => (
                <div key={idx} className="flex items-center">
                  <div
                    className={`px-4 py-2 rounded-md border ${
                      stage.status === 'completed'
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : stage.status === 'in_progress'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{stage.name}</div>
                    <div className="text-xs">{stage.description}</div>
                  </div>
                  {idx < serviceWorkflow.stages.length - 1 && (
                    <div className="mx-2 text-gray-400">→</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={advanceServiceStage}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Advance to Next Stage
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="font-semibold text-blue-900">
                Current Stage: {serviceWorkflow.stages[serviceWorkflow.currentStage]?.name || 'Not started'}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-blue-800 font-medium">Available Actions:</p>
                {serviceWorkflow.stages[serviceWorkflow.currentStage]?.actions.map((action: string, idx: number) => (
                  <li key={idx} className="text-sm text-blue-700 ml-4">{action}</li>
                ))}
              </div>
            </div>
          </div>
        )}

        <ResultIndicator result={testResults['serviceWorkflow']} />
        <ResultIndicator result={testResults['advanceStage']} />
      </div>

      {/* New Construction Workflow */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">New Construction Payment Stages</h3>
          <button
            onClick={testConstructionWorkflow}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Calculating...' : 'Calculate Payment Stages'}
          </button>
        </div>

        {constructionWorkflow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {constructionWorkflow.stages.map((stage: any, idx: number) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    stage.status === 'completed'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                    <span className="text-lg font-bold text-blue-600">{stage.percentage}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">${stage.amount.toFixed(2)}</p>
                    {stage.status !== 'completed' && (
                      <button
                        onClick={() => markPaymentStage(idx)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                    {stage.status === 'completed' && (
                      <span className="text-green-600 font-semibold">✓ Paid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Project Amount:</span>
                <span className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Collected:</span>
                <span className="text-lg font-semibold text-green-600">
                  $
                  {constructionWorkflow.stages
                    .filter((s: any) => s.status === 'completed')
                    .reduce((sum: number, s: any) => sum + s.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span className="text-lg font-semibold text-orange-600">
                  $
                  {(
                    totalAmount -
                    constructionWorkflow.stages
                      .filter((s: any) => s.status === 'completed')
                      .reduce((sum: number, s: any) => sum + s.amount, 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <ResultIndicator result={testResults['constructionWorkflow']} />
        <ResultIndicator result={testResults['paymentStage']} />
      </div>
    </div>
  );
}
