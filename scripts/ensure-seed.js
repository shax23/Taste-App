/**
 * Seeds the database on first boot only (when there are no users yet).
 * Runs as part of the Railway start command, after `prisma migrate deploy`.
 */
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const { upsertPlaces } = require('./upsert-places');

const prisma = new PrismaClient();

const BCN_HOODS = ['Barcelona','El Born','Gràcia','Poblenou','Eixample','Barceloneta','Sant Antoni','Sarrià','Gòtic','Raval','Carmel','Poble Sec'];

async function main() {
  const count = await prisma.user.count();
  const nonBcn = count > 0
    ? await prisma.user.count({ where: { city: { notIn: BCN_HOODS } } })
    : 0;

  if (count === 0 || nonBcn > 0) {
    console.log(count === 0 ? 'Empty database — running seed…' : `Found ${nonBcn} non-Barcelona users — re-seeding…`);
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  } else {
    console.log(`Database has ${count} Barcelona users — skipping seed.`);
  }
  // curated places top-up — idempotent, runs every boot
  await upsertPlaces(prisma);
}

main()
  .catch((e) => {
    console.error('ensure-seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
