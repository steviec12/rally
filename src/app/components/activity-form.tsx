"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Field = "title" | "dateTime" | "location" | "spots" | "tags" | "description" | null;

type InitialData = {
  id: string;
  title: string;
  tags: string[];
  dateTime: string;
  location: string;
  maxSpots: number;
  description?: string | null;
};

export default function ActivityForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert stored ISO dateTime to datetime-local format (YYYY-MM-DDTHH:mm) in UTC,
  // consistent with how minDateTime is derived and how the form submits values.
  const toLocalInput = (iso: string) => new Date(iso).toISOString().slice(0, 16);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [dateTime, setDateTime] = useState(initialData?.dateTime ? toLocalInput(initialData.dateTime) : "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [maxSpots, setMaxSpots] = useState(initialData?.maxSpots ?? 2);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [activeField, setActiveField] = useState<Field>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDescription, setShowDescription] = useState(!!(initialData?.description));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEditMode = !!initialData;

  const minDateTime = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);

  function formatDateTime(dt: string) {
    if (!dt) return null;
    return new Date(dt).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) setTags((p) => [...p, tag]);
      setTagInput("");
      setShowTagInput(false);
    }
    if (e.key === "Escape") {
      setTagInput("");
      setShowTagInput(false);
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Add a title";
    if (!dateTime) e.dateTime = "Pick a date & time";
    else if (new Date(dateTime) <= new Date()) e.dateTime = "Must be in the future";
    if (!location.trim()) e.location = "Add a location";
    return e;
  }

  async function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const url = initialData ? `/api/activities/${initialData.id}` : "/api/activities";
    const method = initialData ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tags,
          dateTime,
          location,
          maxSpots,
          description: description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
        router.push("/dashboard");
      } else {
        setErrors({ form: data.error ?? "Something went wrong." });
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const fieldBorder = (field: string) =>
    errors[field]
      ? "2px solid #FF4444"
      : activeField === field
      ? "2px solid var(--fuchsia)"
      : "2px solid transparent";

  return (
    <div
      style={{
        width: "100%",
        background: "var(--surface)",
        borderRadius: 20,
        border: "1px solid var(--border)",
        boxShadow: "0 8px 40px rgba(255,45,155,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Card gradient header strip */}
      <div
        style={{
          height: 6,
          background: "linear-gradient(135deg, var(--fuchsia), var(--violet))",
        }}
      />

      <div style={{ padding: "24px 24px 0" }}>
        {/* Tags row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, alignItems: "center" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={() => setTags((p) => p.filter((t) => t !== tag))}
              style={{
                padding: "4px 10px",
                borderRadius: "100px",
                background: "var(--violet-bg)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "var(--violet)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                cursor: "pointer",
                userSelect: "none",
              }}
              title="Click to remove"
            >
              {tag} ×
            </span>
          ))}

          {showTagInput ? (
            <input
              autoFocus
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { setTagInput(""); setShowTagInput(false); }}
              placeholder="tag name + Enter"
              style={{
                fontSize: 12,
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                background: "var(--fuchsia-bg)",
                border: "1.5px solid var(--fuchsia)",
                borderRadius: "100px",
                padding: "4px 10px",
                outline: "none",
                width: 130,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              style={{
                padding: "4px 10px",
                borderRadius: "100px",
                background: "transparent",
                border: "1.5px dashed var(--border)",
                color: "var(--text-muted)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + add tag
            </button>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            borderRadius: 10,
            border: fieldBorder("title"),
            padding: "4px 8px",
            marginBottom: 4,
            transition: "border 0.15s",
          }}
        >
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setActiveField("title")}
            onBlur={() => setActiveField(null)}
            placeholder="What's happening? Give it a great title…"
            rows={2}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: title ? "var(--text-primary)" : "var(--text-muted)",
              letterSpacing: "-0.5px",
              lineHeight: 1.3,
            }}
          />
        </div>
        {errors.title && <p style={errorStyle}>{errors.title}</p>}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Date & time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 8px",
            borderRadius: 10,
            border: fieldBorder("dateTime"),
            cursor: activeField === "dateTime" ? "default" : "pointer",
            transition: "border 0.15s",
          }}
          onClick={() => {
            setActiveField("dateTime");
            setTimeout(() => dateInputRef.current?.focus(), 0);
          }}
        >
          <span style={{ fontSize: 18 }}>📅</span>
          {activeField === "dateTime" ? (
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={dateTime}
              min={minDateTime}
              onChange={(e) => { setDateTime(e.target.value); setErrors((p) => ({ ...p, dateTime: "" })); }}
              onBlur={() => setActiveField(null)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
                color: dateTime ? "var(--text-primary)" : "var(--text-muted)",
                flex: 1,
              }}
            >
              {dateTime ? formatDateTime(dateTime) : "Pick a date & time"}
            </span>
          )}
        </div>
        {errors.dateTime && <p style={errorStyle}>{errors.dateTime}</p>}

        {/* Location */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "2px 8px",
            borderRadius: 10,
            border: fieldBorder("location"),
            transition: "border 0.15s",
          }}
        >
          <span style={{ fontSize: 18 }}>📍</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setActiveField("location")}
            onBlur={() => setActiveField(null)}
            placeholder="Where is it?"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              color: location ? "var(--text-primary)" : "var(--text-muted)",
              padding: "8px 0",
            }}
          />
        </div>
        {errors.location && <p style={errorStyle}>{errors.location}</p>}

        {/* Spots stepper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 8px",
            borderRadius: 10,
            border: "2px solid transparent",
          }}
        >
          <span style={{ fontSize: 18 }}>👥</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", flex: 1 }}>
            Spots available
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setMaxSpots((p) => Math.max(1, p - 1))}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                background: "#fff",
                color: "var(--text-primary)",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              −
            </button>
            <span
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "var(--fuchsia)",
                minWidth: 28,
                textAlign: "center",
              }}
            >
              {maxSpots}
            </span>
            <button
              type="button"
              onClick={() => setMaxSpots((p) => p + 1)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                background: "#fff",
                color: "var(--text-primary)",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Description */}
        {showDescription ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "2px 8px",
              borderRadius: 10,
              border: activeField === "description" ? "2px solid var(--fuchsia)" : "2px solid transparent",
              transition: "border 0.15s",
            }}
          >
            <span style={{ fontSize: 18, marginTop: 8 }}>💬</span>
            <textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setActiveField("description")}
              onBlur={() => setActiveField(null)}
              placeholder="Any extra details — skill level, what to bring, etc."
              rows={3}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--text-secondary)",
                padding: "8px 0",
                lineHeight: 1.5,
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px",
              borderRadius: 10,
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)" }}>
              Add a description…
            </span>
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {errors.form && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#FFF0F0",
            border: "1px solid #FFCCCC",
            color: "#CC0000",
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}>
            {errors.form}
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: "14px",
            borderRadius: "100px",
            border: "none",
            background: saving ? "var(--text-muted)" : "linear-gradient(135deg, var(--fuchsia), var(--violet))",
            color: "#fff",
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 800,
            fontSize: 16,
            cursor: saving ? "not-allowed" : "pointer",
            letterSpacing: "-0.3px",
            boxShadow: saving ? "none" : "0 4px 20px rgba(255,45,155,0.35)",
            transition: "all 0.15s",
          }}
        >
          {saving ? (isEditMode ? "Saving…" : "Posting…") : (isEditMode ? "Save changes" : "Post it 🎉")}
        </button>
      </div>
    </div>
  );
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#CC0000",
  fontFamily: "var(--font-body)",
  paddingLeft: 36,
  marginTop: -2,
};
