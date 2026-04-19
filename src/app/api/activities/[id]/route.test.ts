/**
 * Tests for /api/activities/[id] — PATCH and DELETE handlers.
 *
 * Note: this route file exports only PATCH and DELETE. There is no GET handler
 * at this path; activity detail rendering is done server-side in the page component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    activity: { findUnique: vi.fn(), update: vi.fn() },
    user: {},
    joinRequest: {},
    rating: {},
  },
}));
// Keep validateActivityInput and sanitizeTags real; mock only the db-dependent cancelActivity.
vi.mock('@/lib/activity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/activity')>();
  return { ...actual, cancelActivity: vi.fn() };
});

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { cancelActivity } from '@/lib/activity';
import { PATCH, DELETE } from './route';
import { mockAuth } from '@/lib/__tests__/setup';
import type { MockPrismaClient } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockCancelActivity = cancelActivity as any;
const mockDb = db as unknown as MockPrismaClient;
/* eslint-enable @typescript-eslint/no-explicit-any */

const FUTURE_DATE = new Date(Date.now() + 86400000);
const PAST_DATE = new Date(Date.now() - 86400000);

const MOCK_ACTIVITY = {
  id: 'activity-1',
  hostId: 'user-1',
  title: 'Morning Run',
  dateTime: FUTURE_DATE,
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

const VALID_PATCH_BODY = {
  title: 'Evening Run',
  dateTime: new Date(Date.now() + 172800000).toISOString(), // 2 days out
  location: 'Santa Monica',
  maxSpots: 6,
  tags: ['running'],
  locationLat: 34.01,
  locationLng: -118.49,
};

describe('PATCH /api/activities/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PATCH_BODY),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when activity does not exist', async () => {
    mockDb.activity.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/activities/no-such-id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PATCH_BODY),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'no-such-id' }) });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the host', async () => {
    mockDb.activity.findUnique.mockResolvedValue({ ...MOCK_ACTIVITY, hostId: 'other-user' });
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PATCH_BODY),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 403 when activity has already started', async () => {
    mockDb.activity.findUnique.mockResolvedValue({ ...MOCK_ACTIVITY, dateTime: PAST_DATE });
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PATCH_BODY),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid input (missing title)', async () => {
    mockDb.activity.findUnique.mockResolvedValue(MOCK_ACTIVITY);
    const { title: _title, ...noTitle } = VALID_PATCH_BODY;
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noTitle),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Title is required.');
  });

  it('returns 200 with updated activity for valid host request', async () => {
    mockDb.activity.findUnique.mockResolvedValue(MOCK_ACTIVITY);
    const updatedActivity = { ...MOCK_ACTIVITY, title: 'Evening Run', maxSpots: 6 };
    mockDb.activity.update.mockResolvedValue(updatedActivity);

    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PATCH_BODY),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Evening Run');
    expect(body.maxSpots).toBe(6);
  });
});

describe('DELETE /api/activities/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when activity does not exist', async () => {
    mockCancelActivity.mockResolvedValue({
      success: false,
      error: 'Activity not found.',
      status: 404,
    });
    const req = new Request('http://localhost/api/activities/no-such-id', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'no-such-id' }) });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the host', async () => {
    mockCancelActivity.mockResolvedValue({
      success: false,
      error: 'Forbidden',
      status: 403,
    });
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 200 on successful cancellation', async () => {
    mockCancelActivity.mockResolvedValue({ success: true });
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 when reason exceeds 500 characters', async () => {
    const req = new Request('http://localhost/api/activities/activity-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'x'.repeat(501) }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'activity-1' }) });
    expect(res.status).toBe(400);
  });
});
