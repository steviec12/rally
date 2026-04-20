import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    activity: {},
    user: { findUnique: vi.fn(), update: vi.fn() },
    joinRequest: {},
    rating: {},
  },
}));

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { GET, PATCH } from './route';
import { mockAuth } from '@/lib/__tests__/setup';
import type { MockPrismaClient } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockDb = db as unknown as MockPrismaClient;
/* eslint-enable @typescript-eslint/no-explicit-any */

const MOCK_USER = {
  id: 'user-1',
  name: 'Alice',
  bio: 'Loves hiking',
  image: null,
  interests: ['hiking', 'running'],
  location: 'Los Angeles, CA',
  locationLat: 34.05,
  locationLng: -118.24,
};

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/profile');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user profile does not exist', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/profile');
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns 200 with profile data for authenticated user', async () => {
    mockDb.user.findUnique.mockResolvedValue(MOCK_USER);
    const req = new Request('http://localhost/api/profile');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('user-1');
    expect(body.name).toBe('Alice');
    expect(body.interests).toEqual(['hiking', 'running']);
  });
});

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'user-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when name is empty string', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Name cannot be empty.');
  });

  it('returns 400 when interests is not an array', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: 'not-an-array' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Interests must be an array.');
  });

  it('returns 200 with updated profile for valid input', async () => {
    const updatedUser = { ...MOCK_USER, name: 'Alice Updated', bio: 'New bio' };
    mockDb.user.update.mockResolvedValue(updatedUser);

    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Updated', bio: 'New bio' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Alice Updated');
    expect(body.bio).toBe('New bio');
  });
});
