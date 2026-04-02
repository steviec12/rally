import type { ScoringUser, ScoringActivity, ScoringResult } from '@/types/scoring';
import { haversineKm } from '@/lib/geo';

const MAX_DISTANCE_KM = 50;
const MAX_ACTIVITY_COUNT = 20;
const DEFAULT_RATING_SCORE = 50;

function calcTagScore(interests: string[], tags: string[]): number {
  if (tags.length === 0) return 40;
  if (interests.length === 0) return 0;
  const matches = interests.filter((i) => tags.includes(i)).length;
  return (matches / tags.length) * 40;
}

function calcProximityScore(
  userLat: number, userLng: number,
  actLat: number, actLng: number,
): number {
  const dist = haversineKm(userLat, userLng, actLat, actLng);
  return Math.max(0, (1 - dist / MAX_DISTANCE_KM) * 30);
}

function calcRatingScore(rating: number | null): number {
  const raw = rating === null ? DEFAULT_RATING_SCORE : ((rating - 1) / 4) * 100;
  return (raw / 100) * 20;
}

function calcActivityCountScore(count: number): number {
  return (Math.min(count, MAX_ACTIVITY_COUNT) / MAX_ACTIVITY_COUNT) * 10;
}

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

  const tagScore = calcTagScore(requester.interests, activity.tags);
  const proximityScore = calcProximityScore(
    requester.locationLat, requester.locationLng,
    activity.locationLat, activity.locationLng,
  );
  const ratingScore = calcRatingScore(requester.rating);
  const activityCountScore = calcActivityCountScore(requester.activityCount);

  return {
    outcome: 'scored',
    breakdown: {
      total: tagScore + proximityScore + ratingScore + activityCountScore,
      tagScore,
      proximityScore,
      ratingScore,
      activityCountScore,
    },
  };
}
