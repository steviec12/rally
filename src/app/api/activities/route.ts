import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, tags, dateTime, location, maxSpots, description } = body;

  if (!title || typeof title !== "string" || title.trim().length < 1) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!dateTime || isNaN(Date.parse(dateTime))) {
    return NextResponse.json({ error: "A valid date and time is required." }, { status: 400 });
  }
  if (new Date(dateTime) <= new Date()) {
    return NextResponse.json({ error: "Date must be in the future." }, { status: 400 });
  }
  if (!location || typeof location !== "string" || location.trim().length < 1) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }
  if (!maxSpots || typeof maxSpots !== "number" || maxSpots < 1 || !Number.isInteger(maxSpots)) {
    return NextResponse.json({ error: "Max spots must be at least 1." }, { status: 400 });
  }

  const activity = await db.activity.create({
    data: {
      hostId: session.user.id,
      title: title.trim(),
      tags: Array.isArray(tags) ? tags : [],
      dateTime: new Date(dateTime),
      location: location.trim(),
      locationLat: 0,
      locationLng: 0,
      maxSpots,
      description: description?.trim() ?? null,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
