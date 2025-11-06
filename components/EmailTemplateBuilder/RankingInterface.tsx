'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { allTemplates, EmailTemplate } from '@/lib/email-templates';
import { motion } from 'framer-motion';

interface RankedTemplate extends EmailTemplate {
  rank: number;
}

interface SortableTemplateProps {
  template: RankedTemplate;
  index: number;
}

function SortableTemplate({ template, index }: SortableTemplateProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate glow intensity based on rank (top 5 get glow)
  const getGlowStyle = (rank: number) => {
    if (rank <= 3) return 'ring-2 ring-primary shadow-lg shadow-primary/20';
    if (rank <= 5) return 'ring-1 ring-accent shadow-md shadow-accent/10';
    return '';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative cursor-move touch-none ${getGlowStyle(index + 1)}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-4 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md">
        {/* Rank Badge */}
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${
            index < 3
              ? 'bg-gradient-to-br from-primary to-accent'
              : index < 5
              ? 'bg-primary'
              : 'bg-gray-400'
          }`}
        >
          {index + 1}
        </div>

        {/* Template Preview Thumbnail */}
        <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
          <div
            className="h-full w-full scale-[0.15] origin-top-left"
            dangerouslySetInnerHTML={{ __html: template.html }}
          />
        </div>

        {/* Template Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-text-dark">{template.name}</h3>
          <p className="mt-1 text-sm text-text-light">{template.description}</p>
          <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {template.category}
          </span>
        </div>

        {/* Drag Handle Icon */}
        <div className="flex-shrink-0 text-gray-400 transition-colors group-hover:text-primary">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface RankingInterfaceProps {
  onRankingComplete: (rankedTemplates: RankedTemplate[]) => void;
}

export default function RankingInterface({ onRankingComplete }: RankingInterfaceProps) {
  const [templates, setTemplates] = useState<RankedTemplate[]>(
    allTemplates.map((template, index) => ({
      ...template,
      rank: index + 1,
    }))
  );

  const [analyzing, setAnalyzing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTemplates((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update ranks
        return newItems.map((item, index) => ({
          ...item,
          rank: index + 1,
        }));
      });
    }
  };

  const handleContinue = () => {
    setAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      onRankingComplete(templates);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-text-dark">
          Rank Your Favorite Templates
        </h2>
        <p className="text-lg text-text-light">
          Drag to reorder from most favorite (top) to least favorite (bottom).
          Our AI will learn your style preferences.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <motion.div
              className="h-10 w-10 rounded-full bg-primary"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
          <div>
            <p className="font-semibold text-primary">AI Learning Active</p>
            <p className="text-sm text-text-light">
              Analyzing your preferences in real-time...
            </p>
          </div>
        </div>
      </div>

      {/* Ranking List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={templates.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {templates.map((template, index) => (
              <SortableTemplate
                key={template.id}
                template={template}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Continue Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={analyzing}
          className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚙️
              </motion.span>
              Analyzing Your Preferences...
            </span>
          ) : (
            'Continue to Business Info'
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="mt-4 text-center text-sm text-text-light">
        💡 Tip: Your top 5 choices have the most influence on the AI
      </p>
    </div>
  );
}
