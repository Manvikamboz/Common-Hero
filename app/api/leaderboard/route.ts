import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await getAdminServices();
    const snap = await adminDb.collection('users')
      .orderBy('points', 'desc')
      .limit(20)
      .get();

    const leaders = snap.docs.map((doc: any) => {
      const data = doc.data();
      // Sanitize sensitive user info if any
      return {
        id: doc.id,
        name: data.name || 'Anonymous',
        role: data.role || 'citizen',
        points: data.points || 0,
        issuesReported: data.issuesReported || 0,
        issuesValidated: data.issuesValidated || 0,
        badges: data.badges || [],
        wardId: data.wardId || '',
      };
    });

    return NextResponse.json({ success: true, leaders });
  } catch (error: any) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
