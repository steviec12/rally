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

export async function createJoinRequest(
  activityId: string,
  userId: string,
): Promise<JoinRequestResult> {
  const [activity, user] = await Promise.all([
    db.activity.findUnique({
      where: { id: activityId },
      include: { _count: { select: { joinRequests: { where: { status: "approved" } } } } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        interests: true,
        locationLat: true,
        locationLng: true,
        rating: true,
        activityCount: true,
      },
    }),
  ]);

  if (!activity) {
    return { success: false, error: "Activity not found.", status: 404 };
  }

  if (!user) {
    return { success: false, error: "User not found.", status: 404 };
  }

  if (activity.status === "cancelled") {
    return { success: false, error: "This activity has been cancelled.", status: 409 };
  }

  const scoringUser: ScoringUser = {
    id: user.id,
    interests: user.interests,
    locationLat: user.locationLat ?? 0,
    locationLng: user.locationLng ?? 0,
    rating: user.rating,
    activityCount: user.activityCount,
  };

  const scoringActivity: ScoringActivity = {
    id: activity.id,
    hostId: activity.hostId,
    tags: activity.tags,
    dateTime: activity.dateTime,
    locationLat: activity.locationLat,
    locationLng: activity.locationLng,
    maxSpots: activity.maxSpots,
    approvedCount: activity._count.joinRequests,
  };

  const result = calculateCompatibilityScore(scoringUser, scoringActivity);

  if (result.outcome === "rejected") {
    const mapped = mapRejectionToError(result.reason);
    return { success: false, ...mapped };
  }

  try {
    const joinRequest = await db.joinRequest.create({
      data: {
        activityId,
        userId,
        compatibilityScore: result.breakdown.total,
      },
    });

    return {
      success: true,
      joinRequest: {
        id: joinRequest.id,
        status: joinRequest.status,
        compatibilityScore: joinRequest.compatibilityScore,
      },
    };
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false,
        error: "You have already requested to join this activity.",
        status: 409,
      };
    }
    throw error;
  }
}
