'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from './button';

interface Photo {
  id: string;
  url: string;
  type: string;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus the container when lightbox opens for keyboard navigation
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && canGoPrev) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]); // Re-attach listener when index changes

  if (!isOpen) return null;

  const currentPhoto = photos[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  const goToPrevious = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `photo-${currentPhoto.type}-${currentPhoto.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <span className="text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="mx-2">•</span>
          <span className="text-sm capitalize">{currentPhoto.type} photo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Previous Button */}
      {canGoPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Image */}
      <div
        className="max-w-7xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.url}
          alt={`${currentPhoto.type} photo`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>

      {/* Next Button */}
      {canGoNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
}
