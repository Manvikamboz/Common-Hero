import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]
 * Returns: user document + last 20 issues reported by that user.
 * Citizens/validators can only fetch their own profile.
 * Authorities and admins can fetch any profile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: authUser, errorResponse } = await verifyAuth(request);
    if (!authUser) {
      return errorResponse
        ? NextResponse.json(JSON.parse(await errorResponse.text()), { status: errorResponse.status })
        : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const targetId = params.id;

    // Citizens / validators may only read their own profile
    if (authUser.role === 'citizen' || authUser.role === 'validator') {
      if (authUser.uid !== targetId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const { adminDb } = await getAdminServices();

    // 1. Fetch the user document
    const userDoc = await adminDb.collection('users').doc(targetId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userData = { id: userDoc.id, ...userDoc.data() };

    // 2. Fetch the user's most recent 20 reported issues
    const issuesSnap = await adminDb
      .collection('issues')
      .where('reportedBy', '==', targetId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const issues = issuesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, user: userData, issues }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/users/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
