import { describe, it, expect } from 'vitest';
import { calculateCompatibilityScore } from './scoring';
import type { ScoringUser, ScoringActivity } from '@/types/scoring';

// Reusable fixtures — valid defaults that satisfy all guards unless overridden
const baseUser: ScoringUser = {
  id: 'user-1',
  interests: ['basketball'],
  locationLat: 34.0522,
  locationLng: -118.2437,
  rating: 4,
  activityCount: 5,
};

const baseActivity: ScoringActivity = {
  id: 'activity-1',
  hostId: 'host-1',
  tags: ['basketball'],
  dateTime: new Date('2099-01-01T10:00:00Z'),
  locationLat: 34.0522,
  locationLng: -118.2437,
  maxSpots: 4,
  approvedCount: 0,
};

describe('calculateCompatibilityScore', () => {
  describe('Group A — Rejection guards', () => {
    it('rejects self-join when requester is the host', () => {
      const result = calculateCompatibilityScore(
        { ...baseUser, id: 'host-1' },
        baseActivity,
      );
      expect(result).toEqual({ outcome: 'rejected', reason: 'self_join' });
    });

    it('rejects request when activity is full', () => {
      const result = calculateCompatibilityScore(
        baseUser,
        { ...baseActivity, maxSpots: 3, approvedCount: 3 },
      );
      expect(result).toEqual({ outcome: 'rejected', reason: 'activity_full' });
    });

    it('rejects request when activity date has passed', () => {
      const now = new Date('2025-06-01T12:00:00Z');
      const result = calculateCompatibilityScore(
        baseUser,
        { ...baseActivity, dateTime: new Date('2025-06-01T11:59:59Z') },
        now,
      );
      expect(result).toEqual({ outcome: 'rejected', reason: 'activity_expired' });
    });

    it('self_join takes priority over activity_full', () => {
      const result = calculateCompatibilityScore(
        { ...baseUser, id: 'host-1' },
        { ...baseActivity, maxSpots: 3, approvedCount: 3 },
      );
      expect(result).toEqual({ outcome: 'rejected', reason: 'self_join' });
    });
  });
});
