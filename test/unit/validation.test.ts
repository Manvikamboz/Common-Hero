import { describe, it, expect } from 'vitest';
import { CreateIssueSchema, ValidateIssueSchema, ResolveIssueSchema } from '@/lib/validation';

describe('Validation Schemas Unit Tests', () => {
  describe('CreateIssueSchema', () => {
    it('should validate correctly structured payloads', () => {
      const valid = {
        title: 'Broken streetlight on MG Road',
        description: 'The streetlamp outside House 12 is completely dark and needs replacement.',
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'MG Road, New Delhi',
        reportedBy: 'user_123',
      };
      const result = CreateIssueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail validation if title is too short', () => {
      const invalid = {
        title: 'Ab',
        description: 'The streetlamp outside House 12 is completely dark.',
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'MG Road, New Delhi',
        reportedBy: 'user_123',
      };
      const result = CreateIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail validation if coordinates are out of bounds', () => {
      const invalid = {
        title: 'Broken streetlight on MG Road',
        description: 'The streetlamp outside House 12 is completely dark.',
        latitude: 120.0, // Invalid latitude
        longitude: 77.2090,
        address: 'MG Road, New Delhi',
        reportedBy: 'user_123',
      };
      const result = CreateIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ValidateIssueSchema', () => {
    it('should validate correct validations', () => {
      const valid = {
        userId: 'user_123',
        userRole: 'citizen',
        status: 'valid',
        comments: 'I confirmed this is broken',
      };
      const result = ValidateIssueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid user roles', () => {
      const invalid = {
        userId: 'user_123',
        userRole: 'superman', // Invalid role
        status: 'valid',
      };
      const result = ValidateIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ResolveIssueSchema', () => {
    it('should validate resolving data', () => {
      const valid = {
        authorityId: 'auth_789',
        remarks: 'Streetlight bulb replaced with energy saving LED.',
      };
      const result = ResolveIssueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
