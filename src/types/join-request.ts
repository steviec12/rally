export type JoinRequestResult =
  | { success: true; joinRequest: { id: string; status: string; compatibilityScore: number | null } }
  | { success: false; error: string; status: 403 | 404 | 409 };

export type UpdateJoinRequestResult =
  | { success: true }
  | { success: false; error: string; status: 403 | 404 | 409 };
