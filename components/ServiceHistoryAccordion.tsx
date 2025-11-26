'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronRight, User, Clock, Camera, FileText, MessageSquare, Calendar
} from 'lucide-react';

interface ServiceEvent {
  id: string;
  service_date: string;
  service_type: string;
  status: string;
  proposal_number?: string;
  submissions: ServiceSubmission[];
}

interface ServiceSubmission {
  id: string;
  submission_timestamp: number;
  technician_name: string;
  technician_role?: string;
  duration_minutes?: number;
  photo_count: number;
  work_description?: string;
  additional_notes?: string;
  materials_used?: string;
}

interface ServiceHistoryAccordionProps {
  jobId: string;
}

export default function ServiceHistoryAccordion({ jobId }: ServiceHistoryAccordionProps) {
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchServiceHistory();
  }, [jobId]);

  const fetchServiceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/service-history`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch service history');
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'working_on_it': return 'bg-yellow-100 text-yellow-800';
      case 'parts_needed': return 'bg-orange-100 text-orange-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Loading service history...
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-500 py-8">
          No service history available for this job.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Service History ({events.length} {events.length === 1 ? 'visit' : 'visits'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg">
              {/* Event Level */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => toggleEvent(event.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedEvents.has(event.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{event.service_type}</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-gray-600">{formatDate(event.service_date)}</span>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {event.proposal_number && (
                      <p className="text-sm text-gray-500 mt-1">
                        Proposal: {event.proposal_number}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {event.submissions.length} {event.submissions.length === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {/* Submissions Level */}
              {expandedEvents.has(event.id) && (
                <div className="border-t bg-gray-50">
                  <div className="p-4 space-y-2">
                    {event.submissions.map((submission) => (
                      <div key={submission.id} className="bg-white border rounded-lg">
                        {/* Submission Header */}
                        <div
                          className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                          onClick={() => toggleSubmission(submission.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedSubmissions.has(submission.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="font-medium text-sm">
                              {formatTime(submission.submission_timestamp)}
                            </span>
                            <span className="text-gray-500 text-sm">
                              - {submission.technician_name}
                            </span>
                          </div>
                        </div>

                        {/* Submission Details */}
                        {expandedSubmissions.has(submission.id) && (
                          <div className="p-4 pt-0 space-y-3 text-sm">
                            {/* Technician Info */}
                            <div className="flex items-center gap-2 text-gray-700">
                              <User className="h-4 w-4" />
                              <span>{submission.technician_name}</span>
                              {submission.technician_role && (
                                <Badge variant="outline" className="text-xs">
                                  {submission.technician_role}
                                </Badge>
                              )}
                            </div>

                            {/* Duration */}
                            {submission.duration_minutes && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(submission.duration_minutes)}</span>
                              </div>
                            )}

                            {/* Photos */}
                            <div className="flex items-center gap-2 text-gray-700">
                              <Camera className="h-4 w-4" />
                              <span>{submission.photo_count} {submission.photo_count === 1 ? 'photo' : 'photos'}</span>
                            </div>

                            {/* Work Description */}
                            {submission.work_description && (
                              <div>
                                <div className="flex items-center gap-2 text-gray-700 mb-1">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-medium">Work Done:</span>
                                </div>
                                <p className="text-gray-600 ml-6 whitespace-pre-wrap">
                                  {submission.work_description}
                                </p>
                              </div>
                            )}

                            {/* Materials */}
                            {submission.materials_used && (
                              <div>
                                <div className="flex items-center gap-2 text-gray-700 mb-1">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-medium">Materials:</span>
                                </div>
                                <p className="text-gray-600 ml-6 whitespace-pre-wrap">
                                  {submission.materials_used}
                                </p>
                              </div>
                            )}

                            {/* Notes */}
                            {submission.additional_notes && (
                              <div>
                                <div className="flex items-center gap-2 text-gray-700 mb-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="font-medium">Notes:</span>
                                </div>
                                <p className="text-gray-600 ml-6 whitespace-pre-wrap">
                                  {submission.additional_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
