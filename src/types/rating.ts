export type RatingResult =
  | { success: true; rating: { id: string; score: number } }
  | { success: false; error: string; status: 400 | 403 | 404 | 409 };
