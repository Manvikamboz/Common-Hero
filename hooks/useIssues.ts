'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Issue } from '@/types';

interface UseIssuesOptions {
  status?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  pageLimit?: number;
}

interface UseIssuesReturn {
  issues: Issue[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useIssues(options: UseIssuesOptions = {}): UseIssuesReturn {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status, category, lat, lng, radius, pageLimit = 50 } = options;

  const fetchIssues = useCallback(async () => {
    setError(null);
    try {
      const url = new URL('/api/issues', window.location.origin);
      if (status) url.searchParams.set('status', status);
      if (category) url.searchParams.set('category', category);
      if (lat !== undefined) url.searchParams.set('lat', lat.toString());
      if (lng !== undefined) url.searchParams.set('lng', lng.toString());
      if (radius !== undefined) url.searchParams.set('radius', radius.toString());
      url.searchParams.set('pageSize', pageLimit.toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        setIssues(data.issues);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching issues:', err);
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [status, category, lat, lng, radius, pageLimit]);

  useEffect(() => {
    setLoading(true);
    fetchIssues();
    const interval = setInterval(fetchIssues, 10000); // Auto-refresh every 10 seconds for live updates
    return () => clearInterval(interval);
  }, [fetchIssues]);

  return { issues, loading, error, refresh: fetchIssues };
}
