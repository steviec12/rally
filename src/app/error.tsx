'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p
          style={{
            fontFamily: 'var(--font-outfit), sans-serif',
            fontWeight: 900,
            fontSize: 48,
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          Oops
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-outfit), sans-serif',
            fontWeight: 800,
            fontSize: 22,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--text-secondary)',
            marginBottom: 24,
          }}
        >
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '12px 28px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
