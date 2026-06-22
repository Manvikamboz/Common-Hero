import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issues/[id]/dispute
 * Allows citizens to dispute a resolution and reopen the issue.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth Guard
    const { user, errorResponse } = await verifyAuth(request, ['citizen', 'validator', 'admin']);
    if (errorResponse) return errorResponse;

    const { adminDb } = await getAdminServices();
    const issueId = params.id;
    const { remarks } = await request.json();

    if (!remarks || remarks.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide dispute reasons (minimum 5 characters).' },
        { status: 400 }
      );
    }

    const issueRef = adminDb.collection('issues').doc(issueId);

    const result = await adminDb.runTransaction(async (transaction: any) => {
      const issueDoc = await transaction.get(issueRef);
      if (!issueDoc.exists) {
        throw new Error('Issue not found');
      }

      const issueData = issueDoc.data() || {};
      if (issueData.status !== 'resolved') {
        throw new Error('Only resolved issues can be disputed');
      }

      // Reopen issue: set status to 'open', flag as disputed, increment priority/severity
      const currentDisputes = issueData.disputeCount || 0;
      const timelineEvent = {
        type: 'disputed',
        disputedBy: user?.uid,
        disputedAt: new Date().toISOString(),
        remarks,
      };

      transaction.update(issueRef, {
        status: 'open',
        disputed: true,
        disputeCount: currentDisputes + 1,
        disputeRemarks: remarks,
        severity: issueData.severity === 'low' ? 'medium' : issueData.severity === 'medium' ? 'high' : 'critical',
        lastDisputedAt: new Date().toISOString(),
        timeline: [...(issueData.timeline || []), timelineEvent],
      });

      // Add a comment to the issue discussion
      const commentRef = issueRef.collection('comments').doc();
      transaction.set(commentRef, {
        issueId,
        authorId: user?.uid || 'system',
        authorName: 'Dispute System',
        text: `⚠️ Issue disputed and reopened: "${remarks}"`,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error disputing issue: ', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Dispute failed' },
      { status: 500 }
    );
  }
}
