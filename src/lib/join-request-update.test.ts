import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    joinRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import { updateJoinRequestStatus } from './join-request';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockFindUnique = db.joinRequest.findUnique as any;
const mockUpdate = db.joinRequest.update as any;
const mockActivityUpdate = db.activity.update as any;
const mockNotificationCreate = db.notification.create as any;
const mockTransaction = db.$transaction as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Fixture: a pending join request with activity context
const mockJoinRequest = {
  id: 'jr-1',
  status: 'pending',
  activityId: 'activity-1',
  userId: 'user-1',
  activity: {
    id: 'activity-1',
    hostId: 'host-1',
    maxSpots: 4,
    _count: { joinRequests: 1 }, // 1 approved so far
  },
};

describe('updateJoinRequestStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when join request is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await updateJoinRequestStatus('jr-nonexistent', 'host-1', 'approved');

    expect(result).toEqual({
      success: false,
      error: 'Join request not found.',
      status: 404,
    });
  });

  it('returns 403 when caller is not the activity host', async () => {
    mockFindUnique.mockResolvedValue(mockJoinRequest);

    const result = await updateJoinRequestStatus('jr-1', 'not-the-host', 'approved');

    expect(result).toEqual({
      success: false,
      error: 'Only the activity host can update join requests.',
      status: 403,
    });
  });

  it('returns 409 when join request is already approved', async () => {
    mockFindUnique.mockResolvedValue({ ...mockJoinRequest, status: 'approved' });

    const result = await updateJoinRequestStatus('jr-1', 'host-1', 'declined');

    expect(result).toEqual({
      success: false,
      error: 'This join request has already been resolved.',
      status: 409,
    });
  });

  it('returns 409 when join request is already declined', async () => {
    mockFindUnique.mockResolvedValue({ ...mockJoinRequest, status: 'declined' });

    const result = await updateJoinRequestStatus('jr-1', 'host-1', 'approved');

    expect(result).toEqual({
      success: false,
      error: 'This join request has already been resolved.',
      status: 409,
    });
  });

  it('returns 409 when approving but activity is full', async () => {
    mockFindUnique.mockResolvedValue({
      ...mockJoinRequest,
      activity: {
        ...mockJoinRequest.activity,
        maxSpots: 4,
        _count: { joinRequests: 4 }, // already at capacity
      },
    });

    const result = await updateJoinRequestStatus('jr-1', 'host-1', 'approved');

    expect(result).toEqual({
      success: false,
      error: 'This activity is full.',
      status: 409,
    });
  });

  it('successfully approves a pending request', async () => {
    mockFindUnique.mockResolvedValue(mockJoinRequest);
    mockUpdate.mockResolvedValue({ ...mockJoinRequest, status: 'approved' });
    mockNotificationCreate.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);

    const result = await updateJoinRequestStatus('jr-1', 'host-1', 'approved');

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('flips activity status to full when last spot is approved (via transaction)', async () => {
    mockFindUnique.mockResolvedValue({
      ...mockJoinRequest,
      activity: {
        ...mockJoinRequest.activity,
        maxSpots: 4,
        _count: { joinRequests: 3 }, // 3 approved, approving this makes 4 = maxSpots
      },
    });
    mockTransaction.mockResolvedValue([]);
    mockNotificationCreate.mockResolvedValue({});

    await updateJoinRequestStatus('jr-1', 'host-1', 'approved');

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockActivityUpdate).toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: { userId: 'user-1', type: 'request_approved', activityId: 'activity-1' },
    });
  });

  it('does not flip activity status when spots remain after approval', async () => {
    mockFindUnique.mockResolvedValue({
      ...mockJoinRequest,
      activity: {
        ...mockJoinRequest.activity,
        maxSpots: 4,
        _count: { joinRequests: 1 }, // 1 approved + this = 2, still under 4
      },
    });
    mockUpdate.mockResolvedValue({ ...mockJoinRequest, status: 'approved' });
    mockNotificationCreate.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);

    await updateJoinRequestStatus('jr-1', 'host-1', 'approved');

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockActivityUpdate).not.toHaveBeenCalled();
  });

  it('does not flip activity status when declining at capacity', async () => {
    mockFindUnique.mockResolvedValue({
      ...mockJoinRequest,
      activity: {
        ...mockJoinRequest.activity,
        maxSpots: 4,
        _count: { joinRequests: 3 }, // at capacity minus 1, but declining
      },
    });
    mockUpdate.mockResolvedValue({ ...mockJoinRequest, status: 'declined' });
    mockNotificationCreate.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);

    await updateJoinRequestStatus('jr-1', 'host-1', 'declined');

    expect(mockActivityUpdate).not.toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('successfully declines a pending request', async () => {
    mockFindUnique.mockResolvedValue(mockJoinRequest);
    mockUpdate.mockResolvedValue({ ...mockJoinRequest, status: 'declined' });
    mockNotificationCreate.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);

    const result = await updateJoinRequestStatus('jr-1', 'host-1', 'declined');

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalled();
  });
});
