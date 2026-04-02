"use client";

import { useState } from "react";
import ActivityCard from "@/app/components/activity-card";
import type { FeedActivity } from "@/types/activity";

interface FeedListProps {
  initialActivities: FeedActivity[];
  initialNextCursor: string | null;
}

export default function FeedList({ initialActivities, initialNextCursor }: FeedListProps) {
  const [activities, setActivities] = useState<FeedActivity[]>(initialActivities);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/activities?cursor=${nextCursor}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setActivities((prev) => [...prev, ...data.activities]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Failed to load more activities:", err);
      setError("Couldn't load more activities. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (activities.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ fontSize: 32, marginBottom: 12 }}>🏃</p>
        <p
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          No activities yet
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)" }}>
          Be the first to post one!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {activities.map((a) => (
        <ActivityCard
          key={a.id}
          id={a.id}
          title={a.title}
          tags={a.tags}
          dateTime={a.dateTime}
          location={a.location}
          maxSpots={a.maxSpots}
          spotsApproved={a._count.joinRequests}
          host={a.host}
        />
      ))}

      {error && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#CC0000", fontFamily: "var(--font-body)" }}>
          {error}
        </p>
      )}

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            padding: "14px",
            borderRadius: "100px",
            border: "2px solid var(--border)",
            background: "transparent",
            color: loading ? "var(--text-muted)" : "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
