'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Industry {
  id: string;
  name: string;
  colorAccent: string;
}

interface EmailTemplatesMiniDemoProps {
  activeIndustry: Industry;
}

// Email content by industry
const emailContent: Record<string, { plainText: string; subject: string; companyName: string }> = {
  hvac: {
    subject: 'Service Appointment Confirmation',
    companyName: 'Cool Air HVAC',
    plainText: `Hi Sarah,

This is to confirm your AC maintenance appointment tomorrow, June 15th at 2:00 PM.

Our technician will arrive at your location: 123 Main St, Asheville, NC.

Service includes: Annual AC maintenance, filter replacement, system inspection.

Total estimated time: 1-2 hours
Cost: $185

If you need to reschedule, please call us at (828) 555-0123.

Thanks,
Cool Air HVAC Team`,
  },
  electrical: {
    subject: 'Panel Upgrade Estimate',
    companyName: 'Bright Electric',
    plainText: `Hi Mike,

Thank you for reaching out. Here is your estimate for the 200A panel upgrade.

Work includes: Remove old 100A panel, install new 200A panel, rewire all circuits, inspection.

Total cost: $3,200
Timeline: 1 day

This price includes all materials, labor, and permit fees.

Estimate valid for 30 days.

Please let me know if you have any questions.

Best,
Bright Electric`,
  },
  plumbing: {
    subject: 'Water Heater Installation Quote',
    companyName: 'Fast Flow Plumbing',
    plainText: `Hi Robert,

Here is your quote for water heater replacement.

Remove old 40-gal unit, install new 50-gal gas water heater.

Price: $1,850 (includes unit, installation, disposal of old unit)

We can schedule as soon as tomorrow.

Warranty: 6 years on tank, 1 year on labor

Call to schedule: (828) 555-0199

Thanks,
Fast Flow Plumbing`,
  },
  contractor: {
    subject: 'Kitchen Remodel Estimate',
    companyName: 'Premier Builders',
    plainText: `Hi David,

Attached is the detailed estimate for your kitchen remodel project.

Scope: Full kitchen renovation including cabinets, countertops, flooring, electrical, plumbing.

Total investment: $45,000
Timeline: 6-8 weeks

Includes: All materials, labor, permits, cleanup

Payment schedule: 30% deposit, 40% at midpoint, 30% on completion

Valid for 45 days.

Let's schedule a meeting to discuss details.

Premier Builders Team`,
  },
};

export default function EmailTemplatesMiniDemo({ activeIndustry }: EmailTemplatesMiniDemoProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const content = emailContent[activeIndustry.id];

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h4 className="mb-1 text-sm font-bold text-text-dark">Plain Text vs. Professional Email</h4>
        <p className="text-xs text-text-light">Drag the slider to compare</p>
      </div>

      {/* Before/After Slider */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] cursor-ew-resize overflow-hidden rounded-lg shadow-xl"
        onMouseMove={handleMouseMove}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >
        {/* AFTER - Professional Email (Background) */}
        <div className="absolute inset-0 bg-white p-4 text-xs">
          {/* Email Header with Logo */}
          <div
            className="mb-3 rounded-lg p-3"
            style={{
              background: `linear-gradient(135deg, ${activeIndustry.colorAccent}15, ${activeIndustry.colorAccent}05)`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white"
                style={{ backgroundColor: activeIndustry.colorAccent }}
              >
                {content.companyName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-text-dark" style={{ fontSize: '10px' }}>
                  {content.companyName}
                </p>
                <p className="text-text-light" style={{ fontSize: '8px' }}>
                  Professional Service
                </p>
              </div>
            </div>
            <p className="font-semibold text-text-dark" style={{ fontSize: '10px' }}>
              {content.subject}
            </p>
          </div>

          {/* Email Body - Formatted */}
          <div className="space-y-2">
            {content.plainText.split('\n\n').map((paragraph, idx) => {
              if (paragraph.trim()) {
                // Check if it's a greeting or closing
                const isGreeting = paragraph.startsWith('Hi ') || paragraph.startsWith('Hello ');
                const isClosing = paragraph.startsWith('Thanks') || paragraph.startsWith('Best');

                return (
                  <p
                    key={idx}
                    className={`leading-relaxed ${isGreeting || isClosing ? 'font-medium' : ''}`}
                    style={{ fontSize: '8px', color: '#4B5563' }}
                  >
                    {paragraph}
                  </p>
                );
              }
              return null;
            })}
          </div>

          {/* Professional Signature */}
          <div
            className="mt-3 border-t pt-2"
            style={{ borderColor: `${activeIndustry.colorAccent}30`, fontSize: '7px' }}
          >
            <p className="font-semibold" style={{ color: activeIndustry.colorAccent }}>
              {content.companyName}
            </p>
            <p className="text-text-light">📞 (828) 555-0100 | 📧 info@company.com</p>
            <p className="text-text-light">🌐 www.company.com</p>
          </div>
        </div>

        {/* BEFORE - Plain Text Email (Foreground with clip) */}
        <div
          className="absolute inset-0 bg-gray-50 p-4"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <pre
            className="whitespace-pre-wrap font-mono leading-relaxed text-gray-700"
            style={{ fontSize: '8px' }}
          >
            Subject: {content.subject}
            {'\n\n'}
            {content.plainText}
          </pre>
        </div>

        {/* Slider Line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-1 bg-white shadow-xl"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="pointer-events-none absolute top-2 left-2 rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white" style={{ fontSize: '9px' }}>
            BEFORE: Plain Text
          </p>
        </div>
        <div className="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white" style={{ fontSize: '9px' }}>
            AFTER: Professional
          </p>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 p-2">
        <div className="text-center">
          <div className="text-lg">🎨</div>
          <p className="text-xs font-medium text-text-dark">Branded</p>
        </div>
        <div className="text-center">
          <div className="text-lg">📈</div>
          <p className="text-xs font-medium text-text-dark">2x Response</p>
        </div>
        <div className="text-center">
          <div className="text-lg">⭐</div>
          <p className="text-xs font-medium text-text-dark">Credible</p>
        </div>
      </div>

      {/* Try It Live Link */}
      <Link
        href="/email-builder"
        className="block rounded-lg bg-gradient-to-r from-primary to-accent py-2 text-center text-sm font-semibold text-white transition-all hover:scale-105"
      >
        Try Full Builder →
      </Link>
    </div>
  );
}
