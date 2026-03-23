import type { ScoringUser, ScoringActivity, ScoringResult } from '@/types/scoring';

export function calculateCompatibilityScore(
  requester: ScoringUser,
  activity: ScoringActivity,
  now: Date = new Date(),
): ScoringResult {
  if (requester.id === activity.hostId) {
    return { outcome: 'rejected', reason: 'self_join' };
  }

  if (activity.approvedCount >= activity.maxSpots) {
    return { outcome: 'rejected', reason: 'activity_full' };
  }

  if (activity.dateTime <= now) {
    return { outcome: 'rejected', reason: 'activity_expired' };
  }

  return {
    outcome: 'scored',
    breakdown: {
      total: 0,
      tagScore: 0,
      proximityScore: 0,
      ratingScore: 0,
      activityCountScore: 0,
    },
  };
}
