import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    activity: { count: vi.fn() },
    joinRequest: { count: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import { getProfileStats } from './profile';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockActivityCount = db.activity.count as any;
const mockJoinRequestCount = db.joinRequest.count as any;
const mockUserFindUnique = db.user.findUnique as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('getProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns activitiesHosted, activitiesJoined, and averageRating for a user', async () => {
    mockActivityCount.mockResolvedValue(5);
    mockJoinRequestCount.mockResolvedValue(3);
    mockUserFindUnique.mockResolvedValue({ rating: 4.2 });

    const result = await getProfileStats('user-1');

    expect(result).toEqual({
      activitiesHosted: 5,
      activitiesJoined: 3,
      averageRating: 4.2,
    });
  });

  it('returns averageRating as null for a new user with no ratings', async () => {
    mockActivityCount.mockResolvedValue(0);
    mockJoinRequestCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue({ rating: null });

    const result = await getProfileStats('user-new');

    expect(result).toEqual({
      activitiesHosted: 0,
      activitiesJoined: 0,
      averageRating: null,
    });
  });

  it('queries only approved join requests for activitiesJoined', async () => {
    mockActivityCount.mockResolvedValue(2);
    mockJoinRequestCount.mockResolvedValue(1);
    mockUserFindUnique.mockResolvedValue({ rating: 3.5 });

    await getProfileStats('user-1');

    expect(mockJoinRequestCount).toHaveBeenCalledWith({
      where: { userId: 'user-1', status: 'approved' },
    });
  });

  it('queries activities where user is the host', async () => {
    mockActivityCount.mockResolvedValue(2);
    mockJoinRequestCount.mockResolvedValue(1);
    mockUserFindUnique.mockResolvedValue({ rating: 3.5 });

    await getProfileStats('user-1');

    expect(mockActivityCount).toHaveBeenCalledWith({
      where: { hostId: 'user-1' },
    });
  });

  it('returns averageRating as null when user record is not found', async () => {
    mockActivityCount.mockResolvedValue(0);
    mockJoinRequestCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getProfileStats('user-ghost');

    expect(result.averageRating).toBeNull();
  });
});
