// src/hooks/useRateLimit.ts - NEW HOOK
import { useState, useEffect } from 'react';

interface UsageStats {
  requests_today: number;
  requests_remaining: number;
  daily_limit: number;
  reset_time: string;
}

export function useRateLimit() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/user/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return { usage, loading, refetch: fetchUsage };
}