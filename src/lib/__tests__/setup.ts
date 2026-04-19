import { vi } from 'vitest';

/**
 * Configure an already-mocked `auth` function to return a session for the given userId,
 * or null (unauthenticated) when userId is null.
 *
 * Each test file must declare vi.mock('@/auth') itself — this helper only sets the
 * return value for the current test. Call it in beforeEach.
 *
 * @example
 *   import { auth } from '@/auth';
 *   import { mockAuth } from '@/lib/__tests__/setup';
 *   vi.mock('@/auth', () => ({ auth: vi.fn() }));
 *   beforeEach(() => { mockAuth(auth, 'user-1'); });
 */
export function mockAuth(authFn: unknown, userId: string | null): void {
  (authFn as ReturnType<typeof vi.fn>).mockResolvedValue(
    userId ? { user: { id: userId } } : null
  );
}

/**
 * Typed shape for a mocked Prisma db client.
 * Use as the type assertion target when accessing mock methods in tests.
 */
export interface MockPrismaClient {
  activity: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  joinRequest: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    $transaction: ReturnType<typeof vi.fn>;
  };
  rating: {
    create: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
}
