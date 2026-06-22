import { z } from 'zod';

export const IssueSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const IssueStatusSchema = z.enum([
  'reported',
  'open',
  'validated',
  'assigned',
  'in_progress',
  'resolved',
  'archived',
]);
export const IssueCategorySchema = z.enum([
  'pothole',
  'streetlight',
  'water',
  'waste',
  'encroachment',
  'other',
]);

export const CreateIssueSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3).max(500),
  reportedBy: z.string().min(1).max(128),
  overrideCategory: z.string().optional(),
  overrideSeverity: z.string().optional(),
});

export const ValidateIssueSchema = z.object({
  userId: z.string().min(1),
  userRole: z.enum(['citizen', 'validator', 'authority', 'admin']),
  status: z.enum(['valid', 'invalid']),
  comments: z.string().max(500).optional(),
});

export const ResolveIssueSchema = z.object({
  authorityId: z.string().min(1),
  remarks: z.string().max(1000).optional(),
});
