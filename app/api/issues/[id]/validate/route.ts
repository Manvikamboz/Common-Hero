import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-middleware';
import { ValidateIssueSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issues/[id]/validate
 * Allows citizens and community validators to upvote/verify issues.
 * Enforces authentication, Zod validation, self-validation protection, and transactional updates.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth Guard
    const { user, errorResponse } = await verifyAuth(request, ['citizen', 'validator', 'authority', 'admin']);
    if (errorResponse) return errorResponse;

    const { adminDb } = await getAdminServices();
    const issueId = params.id;
    const body = await request.json();

    // 2. Validate input schema
    const validationResult = ValidateIssueSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid validation details', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, userRole, status, comments } = validationResult.data;

    // Enforce that token uid matches the body userId to prevent spoofing
    if (user?.uid !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cannot perform validation on behalf of another user' },
        { status: 403 }
      );
    }

    const issueRef = adminDb.collection('issues').doc(issueId);
    const userRef = adminDb.collection('users').doc(userId);

    const result = await adminDb.runTransaction(async (transaction: any) => {
      const issueDoc = await transaction.get(issueRef);
      if (!issueDoc.exists) {
        throw new Error('Issue not found');
      }

      const issueData = issueDoc.data() || {};
      const currentValidations = issueData.validations || [];

      // 3. Prevent self-validation
      if (issueData.reportedBy === userId) {
        throw new Error('You cannot validate your own reported issue');
      }

      // 4. Check if user already validated/upvoted this issue (prevents double points/votes)
      const alreadyValidated = currentValidations.some((v: any) => v.validatorId === userId);
      if (alreadyValidated) {
        throw new Error('User has already validated this issue');
      }

      // Calculate points to award
      let pointsAwarded = 5; // Standard validation
      const isFirstValidator = currentValidations.length === 0;
      if (isFirstValidator) {
        pointsAwarded = 15; // 5 base + 10 first validator bonus
      }

      // Add validation entry
      const newValidation = {
        validatorId: userId,
        validatedAt: new Date().toISOString(),
        status,
        comments: comments || '',
      };

      const updatedValidations = [...currentValidations, newValidation];
      const newUpvotes = (issueData.upvotes || 0) + 1;

      // Update issue status if validated by a verified Validator
      let newStatus = issueData.status;
      if (userRole === 'validator' && status === 'valid') {
        newStatus = 'validated';
      }

      transaction.update(issueRef, {
        validations: updatedValidations,
        upvotes: newUpvotes,
        status: newStatus,
      });

      // Update user profile (points & validation count)
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        const currentPoints = userData.points || 0;
        const currentCount = userData.issuesValidated || 0;

        transaction.update(userRef, {
          points: currentPoints + pointsAwarded,
          issuesValidated: currentCount + 1,
        });
      }

      return { newStatus, newUpvotes, pointsAwarded };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Validation added successfully',
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error validating issue: ', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
