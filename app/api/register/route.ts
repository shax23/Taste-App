import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? '').toLowerCase().trim();
  const displayName = String(body?.displayName ?? '').trim();
  const neighbourhood = String(body?.neighbourhood ?? '').trim().slice(0, 50) || 'Barcelona';
  const password = String(body?.password ?? '');

  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–24 characters (letters, numbers, _ . -).' },
      { status: 400 }
    );
  }
  if (!displayName || displayName.length > 50) {
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'That username is taken.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      city: neighbourhood,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(username)}&backgroundColor=f2e4d8`,
      credibilityScore: { create: {} },
    },
  });

  return NextResponse.json({ ok: true, username: user.username });
}
