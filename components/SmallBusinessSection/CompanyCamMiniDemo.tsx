'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Industry {
  id: string;
  name: string;
  icon: string;
  colorAccent: string;
}

interface CompanyCamMiniDemoProps {
  activeIndustry: Industry;
}

// Timeline data for each industry showing progress over time
const timelineData: Record<
  string,
  {
    projectName: string;
    location: string;
    photos: { date: string; stage: string; description: string }[];
  }
> = {
  hvac: {
    projectName: 'AC Unit Replacement',
    location: 'Asheville, NC',
    photos: [
      { date: 'Jun 12, 8:00am', stage: 'Initial Assessment', description: 'Old unit documented' },
      { date: 'Jun 12, 9:30am', stage: 'Disconnect & Prep', description: 'Refrigerant recovered' },
      { date: 'Jun 12, 11:00am', stage: 'Installation', description: 'New unit positioned' },
      { date: 'Jun 12, 2:00pm', stage: 'Connections', description: 'Lines connected, tested' },
      { date: 'Jun 12, 4:00pm', stage: 'Final Testing', description: 'System running, verified' },
    ],
  },
  electrical: {
    projectName: 'Panel Upgrade - 200A',
    location: 'Charlotte, NC',
    photos: [
      { date: 'Jun 15, 8:30am', stage: 'Inspection', description: 'Old 100A panel assessed' },
      { date: 'Jun 15, 9:00am', stage: 'Power Disconnect', description: 'Utility disconnect completed' },
      { date: 'Jun 15, 10:30am', stage: 'Old Panel Removal', description: 'Wiring documented' },
      { date: 'Jun 15, 12:00pm', stage: 'New Panel Install', description: '200A panel mounted' },
      { date: 'Jun 15, 3:00pm', stage: 'Wiring & Testing', description: 'All circuits verified' },
    ],
  },
  plumbing: {
    projectName: 'Water Heater Replacement',
    location: 'Raleigh, NC',
    photos: [
      { date: 'Jun 18, 9:00am', stage: 'Old Unit', description: '40-gal gas heater' },
      { date: 'Jun 18, 9:45am', stage: 'Drain & Remove', description: 'Water drained safely' },
      { date: 'Jun 18, 11:00am', stage: 'New Unit Prep', description: '50-gal positioned' },
      { date: 'Jun 18, 1:00pm', stage: 'Connections', description: 'Gas & water lines connected' },
      { date: 'Jun 18, 2:30pm', stage: 'Testing Complete', description: 'Hot water flowing' },
    ],
  },
  contractor: {
    projectName: 'Kitchen Waterproofing',
    location: 'Durham, NC',
    photos: [
      { date: 'Jun 20, 8:00am', stage: 'Surface Prep', description: 'Window frame cleaned' },
      { date: 'Jun 20, 9:00am', stage: 'Flashing Tape', description: 'Sill pan tape applied' },
      { date: 'Jun 20, 10:00am', stage: 'Side Flashing', description: 'Jamb protection installed' },
      { date: 'Jun 20, 11:30am', stage: 'Head Flashing', description: 'Top protection complete' },
      { date: 'Jun 20, 1:00pm', stage: 'Final Seal', description: 'Caulking verified, tested' },
    ],
  },
};

export default function CompanyCamMiniDemo({ activeIndustry }: CompanyCamMiniDemoProps) {
  const project = timelineData[activeIndustry.id];
  const [activePhotoIndex, setActivePhotoIndex] = useState(2); // Start at middle photo

  const activePhoto = project.photos[activePhotoIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h4 className="mb-1 text-lg font-bold text-text-dark">{project.projectName}</h4>
        <p className="text-sm text-text-light">📍 {project.location}</p>
      </div>

      {/* Photo Display Area with Overlay Indicator */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg">
        {/* Transparent Overlay Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-none absolute inset-4 rounded border-2 border-dashed border-blue-400/50" />
          <div className="text-center">
            <motion.div
              key={activePhotoIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <span className="text-5xl">{activeIndustry.icon}</span>
            </motion.div>
            <motion.div
              key={`text-${activePhotoIndex}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <p className="text-sm font-semibold text-gray-600">{activePhoto.stage}</p>
              <p className="text-xs text-gray-500">{activePhoto.description}</p>
            </motion.div>
          </div>
        </div>

        {/* Photo Date Stamp */}
        <div className="absolute top-3 left-3 rounded-lg bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {activePhoto.date}
        </div>

        {/* Alignment Overlay Indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-blue-500/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Aligned</span>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="space-y-3">
        <p className="text-center text-xs font-semibold text-text-light">
          Photo {activePhotoIndex + 1} of {project.photos.length}
        </p>

        {/* Timeline Track */}
        <div className="relative px-4">
          {/* Background Track */}
          <div className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-300" />

          {/* Active Progress */}
          <div
            className="absolute left-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `calc(${(activePhotoIndex / (project.photos.length - 1)) * 100}% - 1rem)` }}
          />

          {/* Photo Markers */}
          <div className="relative flex justify-between">
            {project.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setActivePhotoIndex(index)}
                className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  index === activePhotoIndex
                    ? 'scale-125 bg-primary shadow-lg'
                    : 'bg-white hover:scale-110 hover:bg-primary/20'
                } border-2 ${index === activePhotoIndex ? 'border-primary' : 'border-gray-300'}`}
              >
                <span
                  className={`text-xs font-bold ${index === activePhotoIndex ? 'text-white' : 'text-gray-600'}`}
                >
                  {index + 1}
                </span>

                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {photo.stage}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Feature Callout */}
      <div className="rounded-lg bg-blue-50 p-3 text-center">
        <p className="text-xs font-semibold text-blue-900">
          ✨ Transparent overlay ensures perfect alignment across all {project.photos.length} photos
        </p>
        <p className="mt-1 text-xs text-blue-700">
          No more digging through 100+ disorganized photos per project
        </p>
      </div>
    </div>
  );
}
