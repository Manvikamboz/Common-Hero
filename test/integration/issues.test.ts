import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock firebase admin & db without top-level references (due to hoisting)
vi.mock('@/lib/firebase-admin', () => {
  return {
    getAdminServices: vi.fn().mockResolvedValue({
      adminDb: {
        collection: vi.fn().mockImplementation(() => ({
          add: vi.fn().mockResolvedValue({ id: 'mock_issue_doc_id' }),
          doc: vi.fn().mockImplementation(() => ({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
          })),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          startAt: vi.fn().mockReturnThis(),
          endAt: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ docs: [] }),
        })),
        runTransaction: vi.fn().mockImplementation(async (callback) => {
          return callback({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ points: 100, issuesReported: 5 }),
            }),
            update: vi.fn(),
          });
        }),
      },
    }),
    uploadToStorage: vi.fn().mockResolvedValue('https://firebasestorage.googleapis.com/v0/b/mock-bucket/o/issues%2Fmock_report.webp'),
  };
});

// 2. Mock Gemini calls
vi.mock('@/lib/gemini', () => {
  return {
    categorizeIssue: vi.fn().mockResolvedValue({
      category: 'pothole',
      severity: 'high',
      confidenceScore: 0.95,
      safetyHazard: true,
      hazardDetail: 'Deep pothole blocking main lane',
      suggestedTitle: 'Dangerous Pothole MG Road',
      actionBrief: 'Fill pothole on MG Road immediately.',
    }),
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    generateAutoSummary: vi.fn().mockResolvedValue('Action Brief: Fill pothole on MG Road.'),
  };
});

import { POST } from '@/app/api/issues/route';

describe('Issues API Endpoint Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a valid report submission, call Gemini, and award user points', async () => {
    const fd = new FormData();
    fd.append('title', 'Pothole mg road');
    fd.append('description', 'Very deep pothole on MG road near metro station.');
    fd.append('latitude', '28.6139');
    fd.append('longitude', '77.2090');
    fd.append('address', 'MG Road metro station');
    fd.append('duplicateOverride', 'false');

    // Create a mock image file
    const file = new File([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], 'test.jpg', { type: 'image/jpeg' });
    fd.append('image', file);

    const request = new NextRequest('http://localhost/api/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer demo_citizen',
      },
      body: fd,
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.issueId).toBe('mock_issue_doc_id');
    expect(result.status).toBe('open');
  });
});
