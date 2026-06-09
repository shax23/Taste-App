// One-off: swap seeded dicebear avatars for realistic photo portraits.
// Safe to re-run; only touches the known seed usernames.
const { PrismaClient } = require('@prisma/client');

const PORTRAITS = {
  mira: 'https://randomuser.me/api/portraits/women/65.jpg',
  kenji: 'https://randomuser.me/api/portraits/men/32.jpg',
  jonas: 'https://randomuser.me/api/portraits/men/22.jpg',
  amelie: 'https://randomuser.me/api/portraits/women/44.jpg',
  theo: 'https://randomuser.me/api/portraits/men/75.jpg',
  sofia: 'https://randomuser.me/api/portraits/women/68.jpg',
  yuna: 'https://randomuser.me/api/portraits/women/79.jpg',
  lucia: 'https://randomuser.me/api/portraits/women/26.jpg',
  marcus: 'https://randomuser.me/api/portraits/men/45.jpg',
  nina: 'https://randomuser.me/api/portraits/women/12.jpg',
  oliver: 'https://randomuser.me/api/portraits/men/86.jpg',
  priya: 'https://randomuser.me/api/portraits/women/24.jpg',
  daniel: 'https://randomuser.me/api/portraits/men/51.jpg',
  emma: 'https://randomuser.me/api/portraits/women/90.jpg',
  leo: 'https://randomuser.me/api/portraits/men/14.jpg',
  hana: 'https://randomuser.me/api/portraits/women/35.jpg',
};

async function main() {
  const prisma = new PrismaClient();
  let updated = 0;
  for (const [username, avatarUrl] of Object.entries(PORTRAITS)) {
    const res = await prisma.user.updateMany({ where: { username }, data: { avatarUrl } });
    updated += res.count;
  }
  console.log(`Updated ${updated} avatars.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
