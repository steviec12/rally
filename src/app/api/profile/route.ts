import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
      interests: true,
      location: true,
      locationLat: true,
      locationLng: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { name, bio, image, interests, location, locationLat, locationLng } = body as {
    name?: string;
    bio?: string;
    image?: string;
    interests?: unknown[];
    location?: string;
    locationLat?: number;
    locationLng?: number;
  };

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
  }
  if (name !== undefined && name.length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 });
  }
  if (bio !== undefined && typeof bio !== 'string') {
    return NextResponse.json({ error: 'Bio must be a string.' }, { status: 400 });
  }
  if (bio !== undefined && bio.length > 500) {
    return NextResponse.json({ error: 'Bio must be 500 characters or fewer.' }, { status: 400 });
  }
  if (image !== undefined && image !== null && typeof image !== 'string') {
    return NextResponse.json({ error: 'Image must be a string URL.' }, { status: 400 });
  }
  if (location !== undefined && typeof location !== 'string') {
    return NextResponse.json({ error: 'Location must be a string.' }, { status: 400 });
  }
  if (location !== undefined && location.length > 200) {
    return NextResponse.json(
      { error: 'Location must be 200 characters or fewer.' },
      { status: 400 }
    );
  }

  if (interests !== undefined && !Array.isArray(interests)) {
    return NextResponse.json({ error: 'Interests must be an array.' }, { status: 400 });
  }
  const sanitizedInterests =
    interests !== undefined
      ? interests.filter((i): i is string => typeof i === 'string')
      : undefined;

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(bio !== undefined && { bio }),
      ...(image !== undefined && { image }),
      ...(sanitizedInterests !== undefined && { interests: sanitizedInterests }),
      ...(location !== undefined && { location }),
      ...(locationLat !== undefined && {
        locationLat: typeof locationLat === 'number' ? locationLat : null,
      }),
      ...(locationLng !== undefined && {
        locationLng: typeof locationLng === 'number' ? locationLng : null,
      }),
    },
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
      interests: true,
      location: true,
      locationLat: true,
      locationLng: true,
    },
  });

  return NextResponse.json(updated);
}
