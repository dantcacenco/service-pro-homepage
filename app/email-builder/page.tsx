'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RankingInterface from '@/components/EmailTemplateBuilder/RankingInterface';
import BusinessInfoForm, { BusinessInfo } from '@/components/EmailTemplateBuilder/BusinessInfoForm';
import TemplatePreview, { GeneratedTemplate } from '@/components/EmailTemplateBuilder/TemplatePreview';
import { EmailTemplate } from '@/lib/email-templates';

interface RankedTemplate extends EmailTemplate {
  rank: number;
}

type Step = 'ranking' | 'business-info' | 'preview';

export default function EmailBuilderPage() {
  const [currentStep, setCurrentStep] = useState<Step>('ranking');
  const [rankedTemplates, setRankedTemplates] = useState<RankedTemplate[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedTemplate[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Progress indicator
  const steps = [
    { id: 'ranking', label: 'Rank Templates', icon: '⭐' },
    { id: 'business-info', label: 'Business Info', icon: '📋' },
    { id: 'preview', label: 'Preview & Edit', icon: '✨' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Handle ranking completion
  const handleRankingComplete = (templates: RankedTemplate[]) => {
    setRankedTemplates(templates);
    setCurrentStep('business-info');
  };

  // Handle business info submission
  const handleBusinessInfoSubmit = async (info: BusinessInfo) => {
    setBusinessInfo(info);
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Call API to generate templates
      const response = await fetch('/api/generate-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rankedTemplates,
          businessInfo: info,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to generate templates');
      }

      const data = await response.json();

      if (!data.templates || data.templates.length === 0) {
        throw new Error('No templates were generated. Please try again.');
      }

      setGenerationProgress(100);
      setGeneratedTemplates(data.templates);

      // Small delay to show 100% completion
      setTimeout(() => {
        setCurrentStep('preview');
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('Error generating templates:', error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Failed to generate templates. Please try again.'
      );
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Handle going back from preview
  const handleBackFromPreview = () => {
    setCurrentStep('business-info');
  };

  // Handle going back from business info
  const handleBackFromBusinessInfo = () => {
    setCurrentStep('ranking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-text-dark md:text-5xl">
            Email Template Builder
          </h1>
          <p className="text-lg text-text-light">
            Create personalized email templates with AI in 3 easy steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mx-auto mb-12 max-w-4xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold transition-all ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                    animate={index === currentStepIndex ? {
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {index < currentStepIndex ? '✓' : step.icon}
                  </motion.div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-text-dark' : 'text-text-light'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-1 flex-1 rounded transition-all ${
                      index < currentStepIndex
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
              >
                <div className="text-center">
                  <motion.div
                    className="mb-6 text-6xl"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      rotate: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      },
                      scale: {
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  >
                    ✨
                  </motion.div>

                  <h3 className="mb-2 text-2xl font-bold text-text-dark">
                    Generating Your Templates
                  </h3>
                  <p className="mb-6 text-text-light">
                    Our AI is analyzing your preferences and creating personalized templates...
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4 h-3 overflow-hidden rounded-full bg-gray-200">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: '0%' }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className="text-sm font-medium text-text-dark">
                    {generationProgress}% complete
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto mb-8 max-w-2xl rounded-lg border-2 border-red-200 bg-red-50 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-red-900">
                    Generation Error
                  </h3>
                  <p className="mb-4 text-red-800">{generationError}</p>
                  <button
                    onClick={() => {
                      setGenerationError(null);
                      setCurrentStep('business-info');
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'ranking' && (
              <RankingInterface onRankingComplete={handleRankingComplete} />
            )}

            {currentStep === 'business-info' && (
              <div>
                <BusinessInfoForm onSubmit={handleBusinessInfoSubmit} />

                {/* Back Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleBackFromBusinessInfo}
                    className="rounded-full border-2 border-gray-300 bg-white px-6 py-2 font-semibold text-text-dark transition-all hover:border-primary hover:shadow-md"
                  >
                    ← Back to Ranking
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'preview' && generatedTemplates.length > 0 && (
              <TemplatePreview
                templates={generatedTemplates}
                onBack={handleBackFromPreview}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tips Section (shown on ranking and business info steps) */}
        {currentStep !== 'preview' && (
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8">
              <h3 className="mb-4 text-xl font-bold text-text-dark">
                💡 How It Works
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white/80 p-4">
                  <div className="mb-2 text-2xl">⭐</div>
                  <h4 className="mb-2 font-semibold text-text-dark">
                    1. Rank Templates
                  </h4>
                  <p className="text-sm text-text-light">
                    Drag and drop to arrange templates from your favorite to least favorite.
                    Our AI learns your design preferences from your top choices.
                  </p>
                </div>

                <div className="rounded-lg bg-white/80 p-4">
                  <div className="mb-2 text-2xl">📋</div>
                  <h4 className="mb-2 font-semibold text-text-dark">
                    2. Business Details
                  </h4>
                  <p className="text-sm text-text-light">
                    Tell us about your business while AI analyzes your preferences.
                    We'll customize templates for your industry and services.
                  </p>
                </div>

                <div className="rounded-lg bg-white/80 p-4">
                  <div className="mb-2 text-2xl">✨</div>
                  <h4 className="mb-2 font-semibold text-text-dark">
                    3. Edit & Send
                  </h4>
                  <p className="text-sm text-text-light">
                    Preview your custom templates, make edits using natural language,
                    and send test emails to see them in action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
