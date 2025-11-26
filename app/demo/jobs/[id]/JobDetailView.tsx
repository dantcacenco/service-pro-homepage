'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Edit, Calendar, Clock, MapPin, User,
  FileText, Camera, Upload, Plus, X, Save, Trash2,
  DollarSign, Link as LinkIcon, FileCheck, CheckCircle, Download
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getUnifiedDisplayStatus, syncJobProposalStatus, STATUS_COLORS } from '@/lib/status-sync'
import MediaUpload from '@/components/uploads/MediaUpload'
import FileUpload from '@/components/uploads/FileUpload'
import MediaViewer from '@/components/MediaViewer'
import VideoThumbnail from '@/components/VideoThumbnail'
import { EditJobModal } from './EditJobModal'
import ConnecteamSubmissions from './ConnecteamSubmissions'
import StageProgressSection from '@/components/jobs/StageProgressSection'
import CreateInvoiceModal from './CreateInvoiceModal'
import ManualCustomerMatch from './ManualCustomerMatch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface JobDetailViewProps {
  job: any
  userId?: string
  userRole?: string // Added this prop to fix TypeScript error
}

export default function JobDetailView({ job, userId, userRole: initialUserRole }: JobDetailViewProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State - Added setJob to fix TypeScript error
  const [currentJob, setJob] = useState(job)
  const [jobPhotos, setJobPhotos] = useState<any[]>([])
  const [jobFiles, setJobFiles] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState(userId || '')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItems, setViewerItems] = useState<any[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [proposal, setProposal] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [assignedTechnicians, setAssignedTechnicians] = useState<any[]>([])
  const [technicianHours, setTechnicianHours] = useState<Record<string, number>>({})
  const [userRole, setUserRole] = useState(initialUserRole || 'technician')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState(currentJob.notes || '')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [photosExpanded, setPhotosExpanded] = useState(false)
  const [filesExpanded, setFilesExpanded] = useState(false)
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false)
  const [invoiceStage, setInvoiceStage] = useState<'roughin' | 'final'>('roughin')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    console.log('=== JOB DETAIL VIEW DEBUG START ===')
    console.log('Job ID:', currentJob.id)
    console.log('Job Number:', currentJob.job_number)
    console.log('User ID:', currentUserId)
    console.log('User Role:', userRole)
    
    loadTechnicians()
    loadAssignedTechnicians()
    loadJobMedia()
    loadJobFiles()
    loadProposal()
    if (!userId) {
      getCurrentUser()
    }
  }, [currentJob.id])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setUserRole(profile?.role || 'technician')
    }
  }

  const loadJobData = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (name)
      `)
      .eq('id', currentJob.id)
      .single()

    if (data) {
      setJob(data)
    }
  }

  const loadProposal = async () => {
    if (currentJob.proposal_id) {
      const { data } = await supabase
        .from('proposals')
        .select(`
          *,
          customers!inner (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('id', currentJob.proposal_id)
        .single()

      if (data) {
        setProposal(data)

        // Also fetch the invoice for this proposal
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('proposal_id', currentJob.proposal_id)
          .single()

        if (invoiceData) {
          setInvoice(invoiceData)
        }
      }
    }
  }

  const loadTechnicians = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'technician')
      .eq('is_active', true)

    setTechnicians(data || [])
  }

  const loadAssignedTechnicians = async () => {
    console.log('=== TECHNICIAN DEBUG START ===', { jobId: currentJob.id, jobNumber: currentJob.job_number })
    
    const { data } = await supabase
      .from('job_technicians')
      .select(`
        *,
        profiles!technician_id (
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('job_id', currentJob.id)

    console.log('Technician query result:', { data, count: data?.length || 0 })
    const processedData = data?.map((item: any) => item.profiles) || []
    console.log('Processed technician data:', processedData)
    setAssignedTechnicians(processedData)
    
    // Load technician hours after loading technicians
    if (processedData.length > 0) {
      loadTechnicianHours(processedData.map((t: any) => t.id))
    }
  }

  const loadTechnicianHours = async (technicianIds: string[]) => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('job_id', currentJob.id)
      .in('technician_id', technicianIds)
    
    if (error) {
      console.error('Error loading technician hours:', error)
      return
    }
    
    // Calculate total hours per technician
    const hoursMap: Record<string, number> = {}
    
    if (data) {
      data.forEach((entry: any) => {
        if (entry.end_time) {
          const start = new Date(entry.start_time).getTime()
          const end = new Date(entry.end_time).getTime()
          const hours = (end - start) / (1000 * 60 * 60)
          
          hoursMap[entry.technician_id] = (hoursMap[entry.technician_id] || 0) + hours
        }
      })
    }
    
    setTechnicianHours(hoursMap)
  }

  const loadJobMedia = async () => {
    const { data } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', currentJob.id)
      .is('archived_at', null)  // Only get non-archived photos
      .order('created_at', { ascending: true })

    setJobPhotos(data || [])
  }

  const loadJobFiles = async () => {
    console.log('=== LOADING JOB FILES DEBUG ===')
    console.log('Job ID for files:', currentJob.id)
    
    const { data, error } = await supabase
      .from('job_files')
      .select('*')
      .eq('job_id', currentJob.id)
      .is('archived_at', null)  // Only get non-archived files
      .order('created_at', { ascending: false })

    console.log('Job files query result:', { data, error, count: data?.length || 0 })
    
    if (data) {
      console.log('Individual files:')
      data.forEach((file, index) => {
        console.log(`File ${index}:`, {
          id: file.id,
          name: file.file_name,
          url: file.file_url,
          created: file.created_at
        })
      })
    }
    
    setJobFiles(data || [])
  }

  const handleSaveNotes = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ notes: notesText })
        .eq('id', currentJob.id)

      if (error) throw error

      setJob({ ...currentJob, notes: notesText })
      setIsEditingNotes(false)
      toast.success('Notes saved successfully')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', currentJob.id)

      if (jobError) throw jobError

      // Sync proposal status if proposal exists
      if (currentJob.proposal_id) {
        await syncJobProposalStatus(
          supabase,
          currentJob.id,
          currentJob.proposal_id,
          newStatus,
          'job'
        )
      }

      // Update local state
      setJob({ ...currentJob, status: newStatus })
      
      // Reload proposal to reflect changes
      if (currentJob.proposal_id) {
        loadProposal()
      }

      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleTechnicianToggle = async (techId: string) => {
    const isAssigned = assignedTechnicians.some(t => t.id === techId)
    
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('job_technicians')
          .delete()
          .eq('job_id', currentJob.id)
          .eq('technician_id', techId)

        if (error) throw error
        
        await loadAssignedTechnicians()
        toast.success('Technician removed')
      } else {
        const { data: existing } = await supabase
          .from('job_technicians')
          .select('id')
          .eq('job_id', currentJob.id)
          .eq('technician_id', techId)
          .single()
        
        if (!existing) {
          const { error } = await supabase
            .from('job_technicians')
            .insert({
              job_id: currentJob.id,
              technician_id: techId
            })

          if (error) throw error
          
          await loadAssignedTechnicians()
          toast.success('Technician assigned')
        } else {
          toast.info('Technician already assigned')
        }
      }
    } catch (error) {
      console.error('Error toggling technician:', error)
      toast.error('Failed to update technician assignment')
    }
  }

  const updateJobWorkStatus = async (statusField: 'work_started' | 'roughin_done' | 'final_done', technicianId?: string) => {
    try {
      const currentValue = currentJob[statusField] || false
      const newValue = !currentValue
      
      // Prepare update object
      const updateData: any = { [statusField]: newValue }
      
      // Add timestamp field if toggling on (only if no technician specified - for global status)
      if (newValue && !technicianId) {
        const timestampField = statusField + '_at'
        updateData[timestampField] = new Date().toISOString()
      }
      
      // Update job status
      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', currentJob.id)

      if (error) throw error

      // Update local state
      const updatedJob = { ...currentJob, ...updateData }
      setJob(updatedJob)
      
      // Show success message
      const statusLabels = {
        work_started: 'Work Started',
        roughin_done: 'Rough-In Done',
        final_done: 'Final Done'
      }
      
      const techName = technicianId ? 
        assignedTechnicians.find(t => t.id === technicianId)?.full_name || 'Technician' : 
        'Job'
      
      toast.success(`${techName}: ${statusLabels[statusField]} ${newValue ? 'marked complete' : 'unmarked'}`)
    } catch (error) {
      console.error('Error updating work status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeleteJob = async () => {
    setIsDeleting(true)

    try {
      await supabase
        .from('job_technicians')
        .delete()
        .eq('job_id', currentJob.id)

      await supabase
        .from('job_photos')
        .delete()
        .eq('job_id', currentJob.id)

      await supabase
        .from('job_files')
        .delete()
        .eq('job_id', currentJob.id)

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', currentJob.id)

      if (error) throw error

      toast.success('Job deleted successfully')
      router.push('/jobs')
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
      setIsDeleting(false)
    }
  }

  const openMediaViewer = (photos: any[], index: number) => {
    console.log('Opening media viewer for photos:', { count: photos.length, index })
    
    const items = photos.map(photo => ({
      id: photo.id,
      url: photo.photo_url,
      name: photo.caption || 'Media',
      caption: photo.caption,
      type: photo.mime_type?.startsWith('video/') ? 'video' : 'photo',
      mime_type: photo.mime_type
    }))
    
    setViewerItems(items)
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const openFileViewer = (files: any[], index: number) => {
    console.log('=== FILE VIEWER CLICKED ===')
    console.log('Files array:', files)
    console.log('Index clicked:', index)
    console.log('File being opened:', files[index])
    
    const items = files.map(file => ({
      id: file.id,
      url: file.file_url,
      name: file.file_name,
      caption: file.file_name,
      type: 'file',
      mime_type: file.mime_type || 'application/octet-stream'
    }))
    
    console.log('MediaViewer items:', items)
    setViewerItems(items)
    setViewerIndex(index)
    setViewerOpen(true)
    console.log('MediaViewer should now open')
  }

  const handleExportJob = async () => {
    setIsExporting(true)
    setShowExportModal(true)
    setExportProgress('Preparing export...')

    try {
      const response = await fetch(`/api/jobs/${currentJob.id}/export`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      setExportProgress('Downloading ZIP file...')

      // Get the blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentJob.job_number}_${currentJob.customers?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Job'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setExportProgress('Export complete!')
      toast.success('Job exported successfully')

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowExportModal(false)
        setIsExporting(false)
        setExportProgress('')
      }, 2000)
    } catch (error) {
      console.error('Export error:', error)
      setExportProgress('Export failed')
      toast.error('Failed to export job')
      setIsExporting(false)

      // Close modal after showing error
      setTimeout(() => {
        setShowExportModal(false)
        setExportProgress('')
      }, 3000)
    }
  }

  const handleDeleteMedia = async (itemId: string, itemType: 'photo' | 'video' | 'file') => {
    try {
      const fileType = itemType === 'file' ? 'file' : 'photo'
      
      // Call API to archive (soft delete) instead of hard delete
      const response = await fetch('/api/archive-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: itemId,
          fileType: fileType
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to archive file')
      }
      
      // Update local state to remove from view
      if (fileType === 'photo') {
        setJobPhotos(prev => prev.filter(p => p.id !== itemId))
        // Update viewer items if viewer is open
        setViewerItems(prev => prev.filter(item => item.id !== itemId))
      } else {
        setJobFiles(prev => prev.filter(f => f.id !== itemId))
        // Update viewer items if viewer is open
        setViewerItems(prev => prev.filter(item => item.id !== itemId))
      }
      
      toast.success('File archived (can be restored within 30 days)')
    } catch (error) {
      console.error('Error archiving file:', error)
      toast.error('Failed to archive file')
    }
  }

  const handleDeletePhoto = async (photoId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening the viewer
    
    if (!confirm('Archive this photo? It will be hidden but can be restored within 30 days.')) {
      return
    }
    
    await handleDeleteMedia(photoId, 'photo')
  }

  const handleDeleteFile = async (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening the viewer
    
    if (!confirm('Archive this file? It will be hidden but can be restored within 30 days.')) {
      return
    }
    
    await handleDeleteMedia(fileId, 'file')
  }

  const formatJobOverview = (description: string | null | undefined) => {
    if (!description) return 'No overview available'
    
    return description.split('\n').map((line, index) => {
      if (line.includes('SERVICES:') || line.includes('ADD-ONS:')) {
        return (
          <div key={index} className="font-semibold text-gray-900 mt-4 mb-2">
            {line}
          </div>
        )
      }
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={index} className="ml-4 text-gray-700">
            {line}
          </div>
        )
      }
      
      return (
        <div key={index} className="text-gray-700">
          {line}
        </div>
      )
    })
  }

  const getStatusBadge = (jobStatus: string, proposalStatus?: string) => {
    const displayStatus = getUnifiedDisplayStatus(jobStatus, proposalStatus || '')
    
    // Use STATUS_COLORS mapping from status-sync
    const colorClass = STATUS_COLORS[jobStatus] || 'bg-gray-100 text-gray-800'
    
    return (
      <Badge className={colorClass}>
        {displayStatus}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Job {currentJob.job_number}</h1>
            <p className="text-muted-foreground">{currentJob.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(currentJob.status, proposal?.status)}
          {userRole === 'boss' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJob}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export as ZIP'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stage Progress Section - Shows current stage, checklist, and history */}
      <div className="mb-6">
        <StageProgressSection
          jobId={currentJob.id}
          stage={currentJob.stage || 'beginning'}
          stageSteps={currentJob.stage_steps || {}}
          stageHistory={currentJob.stage_history || []}
          userRole={userRole}
          onStageChange={loadJobData}
        />
      </div>

      {/* SECTION 1: Job Details (First) */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Details</CardTitle>
          {userRole === 'boss' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Customer (from Bill.com) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Customer</h3>
                {userRole === 'boss' && (
                  <ManualCustomerMatch
                    jobId={currentJob.id}
                    currentCustomerId={currentJob.customer_id}
                    currentCustomerName={currentJob.customers?.name || 'No customer assigned'}
                    jobAddress={currentJob.service_address || ''}
                  />
                )}
              </div>
              <p className="text-muted-foreground">{currentJob.customers?.name || 'No customer assigned'}</p>
            </div>

            {/* Service Address (single text field) */}
            {currentJob.service_address && (
              <div>
                <h3 className="font-medium">Service Address</h3>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p>{currentJob.service_address}</p>
                </div>
              </div>
            )}

            {/* Proposals (list of links) */}
            {currentJob.proposal_links && Array.isArray(currentJob.proposal_links) && currentJob.proposal_links.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Proposals</h3>
                <div className="space-y-2">
                  {currentJob.proposal_links.map((link: string, index: number) => (
                    <a 
                      key={index}
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Proposal {index + 1}
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices (list of links with stage/quantity metadata) */}
            <div>
              <h3 className="font-medium mb-2">Invoices</h3>

              {/* Existing invoices */}
              {currentJob.invoice_links && Array.isArray(currentJob.invoice_links) && currentJob.invoice_links.length > 0 && (
                <div className="space-y-2 mb-3">
                  {currentJob.invoice_links.map((invoice: any, index: number) => (
                    <a
                      key={index}
                      href={invoice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {invoice.stage ? `${invoice.stage} (${(invoice.quantity * 100).toFixed(0)}%)` : `Invoice ${index + 1}`}
                      </Button>
                    </a>
                  ))}
                </div>
              )}

              {/* Create Invoice buttons (only for boss/admin) */}
              {(userRole === 'boss' || userRole === 'admin') && currentJob.proposal_id && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setInvoiceStage('roughin')
                      setShowCreateInvoiceModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rough-in Invoice (30% / 80%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setInvoiceStage('final')
                      setShowCreateInvoiceModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Final Invoice (20% / 20% / 100%)
                  </Button>
                </div>
              )}
            </div>

            {/* OpenPhone Conversation Links */}
            {currentJob.openphone_links && Array.isArray(currentJob.openphone_links) && currentJob.openphone_links.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">OpenPhone</h3>
                <div className="space-y-2">
                  {currentJob.openphone_links.map((link: any, index: number) => (
                    <a 
                      key={index}
                      href={link.url || link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        {typeof link === 'string' ? `Call ${index + 1}` : (link.label || `Call ${index + 1}`)}
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: ConnectTeam Data (Second) */}
      {userRole === 'boss' && (
        <div className="mb-6">
          <ConnecteamSubmissions jobId={currentJob.id} />
        </div>
      )}

      {/* SECTION 3: Documents & Files (Third) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <FileUpload
              jobId={currentJob.id}
              userId={currentUserId}
              onUploadComplete={loadJobFiles}
            />
          )}

          {jobFiles.length > 0 && (
            <div>
              <div className="space-y-2 mt-4">
                {(filesExpanded ? jobFiles : jobFiles.slice(0, 3)).map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 group">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => {
                        console.log('FILE NAME CLICKED!', file.file_name, 'Index:', index);
                        openFileViewer(jobFiles, index);
                      }}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-blue-600 hover:text-blue-800">
                          {file.file_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {userRole === 'boss' && (
                      <button
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="p-1 text-red-500 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {jobFiles.length > 3 && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilesExpanded(!filesExpanded)}
                  >
                    {filesExpanded ? 'Collapse' : `Expand (${jobFiles.length - 3} more)`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {jobFiles.length === 0 && (
            <p className="text-muted-foreground">No files uploaded yet</p>
          )}
        </CardContent>
      </Card>

      {viewerOpen && (
        <MediaViewer
          items={viewerItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onDelete={handleDeleteMedia}
          allowDelete={userRole === 'boss'}
        />
      )}

      <EditJobModal
        job={currentJob}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onJobUpdated={async () => {
          setShowEditModal(false)
          toast.success('Job updated successfully')
        }}
      />

      {/* Export Progress Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporting Job</DialogTitle>
            <DialogDescription>
              {exportProgress}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isExporting && exportProgress !== 'Export complete!' && exportProgress !== 'Export failed' && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
            {exportProgress === 'Export complete!' && (
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="h-8 w-8" />
              </div>
            )}
            {exportProgress === 'Export failed' && (
              <div className="flex items-center justify-center text-red-600">
                <X className="h-8 w-8" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={showCreateInvoiceModal}
        onClose={() => setShowCreateInvoiceModal(false)}
        job={currentJob}
        stage={invoiceStage}
        onSuccess={() => {
          loadJobData() // Reload job data to show new invoice
        }}
      />
    </div>
  )
}
