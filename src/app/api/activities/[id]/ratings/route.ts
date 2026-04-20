import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRating } from '@/lib/rating';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: activityId } = await params;

  let body: { rateeId?: string; score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.rateeId || typeof body.rateeId !== 'string') {
    return NextResponse.json({ error: 'rateeId is required.' }, { status: 400 });
  }

  if (typeof body.score !== 'number') {
    return NextResponse.json({ error: 'score is required.' }, { status: 400 });
  }

  const result = await createRating(session.user.id, body.rateeId, activityId, body.score);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.rating, { status: 201 });
}
