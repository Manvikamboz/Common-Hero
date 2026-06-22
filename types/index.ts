// ============================================================
// Community Hero — Shared TypeScript Types
// ============================================================

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus =
  | 'reported'
  | 'open'
  | 'validated'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'archived';
export type IssueCategory =
  | 'pothole'
  | 'streetlight'
  | 'water'
  | 'waste'
  | 'encroachment'
  | 'other';

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address: string;
  geohash: string;
}

export interface IssueValidation {
  validatorId: string;
  validatedAt: string;
  status: 'valid' | 'invalid';
  comments: string;
}

export interface IssueAIMetadata {
  categoryConfidence: number;
  originalCategory: string;
  suggestedSeverity: IssueSeverity;
  autoSummary: string;
  duplicateScore?: number;
  possibleDuplicateOf?: string;
  sentimentIndex?: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: IssueLocation;
  mediaUrls: string[];
  reportedBy: string;
  createdAt: string;
  upvotes: number;
  validations: IssueValidation[];
  aiMetadata: IssueAIMetadata;
  resolvedAt?: string;
  resolutionProofUrl?: string;
  resolutionRemarks?: string;
  assignedAuthority?: string;
  wardId?: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  awardedAt: string;
}

export type UserRole = 'citizen' | 'validator' | 'authority' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  points: number;
  issuesReported: number;
  issuesValidated: number;
  issuesResolved?: number;
  badges: UserBadge[];
  wardId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  text: string;
  createdAt: string;
  sentiment?: {
    toxicity: boolean;
    frustrationIndex: number;
    dominantEmotion: string;
  };
}

export interface PredictionResult {
  wardId: string;
  riskCategory: string;
  probability: number;
  reasoning: string;
  recommendedAction: string;
}

export interface AnalyticsDashboard {
  activeIssuesCount: number;
  resolvedIssuesCount: number;
  averageSeverity: string;
  categoryDistribution: Record<string, number>;
  avgResolutionTimeHours?: number;
  activeCitizensCount?: number;
}

export interface ZoneStat {
  wardId: string;
  category: string;
  count: number;
  resolvedCount: number;
  month: string;
}
