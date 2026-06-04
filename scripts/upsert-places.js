/**
 * Idempotently inserts curated places (skips any name+city that already exists).
 * Used by ensure-seed.js at boot; also runnable directly:
 *   DATABASE_URL="file:/abs/path/dev.db" node scripts/upsert-places.js
 */
const path = require('path');
const places = require(path.join(__dirname, '..', 'prisma', 'places-barcelona.js'));

async function upsertPlaces(prisma) {
  let created = 0;
  for (const place of places) {
    const existing = await prisma.place.findFirst({
      where: { name: place.name, city: place.city },
      select: { id: true },
    });
    if (existing) continue;
    const slug = place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.place.create({
      data: { ...place, coverImage: `https://picsum.photos/seed/${slug}/800/600` },
    });
    created++;
  }
  console.log(`places: ${created} added, ${places.length - created} already present`);
}

module.exports = { upsertPlaces };

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  upsertPlaces(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
