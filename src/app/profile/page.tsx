import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import ProfileForm from '@/app/components/profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
      image: true,
      interests: true,
      location: true,
      locationLat: true,
      locationLng: true,
    },
  });

  if (!user) redirect('/');

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-4 py-10"
      style={{ background: 'var(--bg)' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-outfit), sans-serif',
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            marginBottom: 24,
          }}
        >
          Edit profile
        </h1>

        <ProfileForm
          initial={{
            name: user.name ?? '',
            bio: user.bio ?? '',
            image: user.image ?? '',
            interests: user.interests,
            location: user.location ?? '',
            locationLat: user.locationLat,
            locationLng: user.locationLng,
          }}
        />
      </div>
    </main>
  );
}
