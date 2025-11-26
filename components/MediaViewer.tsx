'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Image, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface MediaViewerProps {
  items: Array<{
    id: string
    url: string
    name?: string
    caption?: string
    type: 'photo' | 'video' | 'file'
    mime_type?: string
  }>
  initialIndex: number
  onClose: () => void
  onDelete?: (itemId: string, itemType: 'photo' | 'video' | 'file') => void
  allowDelete?: boolean
}

export default function MediaViewer({ items, initialIndex, onClose, onDelete, allowDelete = true }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const currentItem = items[currentIndex]
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
    setImageError(false)
  }

  const goToNext = () => {
    setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
    setImageError(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentItem.url
    link.download = currentItem.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInNewTab = () => {
    window.open(currentItem.url, '_blank')
  }

  const handleDelete = async () => {
    if (!currentItem || !onDelete) return
    
    if (!confirm('Archive this file? It will be hidden but can be restored within 30 days.')) {
      return
    }
    
    setIsDeleting(true)
    try {
      // Call the parent's delete handler
      await onDelete(currentItem.id, currentItem.type)
      
      // If this was the last item, close the viewer
      if (items.length === 1) {
        onClose()
      } else {
        // Move to next item (or previous if we're at the end)
        if (currentIndex === items.length - 1) {
          setCurrentIndex(prev => prev - 1)
        }
      }
      
      toast.success('File archived (can be restored within 30 days)')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderContent = () => {
    const { mime_type, url, name, type } = currentItem

    console.log('MediaViewer rendering:', { type, mime_type, name, url })

    // If no URL, show error
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <FileText className="w-16 h-16 mb-4 opacity-70" />
          <h3 className="text-xl mb-2">No file URL available</h3>
          <p className="text-gray-300">This file cannot be displayed</p>
        </div>
      )
    }

    // Handle images
    if (type === 'photo' || mime_type?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full max-h-[90vh]">
          {imageError ? (
            <div className="flex flex-col items-center text-white">
              <Image className="w-16 h-16 mb-4 opacity-50" />
              <p>Failed to load image</p>
              <p className="text-sm text-gray-400 mt-2">{url}</p>
              <button 
                onClick={openInNewTab}
                className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Open in New Tab
              </button>
            </div>
          ) : (
            <img
              src={url}
              alt={name || 'Media'}
              className="max-w-full max-h-full object-contain rounded"
              onError={(e) => {
                console.error('Image load error:', e)
                console.error('Failed URL:', url)
                setImageError(true)
              }}
            />
          )}
        </div>
      )
    }

    // Handle videos
    if (type === 'video' || mime_type?.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full max-h-[90vh]">
          <video 
            controls 
            className="max-w-full max-h-full rounded"
            poster=""
            preload="metadata"
          >
            <source src={url} type={mime_type || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Handle PDFs - Show inline instead of download buttons
    if (mime_type?.includes('pdf')) {
      console.log('Attempting to display PDF:', url)
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 min-h-0">
            {/* Try embed first as it's more compatible */}
            <embed
              src={url}
              type="application/pdf"
              className="w-full h-full"
              title={name || 'PDF Document'}
            />
            {/* Fallback download link */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded p-2">
              <button 
                onClick={openInNewTab}
                className="text-white text-sm hover:underline"
              >
                Can't see the PDF? Open in new tab
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Handle other file types
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <FileText className="w-16 h-16 mb-4 opacity-70" />
        <h3 className="text-xl mb-2">{name}</h3>
        <p className="text-gray-300 mb-6">{mime_type || 'File'}</p>
        <div className="flex gap-4">
          <button 
            onClick={handleDownload}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>
          <button 
            onClick={openInNewTab}
            className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Always show close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
        title="Close (ESC)"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Top bar with controls */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">
            {currentItem.name || 'File'} ({currentIndex + 1} of {items.length})
          </span>
          {/* Always show download, open, and delete buttons */}
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white flex items-center gap-2"
              title="Download"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button 
              onClick={openInNewTab}
              className="p-2 bg-gray-600 rounded-lg hover:bg-gray-700 text-white flex items-center gap-2"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
            {allowDelete && onDelete && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 bg-orange-600 rounded-lg hover:bg-orange-700 text-white flex items-center gap-2 disabled:opacity-50"
                title="Archive"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isDeleting ? 'Archiving...' : 'Archive'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="text-white text-center flex-1">
          <p className="font-medium">{currentItem.name}</p>
          {items.length > 1 && (
            <p className="text-gray-300 text-sm">
              {currentIndex + 1} of {items.length}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white hover:text-gray-300 rounded-lg hover:bg-white hover:bg-opacity-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 min-h-0 p-4">
        {renderContent()}
      </div>
    </div>
  )
}