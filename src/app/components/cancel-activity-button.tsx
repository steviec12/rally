"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CancelActivityButtonProps {
  activityId: string;
}

export default function CancelActivityButton({ activityId }: CancelActivityButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
      }
    } catch (err) {
      console.error("Cancel activity failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          flexShrink: 0,
          fontSize: 12,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          color: "var(--text-secondary)",
          background: "transparent",
          border: "1.5px solid var(--border)",
          padding: "4px 10px",
          borderRadius: "100px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,10,27,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "var(--surface)",
              borderRadius: 20,
              border: "1px solid var(--border)",
              boxShadow: "0 8px 40px rgba(255,45,155,0.12)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: "var(--text-primary)",
                letterSpacing: "-0.4px",
              }}
            >
              Cancel this activity?
            </h2>

            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              This can&apos;t be undone. Optionally let your joiners know why.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional) — e.g. something came up, weather, etc."
              rows={3}
              maxLength={500}
              style={{
                width: "100%",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--text-primary)",
                background: "var(--fuchsia-bg)",
                border: "1.5px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ fontSize: 13, color: "#CC0000", fontFamily: "var(--font-body)" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowModal(false); setReason(""); setError(""); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "100px",
                  border: "2px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Keep it
              </button>
              <button
                onClick={handleConfirm}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "100px",
                  border: "none",
                  background: cancelling ? "var(--text-muted)" : "var(--text-primary)",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
