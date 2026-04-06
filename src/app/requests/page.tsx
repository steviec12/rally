import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import BackButton from "@/app/components/back-button";
import type { JoinRequestStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const requests = await db.joinRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      activity: {
        select: {
          id: true,
          title: true,
          dateTime: true,
          location: true,
          host: { select: { name: true, id: true } },
        },
      },
    },
  });

  const statusStyles: Record<
    JoinRequestStatus,
    { bg: string; border: string; color: string }
  > = {
    pending: {
      bg: "rgba(255,202,40,0.1)",
      border: "1px solid rgba(255,202,40,0.3)",
      color: "#D4A017",
    },
    approved: {
      bg: "rgba(45,212,168,0.1)",
      border: "1px solid rgba(45,212,168,0.3)",
      color: "#2DD4A8",
    },
    declined: {
      bg: "var(--fuchsia-bg)",
      border: "1px solid var(--border)",
      color: "var(--text-muted)",
    },
  };

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <BackButton />

        <h1
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
            marginBottom: 20,
          }}
        >
          My Requests
        </h1>

        {requests.length === 0 ? (
          <div
            style={{
              padding: "24px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              textAlign: "center",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          >
            You haven&apos;t requested to join any activities yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {requests.map((req) => {
              const ss = statusStyles[req.status];

              const formattedDate = req.activity.dateTime.toLocaleString(
                "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                },
              );

              return (
                <div
                  key={req.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 20,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Link
                        href={`/activities/${req.activity.id}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {req.activity.title}
                      </Link>
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {formattedDate} &middot;{" "}
                      <Link
                        href={`/user/${req.activity.host.id}`}
                        style={{
                          color: "var(--text-muted)",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {req.activity.host.name ?? "Anonymous"}
                      </Link>
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      background: ss.bg,
                      border: ss.border,
                      color: ss.color,
                      fontSize: 11,
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      textTransform: "capitalize",
                      flexShrink: 0,
                    }}
                  >
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
