import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateActivityInput, sanitizeTags, getFeedActivities } from "@/lib/activity";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const result = await getFeedActivities(session.user.id, cursor);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const activity = await db.activity.create({
    data: {
      hostId: session.user.id,
      title: (b.title as string).trim(),
      tags: sanitizeTags(b.tags),
      dateTime: new Date(b.dateTime as string),
      location: (b.location as string).trim(),
      locationLat: 0,
      locationLng: 0,
      maxSpots: b.maxSpots as number,
      description: typeof b.description === "string" ? b.description.trim() || null : null,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
