'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface JoinRequestActionsProps {
  activityId: string;
  joinRequestId: string;
}

export default function JoinRequestActions({ activityId, joinRequestId }: JoinRequestActionsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<'approved' | 'declined' | null>(null);
  const [error, setError] = useState('');

  async function handleAction(newStatus: 'approved' | 'declined') {
    setSubmitting(newStatus);
    setError('');
    try {
      const res = await fetch(`/api/activities/${activityId}/join-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinRequestId, status: newStatus }),
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
      setSubmitting(null);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => handleAction('approved')}
        disabled={submitting !== null}
        style={{
          padding: '4px 12px',
          borderRadius: '100px',
          border: '1.5px solid #2DD4A8',
          background: submitting === 'approved' ? 'rgba(45,212,168,0.2)' : 'rgba(45,212,168,0.1)',
          color: '#2DD4A8',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          cursor: submitting !== null ? 'not-allowed' : 'pointer',
          opacity: submitting !== null ? 0.6 : 1,
        }}
      >
        {submitting === 'approved' ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => handleAction('declined')}
        disabled={submitting !== null}
        style={{
          padding: '4px 12px',
          borderRadius: '100px',
          border: '1.5px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          cursor: submitting !== null ? 'not-allowed' : 'pointer',
          opacity: submitting !== null ? 0.6 : 1,
        }}
      >
        {submitting === 'declined' ? '...' : 'Decline'}
      </button>
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
