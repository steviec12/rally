import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    activity: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    joinRequest: {},
    rating: {},
  },
}));
// Keep pure functions (validateActivityInput, sanitizeTags) real; mock only the db-dependent one.
vi.mock('@/lib/activity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/activity')>();
  return { ...actual, getFeedActivities: vi.fn() };
});

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getFeedActivities } from '@/lib/activity';
import { GET, POST } from './route';
import { mockAuth } from '@/lib/__tests__/setup';
import type { MockPrismaClient } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGetFeedActivities = getFeedActivities as any;
const mockDb = db as unknown as MockPrismaClient;
/* eslint-enable @typescript-eslint/no-explicit-any */

const FUTURE_DATE = new Date(Date.now() + 86400000).toISOString();
const VALID_BODY = {
  title: 'Morning Run',
  dateTime: FUTURE_DATE,
  location: 'Venice Beach',
  maxSpots: 4,
  tags: ['running'],
  locationLat: 33.9,
  locationLng: -118.4,
};

describe('GET /api/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
    mockGetFeedActivities.mockResolvedValue({ activities: [], nextCursor: null });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/activities');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with activities array when authenticated', async () => {
    mockGetFeedActivities.mockResolvedValue({
      activities: [{ id: 'a1', title: 'Morning Run' }],
      nextCursor: null,
    });
    const req = new Request('http://localhost/api/activities');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
    expect(body.activities[0].id).toBe('a1');
  });

  it('returns 400 when dateFrom is not a valid date string', async () => {
    const req = new Request('http://localhost/api/activities?dateFrom=not-a-date');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when dateTo is not a valid date string', async () => {
    const req = new Request('http://localhost/api/activities?dateTo=not-a-date');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when distanceKm is negative', async () => {
    const req = new Request('http://localhost/api/activities?distanceKm=-5');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when distanceKm is zero', async () => {
    const req = new Request('http://localhost/api/activities?distanceKm=0');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('passes cursor query param to getFeedActivities', async () => {
    const req = new Request('http://localhost/api/activities?cursor=test-cursor');
    await GET(req);
    expect(mockGetFeedActivities).toHaveBeenCalledWith('user-1', 'test-cursor', expect.any(Object));
  });

  it('fetches user location when distanceKm is provided and passes it to getFeedActivities', async () => {
    mockDb.user.findUnique.mockResolvedValue({ locationLat: 34.05, locationLng: -118.24 });
    const req = new Request('http://localhost/api/activities?distanceKm=10');
    await GET(req);
    expect(mockDb.user.findUnique).toHaveBeenCalled();
    expect(mockGetFeedActivities).toHaveBeenCalledWith(
      'user-1',
      undefined,
      expect.objectContaining({ distanceKm: 10, userLat: 34.05, userLng: -118.24 })
    );
  });
});

describe('POST /api/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when request body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const { title: _title, ...noTitle } = VALID_BODY;
    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noTitle),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Title is required.');
  });

  it('returns 400 when dateTime is in the past', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, dateTime: pastDate }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Date must be in the future.');
  });

  it('returns 400 when maxSpots is 0', async () => {
    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, maxSpots: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Max spots must be at least 1.');
  });

  it('returns 201 with created activity for valid input', async () => {
    const fakeActivity = {
      id: 'activity-new-1',
      hostId: 'user-1',
      title: 'Morning Run',
      dateTime: new Date(FUTURE_DATE),
      location: 'Venice Beach',
      maxSpots: 4,
      tags: ['running'],
      status: 'open',
      description: null,
      locationLat: 33.9,
      locationLng: -118.4,
      cancellationReason: null,
      createdAt: new Date(),
    };
    mockDb.activity.create.mockResolvedValue(fakeActivity);

    const req = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('activity-new-1');
    expect(body.hostId).toBe('user-1');
  });
});
