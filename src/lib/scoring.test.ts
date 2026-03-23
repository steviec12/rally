import { describe, it, expect, assert } from 'vitest';
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

  describe('Group B — Individual factor scores', () => {
    // Fixtures with all factors maxed — used as a baseline to isolate one factor at a time
    const maxUser: ScoringUser = {
      id: 'user-1',
      interests: ['basketball', 'running'],
      locationLat: 34.0522,
      locationLng: -118.2437,
      rating: 5,
      activityCount: 20,
    };

    const maxActivity: ScoringActivity = {
      id: 'activity-1',
      hostId: 'host-1',
      tags: ['basketball', 'running'],
      dateTime: new Date('2099-01-01T10:00:00Z'),
      locationLat: 34.0522,
      locationLng: -118.2437,
      maxSpots: 4,
      approvedCount: 0,
    };

    // --- Tag factor ---

    it('perfect tag match produces full tag contribution (40)', () => {
      const result = calculateCompatibilityScore(maxUser, maxActivity);
      assert(result.outcome === 'scored');
      expect(result.breakdown.tagScore).toBe(40);
    });

    it('no tag match produces zero tag contribution but non-zero total', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, interests: ['gaming'] },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.tagScore).toBe(0);
      expect(result.breakdown.total).toBeGreaterThan(0);
    });

    it('partial tag match (1 of 2 activity tags) produces proportional tag score (20)', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, interests: ['basketball', 'gaming'] },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.tagScore).toBe(20);
    });

    it('empty activity tags gives full tag credit', () => {
      const result = calculateCompatibilityScore(
        maxUser,
        { ...maxActivity, tags: [] },
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.tagScore).toBe(40);
    });

    it('empty requester interests with non-empty activity tags gives zero tag score', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, interests: [] },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.tagScore).toBe(0);
    });

    // --- Proximity factor ---

    it('zero distance produces full proximity contribution (30)', () => {
      const result = calculateCompatibilityScore(maxUser, maxActivity);
      assert(result.outcome === 'scored');
      expect(result.breakdown.proximityScore).toBe(30);
    });

    it('distance at exactly the 50 km cap produces zero proximity contribution', () => {
      // ~50 km north of Los Angeles along same longitude
      const result = calculateCompatibilityScore(
        { ...maxUser, locationLat: 34.0522, locationLng: -118.2437 },
        { ...maxActivity, locationLat: 34.5018, locationLng: -118.2437 },
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.proximityScore).toBe(0);
    });

    it('distance beyond the cap produces zero proximity contribution (no negative)', () => {
      // ~100 km north
      const result = calculateCompatibilityScore(
        { ...maxUser, locationLat: 34.0522, locationLng: -118.2437 },
        { ...maxActivity, locationLat: 34.9514, locationLng: -118.2437 },
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.proximityScore).toBe(0);
    });

    it('distance at ~25 km produces half proximity contribution (15)', () => {
      // ~25 km north
      const result = calculateCompatibilityScore(
        { ...maxUser, locationLat: 34.0522, locationLng: -118.2437 },
        { ...maxActivity, locationLat: 34.2770, locationLng: -118.2437 },
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.proximityScore).toBeCloseTo(15, 0);
    });

    // --- Rating factor ---

    it('rating of 5 produces full rating contribution (20)', () => {
      const result = calculateCompatibilityScore(maxUser, maxActivity);
      assert(result.outcome === 'scored');
      expect(result.breakdown.ratingScore).toBe(20);
    });

    it('rating of 1 produces zero rating contribution', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, rating: 1 },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.ratingScore).toBe(0);
    });

    it('rating of 3 produces half rating contribution (10)', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, rating: 3 },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.ratingScore).toBe(10);
    });

    it('null rating (new user) produces neutral rating contribution (10)', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, rating: null },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.ratingScore).toBe(10);
    });

    // --- Activity count factor ---

    it('zero activity count produces zero history contribution', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, activityCount: 0 },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.activityCountScore).toBe(0);
    });

    it('activity count at cap (20) produces full history contribution (10)', () => {
      const result = calculateCompatibilityScore(maxUser, maxActivity);
      assert(result.outcome === 'scored');
      expect(result.breakdown.activityCountScore).toBe(10);
    });

    it('activity count beyond cap (50) is clamped to full history contribution (10)', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, activityCount: 50 },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.activityCountScore).toBe(10);
    });

    it('activity count at midpoint (10) produces half history contribution (5)', () => {
      const result = calculateCompatibilityScore(
        { ...maxUser, activityCount: 10 },
        maxActivity,
      );
      assert(result.outcome === 'scored');
      expect(result.breakdown.activityCountScore).toBe(5);
    });
  });
});
