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

  // TODO: implement remaining validation and creation
  return { success: false, error: "Not implemented.", status: 400 };
}
