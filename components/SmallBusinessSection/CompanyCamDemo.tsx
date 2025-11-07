'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Industry {
  id: string;
  name: string;
  icon: string;
  colorAccent: string;
  gradientFrom: string;
  gradientTo: string;
}

interface CompanyCamDemoProps {
  activeIndustry: Industry;
}

// Sample project data for each industry
const projectData: Record<string, { before: string; after: string; projectName: string; location: string }> = {
  hvac: {
    before: '/images/demos/hvac-before.jpg',
    after: '/images/demos/hvac-after.jpg',
    projectName: 'AC Unit Replacement',
    location: 'Asheville, NC',
  },
  electrical: {
    before: '/images/demos/electrical-before.jpg',
    after: '/images/demos/electrical-after.jpg',
    projectName: 'Panel Upgrade - 200A Service',
    location: 'Charlotte, NC',
  },
  plumbing: {
    before: '/images/demos/plumbing-before.jpg',
    after: '/images/demos/plumbing-after.jpg',
    projectName: 'Water Heater Installation',
    location: 'Raleigh, NC',
  },
  contractor: {
    before: '/images/demos/contractor-before.jpg',
    after: '/images/demos/contractor-after.jpg',
    projectName: 'Kitchen Remodel',
    location: 'Durham, NC',
  },
};

export default function CompanyCamDemo({ activeIndustry }: CompanyCamDemoProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const project = projectData[activeIndustry.id];

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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-white p-8 shadow-xl"
    >
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-3xl font-bold text-text-dark">
          CompanyCam+: See the Difference
        </h3>
        <p className="text-text-light">
          Drag the slider to compare before and after. Every photo timestamped and GPS-tagged.
        </p>
      </div>

      {/* Before/After Slider */}
      <div
        ref={containerRef}
        className="relative mx-auto aspect-[4/3] max-w-4xl cursor-ew-resize overflow-hidden rounded-xl shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
          {/* Placeholder - Replace with actual images */}
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="mb-2 block text-6xl">{activeIndustry.icon}</span>
              <p className="text-xl font-semibold text-gray-600">After</p>
              <p className="text-sm text-gray-500">{project.projectName}</p>
            </div>
          </div>
        </div>

        {/* Before Image (Foreground with clip) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          {/* Placeholder - Replace with actual images */}
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="mb-2 block text-6xl opacity-50">{activeIndustry.icon}</span>
              <p className="text-xl font-semibold text-gray-200">Before</p>
              <p className="text-sm text-gray-300">{project.projectName}</p>
            </div>
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
        <div className="pointer-events-none absolute top-4 left-4 rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">BEFORE</p>
        </div>
        <div className="pointer-events-none absolute top-4 right-4 rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">AFTER</p>
        </div>
      </div>

      {/* Project Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-center justify-between rounded-xl bg-secondary p-6"
      >
        <div>
          <h4 className="mb-1 text-lg font-bold text-text-dark">{project.projectName}</h4>
          <p className="text-sm text-text-light">📍 {project.location}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-light">Captured</p>
          <p className="text-sm font-semibold text-text-dark">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs text-text-light">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>

      {/* Share Button (Visual Only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-primary-dark"
          onClick={() => alert('In a real implementation, this would share the progress with your customer!')}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share with Customer
        </button>
      </motion.div>
    </motion.div>
  );
}
