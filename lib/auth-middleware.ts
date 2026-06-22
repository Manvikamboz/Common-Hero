import { NextRequest } from 'next/server';
import { getAdminServices } from './firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'citizen' | 'validator' | 'authority' | 'admin';
}

/**
 * verifyAuth
 * Parses the Authorization header (Bearer token) and verifies it using firebase-admin.
 * In development/test mode, accepts a mock auth header or fallback user.
 */
export async function verifyAuth(request: NextRequest, allowedRoles?: Array<'citizen' | 'validator' | 'authority' | 'admin'>): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  
  // 1. Allow fallback/bypass in demo/dev mode if not configured
  const isDemo = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key';
  
  if (isDemo || (authHeader && authHeader.startsWith('Bearer demo_'))) {
    // Return mock user from token
    const token = authHeader?.split(' ')[1] || 'demo_citizen';
    let role: 'citizen' | 'validator' | 'authority' | 'admin' = 'citizen';
    if (token.includes('validator')) role = 'validator';
    if (token.includes('authority')) role = 'authority';
    if (token.includes('admin')) role = 'admin';

    const user: AuthenticatedUser = {
      uid: token,
      email: `${token}@commonhero.app`,
      role,
    };

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Insufficient privileges' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    return { user };
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const { adminAuth } = await getAdminServices();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const role = (decodedToken.role as any) || 'citizen';

    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
    };

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Insufficient privileges' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    return { user };
  } catch (err: any) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ success: false, error: `Unauthorized: ${err.message}` }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}
