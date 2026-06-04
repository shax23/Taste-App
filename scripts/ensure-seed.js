/**
 * Seeds the database on first boot only (when there are no users yet).
 * Runs as part of the Railway start command, after `prisma migrate deploy`.
 */
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

prisma.user
  .count()
  .then((count) => {
    if (count === 0) {
      console.log('Empty database — running seed…');
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    } else {
      console.log(`Database already has ${count} users — skipping seed.`);
    }
  })
  .catch((e) => {
    console.error('ensure-seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
