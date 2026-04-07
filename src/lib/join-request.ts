import { db } from "@/lib/db";
import { calculateCompatibilityScore } from "@/lib/scoring";
import type { ScoringUser, ScoringActivity, RejectionReason } from "@/types/scoring";
import type { JoinRequestResult, UpdateJoinRequestResult } from "@/types/join-request";

export type { JoinRequestResult, UpdateJoinRequestResult };

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

interface DbUser {
  id: string;
  interests: string[];
  locationLat: number | null;
  locationLng: number | null;
  rating: number | null;
  activityCount: number;
}

interface DbActivity {
  id: string;
  hostId: string;
  tags: string[];
  dateTime: Date;
  locationLat: number;
  locationLng: number;
  maxSpots: number;
  status: string;
  _count: { joinRequests: number };
}

function toScoringUser(user: DbUser): ScoringUser {
  return {
    id: user.id,
    interests: user.interests,
    locationLat: user.locationLat ?? 0,
    locationLng: user.locationLng ?? 0,
    rating: user.rating,
    activityCount: user.activityCount,
  };
}

function toScoringActivity(activity: DbActivity): ScoringActivity {
  return {
    id: activity.id,
    hostId: activity.hostId,
    tags: activity.tags,
    dateTime: activity.dateTime,
    locationLat: activity.locationLat,
    locationLng: activity.locationLng,
    maxSpots: activity.maxSpots,
    approvedCount: activity._count.joinRequests,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && (error as { code: unknown }).code === "P2002";
}

const JOIN_REQUEST_SELECT = {
  id: true,
  status: true,
  compatibilityScore: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, image: true },
  },
} as const;

export async function getJoinRequestsForHost(activityId: string) {
  return db.joinRequest.findMany({
    where: { activityId },
    orderBy: { compatibilityScore: "desc" as const },
    select: JOIN_REQUEST_SELECT,
  });
}

export async function updateJoinRequestStatus(
  joinRequestId: string,
  hostUserId: string,
  newStatus: "approved" | "declined",
  expectedActivityId?: string,
): Promise<UpdateJoinRequestResult> {
  const joinRequest = await db.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: {
      activity: {
        include: {
          _count: {
            select: { joinRequests: { where: { status: "approved" } } },
          },
        },
      },
    },
  });

  if (!joinRequest) {
    return { success: false, error: "Join request not found.", status: 404 };
  }

  if (expectedActivityId && joinRequest.activityId !== expectedActivityId) {
    return { success: false, error: "Join request does not belong to this activity.", status: 404 };
  }

  if (joinRequest.activity.hostId !== hostUserId) {
    return {
      success: false,
      error: "Only the activity host can update join requests.",
      status: 403,
    };
  }

  if (joinRequest.status !== "pending") {
    return {
      success: false,
      error: "This join request has already been resolved.",
      status: 409,
    };
  }

  if (
    newStatus === "approved" &&
    joinRequest.activity._count.joinRequests >= joinRequest.activity.maxSpots
  ) {
    return { success: false, error: "This activity is full.", status: 409 };
  }

  const shouldMarkFull =
    newStatus === "approved" &&
    joinRequest.activity._count.joinRequests + 1 >= joinRequest.activity.maxSpots;

  if (shouldMarkFull) {
    await db.$transaction([
      db.joinRequest.update({
        where: { id: joinRequestId },
        data: { status: newStatus },
      }),
      db.activity.update({
        where: { id: joinRequest.activity.id },
        data: { status: "full" },
      }),
    ]);
  } else {
    await db.joinRequest.update({
      where: { id: joinRequestId },
      data: { status: newStatus },
    });
  }

  return { success: true };
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

  if (activity.status === "full") {
    return { success: false, error: "This activity is full.", status: 409 };
  }

  const result = calculateCompatibilityScore(
    toScoringUser(user),
    toScoringActivity(activity as DbActivity),
  );

  if (result.outcome === "rejected") {
    return { success: false, ...mapRejectionToError(result.reason) };
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
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "You have already requested to join this activity.",
        status: 409,
      };
    }
    throw error;
  }
}
