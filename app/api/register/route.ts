import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Derive a unique username from the email's local part. */
async function generateUsername(email: string) {
  let base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 20);
  if (base.length < 3) base = `user${base}`;

  let candidate = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${++suffix}`;
  }
  return candidate;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? '').toLowerCase().trim();
  const displayName = String(body?.displayName ?? '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400 }
    );
  }
  if (!displayName || displayName.length > 50) {
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: 'An account with that email already exists. Sign in instead.' },
      { status: 409 }
    );
  }

  const username = await generateUsername(email);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      displayName,
      city: '',
      passwordHash: '', // passwordless — signs in by email (or a connected account)
      avatarUrl: `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(username)}&backgroundColor=f2e4d8`,
      credibilityScore: { create: {} },
    },
  });

  return NextResponse.json({ ok: true, username: user.username });
}
