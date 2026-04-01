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
