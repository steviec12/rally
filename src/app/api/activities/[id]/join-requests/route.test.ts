import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    activity: { findUnique: vi.fn() },
    user: {},
    joinRequest: {},
    rating: {},
  },
}));
vi.mock('@/lib/join-request', () => ({
  getJoinRequestsForHost: vi.fn(),
  createJoinRequest: vi.fn(),
  updateJoinRequestStatus: vi.fn(),
}));

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  getJoinRequestsForHost,
  createJoinRequest,
  updateJoinRequestStatus,
} from '@/lib/join-request';
import { GET, POST, PATCH } from './route';
import { mockAuth } from '@/lib/__tests__/setup';
import type { MockPrismaClient } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockDb = db as unknown as MockPrismaClient;
const mockGetJoinRequestsForHost = getJoinRequestsForHost as any;
const mockCreateJoinRequest = createJoinRequest as any;
const mockUpdateJoinRequestStatus = updateJoinRequestStatus as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const ACTIVITY_ID = 'activity-1';
const PARAMS = { params: Promise.resolve({ id: ACTIVITY_ID }) };

describe('GET /api/activities/[id]/join-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'host-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`);
    const res = await GET(req, PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 404 when activity does not exist', async () => {
    mockDb.activity.findUnique.mockResolvedValue(null);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`);
    const res = await GET(req, PARAMS);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the host', async () => {
    mockDb.activity.findUnique.mockResolvedValue({ hostId: 'other-host' });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`);
    const res = await GET(req, PARAMS);
    expect(res.status).toBe(403);
  });

  it('returns 200 with join requests for the host', async () => {
    mockDb.activity.findUnique.mockResolvedValue({ hostId: 'host-1' });
    mockGetJoinRequestsForHost.mockResolvedValue([{ id: 'jr-1', status: 'pending' }]);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`);
    const res = await GET(req, PARAMS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe('POST /api/activities/[id]/join-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'POST',
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns error status when createJoinRequest fails', async () => {
    mockCreateJoinRequest.mockResolvedValue({
      success: false,
      error: 'Activity is full.',
      status: 409,
    });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'POST',
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(409);
  });

  it('returns 201 with join request on success', async () => {
    mockCreateJoinRequest.mockResolvedValue({
      success: true,
      joinRequest: { id: 'jr-new', status: 'pending', compatibilityScore: 72 },
    });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'POST',
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('jr-new');
  });
});

describe('PATCH /api/activities/[id]/join-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'host-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinRequestId: 'jr-1', status: 'approved' }),
    });
    const res = await PATCH(req, PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 400 when joinRequestId is missing', async () => {
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    const res = await PATCH(req, PARAMS);
    expect(res.status).toBe(400);
  });

  it('returns 400 when status is not approved or declined', async () => {
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinRequestId: 'jr-1', status: 'pending' }),
    });
    const res = await PATCH(req, PARAMS);
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful approval', async () => {
    mockUpdateJoinRequestStatus.mockResolvedValue({ success: true });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/join-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinRequestId: 'jr-1', status: 'approved' }),
    });
    const res = await PATCH(req, PARAMS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
