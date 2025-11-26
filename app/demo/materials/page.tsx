'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, FileText, MessageSquare, RefreshCw, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  submission_id: string;
  material_description: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at?: string;
  job?: {
    job_number: string;
    service_address?: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface WorkDone {
  id: string;
  submission_id: string;
  work_description: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at?: string;
  job?: {
    job_number: string;
    service_address?: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface Note {
  id: string;
  submission_id: string;
  additional_notes: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at?: string;
  job?: {
    job_number: string;
    service_address?: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
}

type FilterType = 'all' | 'unreviewed' | 'reviewed';
type ActiveTab = 'materials' | 'work_done' | 'notes';

export default function MaterialsDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('materials');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [workDone, setWorkDone] = useState<WorkDone[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await checkAndTriggerSync();
    await fetchAllData();
    calculateNextSync();
  };

  const checkAndTriggerSync = async () => {
    try {
      // Get last sync time from database
      const lastSync = await getLastSyncTime();
      const now = new Date();
      const nextSync = getNextScheduledSync(lastSync);
      
      // Check if we should trigger a sync
      if (now > nextSync && !(await isSyncRunning())) {
        console.log('Auto-triggering scheduled sync...');
        await triggerSync();
      }
    } catch (error) {
      console.error('Error checking sync schedule:', error);
    }
  };

  const getLastSyncTime = async (): Promise<Date> => {
    try {
      const response = await fetch('/api/connecteam/last-sync');
      const data = await response.json();
      
      if (data.lastSync) {
        return new Date(data.lastSync);
      }
      
      // Default to 24 hours ago if no sync found
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    } catch (error) {
      console.error('Error fetching last sync time:', error);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
  };

  const getNextScheduledSync = (lastSync: Date): Date => {
    const syncTimes = [6, 11, 14, 18]; // 6am, 11am, 2pm, 6pm
    const now = new Date();
    
    // Find next sync time after last sync
    for (const hour of syncTimes) {
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hour, 0, 0, 0);
      
      if (scheduledTime > lastSync) {
        return scheduledTime;
      }
    }
    
    // If all today's syncs are done, return tomorrow's first sync
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(syncTimes[0], 0, 0, 0);
    return tomorrow;
  };

  const isSyncRunning = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/connecteam/sync-status');
      const data = await response.json();
      return data.isRunning || false;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/connecteam/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'full', triggeredBy: 'automatic' })
      });

      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();
      console.log('Sync completed:', data);
      
      setLastSyncTime(new Date());
      calculateNextSync();
    } catch (error) {
      console.error('Auto-sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch materials
      const materialsRes = await fetch('/api/materials/reviews?type=materials');
      const materialsData = await materialsRes.json();
      setMaterials(materialsData.items || []);

      // Fetch work done
      const workRes = await fetch('/api/materials/reviews?type=work_done');
      const workData = await workRes.json();
      setWorkDone(workData.items || []);

      // Fetch notes
      const notesRes = await fetch('/api/materials/reviews?type=notes');
      const notesData = await notesRes.json();
      setNotes(notesData.items || []);

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextSync = () => {
    const now = new Date();
    const syncTimes = [6, 11, 14, 18]; // 6am, 11am, 2pm, 6pm
    const currentHour = now.getHours();
    
    let nextHour = syncTimes.find(h => h > currentHour);
    if (!nextHour) {
      // Next sync is tomorrow at 6am
      nextHour = syncTimes[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(nextHour, 0, 0, 0);
      setNextSyncTime(tomorrow);
    } else {
      const next = new Date(now);
      next.setHours(nextHour, 0, 0, 0);
      setNextSyncTime(next);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/connecteam/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'full' })
      });

      if (!response.ok) throw new Error('Sync failed');

      toast.success('Sync completed successfully');
      await fetchAllData();
      calculateNextSync();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleReview = async (itemId: string, type: ActiveTab) => {
    try {
      const response = await fetch('/api/materials/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: itemId, reviewType: type })
      });

      if (!response.ok) throw new Error('Review failed');

      // Animate and update state
      if (type === 'materials') {
        setMaterials(prev => prev.map(m => 
          m.submission_id === itemId ? { ...m, reviewed: true, reviewed_at: new Date().toISOString() } : m
        ));
      } else if (type === 'work_done') {
        setWorkDone(prev => prev.map(w => 
          w.submission_id === itemId ? { ...w, reviewed: true, reviewed_at: new Date().toISOString() } : w
        ));
      } else if (type === 'notes') {
        setNotes(prev => prev.map(n => 
          n.submission_id === itemId ? { ...n, reviewed: true, reviewed_at: new Date().toISOString() } : n
        ));
      }

      toast.success('Marked as reviewed');
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to mark as reviewed');
    }
  };

  const getFilteredItems = (items: any[]) => {
    if (filter === 'unreviewed') return items.filter(i => !i.reviewed);
    if (filter === 'reviewed') return items.filter(i => i.reviewed);
    return items;
  };

  const getUnreviewedCount = (items: any[]) => {
    return items.filter(i => !i.reviewed).length;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const filteredMaterials = getFilteredItems(materials).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const filteredWork = getFilteredItems(workDone).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const filteredNotes = getFilteredItems(notes).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-8 w-8" />
            ConnectTeam Dashboard
          </h1>
          <p className="text-gray-600">
            Review materials, work done, and notes from job submissions
          </p>
        </div>

        {/* Sync Status Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Last synced:</span>
                  <span className="font-medium">{formatTime(lastSyncTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Next sync:</span>
                  <span className="font-medium">{formatTime(nextSyncTime)}</span>
                </div>
              </div>
              <Button
                onClick={handleSyncNow}
                disabled={syncing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="materials" className="relative">
              <Package className="h-4 w-4 mr-2" />
              Materials
              {getUnreviewedCount(materials) > 0 && (
                <Badge className="ml-2 bg-red-500 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {getUnreviewedCount(materials)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="work_done" className="relative">
              <FileText className="h-4 w-4 mr-2" />
              Work Done
              {getUnreviewedCount(workDone) > 0 && (
                <Badge className="ml-2 bg-red-500 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {getUnreviewedCount(workDone)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
              {getUnreviewedCount(notes) > 0 && (
                <Badge className="ml-2 bg-red-500 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {getUnreviewedCount(notes)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unreviewed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unreviewed')}
            >
              Unreviewed
            </Button>
            <Button
              variant={filter === 'reviewed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('reviewed')}
            >
              Reviewed
            </Button>
          </div>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="space-y-3">
              {loading ? (
                <Card><CardContent className="p-8 text-center text-gray-500">Loading...</CardContent></Card>
              ) : filteredMaterials.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-gray-500">No materials found</CardContent></Card>
              ) : (
                filteredMaterials.map((material) => (
                  <Card 
                    key={material.id}
                    className={`transition-all duration-300 ${
                      material.reviewed ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {material.reviewed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="h-5 w-5 rounded border-2 border-gray-300" />
                            )}
                            <p className="font-medium">{material.material_description}</p>
                          </div>
                          <div className="text-sm text-gray-600 ml-7">
                            <p>Job: {material.job?.job_number || 'N/A'}</p>
                            <p>Technician: {material.employee ? `${material.employee.first_name} ${material.employee.last_name}` : 'N/A'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(material.created_at).toLocaleDateString()} at {new Date(material.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {!material.reviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(material.submission_id, 'materials')}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Work Done Tab */}
          <TabsContent value="work_done">
            <div className="space-y-3">
              {loading ? (
                <Card><CardContent className="p-8 text-center text-gray-500">Loading...</CardContent></Card>
              ) : filteredWork.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-gray-500">No work logs found</CardContent></Card>
              ) : (
                filteredWork.map((work) => (
                  <Card 
                    key={work.id}
                    className={`transition-all duration-300 ${
                      work.reviewed ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {work.reviewed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="h-5 w-5 rounded border-2 border-gray-300" />
                            )}
                            <p className="font-medium">{work.work_description}</p>
                          </div>
                          <div className="text-sm text-gray-600 ml-7">
                            <p>Job: {work.job?.job_number || 'N/A'}</p>
                            <p>Technician: {work.employee ? `${work.employee.first_name} ${work.employee.last_name}` : 'N/A'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(work.created_at).toLocaleDateString()} at {new Date(work.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {!work.reviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(work.submission_id, 'work_done')}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="space-y-3">
              {loading ? (
                <Card><CardContent className="p-8 text-center text-gray-500">Loading...</CardContent></Card>
              ) : filteredNotes.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-gray-500">No notes found</CardContent></Card>
              ) : (
                filteredNotes.map((note) => (
                  <Card 
                    key={note.id}
                    className={`transition-all duration-300 ${
                      note.reviewed ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {note.reviewed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="h-5 w-5 rounded border-2 border-gray-300" />
                            )}
                            <p className="font-medium">{note.additional_notes}</p>
                          </div>
                          <div className="text-sm text-gray-600 ml-7">
                            <p>Job: {note.job?.job_number || 'N/A'}</p>
                            <p>Technician: {note.employee ? `${note.employee.first_name} ${note.employee.last_name}` : 'N/A'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {!note.reviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(note.submission_id, 'notes')}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
