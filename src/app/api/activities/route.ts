import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { validateActivityInput, sanitizeTags, getFeedActivities } from '@/lib/activity';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;

  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;
  const distanceKm = searchParams.get('distanceKm')
    ? Number(searchParams.get('distanceKm'))
    : undefined;
  const customTags = searchParams.get('customTags') === 'true';

  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return NextResponse.json({ error: 'Invalid dateFrom.' }, { status: 400 });
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    return NextResponse.json({ error: 'Invalid dateTo.' }, { status: 400 });
  }
  if (distanceKm != null && (isNaN(distanceKm) || distanceKm <= 0 || distanceKm > 20000)) {
    return NextResponse.json({ error: 'Invalid distanceKm.' }, { status: 400 });
  }

  // Read user's saved location for distance filtering
  let userLat: number | undefined;
  let userLng: number | undefined;
  if (distanceKm) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { locationLat: true, locationLng: true },
    });
    if (user?.locationLat != null && user?.locationLng != null) {
      userLat = user.locationLat;
      userLng = user.locationLng;
    }
  }

  const filters = {
    ...(tags?.length ? { tags } : {}),
    ...(customTags ? { customTags: true as const } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(distanceKm && userLat != null && userLng != null ? { distanceKm, userLat, userLng } : {}),
  };

  const result = await getFeedActivities(session.user.id, cursor, filters);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validationError = validateActivityInput(body);
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const activity = await db.activity.create({
    data: {
      hostId: session.user.id,
      title: (b.title as string).trim(),
      tags: sanitizeTags(b.tags),
      dateTime: new Date(b.dateTime as string),
      location: (b.location as string).trim(),
      locationLat: typeof b.locationLat === 'number' ? b.locationLat : 0,
      locationLng: typeof b.locationLng === 'number' ? b.locationLng : 0,
      maxSpots: b.maxSpots as number,
      description: typeof b.description === 'string' ? b.description.trim() || null : null,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
