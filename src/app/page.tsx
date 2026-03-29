import { auth } from "@/auth";
import SignInButton from "@/app/components/sign-in-button";
import SignOutButton from "@/app/components/sign-out-button";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  return (
    <main
      className="relative flex flex-col flex-1 items-center justify-center min-h-screen overflow-hidden px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Background blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          right: "-3%",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, var(--fuchsia-bg-deep) 0%, transparent 60%)",
          filter: "blur(60px)",
          animation: "blob-drift 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          left: "-6%",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, var(--violet-bg) 0%, transparent 60%)",
          filter: "blur(60px)",
          animation: "blob-drift 16s ease-in-out infinite reverse",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm p-10"
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: "-2px",
              color: "var(--fuchsia)",
            }}
          >
            Rally
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                background: "var(--sunny)",
                borderRadius: "50%",
                animation: "bounce-dot 2s ease-in-out infinite",
              }}
            />
          </span>
        </div>

        {session?.user ? (
          /* ── Signed-in state ── */
          <>
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User avatar"}
                width={64}
                height={64}
                className="rounded-full"
                style={{ border: "3px solid var(--fuchsia-bg)" }}
              />
            )}
            <div className="flex flex-col items-center gap-1 text-center">
              <p
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                Welcome back, {session.user.name?.split(" ")[0]} 👋
              </p>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {session.user.email}
              </p>
            </div>

            {/* Activity count badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "var(--fuchsia-bg)",
                border: "1px solid rgba(255,45,155,0.15)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fuchsia)" }}>
                0 activities completed
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                className="w-full py-3 rounded-full font-['Outfit'] font-bold text-base text-white transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  background: "var(--fuchsia)",
                  boxShadow: "var(--shadow-btn)",
                }}
              >
                Go to dashboard →
              </button>
              <SignOutButton />
            </div>
          </>
        ) : (
          /* ── Signed-out state ── */
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  letterSpacing: "-0.5px",
                  color: "var(--text-primary)",
                }}
              >
                Find your people.
                <br />
                Do your thing.
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                College athletes, gym-goers, hikers &amp; more
              </p>
            </div>

            <SignInButton />

            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              By continuing, you agree to Rally&apos;s terms of service
            </p>
          </>
        )}
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
