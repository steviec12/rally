'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface StarRatingProps {
  activityId: string;
  rateeId: string;
  existingScore?: number;
}

export default function StarRating({ activityId, rateeId, existingScore }: StarRatingProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (existingScore) {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: 18,
              color: star <= existingScore ? 'var(--fuchsia)' : 'var(--text-muted)',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  async function handleSubmit() {
    if (selected === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/activities/${activityId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateeId, score: selected }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }} onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitting}
            onMouseEnter={() => setHovered(star)}
            onClick={() => setSelected(star)}
            style={{
              fontSize: 18,
              color: star <= (hovered || selected) ? 'var(--fuchsia)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'color 0.15s',
            }}
          >
            ★
          </button>
        ))}
      </div>
      {selected > 0 && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '3px 10px',
            borderRadius: '100px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '...' : 'Rate'}
        </button>
      )}
      {error && (
        <span
          style={{
            fontSize: 11,
            color: '#CC0000',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
