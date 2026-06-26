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
    let userData: any;
    if (!userDoc.exists) {
      if (targetId.startsWith('demo_')) {
        const role = targetId.includes('validator') ? 'validator' :
                     targetId.includes('authority') ? 'authority' :
                     targetId.includes('admin') ? 'admin' : 'citizen';
        
        let demoProfile: any = {
          name: 'Anonymous Demo User',
          email: `${targetId}@commonhero.app`,
          role,
          points: 0,
          issuesReported: 0,
          issuesValidated: 0,
          badges: [],
          createdAt: new Date().toISOString()
        };

        if (targetId === 'demo_citizen_001') {
          demoProfile = {
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
        } else if (targetId === 'demo_validator_002') {
          demoProfile = {
            name: 'Jane Smith (Validator)',
            email: 'jane@commonhero.app',
            role: 'validator',
            points: 450,
            issuesReported: 2,
            issuesValidated: 35,
            badges: [],
            wardId: 'ward_12',
            createdAt: '2026-01-01T00:00:00Z',
          };
        } else if (targetId === 'demo_authority_003') {
          demoProfile = {
            name: 'Officer John Doe',
            email: 'john.doe@municipal.gov',
            role: 'authority',
            points: 0,
            issuesReported: 0,
            issuesValidated: 0,
            badges: [],
            wardId: 'ward_12',
            createdAt: '2026-01-01T00:00:00Z',
          };
        } else if (targetId === 'demo_admin_004') {
          demoProfile = {
            name: 'System Admin',
            email: 'admin@commonhero.app',
            role: 'admin',
            points: 0,
            issuesReported: 0,
            issuesValidated: 0,
            badges: [],
            wardId: 'ward_12',
            createdAt: '2026-01-01T00:00:00Z',
          };
        }

        await adminDb.collection('users').doc(targetId).set(demoProfile);
        userData = { id: targetId, ...demoProfile };
      } else {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
    } else {
      userData = { id: userDoc.id, ...userDoc.data() };
    }

    // 2. Fetch the user's most recent 20 reported issues
    const issuesSnap = await adminDb
      .collection('issues')
      .where('reportedBy', '==', targetId)
      .limit(100)
      .get();

    const issues = issuesSnap.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 20);

    return NextResponse.json({ success: true, user: userData, issues }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/users/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]
 * Updates user profile details (name, age, gender, DOB, email, photoUrl).
 */
export async function PUT(
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

    // Citizens / validators may only update their own profile
    if (authUser.role === 'citizen' || authUser.role === 'validator') {
      if (authUser.uid !== targetId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, age, gender, dob, email, photoUrl } = body;

    // Basic validation
    if (!name || age === undefined || !gender || !dob || !email) {
      return NextResponse.json({ success: false, error: 'Missing required profile fields' }, { status: 400 });
    }

    const { adminDb } = await getAdminServices();

    const updateData: any = {
      name,
      age: Number(age),
      gender,
      dob,
      email,
    };

    if (photoUrl) {
      updateData.photoUrl = photoUrl;
    }

    await adminDb.collection('users').doc(targetId).set(updateData, { merge: true });

    return NextResponse.json({ success: true, message: 'Profile updated successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('PUT /api/users/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
