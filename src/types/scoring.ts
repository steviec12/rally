export interface ScoringUser {
  id: string;
  interests: string[];
  locationLat: number;
  locationLng: number;
  rating: number | null;
  activityCount: number;
}

export interface ScoringActivity {
  id: string;
  hostId: string;
  tags: string[];
  dateTime: Date;
  locationLat: number;
  locationLng: number;
  maxSpots: number;
  approvedCount: number;
}

export interface ScoreBreakdown {
  total: number;
  tagScore: number;
  proximityScore: number;
  ratingScore: number;
  activityCountScore: number;
}

export type RejectionReason = 'self_join' | 'activity_full' | 'activity_expired';

export type ScoringResult =
  | { outcome: 'scored'; breakdown: ScoreBreakdown }
  | { outcome: 'rejected'; reason: RejectionReason };
