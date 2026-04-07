import Link from "next/link";
import Image from "next/image";

interface ActivityCardProps {
  id: string;
  title: string;
  tags: string[];
  dateTime: string;
  location: string;
  maxSpots: number;
  spotsApproved: number;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function ActivityCard({
  id,
  title,
  tags,
  dateTime,
  location,
  maxSpots,
  spotsApproved,
  host,
}: ActivityCardProps) {
  const spotsLeft = maxSpots - spotsApproved;
  const isFull = spotsLeft <= 0;
  const formattedDate = new Date(dateTime).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
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
      <div style={{ height: 4, background: "linear-gradient(135deg, var(--fuchsia), var(--violet))" }} />

      <div style={{ padding: "16px 20px 20px" }}>
        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "var(--violet-bg)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  color: "var(--violet)",
                  fontSize: 11,
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
        <h3
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-primary)",
            letterSpacing: "-0.4px",
            lineHeight: 1.3,
            marginBottom: 12,
          }}
        >
          {title}
        </h3>

        {/* Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              {formattedDate}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              {location}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>👥</span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 700,
                color: spotsLeft <= 2 ? "var(--fuchsia)" : "var(--text-secondary)",
              }}
            >
              {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>

        {/* Footer: host + join button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href={`/user/${host.id}`}
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          >
            <div
              style={{
                width: 28,
                height: 28,
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
              {host.image ? (
                <Image src={host.image} alt={host.name ?? "Host"} fill style={{ objectFit: "cover" }} unoptimized />
              ) : (
                <span style={{ fontSize: 13 }}>👤</span>
              )}
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
              {host.name ?? "Anonymous"}
            </span>
          </Link>

          <Link
            href={`/activities/${id}`}
            style={{
              padding: "8px 16px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 2px 12px rgba(255,45,155,0.3)",
            }}
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
