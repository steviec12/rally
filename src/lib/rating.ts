import { db } from "@/lib/db";
import type { RatingResult } from "@/types/rating";

export async function createRating(
  raterId: string,
  rateeId: string,
  activityId: string,
  score: number,
): Promise<RatingResult> {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return {
      success: false,
      error: "Score must be an integer between 1 and 5.",
      status: 400,
    };
  }

  if (raterId === rateeId) {
    return {
      success: false,
      error: "You cannot rate yourself.",
      status: 403,
    };
  }

  const activity = await db.activity.findUnique({
    where: { id: activityId },
    select: { id: true, hostId: true, dateTime: true, status: true },
  });

  if (!activity) {
    return { success: false, error: "Activity not found.", status: 404 };
  }

  if (activity.dateTime > new Date()) {
    return {
      success: false,
      error: "You can only rate participants after the activity has ended.",
      status: 403,
    };
  }

  if (activity.status === "cancelled") {
    return {
      success: false,
      error: "Cannot rate participants of a cancelled activity.",
      status: 403,
    };
  }

  const approvedJoinRequests = await db.joinRequest.findMany({
    where: { activityId, status: "approved", userId: { in: [raterId, rateeId] } },
    select: { userId: true },
  });

  const approvedUserIds = new Set(approvedJoinRequests.map((jr: { userId: string }) => jr.userId));

  const raterIsParticipant = raterId === activity.hostId || approvedUserIds.has(raterId);
  if (!raterIsParticipant) {
    return {
      success: false,
      error: "You must be a participant to rate.",
      status: 403,
    };
  }

  const rateeIsParticipant = rateeId === activity.hostId || approvedUserIds.has(rateeId);
  if (!rateeIsParticipant) {
    return {
      success: false,
      error: "Ratee is not a participant of this activity.",
      status: 404,
    };
  }

  // TODO: implement rating creation
  return { success: false, error: "Not implemented.", status: 400 };
}
