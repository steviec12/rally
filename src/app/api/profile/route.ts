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

  const body = await req.json();
  const { name, bio, image, interests, location, locationLat, locationLng } = body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
  }

  if (interests !== undefined && !Array.isArray(interests)) {
    return NextResponse.json({ error: 'Interests must be an array.' }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(bio !== undefined && { bio }),
      ...(image !== undefined && { image }),
      ...(interests !== undefined && { interests }),
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
