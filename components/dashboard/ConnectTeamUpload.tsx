'use client'

import { useState } from 'react'
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SyncResult {
  success: boolean
  submissions_processed: number
  jobs_matched: number
  jobs_created: number
  notes_added: number
  notes_updated: number
  errors: string[]
}

export default function ConnectTeamUpload() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx')) {
      toast.error('Please upload an Excel file (.xlsx)')
      return
    }
    setFile(selectedFile)
    setResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    toast.info('Uploading and processing...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/connecteam/import-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
      toast.success(
        `Success! ${data.notes_added} notes added, ${data.notes_updated} updated`
      )

      // Reload page after 2 seconds to show new data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Add Fresh ConnectTeam Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import ConnectTeam Data</DialogTitle>
          <DialogDescription>
            Upload the Excel file exported from ConnectTeam to sync job submissions
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-gray-600"
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setFile(null)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                    <p className="text-xs text-gray-500 mt-1">
                      Excel file (.xlsx) from ConnectTeam export
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 mb-2">How to export from ConnectTeam:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Go to your form submissions in ConnectTeam</li>
                <li>Click the export button (top right, share icon)</li>
                <li>Download the .xlsx file</li>
                <li>Upload it here</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Results Display
          <div className="space-y-4">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900 mb-2">
                      Import Successful!
                    </h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>✓ Processed {result.submissions_processed} submissions</p>
                      <p>✓ Matched {result.jobs_matched} existing jobs</p>
                      {result.jobs_created > 0 && (
                        <p>✓ Created {result.jobs_created} new jobs</p>
                      )}
                      <p>✓ Added {result.notes_added} new notes</p>
                      <p>✓ Updated {result.notes_updated} existing notes</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 mb-2">Import Failed</h3>
                    <div className="space-y-1 text-sm text-red-800">
                      {result.errors.map((error, i) => (
                        <p key={i}>• {error}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.success && (
              <p className="text-sm text-gray-600 text-center">
                Page will reload in 2 seconds to show updated data...
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
