import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createJoinRequest } from "@/lib/join-request";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await createJoinRequest(id, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.joinRequest, { status: 201 });
}
