import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  createJoinRequest,
  getJoinRequestsForHost,
  updateJoinRequestStatus,
} from '@/lib/join-request';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const activity = await db.activity.findUnique({
    where: { id },
    select: { hostId: true },
  });

  if (!activity) {
    return NextResponse.json({ error: 'Activity not found.' }, { status: 404 });
  }

  if (activity.hostId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const joinRequests = await getJoinRequestsForHost(id);
  return NextResponse.json(joinRequests);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await createJoinRequest(id, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.joinRequest, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: activityId } = await params;

  let body: { joinRequestId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.joinRequestId || typeof body.joinRequestId !== 'string') {
    return NextResponse.json({ error: 'joinRequestId is required.' }, { status: 400 });
  }

  if (body.status !== 'approved' && body.status !== 'declined') {
    return NextResponse.json(
      { error: "Status must be 'approved' or 'declined'." },
      { status: 400 }
    );
  }

  const result = await updateJoinRequestStatus(
    body.joinRequestId,
    session.user.id,
    body.status,
    activityId
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
