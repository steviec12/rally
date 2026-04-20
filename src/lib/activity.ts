import { db } from '@/lib/db';
import type { ActivityStatus } from '@/generated/prisma/client';
import type { FeedActivity, FeedFilters } from '@/types/activity';
import { filterByDistance } from '@/lib/geo';
import { ACTIVITY_TAGS } from '@/lib/tags';

export function buildFeedWhereClause(
  userId: string,
  filters?: FeedFilters,
  now: Date = new Date()
) {
  const dateFloor =
    filters?.dateFrom && new Date(filters.dateFrom) > now ? new Date(filters.dateFrom) : now;

  const dateTime: Record<string, Date> = { gt: dateFloor };
  if (filters?.dateTo) {
    dateTime.lte = new Date(filters.dateTo);
  }

  return {
    status: { in: ['open', 'full'] as ActivityStatus[] },
    dateTime,
    hostId: { not: userId },
    ...(filters?.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
  };
}

// Matches a cuid() ID — 25 chars starting with 'c'
const CUID_REGEX = /^c[a-z0-9]{24}$/;

const FEED_PAGE_SIZE = 10;

interface FeedResult {
  activities: FeedActivity[];
  nextCursor: string | null;
}

export async function getFeedActivities(
  userId: string,
  cursor?: string,
  filters?: FeedFilters
): Promise<FeedResult> {
  if (cursor && !CUID_REGEX.test(cursor)) {
    return { activities: [], nextCursor: null };
  }

  const hasDistanceFilter =
    filters?.distanceKm != null && filters.userLat != null && filters.userLng != null;

  const hasCustomTagsFilter = filters?.customTags === true;
  const needsPostFilter = hasDistanceFilter || hasCustomTagsFilter;

  const fetchSize = needsPostFilter ? FEED_PAGE_SIZE * 3 + 1 : FEED_PAGE_SIZE + 1;

  const rows = await db.activity.findMany({
    where: buildFeedWhereClause(userId, filters),
    orderBy: { dateTime: 'asc' },
    take: fetchSize,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      tags: true,
      dateTime: true,
      location: true,
      locationLat: true,
      locationLng: true,
      maxSpots: true,
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { joinRequests: { where: { status: 'approved' } } } },
    },
  });

  if (needsPostFilter) {
    // Post-filters run in JS. Use the last unfiltered row as cursor
    // so subsequent pages advance past all fetched rows (including filtered-out ones).
    const dbHasMore = rows.length === fetchSize;
    const dbCursor = dbHasMore ? rows[rows.length - 1].id : null;

    const predefined = ACTIVITY_TAGS as readonly string[];
    let filtered = rows;

    if (hasDistanceFilter) {
      filtered = filterByDistance(
        filtered,
        filters!.userLat!,
        filters!.userLng!,
        filters!.distanceKm!
      );
    }

    if (hasCustomTagsFilter) {
      filtered = filtered.filter((a) => a.tags.some((t) => !predefined.includes(t)));
    }

    const page = filtered.slice(0, FEED_PAGE_SIZE);
    const activities: FeedActivity[] = page.map((a) => ({
      ...a,
      dateTime: a.dateTime.toISOString(),
    }));

    return { activities, nextCursor: dbCursor };
  }

  const hasMore = rows.length > FEED_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const activities: FeedActivity[] = page.map((a) => ({
    ...a,
    dateTime: a.dateTime.toISOString(),
  }));

  return { activities, nextCursor };
}

type CancelResult =
  | { success: true; error?: never }
  | { success: false; error: string; status: 403 | 404 | 409 };

export async function cancelActivity(
  activityId: string,
  requestingUserId: string,
  reason?: string
): Promise<CancelResult> {
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity)
    return { success: false as const, error: 'Activity not found.', status: 404 as const };
  if (activity.hostId !== requestingUserId)
    return { success: false as const, error: 'Forbidden', status: 403 as const };
  if (activity.dateTime <= new Date()) {
    return {
      success: false as const,
      error: 'This activity has already started and cannot be cancelled.',
      status: 403 as const,
    };
  }
  if (activity.status === 'completed') {
    return {
      success: false as const,
      error: 'Completed activities cannot be cancelled.',
      status: 403 as const,
    };
  }
  if (activity.status === 'cancelled') {
    return {
      success: false as const,
      error: 'Activity is already cancelled.',
      status: 409 as const,
    };
  }

  await db.$transaction([
    db.activity.update({
      where: { id: activityId },
      data: { status: 'cancelled', cancellationReason: reason?.trim() || null },
    }),
    db.joinRequest.updateMany({
      where: { activityId, status: 'pending' },
      data: { status: 'declined' },
    }),
  ]);
  return { success: true as const };
}

export function validateActivityInput(body: unknown): { error: string } | null {
  const b = body as Record<string, unknown>;

  if (!b.title || typeof b.title !== 'string' || b.title.trim().length < 1) {
    return { error: 'Title is required.' };
  }
  if (typeof b.title === 'string' && b.title.length > 200) {
    return { error: 'Title must be 200 characters or fewer.' };
  }
  if (!b.dateTime || typeof b.dateTime !== 'string' || isNaN(Date.parse(b.dateTime))) {
    return { error: 'A valid date and time is required.' };
  }
  if (new Date(b.dateTime) <= new Date()) {
    return { error: 'Date must be in the future.' };
  }
  if (!b.location || typeof b.location !== 'string' || b.location.trim().length < 1) {
    return { error: 'Location is required.' };
  }
  if (typeof b.location === 'string' && b.location.length > 200) {
    return { error: 'Location must be 200 characters or fewer.' };
  }
  if (
    b.maxSpots === undefined ||
    typeof b.maxSpots !== 'number' ||
    b.maxSpots < 1 ||
    !Number.isInteger(b.maxSpots)
  ) {
    return { error: 'Max spots must be at least 1.' };
  }
  if (typeof b.maxSpots === 'number' && b.maxSpots > 100) {
    return { error: 'Max spots cannot exceed 100.' };
  }

  return null;
}

export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === 'string');
}
