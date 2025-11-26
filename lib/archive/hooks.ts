/**
 * Archive System - React Hooks
 * 
 * Provides React hooks for easy integration with the archive system
 * 
 * @module lib/archive/hooks
 */

'use client';

import { useState, useCallback } from 'react';
import {
  archivePhoto,
  archiveFile,
  restorePhoto,
  restoreFile,
  getArchiveStats,
  simulateCleanup,
  type ArchiveResult,
  type ArchiveStats,
  type CleanupSimulationResult,
} from './index';

/**
 * Hook for archiving photos
 */
export function useArchivePhoto() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchiveResult | null>(null);

  const archive = useCallback(async (
    photoId: string,
    userId: string,
    reason?: string
  ): Promise<ArchiveResult> => {
    setLoading(true);
    setResult(null);
    
    const res = await archivePhoto(photoId, userId, reason);
    
    setResult(res);
    setLoading(false);
    return res;
  }, []);

  return { archive, loading, result };
}

/**
 * Hook for archiving files
 */
export function useArchiveFile() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchiveResult | null>(null);

  const archive = useCallback(async (
    fileId: string,
    userId: string,
    reason?: string
  ): Promise<ArchiveResult> => {
    setLoading(true);
    setResult(null);
    
    const res = await archiveFile(fileId, userId, reason);
    
    setResult(res);
    setLoading(false);
    return res;
  }, []);

  return { archive, loading, result };
}

/**
 * Hook for restoring photos
 */
export function useRestorePhoto() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchiveResult | null>(null);

  const restore = useCallback(async (photoId: string): Promise<ArchiveResult> => {
    setLoading(true);
    setResult(null);
    
    const res = await restorePhoto(photoId);
    
    setResult(res);
    setLoading(false);
    return res;
  }, []);

  return { restore, loading, result };
}

/**
 * Hook for restoring files
 */
export function useRestoreFile() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchiveResult | null>(null);

  const restore = useCallback(async (fileId: string): Promise<ArchiveResult> => {
    setLoading(true);
    setResult(null);
    
    const res = await restoreFile(fileId);
    
    setResult(res);
    setLoading(false);
    return res;
  }, []);

  return { restore, loading, result };
}

/**
 * Hook for archive statistics
 */
export function useArchiveStats() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ArchiveStats | null>(null);

  const loadStats = useCallback(async (): Promise<ArchiveStats | null> => {
    setLoading(true);
    
    const data = await getArchiveStats();
    
    setStats(data);
    setLoading(false);
    return data;
  }, []);

  const refresh = loadStats;

  return { stats, loading, loadStats, refresh };
}

/**
 * Hook for cleanup simulation
 */
export function useCleanupSimulation() {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<CleanupSimulationResult | null>(null);

  const simulate = useCallback(async (): Promise<CleanupSimulationResult> => {
    setLoading(true);
    
    const data = await simulateCleanup();
    
    setSimulation(data);
    setLoading(false);
    return data;
  }, []);

  return { simulation, loading, simulate };
}
