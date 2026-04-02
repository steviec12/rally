import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/app/components/sign-out-button";
import CancelActivityButton from "@/app/components/cancel-activity-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
      image: true,
      interests: true,
      location: true,
      activityCount: true,
      rating: true,
    },
  });

  if (!user) redirect("/");

  const activities = await db.activity.findMany({
    where: { hostId: session.user.id },
    orderBy: { dateTime: "asc" },
    select: { id: true, title: true, dateTime: true, status: true, cancellationReason: true },
  });

  const now = new Date();

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid var(--fuchsia-bg)",
            background: "var(--fuchsia-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {user.image ? (
            <Image src={user.image} alt={user.name ?? "Avatar"} fill style={{ objectFit: "cover" }} unoptimized />
          ) : (
            <span style={{ fontSize: 28 }}>👤</span>
          )}
        </div>

        {/* Name & bio */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            {user.name ?? "No name set"}
          </h1>
          {user.location && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>📍 {user.location}</p>
          )}
          {user.bio && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
              {user.bio}
            </p>
          )}
        </div>

        {/* Interests */}
        {user.interests.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {user.interests.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  background: "var(--fuchsia-bg)",
                  border: "1px solid rgba(255,45,155,0.2)",
                  color: "var(--fuchsia)",
                  fontSize: 12,
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: 20, color: "var(--fuchsia)" }}>
              {user.activityCount}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>activities</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: 20, color: "var(--fuchsia)" }}>
              {user.rating ? user.rating.toFixed(1) : "—"}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>rating</p>
          </div>
        </div>

        {/* Your activities */}
        {activities.length > 0 && (
          <div style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <p
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Your activities
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activities.map((a) => {
                const editable = a.dateTime > now && a.status !== "cancelled" && a.status !== "completed";
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 14,
                          color: a.status === "cancelled" ? "var(--text-muted)" : "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: a.status === "cancelled" ? "line-through" : "none",
                        }}
                      >
                        {a.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(a.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    {a.status === "cancelled" ? (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          background: "var(--bg)",
                          border: "1.5px solid var(--border)",
                          padding: "4px 10px",
                          borderRadius: "100px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Cancelled
                      </span>
                    ) : editable ? (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <Link
                          href={`/activities/${a.id}/edit`}
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                            color: "var(--fuchsia)",
                            textDecoration: "none",
                            padding: "4px 10px",
                            borderRadius: "100px",
                            border: "1.5px solid var(--fuchsia)",
                          }}
                        >
                          Edit
                        </Link>
                        <CancelActivityButton activityId={a.id} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <Link
            href="/feed"
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Browse activities 🔥
          </Link>
          <Link
            href="/activities/new"
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            + Create activity
          </Link>
          <Link
            href="/profile"
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Edit profile
          </Link>
          <Link
            href={`/user/${session.user.id}`}
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              borderRadius: "100px",
              border: "2px solid var(--border)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            View public profile
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
