import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rating', () => ({
  createRating: vi.fn(),
}));

import { auth } from '@/auth';
import { createRating } from '@/lib/rating';
import { POST } from './route';
import { mockAuth } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockCreateRating = createRating as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const ACTIVITY_ID = 'activity-1';
const PARAMS = { params: Promise.resolve({ id: ACTIVITY_ID }) };

describe('POST /api/activities/[id]/ratings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(auth, 'rater-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth(auth, null);
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateeId: 'ratee-1', score: 4 }),
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 400 when rateeId is missing', async () => {
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 4 }),
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('rateeId is required.');
  });

  it('returns 400 when score is missing', async () => {
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateeId: 'ratee-1' }),
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('score is required.');
  });

  it('returns error status when createRating fails', async () => {
    mockCreateRating.mockResolvedValue({
      success: false,
      error: 'Score must be an integer between 1 and 5.',
      status: 400,
    });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateeId: 'ratee-1', score: 6 }),
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(400);
  });

  it('returns 201 with rating on success', async () => {
    mockCreateRating.mockResolvedValue({
      success: true,
      rating: { id: 'rating-1', score: 4 },
    });
    const req = new Request(`http://localhost/api/activities/${ACTIVITY_ID}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateeId: 'ratee-1', score: 4 }),
    });
    const res = await POST(req, PARAMS);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('rating-1');
    expect(body.score).toBe(4);
  });
});
