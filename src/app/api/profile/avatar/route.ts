import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const fileEntry = formData.get('file');

  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const file = fileEntry as File;

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 });
  }

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  const ext = mimeToExt[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 });
  }
  const filename = `avatars/${session.user.id}.${ext}`;

  const blob = await put(filename, file, {
    access: 'public',
    allowOverwrite: true,
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { image: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
