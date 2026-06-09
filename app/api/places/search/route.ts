import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CITY, toPickCategory } from '@/lib/taste';

// Barcelona bounding box for the OSM lookup (lng/lat: left,top,right,bottom)
const BCN_VIEWBOX = '2.05,41.47,2.30,41.31';

/**
 * GET /api/places/search?q=paradiso
 * Places lookup for the list builder: curated local pool first,
 * then OpenStreetMap (Nominatim) scoped to Barcelona for everything else.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const local = await prisma.place.findMany({
    where: { city: CITY, name: { contains: q } },
    take: 6,
    orderBy: { name: 'asc' },
  });

  const results: any[] = local.map((p) => ({
    source: 'local',
    placeId: p.id,
    name: p.name,
    category: toPickCategory(p.category),
    address: p.address,
    neighborhood: p.neighborhood,
    lat: p.lat,
    lng: p.lng,
  }));

  // OSM fallback — real pins for anything not in the curated pool
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&bounded=1` +
      `&viewbox=${BCN_VIEWBOX}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'taste-app/1.0 (curated Barcelona lists)' },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const osm: any[] = await res.json();
      const localNames = new Set(results.map((r) => r.name.toLowerCase()));
      for (const hit of osm) {
        const name = (hit.namedetails?.name ?? hit.display_name?.split(',')[0] ?? '').trim();
        if (!name || localNames.has(name.toLowerCase())) continue;
        const a = hit.address ?? {};
        results.push({
          source: 'osm',
          externalId: `${hit.osm_type}/${hit.osm_id}`,
          name,
          category: null, // user assigns one of the six pick categories
          address: [a.road, a.house_number].filter(Boolean).join(' ') || hit.display_name?.split(',').slice(1, 3).join(',').trim() || '',
          neighborhood: a.suburb ?? a.quarter ?? a.neighbourhood ?? a.city_district ?? null,
          lat: parseFloat(hit.lat),
          lng: parseFloat(hit.lon),
        });
      }
    }
  } catch {
    // OSM down → local results only; the builder still works
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
