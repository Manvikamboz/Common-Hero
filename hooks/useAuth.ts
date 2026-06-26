'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '@/types';

const MOCK_USER: User = {
  id: 'demo_citizen_001',
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

  const signInWithDemo = useCallback(async (role: 'citizen' | 'validator' | 'authority' | 'admin' = 'citizen', email?: string) => {
    const demoProfiles: Record<string, User> = {
      citizen: {
        ...MOCK_USER,
        email: email || 'manvi@commonhero.app',
      },
      validator: {
        id: 'demo_validator_002',
        name: 'Jane Smith (Validator)',
        email: email || 'jane@commonhero.app',
        role: 'validator',
        points: 450,
        issuesReported: 2,
        issuesValidated: 35,
        badges: [],
        wardId: 'ward_12',
        createdAt: '2026-01-01T00:00:00Z',
      },
      authority: {
        id: 'demo_authority_003',
        name: 'Officer John Doe',
        email: email || 'john.doe@municipal.gov',
        role: 'authority',
        points: 0,
        issuesReported: 0,
        issuesValidated: 0,
        badges: [],
        wardId: 'ward_12',
        createdAt: '2026-01-01T00:00:00Z',
      },
      admin: {
        id: 'demo_admin_004',
        name: 'System Admin',
        email: email || 'admin@commonhero.app',
        role: 'admin',
        points: 0,
        issuesReported: 0,
        issuesValidated: 0,
        badges: [],
        wardId: 'ward_12',
        createdAt: '2026-01-01T00:00:00Z',
      }
    };
    
    const selectedUser = demoProfiles[role] || demoProfiles.citizen;
    try {
      await setDoc(doc(db, 'users', selectedUser.id), selectedUser, { merge: true });
    } catch (e) {
      console.error('Error writing demo user to Firestore:', e);
    }
    localStorage.setItem('demo_user_override', JSON.stringify(selectedUser));
    setUser(selectedUser);
  }, []);

  useEffect(() => {
    // Check if there is a demo user override in localStorage
    if (typeof window !== 'undefined') {
      const savedDemoUser = localStorage.getItem('demo_user_override');
      if (savedDemoUser) {
        try {
          setUser(JSON.parse(savedDemoUser));
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('demo_user_override');
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to fetch full user profile from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ id: userSnap.id, ...userSnap.data() } as User);
          } else {
            // First-time sign in: create profile in Firestore
            const newUser: User = {
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
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch {
          // Fallback to basic Firebase auth info if Firestore fetch fails
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
        }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user_override');
    }
    await signOut(auth);
    setUser(null);
  }, []);

  const getAuthToken = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const savedDemoUser = localStorage.getItem('demo_user_override');
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          if (parsed && parsed.id) {
            return parsed.id;
          }
        } catch (e) {
          // ignore
        }
      }
    }
    try {
      return (await auth.currentUser?.getIdToken()) || '';
    } catch {
      return '';
    }
  }, []);

  return { user, loading, signInWithGoogle, signInWithDemo, logout, getAuthToken };
}
