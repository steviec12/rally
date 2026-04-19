import { db } from '@/lib/db';

export interface ProfileStats {
  activitiesHosted: number;
  activitiesJoined: number;
  averageRating: number | null;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [activitiesHosted, activitiesJoined, user] = await Promise.all([
    db.activity.count({ where: { hostId: userId } }),
    db.joinRequest.count({ where: { userId, status: 'approved' } }),
    db.user.findUnique({ where: { id: userId }, select: { rating: true } }),
  ]);

  return {
    activitiesHosted,
    activitiesJoined,
    averageRating: user?.rating ?? null,
  };
}
