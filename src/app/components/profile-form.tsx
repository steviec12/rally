"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileData {
  name: string;
  bio: string;
  image: string;
  interests: string[];
  location: string;
}

export default function ProfileForm({ initial }: { initial: ProfileData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [interests, setInterests] = useState<string[]>(initial.interests ?? []);
  const [location, setLocation] = useState(initial.location ?? "");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImage(data.url);
      } else {
        setErrors((prev) => ({ ...prev, form: data.error ?? "Upload failed." }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, form: "Upload failed. Please try again." }));
    } finally {
      setUploading(false);
    }
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !interests.includes(tag)) {
        setInterests((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Name is required." });
      return;
    }
    setErrors({});
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, image, interests, location }),
    });

    setSaving(false);

    if (res.ok) {
      router.refresh();
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setErrors({ form: data.error ?? "Something went wrong." });
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "3px solid var(--fuchsia-bg)",
            overflow: "hidden",
            cursor: "pointer",
            background: "var(--fuchsia-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {image ? (
            <Image src={image} alt="Avatar" fill style={{ objectFit: "cover" }} unoptimized />
          ) : (
            <span style={{ fontSize: 32 }}>👤</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            fontSize: 13,
            color: "var(--fuchsia)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Name */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={inputStyle(!!errors.name)}
        />
        {errors.name && <span style={errorStyle}>{errors.name}</span>}
      </div>

      {/* Bio */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people a bit about yourself"
          rows={3}
          style={{ ...inputStyle(false), resize: "none" }}
        />
      </div>

      {/* Location */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={labelStyle}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Los Angeles, CA"
          style={inputStyle(false)}
        />
      </div>

      {/* Interests */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={labelStyle}>Interests</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            padding: "10px 12px",
            borderRadius: "12px",
            border: "2px solid var(--border)",
            background: "#fff",
            minHeight: 48,
          }}
        >
          {interests.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "100px",
                background: "var(--fuchsia-bg)",
                border: "1px solid rgba(255,45,155,0.2)",
                color: "var(--fuchsia)",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fuchsia)",
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={interests.length === 0 ? "Type a tag and press Enter" : "Add more…"}
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              color: "var(--text-primary)",
              background: "transparent",
              minWidth: 140,
              flex: 1,
            }}
          />
        </div>
      </div>

      {errors.form && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "10px",
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
        type="submit"
        disabled={saving || uploading}
        style={{
          padding: "13px",
          borderRadius: "12px",
          border: "none",
          background: saving ? "var(--text-muted)" : "linear-gradient(135deg, var(--fuchsia), var(--violet))",
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 15,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: "11px 14px",
    borderRadius: "12px",
    border: `2px solid ${hasError ? "#FF4444" : "var(--border)"}`,
    background: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#CC0000",
  fontFamily: "var(--font-body)",
  paddingLeft: 4,
};
