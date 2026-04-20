import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SignInButton from '@/app/components/sign-in-button';
import AuthForm from '@/app/components/auth-form';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <main
      className="relative flex flex-col flex-1 items-center justify-center min-h-screen overflow-hidden px-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          right: '-3%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, var(--fuchsia-bg-deep) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'blob-drift 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '-6%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, var(--violet-bg) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'blob-drift 16s ease-in-out infinite reverse',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm p-10"
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: '-2px',
              color: 'var(--fuchsia)',
            }}
          >
            Rally
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                background: 'var(--sunny)',
                borderRadius: '50%',
                animation: 'bounce-dot 2s ease-in-out infinite',
              }}
            />
          </span>
        </div>

        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1
              style={{
                fontFamily: 'var(--font-outfit), sans-serif',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
              }}
            >
              Find your people.
              <br />
              Do your thing.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              College athletes, gym-goers, hikers &amp; more
            </p>
          </div>

          <SignInButton />

          <AuthForm />

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            By continuing, you agree to Rally&apos;s terms of service
          </p>
        </>
      </div>

      <style>{`
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.1); }
        }
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -25px) scale(1.04); }
          66% { transform: translate(-15px, 12px) scale(0.96); }
        }
      `}</style>
    </main>
  );
}
