import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices, uploadToStorage } from '@/lib/firebase-admin';
import { categorizeIssue, generateEmbedding, generateAutoSummary } from '@/lib/gemini';
import { getCosineSimilarity, getHaversineDistance } from '@/lib/maps';
import { verifyAuth } from '@/lib/auth-middleware';
import { isRateLimited } from '@/lib/rate-limiter';
import { CreateIssueSchema } from '@/lib/validation';
import { hardenUploadedFile } from '@/lib/media-harden';
import * as geofire from 'geofire-common';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issues
 * Returns paginated, filterable issues, including location radius checks.
 * Enforces pagination with max page size of 50.
 */
export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await getAdminServices();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius') || '5000'; // in meters
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 50);
    const lastDocId = searchParams.get('lastDocId');

    // 1. Optimize with geospatial database queries if lat/lng are provided
    if (latStr && lngStr) {
      const centerLat = parseFloat(latStr);
      const centerLng = parseFloat(lngStr);
      const radiusInMeters = parseFloat(radiusStr);
      const radiusInKm = radiusInMeters / 1000;

      const bounds = geofire.geohashQueryBounds([centerLat, centerLng], radiusInMeters);
      const promises = [];

      for (const b of bounds) {
        const q = adminDb.collection('issues')
          .orderBy('location.geohash')
          .startAt(b[0])
          .endAt(b[1]);
        promises.push(q.get());
      }

      const snapshots = await Promise.all(promises);
      let geoIssues: any[] = [];

      snapshots.forEach((snap) => {
        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          const distance = getHaversineDistance(
            centerLat,
            centerLng,
            data.location.latitude,
            data.location.longitude
          );
          if (distance <= radiusInKm) {
            geoIssues.push({ id: doc.id, ...data });
          }
        });
      });

      // Apply server-side filters
      if (status) {
        const statuses = status.split(',');
        geoIssues = geoIssues.filter((iss) => statuses.includes(iss.status));
      }
      if (category) {
        geoIssues = geoIssues.filter((iss) => iss.category === category);
      }

      // Sort by createdAt desc
      geoIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination cursor
      let startIndex = 0;
      if (lastDocId) {
        const idx = geoIssues.findIndex((iss) => iss.id === lastDocId);
        if (idx !== -1) {
          startIndex = idx + 1;
        }
      }
      geoIssues = geoIssues.slice(startIndex, startIndex + pageSize);

      return NextResponse.json({ success: true, issues: geoIssues }, { status: 200 });
    }

    // 2. Fallback to standard query for non-spatial lists
    let dbQuery: any = adminDb.collection('issues');

    if (status) {
      const statuses = status.split(',');
      dbQuery = dbQuery.where('status', 'in', statuses);
    }
    if (category) {
      dbQuery = dbQuery.where('category', '==', category);
    }

    const snapshot = await dbQuery.get();
    let issues = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Sort by createdAt desc in memory to prevent Firestore composite index requirements
    issues.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination in memory
    let startIndex = 0;
    if (lastDocId) {
      const idx = issues.findIndex((iss) => iss.id === lastDocId);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }
    issues = issues.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({ success: true, issues }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching issues: ', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues
 * Validates credentials, checks rate limits, sanitizes uploads, handles fallback category degradation,
 * scans for duplicates, and writes transactions to Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    if (isRateLimited(request, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // 2. Authentication Check
    const { user, errorResponse } = await verifyAuth(request, ['citizen', 'validator', 'authority', 'admin']);
    if (errorResponse) return errorResponse;

    const { adminDb } = await getAdminServices();

    // 3. Parse Multipart Form Data
    const formData = await request.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const latStr = (formData.get('latitude') as string) || '';
    const lngStr = (formData.get('longitude') as string) || '';
    const address = (formData.get('address') as string) || '';
    const duplicateOverride = formData.get('duplicateOverride') === 'true';
    const file = formData.get('image') as File | null;

    // Convert types for Zod validation
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    // 4. Schema Validation
    const validationResult = CreateIssueSchema.safeParse({
      title,
      description,
      latitude,
      longitude,
      address,
      reportedBy: user?.uid,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // 5. Image Sanitization & Validation (Magic Bytes & EXIF metadata stripping)
    const mediaUrls: string[] = [];
    let imageBuffer: Buffer | null = null;
    let imageMime = 'image/jpeg';

    if (file) {
      const originalBuffer = Buffer.from(await file.arrayBuffer());
      const fileHardenResult = hardenUploadedFile(originalBuffer);

      if (!fileHardenResult.success) {
        return NextResponse.json(
          { success: false, error: fileHardenResult.error || 'Media security validation failed.' },
          { status: 400 }
        );
      }

      imageBuffer = fileHardenResult.hardenedBuffer;
      imageMime = fileHardenResult.mimeType;

      // Upload to actual Firebase Storage using admin SDK with base64 fallback
      const filename = `issues/${Date.now()}_report.webp`;
      try {
        const publicUrl = await uploadToStorage(imageBuffer, imageMime, filename);
        mediaUrls.push(publicUrl);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed (bucket not created). Falling back to base64 inline encoding:', storageErr);
        const base64Str = imageBuffer.toString('base64');
        mediaUrls.push(`data:${imageMime};base64,${base64Str}`);
      }
    }

    // 6. Gemini Vision AI Analysis with Graceful Degradation
    let detectedCategory = 'other';
    let detectedSeverity = 'low';
    let safetyHazard = false;
    let hazardDetail = '';
    let suggestedTitle = title || 'Reported Civic Issue';
    let confidenceScore = 1.0;
    let autoSummary = '';
    let aiDegraded = false;

    if (imageBuffer) {
      try {
        const visionResult = await categorizeIssue(imageBuffer, imageMime, description);
        
        // Enum validation on Gemini output
        const validCategories = ['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'];
        const validSeverities = ['low', 'medium', 'high', 'critical'];

        detectedCategory = validCategories.includes(visionResult.category) ? visionResult.category : 'other';
        detectedSeverity = validSeverities.includes(visionResult.severity) ? visionResult.severity : 'low';
        
        safetyHazard = !!visionResult.safetyHazard;
        hazardDetail = visionResult.hazardDetail || '';
        suggestedTitle = visionResult.suggestedTitle || suggestedTitle;
        confidenceScore = visionResult.confidenceScore || 0.8;
      } catch (aiErr) {
        console.error('Gemini Vision failed (degrading to manual review):', aiErr);
        aiDegraded = true;
        detectedCategory = 'other';
        detectedSeverity = 'low';
      }
    }

    // AI summary generation with degradation
    try {
      autoSummary = await generateAutoSummary(description, address);
    } catch {
      autoSummary = `Action Brief: Resolve reported ${detectedCategory}. Location Detail: ${address}`;
    }

    // 7. Duplicate Detection Pipeline
    let duplicateScore = 0;
    let possibleDuplicateOf = '';

    try {
      const newEmbedding = await generateEmbedding(description);
      const bounds = geofire.geohashQueryBounds([latitude, longitude], 500); // 500 meters
      const openIssues: any[] = [];

      for (const b of bounds) {
        const q = adminDb.collection('issues')
          .where('status', 'in', ['reported', 'open', 'validated', 'assigned'])
          .orderBy('location.geohash')
          .startAt(b[0])
          .endAt(b[1]);

        const qSnap = await q.get();
        qSnap.docs.forEach((doc: any) => {
          const data = doc.data();
          const dist = getHaversineDistance(latitude, longitude, data.location.latitude, data.location.longitude);
          if (dist <= 0.5) {
            openIssues.push({ id: doc.id, ...data });
          }
        });
      }

      let highestSimilarity = 0;
      let duplicateIssueId = '';

      for (const openIssue of openIssues) {
        try {
          const existingEmbedding = await generateEmbedding(openIssue.description);
          const similarity = getCosineSimilarity(newEmbedding, existingEmbedding);

          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            duplicateIssueId = openIssue.id;
          }
        } catch {}
      }

      if (highestSimilarity > 0.85) {
        duplicateScore = highestSimilarity;
        possibleDuplicateOf = duplicateIssueId;
      }
    } catch (dupErr) {
      console.error('Duplicate detection pipeline failed: ', dupErr);
    }

    // 8. If duplicate is detected and NOT overridden, return duplicate block
    if (possibleDuplicateOf && !duplicateOverride) {
      return NextResponse.json({
        success: false,
        duplicateWarning: true,
        possibleDuplicateOf,
        duplicateScore,
        message: 'A similar issue already exists in this area. Do you want to submit anyway?',
      }, { status: 409 });
    }

    // Calculate geohash for physical lookup
    const geohash = geofire.geohashForLocation([latitude, longitude]);

    // 9. Build final sanitized issue document
    const issueData = {
      title: suggestedTitle,
      description,
      category: detectedCategory,
      severity: detectedSeverity,
      status: aiDegraded ? 'reported' : 'open', // 'reported' triggers manual triage/review, 'open' is ready
      location: {
        latitude,
        longitude,
        address,
        geohash,
      },
      mediaUrls,
      reportedBy: user?.uid || 'anonymous',
      createdAt: new Date().toISOString(),
      upvotes: 0,
      validations: [],
      aiMetadata: {
        categoryConfidence: confidenceScore,
        originalCategory: detectedCategory,
        suggestedSeverity: detectedSeverity,
        autoSummary,
        safetyHazard,
        hazardDetail,
        duplicateScore,
        possibleDuplicateOf,
        aiDegraded,
      },
    };

    const docRef = await adminDb.collection('issues').add(issueData);

    // 10. Award points for citizen reporting in transaction
    if (user && user.uid !== 'anonymous') {
      const userRef = adminDb.collection('users').doc(user.uid);
      await adminDb.runTransaction(async (transaction: any) => {
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const currentPoints = userDoc.data()?.points || 0;
          const currentCount = userDoc.data()?.issuesReported || 0;
          transaction.update(userRef, {
            points: currentPoints + 10,
            issuesReported: currentCount + 1,
          });
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        issueId: docRef.id,
        status: issueData.status,
        aiMetadata: issueData.aiMetadata,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating issue: ', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
