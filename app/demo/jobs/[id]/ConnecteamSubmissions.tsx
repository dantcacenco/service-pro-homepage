'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PhotoLightbox from '@/components/ui/photo-lightbox';
import {
  Clock, User, Calendar, Image, Package, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ConnecteamSubmission {
  id: string;
  submissionId: string;
  submissionDate: string;
  startTime?: string;
  endTime?: string;
  jobType?: string;
  workDescription?: string;
  additionalNotes?: string;
  partsMaterialsNeeded?: string;
  managerNote?: string;
  managerStatus?: string;
  matchConfidence?: string;
  matchScore?: number;
  technician?: {
    id: string;
    name: string;
    role?: string[];
  };
  photos: {
    id: string;
    type: 'before' | 'after';
    url: string;
  }[];
  materials: {
    id: string;
    description: string;
    quantity?: string;
    ordered: boolean;
    orderedAt?: string;
  }[];
}

interface ConnecteamSubmissionsProps {
  jobId: string;
}

export default function ConnecteamSubmissions({ jobId }: ConnecteamSubmissionsProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ConnecteamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [syncingStatus, setSyncingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchConnecteamData();
  }, [jobId]);

  const fetchConnecteamData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/connecteam`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ConnectTeam data');
      }

      setSubmissions(data.submissions || []);
      setTotalPhotos(data.totalPhotos || 0);
      setTotalNotes(data.totalNotes || 0);
    } catch (error) {
      console.error('Error fetching ConnectTeam data:', error);
      toast.error('Failed to load ConnectTeam data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmission = (submissionId: string) => {
    setExpandedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const openLightbox = (photos: any[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
    return `${hours.toFixed(1)} hours`;
  };

  const getConfidenceBadge = (confidence?: string, score?: number) => {
    if (!confidence) return null;
    
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-orange-100 text-orange-800 border-orange-300',
    };

    return (
      <Badge className={`${colors[confidence as keyof typeof colors]} border`}>
        {confidence} ({score ? (score * 100).toFixed(0) : '0'}%)
      </Badge>
    );
  };

  const handleSyncStatus = async (submissionId: string, connecteamStatus: string) => {
    try {
      setSyncingStatus(submissionId);
      
      const response = await fetch('/api/connecteam/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, jobId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync status');
      }
      
      if (data.success) {
        toast.success(`Job status updated to: ${data.newStatus.replace('_', ' ')}`);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to sync status');
      }
    } catch (error) {
      console.error('Error syncing status:', error);
      toast.error('Failed to sync status');
    } finally {
      setSyncingStatus(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            ConnectTeam Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading ConnectTeam submissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            ConnectTeam Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No ConnectTeam submissions linked to this job yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              ConnectTeam Data
            </CardTitle>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                {totalPhotos} photos
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {totalNotes} notes
              </span>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission) => {
            const isExpanded = expandedSubmissions.has(submission.id);
            const duration = formatDuration(submission.startTime, submission.endTime);
            
            // Count how many note fields have content
            const notesCount = [
              submission.workDescription,
              submission.additionalNotes,
              submission.partsMaterialsNeeded
            ].filter(Boolean).length;

            return (
              <div
                key={submission.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Header - Always Visible */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => toggleSubmission(submission.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">
                          {submission.technician?.name || 'Unknown Technician'}
                        </span>
                        {submission.technician?.role && (
                          <Badge variant="secondary" className="text-xs">
                            {submission.technician.role.join(', ')}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(submission.submissionDate).toLocaleDateString()}
                        </span>
                        {submission.jobType && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 border">
                            {submission.jobType}
                          </Badge>
                        )}
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {duration}
                          </span>
                        )}
                        {submission.photos.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="h-4 w-4" />
                            {submission.photos.length} photos
                          </span>
                        )}
                        {notesCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {notesCount} notes
                          </span>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t">
                    {/* Time Details */}
                    {(submission.startTime || submission.endTime) && (
                      <div>
                        <h4 className="font-semibold mb-2">Time Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {submission.startTime && (
                            <div>
                              <span className="text-gray-600">Start:</span>
                              <span className="ml-2">
                                {new Date(submission.startTime).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                          {submission.endTime && (
                            <div>
                              <span className="text-gray-600">End:</span>
                              <span className="ml-2">
                                {new Date(submission.endTime).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes Section - Three grey boxes - MOVED BEFORE PHOTOS */}
                    {(submission.workDescription || submission.additionalNotes || submission.partsMaterialsNeeded) && (
                      <div>
                        <h4 className="font-semibold mb-2">Notes:</h4>
                        <div className="space-y-2">
                          {/* What was done? */}
                          {submission.workDescription && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-gray-600 mb-1">What was done?</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {submission.workDescription}
                              </p>
                            </div>
                          )}

                          {/* Additional notes */}
                          {submission.additionalNotes && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Additional notes</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {submission.additionalNotes}
                              </p>
                            </div>
                          )}

                          {/* Parts/material needed */}
                          {submission.partsMaterialsNeeded && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Parts/material needed</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {submission.partsMaterialsNeeded}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {submission.photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Photos:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {submission.photos.map((photo, index) => (
                            <div key={photo.id} className="relative group">
                              <button
                                onClick={() => openLightbox(submission.photos, index)}
                                className="block w-full"
                              >
                                <img
                                  src={photo.url}
                                  alt={`${photo.type} photo`}
                                  className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition cursor-pointer"
                                />
                                <div className="absolute top-2 left-2">
                                  <Badge
                                    className={
                                      photo.type === 'before'
                                        ? 'bg-blue-500'
                                        : 'bg-orange-500'
                                    }
                                  >
                                    {photo.type}
                                  </Badge>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manager Note - NEW */}
                    {submission.managerNote && (
                      <div>
                        <h4 className="font-semibold mb-2">Manager Note:</h4>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            📝 {submission.managerNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Manager Status Badge */}
                    {submission.managerStatus && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-700">ConnectTeam Status:</span>
                        <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                          {submission.managerStatus}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncStatus(submission.id, submission.managerStatus!)}
                          disabled={syncingStatus === submission.id}
                          className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          {syncingStatus === submission.id ? 'Syncing...' : 'Sync to Job'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>

    <PhotoLightbox
      photos={lightboxPhotos}
      initialIndex={lightboxIndex}
      isOpen={lightboxOpen}
      onClose={() => setLightboxOpen(false)}
    />
    </>
  );
}
