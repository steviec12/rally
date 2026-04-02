import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapRejectionToError } from './join-request';

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

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockActivityFindUnique = db.activity.findUnique as any;
const mockUserFindUnique = db.user.findUnique as any;
const mockJoinRequestCreate = db.joinRequest.create as any;
const mockedScore = calculateCompatibilityScore as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

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
    mockActivityFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(mockUser);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'Activity not found.',
      status: 404,
    });
  });

  it('returns 404 when user is not found', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(null);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'User not found.',
      status: 404,
    });
  });

  it('returns 409 when activity is cancelled', async () => {
    mockActivityFindUnique.mockResolvedValue({
      ...mockActivity,
      status: 'cancelled',
    });
    mockUserFindUnique.mockResolvedValue(mockUser);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'This activity has been cancelled.',
      status: 409,
    });
  });

  it('returns rejection error when scoring rejects (self_join)', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
    mockedScore.mockReturnValue({ outcome: 'rejected', reason: 'self_join' });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'You cannot join your own activity.',
      status: 403,
    });
  });

  it('returns rejection error when scoring rejects (activity_full)', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
    mockedScore.mockReturnValue({ outcome: 'rejected', reason: 'activity_full' });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'This activity is full.',
      status: 409,
    });
  });

  it('returns rejection error when scoring rejects (activity_expired)', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
    mockedScore.mockReturnValue({ outcome: 'rejected', reason: 'activity_expired' });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'This activity has already started.',
      status: 409,
    });
  });

  it('creates join request on successful scoring', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
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
    mockJoinRequestCreate.mockResolvedValue({
      id: 'jr-1',
      status: 'pending',
      compatibilityScore: 75,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    });

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: true,
      joinRequest: { id: 'jr-1', status: 'pending', compatibilityScore: 75 },
    });
    expect(mockJoinRequestCreate).toHaveBeenCalledWith({
      data: {
        activityId: 'activity-1',
        userId: 'user-1',
        compatibilityScore: 75,
      },
    });
  });

  it('returns 409 on duplicate join request (P2002)', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
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
    const prismaError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    mockJoinRequestCreate.mockRejectedValue(prismaError);

    const result = await createJoinRequest('activity-1', 'user-1');
    expect(result).toEqual({
      success: false,
      error: 'You have already requested to join this activity.',
      status: 409,
    });
  });

  it('builds ScoringUser with default lat/lng when user has null coordinates', async () => {
    const userWithNullCoords = { ...mockUser, locationLat: null, locationLng: null };
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(userWithNullCoords);
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
    mockJoinRequestCreate.mockResolvedValue({
      id: 'jr-2',
      status: 'pending',
      compatibilityScore: 50,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    });

    await createJoinRequest('activity-1', 'user-1');

    expect(mockedScore).toHaveBeenCalledWith(
      expect.objectContaining({ locationLat: 0, locationLng: 0 }),
      expect.anything(),
    );
  });

  it('passes correct ScoringActivity with approvedCount from _count', async () => {
    mockActivityFindUnique.mockResolvedValue({
      ...mockActivity,
      _count: { joinRequests: 3 },
    });
    mockUserFindUnique.mockResolvedValue(mockUser);
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
    mockJoinRequestCreate.mockResolvedValue({
      id: 'jr-3',
      status: 'pending',
      compatibilityScore: 60,
      activityId: 'activity-1',
      userId: 'user-1',
      createdAt: new Date(),
    });

    await createJoinRequest('activity-1', 'user-1');

    expect(mockedScore).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ approvedCount: 3 }),
    );
  });

  it('re-throws unexpected errors', async () => {
    mockActivityFindUnique.mockResolvedValue(mockActivity);
    mockUserFindUnique.mockResolvedValue(mockUser);
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
    mockJoinRequestCreate.mockRejectedValue(new Error('Connection lost'));

    await expect(createJoinRequest('activity-1', 'user-1')).rejects.toThrow('Connection lost');
  });
});
