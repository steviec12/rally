import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getJoinRequestsForHost } from "@/lib/join-request";
import Image from "next/image";
import Link from "next/link";
import JoinButton from "@/app/components/join-button";
import BackButton from "@/app/components/back-button";
import JoinRequestActions from "@/app/components/join-request-actions";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const activity = await db.activity.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      dateTime: true,
      location: true,
      maxSpots: true,
      status: true,
      host: { select: { id: true, name: true, image: true } },
      _count: {
        select: { joinRequests: { where: { status: "approved" } } },
      },
      joinRequests: {
        where: { userId: session.user.id },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });

  if (!activity) notFound();

  const isHost = activity.host.id === session.user.id;
  const existingRequest = activity.joinRequests[0] ?? null;

  // Host sees all requests with scores; others see only approved participants
  const allJoinRequests = isHost
    ? await getJoinRequestsForHost(id)
    : await db.joinRequest.findMany({
        where: { activityId: id, status: "approved" },
        select: {
          id: true,
          status: true,
          compatibilityScore: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
  const spotsLeft = activity.maxSpots - activity._count.joinRequests;
  const isPast = activity.dateTime <= new Date();
  const isCancelled = activity.status === "cancelled";
  const isFull = spotsLeft <= 0;

  const formattedDate = activity.dateTime.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Back button */}
        <BackButton />

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            boxShadow: "0 4px 20px rgba(255,45,155,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Gradient header strip */}
          <div
            style={{
              height: 4,
              background:
                "linear-gradient(135deg, var(--fuchsia), var(--violet))",
            }}
          />

          <div style={{ padding: "20px 24px 24px" }}>
            {/* Tags */}
            {activity.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {activity.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      background: "var(--violet-bg)",
                      border: "1px solid rgba(139,92,246,0.2)",
                      color: "var(--violet)",
                      fontSize: 12,
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                fontSize: 24,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
                lineHeight: 1.3,
                marginBottom: 8,
              }}
            >
              {activity.title}
            </h1>

            {/* Description */}
            {activity.description && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {activity.description}
              </p>
            )}

            {/* Meta */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {formattedDate}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {activity.location}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>👥</span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                      spotsLeft <= 2 ? "var(--fuchsia)" : "var(--text-secondary)",
                  }}
                >
                  {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                </span>
              </div>
            </div>

            {/* Host */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 0",
                borderTop: "1px solid var(--border)",
                marginBottom: 20,
              }}
            >
              <Link
                href={`/user/${activity.host.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "var(--fuchsia-bg)",
                    flexShrink: 0,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activity.host.image ? (
                    <Image
                      src={activity.host.image}
                      alt={activity.host.name ?? "Host"}
                      fill
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <span style={{ fontSize: 16 }}>👤</span>
                  )}
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {activity.host.name ?? "Anonymous"}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginLeft: 8,
                    }}
                  >
                    Host
                  </span>
                </div>
              </Link>
            </div>

            {/* Join action area */}
            <JoinAction
              isHost={isHost}
              existingRequest={existingRequest}
              isCancelled={isCancelled}
              isPast={isPast}
              isFull={isFull}
              activityId={activity.id}
            />
          </div>
        </div>

        {/* Join Requests / Participants */}
        {allJoinRequests.length > 0 || isHost ? (
          <div style={{ marginTop: 20 }}>
            <p
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {isHost
                ? `Join Requests (${allJoinRequests.length})`
                : `Going (${allJoinRequests.length})`}
            </p>

            {allJoinRequests.length === 0 ? (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: 20,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                }}
              >
                No requests yet
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {allJoinRequests.map((jr) => (
                  <JoinRequestRow
                    key={jr.id}
                    joinRequest={jr}
                    showScore={isHost}
                    showStatus={isHost}
                    isHost={isHost}
                    activityId={activity.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function JoinAction({
  isHost,
  existingRequest,
  isCancelled,
  isPast,
  isFull,
  activityId,
}: {
  isHost: boolean;
  existingRequest: { id: string; status: string } | null;
  isCancelled: boolean;
  isPast: boolean;
  isFull: boolean;
  activityId: string;
}) {
  if (isHost) {
    return <StatusBadge text="You're hosting this activity" variant="neutral" />;
  }
  if (isCancelled) {
    return <StatusBadge text="This activity was cancelled" variant="muted" />;
  }
  if (isPast) {
    return <StatusBadge text="This activity has ended" variant="muted" />;
  }
  if (existingRequest?.status === "approved") {
    return <StatusBadge text="You're in!" variant="success" />;
  }
  if (existingRequest?.status === "pending") {
    return <StatusBadge text="Request pending" variant="pending" />;
  }
  if (existingRequest?.status === "declined") {
    return <StatusBadge text="Request declined" variant="muted" />;
  }
  if (isFull) {
    return <StatusBadge text="This activity is full" variant="muted" />;
  }
  return <JoinButton activityId={activityId} />;
}

function JoinRequestRow({
  joinRequest,
  showScore = true,
  showStatus = true,
  isHost = false,
  activityId,
}: {
  joinRequest: {
    id: string;
    status: string;
    compatibilityScore: number | null;
    user: { id: string; name: string | null; image: string | null };
  };
  showScore?: boolean;
  showStatus?: boolean;
  isHost?: boolean;
  activityId?: string;
}) {
  const statusStyles: Record<string, { bg: string; border: string; color: string }> = {
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

  const ss = statusStyles[joinRequest.status] ?? statusStyles.pending;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Avatar + Name */}
      <Link
        href={`/user/${joinRequest.user.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            overflow: "hidden",
            background: "var(--fuchsia-bg)",
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {joinRequest.user.image ? (
            <Image
              src={joinRequest.user.image}
              alt={joinRequest.user.name ?? "User"}
              fill
              style={{ objectFit: "cover" }}
              unoptimized
            />
          ) : (
            <span style={{ fontSize: 14 }}>👤</span>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {joinRequest.user.name ?? "Anonymous"}
        </span>
      </Link>

      {/* Score — host only */}
      {showScore && joinRequest.compatibilityScore != null && (
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "100px",
            background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
            color: "#fff",
            fontSize: 12,
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {Math.round(joinRequest.compatibilityScore)}
        </span>
      )}

      {/* Host: approve/decline for pending, status pill for resolved */}
      {isHost && activityId && joinRequest.status === "pending" ? (
        <JoinRequestActions
          activityId={activityId}
          joinRequestId={joinRequest.id}
        />
      ) : (
        showStatus && <span
          style={{
            padding: "3px 10px",
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
          {joinRequest.status}
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  text,
  variant,
}: {
  text: string;
  variant: "neutral" | "muted" | "success" | "pending";
}) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    neutral: {
      bg: "var(--violet-bg)",
      border: "2px solid rgba(139,92,246,0.2)",
      color: "var(--violet)",
    },
    muted: {
      bg: "var(--fuchsia-bg)",
      border: "2px solid var(--border)",
      color: "var(--text-muted)",
    },
    success: {
      bg: "rgba(45,212,168,0.1)",
      border: "2px solid rgba(45,212,168,0.3)",
      color: "#2DD4A8",
    },
    pending: {
      bg: "rgba(255,202,40,0.1)",
      border: "2px solid rgba(255,202,40,0.3)",
      color: "#D4A017",
    },
  };

  const s = styles[variant];

  return (
    <div
      style={{
        padding: "14px 24px",
        borderRadius: "100px",
        background: s.bg,
        border: s.border,
        color: s.color,
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 15,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
