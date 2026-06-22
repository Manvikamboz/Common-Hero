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
  const { status, category, lat, lng, radius = 5000, pageLimit = 50, realtime = true } = options;

  const buildAndSubscribe = useCallback(() => {
    // Cleanup previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);

    const isDemoMode =
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key';

    if (isDemoMode) {
      // Return mock data in demo mode
      const mockIssues: Issue[] = [
        {
          id: 'demo_001',
          title: 'Large pothole near bus stop on MG Road',
          description: 'Deep pothole approximately 60cm wide causing vehicle damage and hazard for two-wheelers.',
          category: 'pothole',
          severity: 'high',
          status: 'validated',
          location: { latitude: 28.6139, longitude: 77.2090, address: 'MG Road, Near Bus Stop 12A, New Delhi', geohash: 'ttnfv2' },
          mediaUrls: [],
          reportedBy: 'demo_user_001',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          upvotes: 14,
          validations: [{ validatorId: 'v1', validatedAt: new Date().toISOString(), status: 'valid', comments: 'Confirmed on site' }],
          aiMetadata: { categoryConfidence: 0.94, originalCategory: 'pothole', suggestedSeverity: 'high', autoSummary: 'Action Brief: Fill deep pothole on MG Road using asphalt. Location Detail: Adjacent to Bus Stop 12A, affecting two-wheeler lane.', duplicateScore: 0 },
          wardId: 'ward_12',
        },
        {
          id: 'demo_002',
          title: 'Streetlight out for 2 weeks on Lajpat Nagar',
          description: 'Three consecutive streetlights on sector 4 main road are non-functional creating safety hazard at night.',
          category: 'streetlight',
          severity: 'medium',
          status: 'assigned',
          location: { latitude: 28.5665, longitude: 77.2430, address: 'Sector 4 Main Road, Lajpat Nagar, New Delhi', geohash: 'ttnfq8' },
          mediaUrls: [],
          reportedBy: 'demo_user_002',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          upvotes: 8,
          validations: [],
          aiMetadata: { categoryConfidence: 0.91, originalCategory: 'streetlight', suggestedSeverity: 'medium', autoSummary: 'Action Brief: Replace/repair 3 consecutive failed streetlights on Sector 4. Location Detail: Lajpat Nagar main road, between Market Gate and Petrol Pump.' },
          wardId: 'ward_08',
        },
        {
          id: 'demo_003',
          title: 'Water pipeline burst flooding street',
          description: 'Main water pipeline burst creating large pool blocking entire road. Sewage mixing in.',
          category: 'water',
          severity: 'critical',
          status: 'open',
          location: { latitude: 28.7041, longitude: 77.1025, address: 'Rohini Sector 17, Block B, New Delhi', geohash: 'ttng4c' },
          mediaUrls: [],
          reportedBy: 'demo_user_003',
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          upvotes: 23,
          validations: [],
          aiMetadata: { categoryConfidence: 0.97, originalCategory: 'water', suggestedSeverity: 'critical', autoSummary: 'Action Brief: Emergency repair of burst main water pipeline. Location Detail: Rohini Sector 17, Block B — complete road flooding.', safetyHazard: true } as any,
          wardId: 'ward_03',
        },
        {
          id: 'demo_004',
          title: 'Garbage overflow at community bin',
          description: 'Municipal garbage bin overflowing with uncollected waste for 5 days. Foul smell affecting nearby shops.',
          category: 'waste',
          severity: 'medium',
          status: 'resolved',
          location: { latitude: 28.6315, longitude: 77.2180, address: 'Karol Bagh Market, New Delhi', geohash: 'ttnfw6' },
          mediaUrls: [],
          reportedBy: 'demo_user_004',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          upvotes: 6,
          validations: [{ validatorId: 'v2', validatedAt: new Date().toISOString(), status: 'valid', comments: '' }],
          aiMetadata: { categoryConfidence: 0.88, originalCategory: 'waste', suggestedSeverity: 'medium', autoSummary: 'Action Brief: Clear overflowing garbage bin and schedule frequent pickup. Location Detail: Karol Bagh Market main entrance.' },
          wardId: 'ward_05',
        },
        {
          id: 'demo_005',
          title: 'Illegal encroachment blocking sidewalk',
          description: 'Vendor carts permanently blocking 80% of public footpath forcing pedestrians onto road.',
          category: 'encroachment',
          severity: 'low',
          status: 'reported',
          location: { latitude: 28.6443, longitude: 77.2163, address: 'Connaught Place, Outer Circle, New Delhi', geohash: 'ttnfx2' },
          mediaUrls: [],
          reportedBy: 'demo_user_005',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          upvotes: 3,
          validations: [],
          aiMetadata: { categoryConfidence: 0.82, originalCategory: 'encroachment', suggestedSeverity: 'low', autoSummary: 'Action Brief: Remove unauthorized vendors blocking public footpath at Connaught Place Outer Circle. Location Detail: Between Gate 7 and Gate 8.' },
          wardId: 'ward_01',
        },
      ];

      let filtered = mockIssues;
      if (status) {
        const statuses = status.split(',');
        filtered = filtered.filter((i) => statuses.includes(i.status));
      }
      if (category) {
        filtered = filtered.filter((i) => i.category === category);
      }

      setIssues(filtered);
      setLoading(false);
      return;
    }

    // Real Firestore listener
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
  }, [status, category, pageLimit, realtime]);

  useEffect(() => {
    buildAndSubscribe();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [buildAndSubscribe]);

  return { issues, loading, error, refresh: buildAndSubscribe };
}
