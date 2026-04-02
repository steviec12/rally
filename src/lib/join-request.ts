import { db } from "@/lib/db";
import { calculateCompatibilityScore } from "@/lib/scoring";
import type { ScoringUser, ScoringActivity, RejectionReason } from "@/types/scoring";

export type JoinRequestResult =
  | { success: true; joinRequest: { id: string; status: string; compatibilityScore: number | null } }
  | { success: false; error: string; status: 403 | 404 | 409 };

export function mapRejectionToError(reason: RejectionReason): { error: string; status: 403 | 409 } {
  switch (reason) {
    case 'self_join':
      return { error: 'You cannot join your own activity.', status: 403 };
    case 'activity_full':
      return { error: 'This activity is full.', status: 409 };
    case 'activity_expired':
      return { error: 'This activity has already started.', status: 409 };
  }
}
