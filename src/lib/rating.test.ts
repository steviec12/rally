import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    activity: { findUnique: vi.fn() },
    joinRequest: { findMany: vi.fn() },
    rating: { create: vi.fn(), aggregate: vi.fn() },
    user: { update: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import { createRating } from './rating';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockActivityFindUnique = db.activity.findUnique as any;
const mockJoinRequestFindMany = db.joinRequest.findMany as any;
const mockRatingCreate = db.rating.create as any;
const mockRatingAggregate = db.rating.aggregate as any;
const mockUserUpdate = db.user.update as any;
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

  describe('activity not yet past', () => {
    it('returns 403 when activity dateTime is in the future', async () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: futureDate,
        status: 'open',
      });

      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'You can only rate participants after the activity has ended.',
        status: 403,
      });
    });
  });

  describe('activity cancelled', () => {
    it('returns 403 when activity is cancelled', async () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'cancelled',
      });

      const result = await createRating('rater-1', 'ratee-1', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'Cannot rate participants of a cancelled activity.',
        status: 403,
      });
    });
  });

  describe('rater not a participant', () => {
    it('returns 403 when rater is not host and has no approved join request', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      mockJoinRequestFindMany.mockResolvedValue([]);

      const result = await createRating('stranger', 'ratee-1', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'You must be a participant to rate.',
        status: 403,
      });
    });
  });

  describe('ratee not a participant', () => {
    it('returns 404 when ratee is not host and has no approved join request', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      // Rater is host, ratee has no join request
      mockJoinRequestFindMany.mockResolvedValue([]);

      const result = await createRating('host-1', 'stranger', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'Ratee is not a participant of this activity.',
        status: 404,
      });
    });
  });

  describe('happy path', () => {
    it('creates a rating when host rates an approved participant', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      mockJoinRequestFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      mockRatingCreate.mockResolvedValue({ id: 'r1', score: 4 });
      mockRatingAggregate.mockResolvedValue({ _avg: { score: 4.0 } });
      mockUserUpdate.mockResolvedValue({});

      const result = await createRating('host-1', 'user-1', 'activity-1', 4);

      expect(result).toEqual({
        success: true,
        rating: { id: 'r1', score: 4 },
      });
      expect(mockRatingCreate).toHaveBeenCalledWith({
        data: {
          raterId: 'host-1',
          rateeId: 'user-1',
          activityId: 'activity-1',
          score: 4,
        },
      });
    });
  });

  describe('anonymity', () => {
    it('does not expose rater identity in the result', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      mockJoinRequestFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      mockRatingCreate.mockResolvedValue({ id: 'r1', score: 4 });
      mockRatingAggregate.mockResolvedValue({ _avg: { score: 4.0 } });
      mockUserUpdate.mockResolvedValue({});

      const result = await createRating('host-1', 'user-1', 'activity-1', 4);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.rating).not.toHaveProperty('raterId');
        expect(result.rating).not.toHaveProperty('rater');
        expect(result.rating).not.toHaveProperty('raterName');
        expect(result.rating).not.toHaveProperty('raterEmail');
        expect(Object.keys(result.rating)).toEqual(['id', 'score']);
      }
    });
  });

  describe('average rating recalculation', () => {
    it('updates ratee average rating after successful rating', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      mockJoinRequestFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      mockRatingCreate.mockResolvedValue({ id: 'r1', score: 4 });
      mockRatingAggregate.mockResolvedValue({ _avg: { score: 3.5 } });
      mockUserUpdate.mockResolvedValue({});

      await createRating('host-1', 'user-1', 'activity-1', 4);

      expect(mockRatingAggregate).toHaveBeenCalledWith({
        where: { rateeId: 'user-1' },
        _avg: { score: true },
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { rating: 3.5 },
      });
    });
  });

  describe('duplicate rating', () => {
    it('returns 409 when unique constraint is violated', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      mockJoinRequestFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      mockRatingCreate.mockRejectedValue({ code: 'P2002' });

      const result = await createRating('host-1', 'user-1', 'activity-1', 4);

      expect(result).toEqual({
        success: false,
        error: 'You have already rated this participant for this activity.',
        status: 409,
      });
    });
  });

  describe('host can be rated by participant', () => {
    it('allows an approved participant to rate the host', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockActivityFindUnique.mockResolvedValue({
        id: 'activity-1',
        hostId: 'host-1',
        dateTime: pastDate,
        status: 'completed',
      });
      // user-1 has approved join request; host-1 is the host (ratee)
      mockJoinRequestFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      mockRatingCreate.mockResolvedValue({ id: 'r2', score: 5 });
      mockRatingAggregate.mockResolvedValue({ _avg: { score: 5.0 } });
      mockUserUpdate.mockResolvedValue({});

      const result = await createRating('user-1', 'host-1', 'activity-1', 5);

      expect(result).toEqual({
        success: true,
        rating: { id: 'r2', score: 5 },
      });
    });
  });
});
