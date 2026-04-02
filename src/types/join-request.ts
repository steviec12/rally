export type JoinRequestResult =
  | { success: true; joinRequest: { id: string; status: string; compatibilityScore: number | null } }
  | { success: false; error: string; status: 403 | 404 | 409 };
