import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the firebase admin auth
vi.mock('@/lib/firebase-admin', () => {
  return {
    getAdminServices: vi.fn().mockResolvedValue({
      adminAuth: {
        verifyIdToken: vi.fn().mockImplementation(async (token: string) => {
          if (token === 'valid_citizen_token') {
            return { uid: 'user_cit_123', email: 'citizen@test.com', role: 'citizen' };
          }
          if (token === 'valid_authority_token') {
            return { uid: 'user_auth_789', email: 'authority@test.com', role: 'authority' };
          }
          throw new Error('Invalid token');
        }),
      },
    }),
  };
});

import { verifyAuth } from '@/lib/auth-middleware';

describe('Auth Middleware Unit Tests', () => {
  beforeEach(() => {
    // Reset environments
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'real-api-key';
  });

  it('should deny requests missing Authorization header', async () => {
    const request = new NextRequest('http://localhost/api/issues', {
      headers: new Headers(),
    });

    const { user, errorResponse } = await verifyAuth(request);
    expect(user).toBeNull();
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.status).toBe(401);
  });

  it('should accept valid tokens and assign user role profile info', async () => {
    const headers = new Headers();
    headers.set('Authorization', 'Bearer valid_citizen_token');
    const request = new NextRequest('http://localhost/api/issues', { headers });

    const { user, errorResponse } = await verifyAuth(request);
    expect(errorResponse).toBeUndefined();
    expect(user).toBeDefined();
    expect(user?.uid).toBe('user_cit_123');
    expect(user?.role).toBe('citizen');
  });

  it('should deny access if user role is not allowed in endpoint privileges', async () => {
    const headers = new Headers();
    headers.set('Authorization', 'Bearer valid_citizen_token');
    const request = new NextRequest('http://localhost/api/issues/resolve', { headers });

    // Restrict endpoint to authorities only
    const { user, errorResponse } = await verifyAuth(request, ['authority', 'admin']);
    expect(user).toBeNull();
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.status).toBe(403);
  });
});
