import { db } from '@/lib/db';
import type { RatingResult } from '@/types/rating';

export async function createRating(
  raterId: string,
  rateeId: string,
  activityId: string,
  score: number
): Promise<RatingResult> {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return {
      success: false,
      error: 'Score must be an integer between 1 and 5.',
      status: 400,
    };
  }

  if (raterId === rateeId) {
    return {
      success: false,
      error: 'You cannot rate yourself.',
      status: 403,
    };
  }

  const activity = await db.activity.findUnique({
    where: { id: activityId },
    select: { id: true, hostId: true, dateTime: true, status: true },
  });

  if (!activity) {
    return { success: false, error: 'Activity not found.', status: 404 };
  }

  if (activity.dateTime > new Date()) {
    return {
      success: false,
      error: 'You can only rate participants after the activity has ended.',
      status: 403,
    };
  }

  if (activity.status === 'cancelled') {
    return {
      success: false,
      error: 'Cannot rate participants of a cancelled activity.',
      status: 403,
    };
  }

  const approvedJoinRequests = await db.joinRequest.findMany({
    where: { activityId, status: 'approved', userId: { in: [raterId, rateeId] } },
    select: { userId: true },
  });

  const approvedUserIds = new Set(approvedJoinRequests.map((jr: { userId: string }) => jr.userId));
  const isParticipant = (userId: string) =>
    userId === activity.hostId || approvedUserIds.has(userId);

  if (!isParticipant(raterId)) {
    return {
      success: false,
      error: 'You must be a participant to rate.',
      status: 403,
    };
  }

  if (!isParticipant(rateeId)) {
    return {
      success: false,
      error: 'Ratee is not a participant of this activity.',
      status: 404,
    };
  }

  try {
    const rating = await db.rating.create({
      data: { raterId, rateeId, activityId, score },
    });

    // Recalculate ratee's average rating atomically
    const { _avg } = await db.rating.aggregate({
      where: { rateeId },
      _avg: { score: true },
    });
    if (_avg.score !== null) {
      await db.user.update({
        where: { id: rateeId },
        data: { rating: Math.round(_avg.score * 10) / 10 },
      });
    }

    return { success: true, rating: { id: rating.id, score: rating.score } };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: 'You have already rated this participant for this activity.',
        status: 409,
      };
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}
