'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GeneratedTemplate {
  html: string;
  name: string;
  description: string;
}

interface TemplatePreviewProps {
  templates: GeneratedTemplate[];
  onBack: () => void;
}

type ViewMode = 'desktop' | 'mobile';

export default function TemplatePreview({ templates, onBack }: TemplatePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [editRequest, setEditRequest] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplates, setEditedTemplates] = useState<GeneratedTemplate[]>(templates);

  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const currentTemplate = editedTemplates[selectedTemplate];

  const handleEdit = async () => {
    if (!editRequest.trim()) {
      return;
    }

    setIsEditing(true);
    setSendStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/edit-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: currentTemplate.html,
          editRequest: editRequest.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to edit template');
      }

      const data = await response.json();

      // Update the current template with edited version
      const newTemplates = [...editedTemplates];
      newTemplates[selectedTemplate] = {
        ...currentTemplate,
        html: data.html,
      };
      setEditedTemplates(newTemplates);

      // Show success message
      setSendStatus({
        type: 'success',
        message: `Template updated! ${data.changes}`,
      });

      // Clear edit request
      setEditRequest('');
    } catch (error) {
      console.error('Error editing template:', error);
      setSendStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to edit template. Please try again.',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setSendStatus({
        type: 'error',
        message: 'Please enter an email address',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setSendStatus({
        type: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setIsSending(true);
    setSendStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: `Test Email - ${currentTemplate.name}`,
          html: currentTemplate.html,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSendStatus({
        type: 'success',
        message: `Test email sent successfully to ${testEmail}! Check your inbox.`,
      });

      // Clear email input after successful send
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      setSendStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send test email. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const exampleEdits = [
    'Make the header blue',
    'Increase font size',
    'Change button color to green',
    'Add more padding',
    'Make text center-aligned',
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-text-dark">
          Your Personalized Templates
        </h2>
        <p className="text-lg text-text-light">
          Select a template, customize it with natural language, and send a test email
        </p>
      </div>

      {/* Template Selector */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {editedTemplates.map((template, index) => (
          <motion.button
            key={index}
            onClick={() => setSelectedTemplate(index)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              selectedTemplate === index
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-text-dark">{template.name}</h3>
              {selectedTemplate === index && (
                <div className="h-4 w-4 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-text-light">{template.description}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-text-dark">Preview Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          {/* Natural Language Editor */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-text-dark">
              Edit with Natural Language
            </h3>

            <div className="mb-3">
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Tell us what to change:
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
                placeholder="e.g., Make the header blue, larger text, change button color to green..."
                value={editRequest}
                onChange={(e) => setEditRequest(e.target.value)}
                disabled={isEditing}
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={!editRequest.trim() || isEditing}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙
                  </motion.span>
                  Applying Changes...
                </span>
              ) : (
                'Apply Changes'
              )}
            </button>

            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-text-light">
                Quick examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleEdits.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setEditRequest(example)}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-text-dark transition-colors hover:bg-gray-200"
                    disabled={isEditing}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Send Test Email */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-text-dark">
              Send Test Email
            </h3>

            <div className="mb-3">
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Email address:
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendTestEmail();
                  }
                }}
              />
            </div>

            <button
              onClick={handleSendTestEmail}
              disabled={!testEmail.trim() || isSending}
              className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all hover:bg-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙
                  </motion.span>
                  Sending...
                </span>
              ) : (
                'Send Test Email'
              )}
            </button>
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {sendStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-lg border-2 p-4 ${
                  sendStatus.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <p className="text-sm font-medium">{sendStatus.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Template Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-text-dark">
                {currentTemplate.name}
              </h3>
              <span className="text-sm text-text-light">
                {viewMode === 'desktop' ? '600px width' : '375px width'}
              </span>
            </div>

            {/* Preview Container */}
            <div className="flex justify-center">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl"
                style={{
                  width: viewMode === 'desktop' ? '600px' : '375px',
                  maxWidth: '100%',
                }}
              >
                <div
                  className="overflow-auto"
                  style={{ maxHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: currentTemplate.html }}
                />
              </motion.div>
            </div>

            {/* Template Info */}
            <div className="mt-4 rounded-lg bg-white p-4">
              <p className="text-sm text-text-light">
                {currentTemplate.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="rounded-full border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-text-dark transition-all hover:border-primary hover:shadow-md"
        >
          Back to Business Info
        </button>
      </div>
    </div>
  );
}
