import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/dashboard
 * Aggregates statistics of reported issues.
 */
export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await getAdminServices();
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId');

    let query: any = adminDb.collection('issues');
    
    if (wardId) {
      query = query.where('wardId', '==', wardId);
    }

    const snapshot = await query.get();
    
    let activeIssuesCount = 0;
    let resolvedIssuesCount = 0;
    let totalSeverityScore = 0;
    let issuesWithSeverity = 0;
    const categoryDistribution: Record<string, number> = {};

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const status = data.status;
      const category = data.category || 'other';
      const severity = data.severity;

      // Status counters
      if (['reported', 'open', 'validated', 'assigned'].includes(status)) {
        activeIssuesCount++;
      } else if (status === 'resolved' || status === 'archived') {
        resolvedIssuesCount++;
      }

      // Category breakdown
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;

      // Severity calculations
      if (severity) {
        let weight = 1;
        if (severity === 'medium') weight = 2;
        if (severity === 'high') weight = 3;
        if (severity === 'critical') weight = 4;
        
        totalSeverityScore += weight;
        issuesWithSeverity++;
      }
    });

    const averageSeverity = issuesWithSeverity > 0 ? (totalSeverityScore / issuesWithSeverity) : 0;
    let severityLabel = 'Low';
    if (averageSeverity > 3) severityLabel = 'Critical';
    else if (averageSeverity > 2) severityLabel = 'High';
    else if (averageSeverity > 1.5) severityLabel = 'Medium';

    return NextResponse.json({
      success: true,
      activeIssuesCount,
      resolvedIssuesCount,
      averageSeverity: severityLabel,
      categoryDistribution,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Analytics aggregation failed: ', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}
