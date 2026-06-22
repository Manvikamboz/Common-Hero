// Set env variable before imports
process.env.GEMINI_API_KEY = 'mock-gemini-key';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Google AI SDK before import
vi.mock('@google/generative-ai', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        category: 'streetlight',
        severity: 'medium',
        confidenceScore: 0.92,
        safetyHazard: false,
        suggestedTitle: 'Broken Streetlight',
        actionBrief: 'Replace burnt bulb on the pole.'
      })
    }
  });

  const embedContentMock = vi.fn().mockResolvedValue({
    embedding: {
      values: [0.1, 0.2, 0.3]
    }
  });

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockImplementation(() => ({
        generateContent: generateContentMock,
        embedContent: embedContentMock,
      }))
    }))
  };
});

import { categorizeIssue, generateEmbedding } from '@/lib/gemini';

describe('Gemini AI Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should categorize issue correctly based on multimodal vision prompt', async () => {
    const fakeBuffer = Buffer.from('fake-image-data');
    const result = await categorizeIssue(fakeBuffer, 'image/jpeg', 'Streetlight is broken');

    expect(result.category).toBe('streetlight');
    expect(result.severity).toBe('medium');
    expect(result.confidenceScore).toBe(0.92);
  });

  it('should generate embeddings successfully', async () => {
    const embedding = await generateEmbedding('Streetlight issue description');
    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });
});
