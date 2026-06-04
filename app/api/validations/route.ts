import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateAndStore } from '@/lib/credibility';

/**
 * POST /api/validations  { postId, note? }
 * "I tried this" — records a validation and triggers credibility
 * recalculation for the post author (non-blocking).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const validatorId = session.user.userId;

  const body = await req.json().catch(() => null);
  const postId = String(body?.postId ?? '');
  const note = body?.note ? String(body.note).slice(0, 280) : null;

  if (!postId) {
    return NextResponse.json({ error: 'postId is required.' }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }
  if (post.userId === validatorId) {
    return NextResponse.json(
      { error: 'You cannot validate your own post.' },
      { status: 400 }
    );
  }

  const existing = await prisma.validation.findFirst({
    where: { postId, validatorId },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'You already validated this post.' },
      { status: 409 }
    );
  }

  const validation = await prisma.validation.create({
    data: { validatorId, validatedUserId: post.userId, postId, note },
  });

  // Recalculate the author's credibility asynchronously — don't block the response.
  void recalculateAndStore(post.userId).catch((e) =>
    console.error('credibility recalc failed', e)
  );

  return NextResponse.json({ ok: true, validationId: validation.id });
}
