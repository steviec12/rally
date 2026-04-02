import { describe, it, expect } from 'vitest';
import { buildFeedWhereClause } from './activity';

const NOW = new Date('2025-06-01T12:00:00Z');
const USER_ID = 'user-123';

describe('buildFeedWhereClause', () => {
  describe('base behavior (no filters)', () => {
    it('returns status open, dateTime gt now, and excludes host', () => {
      const result = buildFeedWhereClause(USER_ID, undefined, NOW);

      expect(result).toEqual({
        status: 'open',
        dateTime: { gt: NOW },
        hostId: { not: USER_ID },
      });
    });
  });
});
