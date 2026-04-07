import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    activity: { findUnique: vi.fn() },
    joinRequest: { findMany: vi.fn() },
    rating: { create: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import { createRating } from './rating';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockActivityFindUnique = db.activity.findUnique as any;
const mockJoinRequestFindMany = db.joinRequest.findMany as any;
const mockRatingCreate = db.rating.create as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('createRating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('score validation', () => {
    it('rejects score of 0', async () => {
      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 0);
      expect(result).toEqual({
        success: false,
        error: 'Score must be an integer between 1 and 5.',
        status: 400,
      });
    });

    it('rejects score of 6', async () => {
      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 6);
      expect(result).toEqual({
        success: false,
        error: 'Score must be an integer between 1 and 5.',
        status: 400,
      });
    });

    it('rejects non-integer score of 3.5', async () => {
      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 3.5);
      expect(result).toEqual({
        success: false,
        error: 'Score must be an integer between 1 and 5.',
        status: 400,
      });
    });

    it('rejects negative score', async () => {
      const result = await createRating('rater-1', 'ratee-1', 'activity-1', -1);
      expect(result).toEqual({
        success: false,
        error: 'Score must be an integer between 1 and 5.',
        status: 400,
      });
    });
  });

  describe('self-rating', () => {
    it('rejects rating yourself', async () => {
      const result = await createRating('user-1', 'user-1', 'activity-1', 4);
      expect(result).toEqual({
        success: false,
        error: 'You cannot rate yourself.',
        status: 403,
      });
    });
  });

  describe('activity not found', () => {
    it('returns 404 when activity does not exist', async () => {
      mockActivityFindUnique.mockResolvedValue(null);

      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'Activity not found.',
        status: 404,
      });
    });
  });
});
