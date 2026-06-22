import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { generatePredictiveInsights } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * GET /api/ai/insights
 * Returns predictive analysis of hotspot zones and recommended actions based on historical data.
 * Optimized with a 6-hour shared Firestore caching mechanism to minimize Gemini API calls/tokens.
 */
export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await getAdminServices();
    const now = Date.now();

    // 1. Check Distributed Cache in Firestore
    const cacheRef = adminDb.collection('system').doc('predictive_insights');
    const cacheSnap = await cacheRef.get();

    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data();
      const cachedAt = new Date(cacheData?.cachedAt || 0).getTime();

      if (now - cachedAt < CACHE_DURATION_MS) {
        return NextResponse.json({
          success: true,
          predictions: cacheData?.predictions || [],
          cachedAt: cacheData?.cachedAt,
          fromCache: true,
        }, { status: 200 });
      }
    }

    // 2. Cache expired or missing: Fetch recent issues from Firestore (past 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const snapshot = await adminDb.collection('issues')
      .where('createdAt', '>=', ninetyDaysAgo.toISOString())
      .get();

    const issues = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        wardId: data.wardId || 'unknown_ward',
        category: data.category,
        status: data.status,
        createdAt: data.createdAt,
      };
    });

    if (issues.length === 0) {
      return NextResponse.json({
        success: true,
        predictions: [
          {
            wardId: 'Ward_Default',
            riskCategory: 'general',
            probability: 0.5,
            reasoning: 'Insufficient data points to build dynamic model predictions.',
            recommendedAction: 'Increase citizen reporting campaigns to accumulate local data.',
          }
        ],
        fromCache: false,
      }, { status: 200 });
    }

    // 3. Call Gemini AI with serialized log data
    const issuesJsonString = JSON.stringify(issues, null, 2);
    const insights = await generatePredictiveInsights(issuesJsonString);
    const predictions = insights.predictions || [];

    // 4. Update Distributed Cache
    const cachePayload = {
      predictions,
      cachedAt: new Date().toISOString(),
    };
    await cacheRef.set(cachePayload, { merge: true });

    return NextResponse.json({
      success: true,
      predictions,
      cachedAt: cachePayload.cachedAt,
      fromCache: false,
    }, { status: 200 });

  } catch (error: any) {
    console.error('AI Insights endpoint failed: ', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
