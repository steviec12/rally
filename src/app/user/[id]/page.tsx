import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getProfileStats } from '@/lib/profile';
import Image from 'next/image';
import BackButton from '@/app/components/back-button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;

  const [user, stats] = await Promise.all([
    db.user.findUnique({
      where: { id },
      select: {
        name: true,
        bio: true,
        image: true,
        interests: true,
        location: true,
      },
    }),
    getProfileStats(id),
  ]);

  if (!user) notFound();

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-4 py-10"
      style={{ background: 'var(--bg)' }}
    >
      <BackButton />
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--fuchsia-bg)',
            background: 'var(--fuchsia-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Avatar'}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <span style={{ fontSize: 28 }}>👤</span>
          )}
        </div>

        {/* Name, location, bio */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-outfit), sans-serif',
              fontWeight: 800,
              fontSize: 22,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            {user.name ?? 'Anonymous'}
          </h1>
          {user.location && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              📍 {user.location}
            </p>
          )}
          {user.bio && (
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {user.bio}
            </p>
          )}
        </div>

        {/* Interests */}
        {user.interests.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {user.interests.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  background: 'var(--fuchsia-bg)',
                  border: '1px solid rgba(255,45,155,0.2)',
                  color: 'var(--fuchsia)',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'var(--fuchsia-bg)',
              border: '1px solid rgba(255,45,155,0.2)',
              color: 'var(--fuchsia)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {stats.activitiesHosted} activities hosted
          </span>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'var(--violet-bg)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: 'var(--violet)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {stats.activitiesJoined} activities joined
          </span>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #FF2D9B, #8B5CF6)',
              color: '#fff',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
            }}
          >
            ★ {stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—'} avg rating
          </span>
        </div>
      </div>
    </main>
  );
}
