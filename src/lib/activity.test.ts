import { describe, it, expect } from 'vitest';
import { buildFeedWhereClause } from './activity';
import type { FeedFilters } from '@/types/activity';

const USER_ID = 'user-123';
const NOW = new Date('2025-06-01T12:00:00Z');

describe('buildFeedWhereClause', () => {
  it('returns base where clause when no filters provided', () => {
    const result = buildFeedWhereClause(USER_ID, undefined, NOW);
    expect(result).toEqual({
      status: 'open',
      dateTime: { gt: NOW },
      hostId: { not: USER_ID },
    });
  });

  it('adds hasSome when tags filter has values', () => {
    const filters: FeedFilters = { tags: ['basketball', 'running'] };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.tags).toEqual({ hasSome: ['basketball', 'running'] });
  });

  it('treats empty tags array as no filter', () => {
    const filters: FeedFilters = { tags: [] };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.tags).toBeUndefined();
  });

  it('uses dateFrom when it is after now', () => {
    const dateFrom = '2025-07-01T00:00:00Z';
    const filters: FeedFilters = { dateFrom };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.dateTime).toEqual({ gt: new Date(dateFrom) });
  });

  it('uses now as floor when dateFrom is in the past', () => {
    const dateFrom = '2025-01-01T00:00:00Z';
    const filters: FeedFilters = { dateFrom };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.dateTime).toEqual({ gt: NOW });
  });

  it('adds lte when dateTo is provided', () => {
    const dateTo = '2025-08-01T00:00:00Z';
    const filters: FeedFilters = { dateTo };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.dateTime).toEqual({ gt: NOW, lte: new Date(dateTo) });
  });

  it('combines dateFrom and dateTo', () => {
    const dateFrom = '2025-07-01T00:00:00Z';
    const dateTo = '2025-08-01T00:00:00Z';
    const filters: FeedFilters = { dateFrom, dateTo };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.dateTime).toEqual({
      gt: new Date(dateFrom),
      lte: new Date(dateTo),
    });
  });

  it('combines tags + date range filters', () => {
    const filters: FeedFilters = {
      tags: ['hiking'],
      dateFrom: '2025-07-01T00:00:00Z',
      dateTo: '2025-08-01T00:00:00Z',
    };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result.status).toBe('open');
    expect(result.hostId).toEqual({ not: USER_ID });
    expect(result.tags).toEqual({ hasSome: ['hiking'] });
    expect(result.dateTime).toEqual({
      gt: new Date('2025-07-01T00:00:00Z'),
      lte: new Date('2025-08-01T00:00:00Z'),
    });
  });

  it('ignores distance-related fields', () => {
    const filters: FeedFilters = { distanceKm: 10, userLat: 34, userLng: -118 };
    const result = buildFeedWhereClause(USER_ID, filters, NOW);
    expect(result).toEqual({
      status: 'open',
      dateTime: { gt: NOW },
      hostId: { not: USER_ID },
    });
  });
});
