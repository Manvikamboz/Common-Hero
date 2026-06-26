import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issues/[id]
 * Returns details for a single issue.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { adminDb } = await getAdminServices();
    const issueId = params.id;

    const doc = await adminDb.collection('issues').doc(issueId).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, issue: { id: doc.id, ...doc.data() } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
