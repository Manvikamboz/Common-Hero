import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices, uploadToStorage } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-middleware';
import { ResolveIssueSchema } from '@/lib/validation';
import { hardenUploadedFile } from '@/lib/media-harden';
import { sendPushNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issues/[id]/resolve
 * Allows municipal workers (authorities/admins) to submit resolution proof (photo URL + remarks) and complete the ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth Guard (only authorities or admins can resolve)
    const { user, errorResponse } = await verifyAuth(request, ['authority', 'admin']);
    if (errorResponse) return errorResponse;

    const { adminDb } = await getAdminServices();
    const issueId = params.id;

    // Parse form data
    const formData = await request.formData();
    const remarks = (formData.get('remarks') as string) || '';
    const authorityId = (formData.get('authorityId') as string) || '';
    const file = formData.get('resolutionProof') as File | null;

    // 2. Validate input schema
    const validationResult = ResolveIssueSchema.safeParse({ authorityId, remarks });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid resolution input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Prevent authorityId spoofing
    if (user?.uid !== authorityId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cannot resolve on behalf of another authority' },
        { status: 403 }
      );
    }

    // 3. Media validation (MIME, max size, EXIF strip)
    let resolutionProofUrl = '';
    if (file) {
      const originalBuffer = Buffer.from(await file.arrayBuffer());
      const fileHardenResult = hardenUploadedFile(originalBuffer);

      if (!fileHardenResult.success) {
        return NextResponse.json(
          { success: false, error: fileHardenResult.error || 'Media security validation failed.' },
          { status: 400 }
        );
      }

      // Upload to actual Firebase Storage using admin SDK with base64 fallback
      const filename = `resolutions/${Date.now()}_proof.webp`;
      try {
        resolutionProofUrl = await uploadToStorage(fileHardenResult.hardenedBuffer, fileHardenResult.mimeType, filename);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed (bucket not created). Falling back to base64 inline encoding:', storageErr);
        const base64Str = fileHardenResult.hardenedBuffer.toString('base64');
        resolutionProofUrl = `data:${fileHardenResult.mimeType};base64,${base64Str}`;
      }
    }

    const issueRef = adminDb.collection('issues').doc(issueId);

    const result = await adminDb.runTransaction(async (transaction: any) => {
      const issueDoc = await transaction.get(issueRef);
      if (!issueDoc.exists) {
        throw new Error('Issue not found');
      }

      const issueData = issueDoc.data() || {};
      if (issueData.status === 'resolved' || issueData.status === 'archived') {
        throw new Error('Issue has already been resolved');
      }

      // Update issue status to resolved
      transaction.update(issueRef, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolutionProofUrl,
        resolutionRemarks: remarks,
        assignedAuthority: authorityId,
      });

      // Award points to the original reporter (+25 points)
      const reporterId = issueData.reportedBy;
      let reporterPointsAwarded = false;

      if (reporterId && reporterId !== 'anonymous') {
        const reporterRef = adminDb.collection('users').doc(reporterId);
        const reporterDoc = await transaction.get(reporterRef);
        if (reporterDoc.exists) {
          const currentPoints = reporterDoc.data()?.points || 0;
          transaction.update(reporterRef, {
            points: currentPoints + 25,
          });
          reporterPointsAwarded = true;
        }
      }

      return { reporterId, reporterPointsAwarded, issueTitle: issueData.title || 'Civic Issue' };
    });

    // 4. Send FCM Push Notification to Reporter
    if (result.reporterId && result.reporterId !== 'anonymous') {
      sendPushNotification(result.reporterId, {
        title: 'Issue Resolved!',
        body: `Your reported issue "${result.issueTitle}" has been resolved. View proof photo now.`,
        data: {
          issueId,
          type: 'status_change',
          newStatus: 'resolved',
        },
      }).catch((err) => console.error('[FCM Resolve Alert] Dispatch error: ', err));
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Issue resolved successfully',
        resolutionProofUrl,
        reporterPointsAwarded: result.reporterPointsAwarded,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error resolving issue: ', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
