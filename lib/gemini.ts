import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

/**
 * categorizeIssue — Gemini Vision multimodal classification
 * Returns: { category, severity, confidenceScore, safetyHazard, hazardDetail, suggestedTitle, actionBrief }
 */
export async function categorizeIssue(
  imageBuffer: Buffer,
  mimeType: string,
  description: string
) {
  if (!apiKey) {
    return {
      category: 'other',
      severity: 'low',
      confidenceScore: 0.5,
      safetyHazard: false,
      hazardDetail: '',
      suggestedTitle: description.slice(0, 60),
      actionBrief: `Resolve reported issue at described location.`,
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction:
      'You are an expert municipal AI. Analyze the provided civic-issue image and citizen description. Classify it into the correct category, assess severity, and generate a concise action brief for repair crews. Return strict JSON.',
  });

  const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          imagePart,
          {
            text: `Citizen Description: "${description}"

Respond with JSON matching this schema:
{
  "category": one of ["pothole","streetlight","water","waste","encroachment","other"],
  "severity": one of ["low","medium","high","critical"],
  "confidenceScore": float 0-1,
  "safetyHazard": boolean,
  "hazardDetail": string (empty if no hazard),
  "suggestedTitle": string (max 80 chars, descriptive title for the issue),
  "actionBrief": string (2-sentence actionable instruction for repair crews)
}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['pothole', 'streetlight', 'water', 'waste', 'encroachment', 'other'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          confidenceScore: { type: 'number' },
          safetyHazard: { type: 'boolean' },
          hazardDetail: { type: 'string' },
          suggestedTitle: { type: 'string' },
          actionBrief: { type: 'string' },
        },
        required: ['category', 'severity', 'confidenceScore', 'safetyHazard', 'suggestedTitle', 'actionBrief'],
      } as any,
    },
  });

  return JSON.parse(result.response.text());
}

/**
 * detectDuplicate — Compare new issue against nearby existing issues using text similarity
 * Returns: { isDuplicate, matchedIssueId, confidence }
 */
export async function detectDuplicate(
  newIssue: { title: string; description: string; address: string },
  nearbyIssues: Array<{ id: string; title: string; description: string; address: string }>
): Promise<{ isDuplicate: boolean; matchedIssueId: string | null; confidence: number }> {
  if (!apiKey || nearbyIssues.length === 0) {
    return { isDuplicate: false, matchedIssueId: null, confidence: 0 };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const nearbyList = nearbyIssues
    .slice(0, 5)
    .map((iss, i) => `[${i}] ID=${iss.id} | "${iss.title}" | "${iss.description.slice(0, 100)}" | ${iss.address}`)
    .join('\n');

  const prompt = `Determine if the NEW issue is a duplicate of any EXISTING issue (same physical problem at same location).

NEW ISSUE:
Title: "${newIssue.title}"
Description: "${newIssue.description}"
Address: "${newIssue.address}"

EXISTING NEARBY ISSUES:
${nearbyList}

Respond with JSON:
{
  "isDuplicate": boolean,
  "matchedIndex": number or null (index into EXISTING list, null if not duplicate),
  "confidence": float 0-1
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          isDuplicate: { type: 'boolean' },
          matchedIndex: { type: 'number' },
          confidence: { type: 'number' },
        },
        required: ['isDuplicate', 'confidence'],
      } as any,
    },
  });

  const parsed = JSON.parse(result.response.text());
  const matchedIssue =
    parsed.isDuplicate && parsed.matchedIndex !== null && parsed.matchedIndex !== undefined
      ? nearbyIssues[parsed.matchedIndex]
      : null;

  return {
    isDuplicate: parsed.isDuplicate,
    matchedIssueId: matchedIssue?.id ?? null,
    confidence: parsed.confidence,
  };
}

/**
 * generateEmbedding — 768-dim text embedding for cosine similarity duplicate detection
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  if (result.embedding?.values) return result.embedding.values;
  throw new Error('Embedding failed');
}

/**
 * generateAutoSummary — 2-sentence actionable dispatch brief
 */
export async function generateAutoSummary(description: string, address: string): Promise<string> {
  if (!apiKey) {
    return `Action Brief: Resolve the reported civic issue. Location Detail: ${address}`;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(
    `You are a municipal dispatch AI. Summarize this citizen report into a 2-sentence action brief for a field repair crew. Be specific about what needs to be done and where.

Report: "${description}"
Location: "${address}"

Format: "Action Brief: <what to do>. Location Detail: <specific pointer>."`
  );
  return result.response.text().trim();
}

/**
 * analyzeSentiment — sentiment analysis on citizen comments
 * Returns { frustrationIndex, flaggedComments }
 */
export async function analyzeSentiment(comments: string[]): Promise<{
  frustrationIndex: number;
  flaggedComments: string[];
}> {
  if (!apiKey || comments.length === 0) {
    return { frustrationIndex: 3, flaggedComments: [] };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const commentList = comments.map((c, i) => `[${i}]: "${c}"`).join('\n');

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze these citizen comments on an unresolved civic issue. Return a frustration index (1=calm, 10=extremely frustrated) and list any toxic/abusive comments.

Comments:
${commentList}

Respond with JSON:
{
  "frustrationIndex": number 1-10,
  "flaggedComments": string[] (exact text of toxic comments, empty if none)
}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          frustrationIndex: { type: 'number' },
          flaggedComments: { type: 'array', items: { type: 'string' } },
        },
        required: ['frustrationIndex', 'flaggedComments'],
      } as any,
    },
  });

  return JSON.parse(result.response.text());
}

/**
 * generatePredictiveInsights — Urban hotspot prediction from last 90 days of data
 */
export async function generatePredictiveInsights(recentIssuesJson: string): Promise<{
  predictions: Array<{
    wardId: string;
    riskCategory: string;
    probability: number;
    reasoning: string;
    recommendedAction: string;
  }>;
}> {
  if (!apiKey) return { predictions: [] };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction:
      'You are a senior urban planning AI analyst. Examine 90 days of civic issues data. Identify emerging clusters, predict categories likely to surge in next 14 days, and recommend concrete preventative maintenance steps.',
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this 90-day aggregated civic issue data and generate 3-5 predictive hotspot insights:

${recentIssuesJson}

Return JSON with predictions array. Each prediction should identify a specific ward, the risk category, surge probability (0-1), reasoning, and a concrete recommended action for municipal teams.`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                wardId: { type: 'string' },
                riskCategory: { type: 'string' },
                probability: { type: 'number' },
                reasoning: { type: 'string' },
                recommendedAction: { type: 'string' },
              },
              required: ['wardId', 'riskCategory', 'probability', 'reasoning', 'recommendedAction'],
            },
          },
        },
        required: ['predictions'],
      } as any,
    },
  });

  return JSON.parse(result.response.text());
}

/**
 * analyzeCommentSentiment — single-comment sentiment analysis (legacy compat)
 */
export async function analyzeCommentSentiment(commentText: string) {
  if (!apiKey) {
    return { toxicity: false, frustrationIndex: 5, dominantEmotion: 'neutral' };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze the sentiment of this citizen comment on an unresolved civic issue. Flag toxic/abusive language. Rate frustration 1-10. Identify dominant emotion.

Comment: "${commentText}"`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          toxicity: { type: 'boolean' },
          frustrationIndex: { type: 'integer' },
          dominantEmotion: { type: 'string', enum: ['anger', 'impatience', 'hopeful', 'indifference', 'neutral'] },
        },
        required: ['toxicity', 'frustrationIndex', 'dominantEmotion'],
      } as any,
    },
  });

  return JSON.parse(result.response.text());
}
