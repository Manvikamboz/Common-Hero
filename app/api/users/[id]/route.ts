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

    const { adminDb, adminAuth } = await getAdminServices();

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
          createdAt: new Date().toISOString(),
          address: 'MG Road, New Delhi, India',
          latitude: 28.6139,
          longitude: 77.2090,
          town: 'New Delhi',
          state: 'Delhi',
          district: 'New Delhi',
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
            address: 'MG Road, New Delhi, India',
            latitude: 28.6139,
            longitude: 77.2090,
            town: 'New Delhi',
            state: 'Delhi',
            district: 'New Delhi',
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
            address: 'MG Road, New Delhi, India',
            latitude: 28.6139,
            longitude: 77.2090,
            town: 'New Delhi',
            state: 'Delhi',
            district: 'New Delhi',
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
            address: 'MG Road, New Delhi, India',
            latitude: 28.6139,
            longitude: 77.2090,
            town: 'New Delhi',
            state: 'Delhi',
            district: 'New Delhi',
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
            address: 'MG Road, New Delhi, India',
            latitude: 28.6139,
            longitude: 77.2090,
            town: 'New Delhi',
            state: 'Delhi',
            district: 'New Delhi',
          };
        }

        await adminDb.collection('users').doc(targetId).set(demoProfile);
        userData = { id: targetId, ...demoProfile };
      } else {
        // Real user whose Firestore document doesn't exist yet (e.g. first login via Google/Email)
        let displayName = 'Anonymous User';
        let email = authUser.email || '';
        try {
          const firebaseUserRecord = await adminAuth.getUser(targetId);
          displayName = firebaseUserRecord.displayName || firebaseUserRecord.email?.split('@')[0] || 'Anonymous User';
          email = firebaseUserRecord.email || email;
        } catch (authErr) {
          console.error('Error fetching user record from auth:', authErr);
        }

        const defaultProfile = {
          name: displayName,
          email: email,
          role: authUser.role || 'citizen',
          points: 0,
          issuesReported: 0,
          issuesValidated: 0,
          badges: [],
          createdAt: new Date().toISOString(),
          address: '',
          latitude: 0,
          longitude: 0,
          town: '',
          state: '',
          district: '',
        };

        try {
          await adminDb.collection('users').doc(targetId).set(defaultProfile);
        } catch (dbErr) {
          console.error('Error auto-creating Firestore user doc:', dbErr);
        }

        userData = { id: targetId, ...defaultProfile };
      }
    } else {
      userData = { id: userDoc.id, ...userDoc.data() };
    }

    // 2. Fetch all issues dynamically to calculate statistics (points, reported, validated, resolved)
    const allIssuesSnap = await adminDb.collection('issues').get();
    let issuesReported = 0;
    let issuesValidated = 0;
    let computedPoints = 0;
    let issuesResolved = 0;

    allIssuesSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data() || {};
      if (data.reportedBy === targetId) {
        issuesReported++;
        computedPoints += 10; // 10 points per report
        if (data.status === 'resolved') {
          issuesResolved++;
        }
      }
      const validations = data.validations || [];
      const vIdx = validations.findIndex((v: any) => v.validatorId === targetId);
      if (vIdx !== -1) {
        issuesValidated++;
        if (vIdx === 0) {
          computedPoints += 15; // First validator bonus
        } else {
          computedPoints += 5; // Standard validation
        }
      }
    });

    // Use stored values as primary, fallback to dynamically calculated stats if they do not exist
    userData.points = userData.points !== undefined ? userData.points : computedPoints;
    userData.issuesReported = userData.issuesReported !== undefined ? userData.issuesReported : issuesReported;
    userData.issuesValidated = userData.issuesValidated !== undefined ? userData.issuesValidated : issuesValidated;
    userData.issuesResolved = userData.issuesResolved !== undefined ? userData.issuesResolved : issuesResolved;

    // Award badges dynamically while keeping existing ones
    const dynamicBadges = [...(userData.badges || [])];
    const badgeIds = new Set(dynamicBadges.map((b: any) => b.id));

    if (issuesReported >= 1 && !badgeIds.has('first_report')) {
      dynamicBadges.push({
        id: 'first_report',
        name: 'First Reporter',
        description: 'Submitted first validated report',
        awardedAt: new Date().toISOString()
      });
    }
    if (issuesValidated >= 10 && !badgeIds.has('neighborhood_watch')) {
      dynamicBadges.push({
        id: 'neighborhood_watch',
        name: 'Neighborhood Watch',
        description: '10 validated reports',
        awardedAt: new Date().toISOString()
      });
    }
    if (issuesValidated >= 25 && !badgeIds.has('validator_pro')) {
      dynamicBadges.push({
        id: 'validator_pro',
        name: 'Validator Pro',
        description: 'Validate 25+ issues',
        awardedAt: new Date().toISOString()
      });
    }
    userData.badges = dynamicBadges;

    // 3. Filter user's reported issues
    const issues = allIssuesSnap.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() as any }))
      .filter((issue: any) => issue.reportedBy === targetId)
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
    const { name, email, dob, gender, address, town, state, district, phone, photoUrl } = body;

    // Basic validation
    if (!name || !email || !dob || !gender || !address || !town || !state || !district || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required profile fields' }, { status: 400 });
    }

    const { adminDb } = await getAdminServices();

    // Calculate age from dob
    let calculatedAge = 0;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    const updateData: any = {
      name,
      email,
      dob,
      gender,
      age: calculatedAge,
      address,
      town,
      state,
      district,
      phone,
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
