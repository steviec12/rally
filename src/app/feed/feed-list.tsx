"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ActivityCard from "@/app/components/activity-card";
import type { FeedActivity, FeedFilters } from "@/types/activity";

interface FeedListProps {
  initialActivities: FeedActivity[];
  initialNextCursor: string | null;
  filters?: FeedFilters;
}

function buildFilterQuery(filters?: FeedFilters): string {
  const params = new URLSearchParams();
  if (filters?.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters?.customTags) params.set("customTags", "true");
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.distanceKm != null) params.set("distanceKm", String(filters.distanceKm));
  const qs = params.toString();
  return qs ? `&${qs}` : "";
}

export default function FeedList({ initialActivities, initialNextCursor, filters }: FeedListProps) {
  const [activities, setActivities] = useState<FeedActivity[]>(initialActivities);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtersKey = JSON.stringify(filters ?? {});
  const prevFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      setActivities(initialActivities);
      setNextCursor(initialNextCursor);
    }
  }, [filtersKey, initialActivities, initialNextCursor]);

  const filterQuery = buildFilterQuery(filters);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError("");
    try {
      let cursor = nextCursor;
      let newActivities: FeedActivity[] = [];

      // Retry if distance filtering returns empty pages but more data exists
      while (cursor) {
        const res = await fetch(`/api/activities?cursor=${cursor}${filterQuery}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        newActivities = data.activities;
        cursor = data.nextCursor;
        if (newActivities.length > 0 || !cursor) break;
      }

      setActivities((prev) => [...prev, ...newActivities]);
      setNextCursor(cursor);
    } catch (err) {
      console.error("Failed to load more activities:", err);
      setError("Couldn't load more activities. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasFilters = filters && Object.keys(filters).length > 0;

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
        <p style={{ fontSize: 32, marginBottom: 12 }}>{hasFilters ? "🔍" : "🏃"}</p>
        <p
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          {hasFilters ? "No activities match your filters" : "No activities yet"}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
          {hasFilters ? "Try adjusting or clearing your filters." : "Be the first to post one!"}
        </p>
        {hasFilters ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link
              href="/feed"
              style={{
                padding: "12px 24px",
                borderRadius: "100px",
                border: "2px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Clear Filters
            </Link>
            <Link
              href="/activities/new"
              style={{
                padding: "12px 24px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Post an Activity
            </Link>
          </div>
        ) : (
          <Link
            href="/activities/new"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Post an Activity
          </Link>
        )}
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
