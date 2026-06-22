'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import type { User } from '@/types';

const MOCK_USER: User = {
  id: 'demo_user_001',
  name: 'Manvi Kamboj',
  email: 'manvi@commonhero.app',
  role: 'citizen',
  points: 240,
  issuesReported: 8,
  issuesValidated: 18,
  badges: [
    { id: 'first_report', name: 'First Reporter', description: 'Submitted first validated report', awardedAt: '2026-01-15T08:00:00Z' },
    { id: 'neighborhood_watch', name: 'Neighborhood Watch', description: '10 validated reports', awardedAt: '2026-03-20T08:00:00Z' },
  ],
  wardId: 'ward_12',
  createdAt: '2026-01-01T00:00:00Z',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use mock user for demo — in production, use onAuthStateChanged
    const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key';

    if (isDemoMode) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // In production, fetch full user profile from Firestore
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || undefined,
          role: 'citizen',
          points: 0,
          issuesReported: 0,
          issuesValidated: 0,
          badges: [],
          createdAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return { user, loading, signInWithGoogle, logout };
}
