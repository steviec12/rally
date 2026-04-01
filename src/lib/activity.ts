import { db } from "@/lib/db";

type CancelResult =
  | { success: true; error?: never }
  | { success: false; error: string; status: 403 | 404 | 409 };

export async function cancelActivity(
  activityId: string,
  requestingUserId: string,
  reason?: string
): Promise<CancelResult> {
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity) return { success: false as const, error: "Activity not found.", status: 404 as const };
  if (activity.hostId !== requestingUserId) return { success: false as const, error: "Forbidden", status: 403 as const };
  if (activity.dateTime <= new Date()) {
    return { success: false as const, error: "This activity has already started and cannot be cancelled.", status: 403 as const };
  }
  if (activity.status === "completed") {
    return { success: false as const, error: "Completed activities cannot be cancelled.", status: 403 as const };
  }
  if (activity.status === "cancelled") {
    return { success: false as const, error: "Activity is already cancelled.", status: 409 as const };
  }

  await db.activity.update({
    where: { id: activityId },
    data: { status: "cancelled", cancellationReason: reason?.trim() || null },
  });
  return { success: true as const };
}

export function validateActivityInput(body: unknown): { error: string } | null {
  const b = body as Record<string, unknown>;

  if (!b.title || typeof b.title !== "string" || b.title.trim().length < 1) {
    return { error: "Title is required." };
  }
  if (!b.dateTime || typeof b.dateTime !== "string" || isNaN(Date.parse(b.dateTime))) {
    return { error: "A valid date and time is required." };
  }
  if (new Date(b.dateTime) <= new Date()) {
    return { error: "Date must be in the future." };
  }
  if (!b.location || typeof b.location !== "string" || b.location.trim().length < 1) {
    return { error: "Location is required." };
  }
  if (
    b.maxSpots === undefined ||
    typeof b.maxSpots !== "number" ||
    b.maxSpots < 1 ||
    !Number.isInteger(b.maxSpots)
  ) {
    return { error: "Max spots must be at least 1." };
  }

  return null;
}

export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string");
}
