import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeedActivities } from "@/lib/activity";
import Link from "next/link";
import FeedList from "./feed-list";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { activities, nextCursor } = await getFeedActivities(session.user.id);

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 900,
              fontSize: 28,
              color: "var(--text-primary)",
              letterSpacing: "-0.6px",
            }}
          >
            What&apos;s happening 🔥
          </h1>
          <Link
            href="/activities/new"
            style={{
              padding: "8px 16px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Post
          </Link>
        </div>

        <FeedList initialActivities={activities} initialNextCursor={nextCursor} />

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
