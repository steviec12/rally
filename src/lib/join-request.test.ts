import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapRejectionToError } from './join-request';
import type { RejectionReason } from '@/types/scoring';

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    activity: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    joinRequest: {
      create: vi.fn(),
    },
  },
}));

// Mock scoring module
vi.mock('@/lib/scoring', () => ({
  calculateCompatibilityScore: vi.fn(),
}));

import { db } from '@/lib/db';
import { calculateCompatibilityScore } from '@/lib/scoring';
import { createJoinRequest } from './join-request';
import type { ScoringResult } from '@/types/scoring';

const mockedDb = vi.mocked(db);
const mockedScore = vi.mocked(calculateCompatibilityScore);

// Fixtures
const mockActivity = {
  id: 'activity-1',
  hostId: 'host-1',
  title: 'Pickup basketball',
  tags: ['basketball'],
  dateTime: new Date('2099-01-01T10:00:00Z'),
  location: 'Venice Beach',
  locationLat: 34.0,
  locationLng: -118.0,
  maxSpots: 4,
  status: 'open',
  _count: { joinRequests: 1 },
};

const mockUser = {
  id: 'user-1',
  interests: ['basketball'],
  locationLat: 34.05,
  locationLng: -118.05,
  rating: 4.0,
  activityCount: 5,
};

describe('mapRejectionToError', () => {
  it('maps self_join to 403 with correct message', () => {
    const result = mapRejectionToError('self_join');
    expect(result).toEqual({
      error: 'You cannot join your own activity.',
      status: 403,
    });
  });

  it('maps activity_full to 409 with correct message', () => {
    const result = mapRejectionToError('activity_full');
    expect(result).toEqual({
      error: 'This activity is full.',
      status: 409,
    });
  });

  it('maps activity_expired to 409 with correct message', () => {
    const result = mapRejectionToError('activity_expired');
    expect(result).toEqual({
      error: 'This activity has already started.',
      status: 409,
    });
  });
});

describe('createJoinRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when activity is not found', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(null);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'Activity not found.',
      status: 404,
    });
  });

  it('returns 404 when user is not found', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(null);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'User not found.',
      status: 404,
    });
  });

  it('returns 409 when activity is cancelled', async () => {
    mockedDb.activity.findUnique.mockResolvedValue({
      ...mockActivity,
      status: 'cancelled',
    } as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'This activity has been cancelled.',
      status: 409,
    });
  });

  it('returns rejection error when scoring rejects (self_join)', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({ outcome: 'rejected', reason: 'self_join' });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'You cannot join your own activity.',
      status: 403,
    });
  });

  it('returns rejection error when scoring rejects (activity_full)', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({ outcome: 'rejected', reason: 'activity_full' });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'This activity is full.',
      status: 409,
    });
  });

  it('creates join request on successful scoring', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({
      outcome: 'scored',
      breakdown: {
        total: 75,
        tagScore: 40,
        proximityScore: 25,
        ratingScore: 15,
        activityCountScore: 2.5,
      },
    });
    mockedDb.joinRequest.create.mockResolvedValue({
      id: 'jr-1',
      status: 'pending',
      compatibilityScore: 75,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    } as never);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: true,
      joinRequest: { id: 'jr-1', status: 'pending', compatibilityScore: 75 },
    });
    expect(mockedDb.joinRequest.create).toHaveBeenCalledWith({
      data: {
        activityId: 'activity-1',
        userId: 'user-1',
        compatibilityScore: 75,
      },
    });
  });

  it('returns 409 on duplicate join request (P2002)', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({
      outcome: 'scored',
      breakdown: {
        total: 75,
        tagScore: 40,
        proximityScore: 25,
        ratingScore: 15,
        activityCountScore: 2.5,
      },
    });
    const prismaError = new Error('Unique constraint failed');
    (prismaError as Record<string, unknown>).code = 'P2002';
    mockedDb.joinRequest.create.mockRejectedValue(prismaError);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'You have already requested to join this activity.',
      status: 409,
    });
  });

  it('builds ScoringUser with default lat/lng when user has null coordinates', async () => {
    const userWithNullCoords = { ...mockUser, locationLat: null, locationLng: null };
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(userWithNullCoords as never);
    mockedScore.mockReturnValue({
      outcome: 'scored',
      breakdown: {
        total: 50,
        tagScore: 40,
        proximityScore: 0,
        ratingScore: 15,
        activityCountScore: 2.5,
      },
    });
    mockedDb.joinRequest.create.mockResolvedValue({
      id: 'jr-2',
      status: 'pending',
      compatibilityScore: 50,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    } as never);

    await createJoinRequest('activity-1', 'user-1');

    expect(mockedScore).toHaveBeenCalledWith(
      expect.objectContaining({ locationLat: 0, locationLng: 0 }),
      expect.anything(),
    );
  });

  it('passes correct ScoringActivity with approvedCount from _count', async () => {
    mockedDb.activity.findUnique.mockResolvedValue({
      ...mockActivity,
      _count: { joinRequests: 3 },
    } as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({
      outcome: 'scored',
      breakdown: {
        total: 60,
        tagScore: 40,
        proximityScore: 10,
        ratingScore: 15,
        activityCountScore: 2.5,
      },
    });
    mockedDb.joinRequest.create.mockResolvedValue({
      id: 'jr-3',
      status: 'pending',
      compatibilityScore: 60,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    } as never);

    await createJoinRequest('activity-1', 'user-1');

    expect(mockedScore).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ approvedCount: 3 }),
    );
  });

  it('re-throws unexpected errors', async () => {
    mockedDb.activity.findUnique.mockResolvedValue(mockActivity as never);
    mockedDb.user.findUnique.mockResolvedValue(mockUser as never);
    mockedScore.mockReturnValue({
      outcome: 'scored',
      breakdown: {
        total: 75,
        tagScore: 40,
        proximityScore: 25,
        ratingScore: 15,
        activityCountScore: 2.5,
      },
    });
    mockedDb.joinRequest.create.mockRejectedValue(new Error('Connection lost'));

    await expect(createJoinRequest('activity-1', 'user-1')).rejects.toThrow('Connection lost');
  });
});
