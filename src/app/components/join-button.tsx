'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface JoinButtonProps {
  activityId: string;
}

export default function JoinButton({ activityId }: JoinButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleJoin() {
    setSubmitting(true);
    setResult(null);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/activities/${activityId}/join-requests`, {
        method: 'POST',
      });
      if (res.ok) {
        setResult('success');
        setTimeout(() => router.refresh(), 1200);
      } else {
        const data = await res.json();
        setResult('error');
        setErrorMessage(data.error ?? 'Something went wrong.');
      }
    } catch {
      setResult('error');
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result === 'success') {
    return (
      <div
        style={{
          padding: '14px 24px',
          borderRadius: '100px',
          background: 'var(--fuchsia-bg)',
          border: '2px solid var(--fuchsia-light)',
          color: 'var(--fuchsia)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        Request sent!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={handleJoin}
        disabled={submitting}
        style={{
          padding: '14px 24px',
          borderRadius: '100px',
          border: 'none',
          background: submitting
            ? 'var(--text-muted)'
            : 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 15,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.6 : 1,
          boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,45,155,0.3)',
        }}
      >
        {submitting ? 'Sending request...' : 'Request to Join'}
      </button>
      {result === 'error' && (
        <p
          style={{
            fontSize: 13,
            color: '#CC0000',
            fontFamily: 'var(--font-body)',
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
