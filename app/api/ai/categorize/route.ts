import { NextRequest, NextResponse } from 'next/server';
import { categorizeIssue } from '@/lib/gemini';

/**
 * POST /api/ai/categorize
 * Standalone endpoint to preview image categorization results.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const description = formData.get('description') as string || '';
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';

    const result = await categorizeIssue(buffer, mimeType, description);

    return NextResponse.json({
      success: true,
      category: result.category,
      severity: result.severity,
      confidenceScore: result.confidenceScore,
      safetyHazard: result.safetyHazard,
      hazardDetail: result.hazardDetail,
    }, { status: 200 });

  } catch (error: any) {
    console.error('AI Standalone Categorization failed: ', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI categorization failed' },
      { status: 500 }
    );
  }
}
