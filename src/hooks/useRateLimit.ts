// =============================================================================
// src/hooks/useRateLimit.ts - FIXED WITH PROPER ERROR HANDLING AND TYPES
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

interface ModelInfo {
  name: string;
  displayName: string;
  remaining: number;
  inCooldown: boolean;
  cooldownEndsAt?: string;
  minutesRemaining?: number;
}

interface UsageStats {
  totalRequestsToday: number;
  currentModel: string;
  availableModels: ModelInfo[];
  nextAvailableAt?: string;
  allModelsExhausted: boolean;
  resetTime: string;
  // Legacy compatibility fields
  requests_today: number;
  requests_remaining: number;
  daily_limit: number;
  reset_time: string;
}

interface UseRateLimitReturn {
  usage: UsageStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useRateLimit(): UseRateLimitReturn {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/user/usage', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 429) {
          throw new Error('Too many requests - please wait a moment');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch usage statistics');
      }

      // Validate and sanitize the data
      const sanitizedUsage: UsageStats = {
        totalRequestsToday: Math.max(0, data.usage?.totalRequestsToday || 0),
        currentModel: data.usage?.currentModel || 'Loading...',
        availableModels: Array.isArray(data.usage?.availableModels) 
          ? data.usage.availableModels.map((model: any) => ({
              name: model.name || '',
              displayName: model.displayName || model.name || 'Unknown Model',
              remaining: Math.max(0, model.remaining || 0),
              inCooldown: Boolean(model.inCooldown),
              cooldownEndsAt: model.cooldownEndsAt || undefined,
              minutesRemaining: model.minutesRemaining ? Math.max(0, model.minutesRemaining) : undefined
            }))
          : [],
        nextAvailableAt: data.usage?.nextAvailableAt || undefined,
        allModelsExhausted: Boolean(data.usage?.allModelsExhausted),
        resetTime: data.usage?.resetTime || new Date().toISOString(),
        // Legacy fields
        requests_today: Math.max(0, data.usage?.requests_today || data.usage?.totalRequestsToday || 0),
        requests_remaining: Math.max(0, data.usage?.requests_remaining || 0),
        daily_limit: Math.max(1, data.usage?.daily_limit || 50),
        reset_time: data.usage?.reset_time || data.usage?.resetTime || new Date().toISOString()
      };

      setUsage(sanitizedUsage);
      setLastUpdated(new Date());
      
    } catch (fetchError) {
      console.error('Failed to fetch usage stats:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error occurred');
      
      // Set fallback data if no usage data exists
      if (!usage) {
        const fallbackResetTime = new Date();
        fallbackResetTime.setDate(fallbackResetTime.getDate() + 1);
        fallbackResetTime.setHours(0, 0, 0, 0);
        
        setUsage({
          totalRequestsToday: 0,
          currentModel: 'Error loading models',
          availableModels: [],
          nextAvailableAt: undefined,
          allModelsExhausted: true,
          resetTime: fallbackResetTime.toISOString(),
          requests_today: 0,
          requests_remaining: 0,
          daily_limit: 50,
          reset_time: fallbackResetTime.toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  }, [usage]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch if not currently loading and no critical error
      if (!loading && error !== 'Authentication required') {
        fetchUsage();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loading, error, fetchUsage]);

  // Auto-refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        fetchUsage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, fetchUsage]);

  return { 
    usage, 
    loading, 
    error,
    refetch: fetchUsage,
    lastUpdated
  };
}

// Helper hook for debugging - only use in development
export function useRateLimitDebug() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Debug hook should only be used in development');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/usage-debug');
      
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      }
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { debugData, loading, fetchDebugData };
}