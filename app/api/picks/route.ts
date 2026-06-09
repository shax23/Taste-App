import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CITY, LIST_SIZE, PICK_CATEGORIES, toPickCategory } from '@/lib/taste';

async function requireUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.userId ?? null;
}

function serialize(pick: any) {
  return {
    id: pick.id,
    note: pick.note,
    rank: pick.rank,
    place: {
      id: pick.place.id,
      name: pick.place.name,
      category: toPickCategory(pick.place.category),
      address: pick.place.address,
      neighborhood: pick.place.neighborhood,
      lat: pick.place.lat,
      lng: pick.place.lng,
    },
  };
}

/** GET /api/picks — my list, ranked. */
export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const picks = await prisma.pick.findMany({
    where: { userId },
    include: { place: true },
    orderBy: { rank: 'asc' },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { publishedAt: true },
  });

  return NextResponse.json({
    picks: picks.map(serialize),
    published: !!user?.publishedAt,
    listSize: LIST_SIZE,
  });
}

/**
 * POST /api/picks
 * { placeId, note? }                                  — add from the curated pool
 * { place: {name,lat,lng,address,neighborhood,externalId?}, category, note? } — add from lookup
 */
export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });

  const count = await prisma.pick.count({ where: { userId } });
  if (count >= LIST_SIZE) {
    return NextResponse.json(
      { error: `Your list is full — ${LIST_SIZE} places. Remove one to add another.` },
      { status: 400 }
    );
  }

  let placeId: string | null = body.placeId ?? null;

  if (!placeId && body.place) {
    const cat = String(body.category ?? '');
    if (!PICK_CATEGORIES.some((c) => c.slug === cat)) {
      return NextResponse.json({ error: 'Pick a category for this place.' }, { status: 400 });
    }
    const p = body.place;
    const name = String(p.name ?? '').trim().slice(0, 80);
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    if (!name || !isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error: 'Place needs a name and coordinates.' }, { status: 400 });
    }
    // reuse an existing row when the same external place was added before
    const externalId = p.externalId ? String(p.externalId) : null;
    const existing = externalId
      ? await prisma.place.findFirst({ where: { externalId, city: CITY } })
      : await prisma.place.findFirst({ where: { name, city: CITY } });
    if (existing) {
      placeId = existing.id;
    } else {
      const created = await prisma.place.create({
        data: {
          name,
          category: cat,
          address: String(p.address ?? '').slice(0, 120),
          city: CITY,
          neighborhood: p.neighborhood ? String(p.neighborhood).slice(0, 60) : null,
          externalId,
          lat,
          lng,
        },
      });
      placeId = created.id;
    }
  }

  if (!placeId) return NextResponse.json({ error: 'placeId or place required.' }, { status: 400 });

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place || place.city !== CITY) {
    return NextResponse.json({ error: 'Taste is Barcelona-only (for now).' }, { status: 400 });
  }

  const dupe = await prisma.pick.findUnique({
    where: { userId_placeId: { userId, placeId } },
  });
  if (dupe) return NextResponse.json({ error: 'Already on your list.' }, { status: 409 });

  const pick = await prisma.pick.create({
    data: {
      userId,
      placeId,
      note: body.note ? String(body.note).slice(0, 140) : null,
      rank: count + 1,
    },
    include: { place: true },
  });

  return NextResponse.json({ ok: true, pick: serialize(pick) });
}

/** PATCH /api/picks  { pickId, note? , move?: 'up'|'down' } */
export async function PATCH(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const pickId = String(body?.pickId ?? '');
  const pick = await prisma.pick.findFirst({ where: { id: pickId, userId } });
  if (!pick) return NextResponse.json({ error: 'Pick not found.' }, { status: 404 });

  if (typeof body.note === 'string') {
    await prisma.pick.update({
      where: { id: pick.id },
      data: { note: body.note.trim().slice(0, 140) || null },
    });
  }

  if (body.move === 'up' || body.move === 'down') {
    const neighborRank = body.move === 'up' ? pick.rank - 1 : pick.rank + 1;
    const neighbor = await prisma.pick.findFirst({
      where: { userId, rank: neighborRank },
    });
    if (neighbor) {
      await prisma.$transaction([
        prisma.pick.update({ where: { id: neighbor.id }, data: { rank: pick.rank } }),
        prisma.pick.update({ where: { id: pick.id }, data: { rank: neighborRank } }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/picks?id=... — remove and close the rank gap. */
export async function DELETE(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') ?? '';
  const pick = await prisma.pick.findFirst({ where: { id, userId } });
  if (!pick) return NextResponse.json({ error: 'Pick not found.' }, { status: 404 });

  await prisma.$transaction([
    prisma.pick.delete({ where: { id: pick.id } }),
    prisma.pick.updateMany({
      where: { userId, rank: { gt: pick.rank } },
      data: { rank: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
