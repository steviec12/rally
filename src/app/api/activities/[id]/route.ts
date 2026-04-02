import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateActivityInput, sanitizeTags, cancelActivity } from "@/lib/activity";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let reason: string | undefined;
  try {
    const body = await _req.json();
    if (typeof body?.reason === "string") {
      if (body.reason.length > 500) {
        return NextResponse.json({ error: "Reason must be 500 characters or fewer." }, { status: 400 });
      }
      reason = body.reason;
    }
  } catch {
    // reason is optional — ignore parse errors
  }

  const result = await cancelActivity(id, session.user.id, reason);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const activity = await db.activity.findUnique({ where: { id } });
  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }
  if (activity.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (activity.dateTime <= new Date()) {
    return NextResponse.json({ error: "This activity has already started and cannot be edited." }, { status: 403 });
  }
  if (activity.status === "cancelled") {
    return NextResponse.json({ error: "Cancelled activities cannot be edited." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validateActivityInput(body);
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const updated = await db.activity.update({
    where: { id },
    data: {
      title: (b.title as string).trim(),
      tags: sanitizeTags(b.tags),
      dateTime: new Date(b.dateTime as string),
      location: (b.location as string).trim(),
      locationLat: typeof b.locationLat === "number" ? b.locationLat : activity.locationLat,
      locationLng: typeof b.locationLng === "number" ? b.locationLng : activity.locationLng,
      maxSpots: b.maxSpots as number,
      description: typeof b.description === "string" ? b.description.trim() || null : null,
    },
  });

  return NextResponse.json(updated);
}
