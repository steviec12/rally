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

  // TODO: implement remaining validation and creation
  return { success: false, error: "Not implemented.", status: 400 };
}
