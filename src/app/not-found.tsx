import Link from 'next/link';

export default function NotFound() {
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
            fontSize: 64,
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
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
          Page not found
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--text-secondary)',
            marginBottom: 24,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/feed"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Browse activities
        </Link>
      </div>
    </main>
  );
}
