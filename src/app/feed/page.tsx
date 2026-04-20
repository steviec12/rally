import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getFeedActivities } from '@/lib/activity';
import Link from 'next/link';
import FeedList from './feed-list';
import FeedFilters from './feed-filters';
import { Suspense } from 'react';
import type { FeedFilters as FeedFiltersType } from '@/types/activity';

export const dynamic = 'force-dynamic';

interface FeedPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { locationLat: true, locationLng: true },
  });

  const params = await searchParams;

  const tags = typeof params.tags === 'string' ? params.tags.split(',').filter(Boolean) : undefined;
  const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === 'string' ? params.dateTo : undefined;
  const distanceKm = typeof params.distanceKm === 'string' ? Number(params.distanceKm) : undefined;
  const customTags = params.customTags === 'true';

  const filters: FeedFiltersType = {
    ...(tags?.length ? { tags } : {}),
    ...(customTags ? { customTags: true } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(distanceKm && user?.locationLat != null && user?.locationLng != null
      ? { distanceKm, userLat: user.locationLat, userLng: user.locationLng }
      : {}),
  };

  const { activities, nextCursor } = await getFeedActivities(session.user.id, undefined, filters);

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-10"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 900,
              fontSize: 28,
              color: 'var(--text-primary)',
              letterSpacing: '-0.6px',
            }}
          >
            What&apos;s happening 🔥
          </h1>
          <Link
            href="/activities/new"
            style={{
              padding: '8px 16px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
              color: '#fff',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Post
          </Link>
        </div>

        <Suspense>
          <FeedFilters hasLocation={user?.locationLat != null && user?.locationLng != null} />
        </Suspense>

        <FeedList initialActivities={activities} initialNextCursor={nextCursor} filters={filters} />

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
