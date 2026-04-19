import { describe, it, expect } from 'vitest';
import { buildFeedWhereClause, validateActivityInput, sanitizeTags } from './activity';
import type { FeedFilters } from '@/types/activity';

const USER_ID = 'user-123';
const NOW = new Date('2025-06-01T12:00:00Z');

describe('buildFeedWhereClause', () => {
  it('returns base where clause when no filters provided', () => {
    const result = buildFeedWhereClause(USER_ID, undefined, NOW);
    expect(result).toEqual({
      status: { in: ['open', 'full'] },
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
    expect(result.status).toEqual({ in: ['open', 'full'] });
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
      status: { in: ['open', 'full'] },
      dateTime: { gt: NOW },
      hostId: { not: USER_ID },
    });
  });
});

describe('validateActivityInput', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  it('returns null for fully valid input', () => {
    expect(
      validateActivityInput({ title: 'Morning Run', dateTime: futureDate, location: 'Venice Beach', maxSpots: 2 })
    ).toBeNull();
  });

  it('returns error when title is an empty string', () => {
    expect(
      validateActivityInput({ title: '', dateTime: futureDate, location: 'Test', maxSpots: 2 })
    ).toEqual({ error: 'Title is required.' });
  });

  it('returns error when title is whitespace only', () => {
    expect(
      validateActivityInput({ title: '   ', dateTime: futureDate, location: 'Test', maxSpots: 2 })
    ).toEqual({ error: 'Title is required.' });
  });

  it('returns error when dateTime is not a valid date string', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: 'not-a-date', location: 'Test', maxSpots: 2 })
    ).toEqual({ error: 'A valid date and time is required.' });
  });

  it('returns error when dateTime is a past date', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    expect(
      validateActivityInput({ title: 'Test', dateTime: pastDate, location: 'Test', maxSpots: 2 })
    ).toEqual({ error: 'Date must be in the future.' });
  });

  it('returns error when dateTime is exactly now (not in the future)', () => {
    const justPast = new Date(Date.now() - 1).toISOString();
    expect(
      validateActivityInput({ title: 'Test', dateTime: justPast, location: 'Test', maxSpots: 2 })
    ).toEqual({ error: 'Date must be in the future.' });
  });

  it('returns error when location is an empty string', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: futureDate, location: '', maxSpots: 2 })
    ).toEqual({ error: 'Location is required.' });
  });

  it('returns error when maxSpots is 0', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: futureDate, location: 'Test', maxSpots: 0 })
    ).toEqual({ error: 'Max spots must be at least 1.' });
  });

  it('returns error when maxSpots is negative', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: futureDate, location: 'Test', maxSpots: -1 })
    ).toEqual({ error: 'Max spots must be at least 1.' });
  });

  it('returns error when maxSpots is a float (non-integer)', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: futureDate, location: 'Test', maxSpots: 1.5 })
    ).toEqual({ error: 'Max spots must be at least 1.' });
  });

  it('returns error when maxSpots is undefined', () => {
    expect(
      validateActivityInput({ title: 'Test', dateTime: futureDate, location: 'Test' })
    ).toEqual({ error: 'Max spots must be at least 1.' });
  });

  it('returns error when body is empty object', () => {
    expect(validateActivityInput({})).toEqual({ error: 'Title is required.' });
  });
});

describe('sanitizeTags', () => {
  it('returns empty array for non-array input', () => {
    expect(sanitizeTags('not-an-array')).toEqual([]);
  });

  it('returns empty array for null', () => {
    expect(sanitizeTags(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(sanitizeTags(undefined)).toEqual([]);
  });

  it('filters out non-string values from mixed array', () => {
    expect(sanitizeTags(['sports', 1, null, 'music', true])).toEqual(['sports', 'music']);
  });

  it('returns all strings from a valid string array', () => {
    expect(sanitizeTags(['sports', 'music', 'gaming'])).toEqual(['sports', 'music', 'gaming']);
  });

  it('returns empty array for empty array input', () => {
    expect(sanitizeTags([])).toEqual([]);
  });
});
