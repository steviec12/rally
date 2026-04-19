import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    activity: {},
    user: { findUnique: vi.fn(), create: vi.fn() },
    joinRequest: {},
    rating: {},
  },
}));
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

import { db } from '@/lib/db';
import { POST } from './route';
import type { MockPrismaClient } from '@/lib/__tests__/setup';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockDb = db as unknown as MockPrismaClient;
/* eslint-enable @typescript-eslint/no-explicit-any */

const VALID_BODY = {
  name: 'Alice',
  email: 'alice@example.com',
  password: 'securepassword',
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.user.findUnique.mockResolvedValue(null); // no existing user by default
  });

  it('returns 400 when email is missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', password: 'securepassword' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it('returns 400 when password is too short (less than 8 chars)', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: 'short' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/password/i);
  });

  it('returns 409 when email already exists', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'existing-user', email: VALID_BODY.email });
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it('returns 201 when registration is successful', async () => {
    mockDb.user.create.mockResolvedValue({
      id: 'new-user-1',
      name: VALID_BODY.name,
      email: VALID_BODY.email,
      password: 'hashed-password',
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
