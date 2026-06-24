'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, QueryConstraint } from 'firebase/firestore';
import type { Issue } from '@/types';

interface UseIssuesOptions {
  status?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  pageLimit?: number;
  realtime?: boolean;
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
  const unsubRef = useRef<(() => void) | null>(null);
  const { status, category, pageLimit = 50 } = options;

  const buildAndSubscribe = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);

    try {
      const constraints: QueryConstraint[] = [];

      if (status) {
        const statuses = status.split(',');
        if (statuses.length === 1) {
          constraints.push(where('status', '==', statuses[0]));
        } else {
          constraints.push(where('status', 'in', statuses));
        }
      }

      if (category) {
        constraints.push(where('category', '==', category));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageLimit));

      const q = query(collection(db, 'issues'), ...constraints);

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Issue));
          setIssues(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      unsubRef.current = unsub;
    } catch (err: any) {
      setError(err.message ?? 'Failed to load issues');
      setLoading(false);
    }
  }, [status, category, pageLimit]);

  useEffect(() => {
    buildAndSubscribe();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [buildAndSubscribe]);

  return { issues, loading, error, refresh: buildAndSubscribe };
}
