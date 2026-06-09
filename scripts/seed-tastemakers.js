/**
 * Marks the curator accounts as tastemakers and gives each a published
 * 10-place Barcelona list. Idempotent: users who already have picks are
 * skipped, so it can run at every boot (called from ensure-seed.js).
 * Lists intentionally overlap so taste-match scores are meaningful on day one.
 */

const CITY = 'Barcelona';

// address keyword → neighborhood backfill for the curated pool
const NEIGHBORHOODS = {
  'Gràcia': 'Gràcia',
  'Raval': 'El Raval',
  'El Born': 'El Born',
  'Eixample': 'Eixample',
  'Poble-sec': 'Poble-sec',
  'Barceloneta': 'Barceloneta',
  'Poblenou': 'Poblenou',
  'Montjuïc': 'Montjuïc',
  'Gòtic': 'Barri Gòtic',
  'Sant Gervasi': 'Sant Gervasi',
  'El Carmel': 'El Carmel',
  'Port Vell': 'Port Vell',
  'Glòries': 'Glòries',
};

/** username → ten [placeName, note] entries, in rank order */
const LISTS = {
  mira: [
    ["Satan's Coffee Corner", 'The flat white that ruined all other flat whites for me.'],
    ['Nømad Coffee Lab', 'Ask for whatever is on the single-origin flight.'],
    ['Bar Brutal', 'Natural wine chaos in the best way. Trust the somm.'],
    ['Bar Cañete', 'Sit at the bar, order the gambas, thank me later.'],
    ['Hofmann Pastisseria', 'The mascarpone croissant is a religious experience.'],
    ['MACBA', 'I come for one room and stay all afternoon.'],
    ['Mercat de la Boqueria', 'Go at 8am, before the tour groups. Different planet.'],
    ['Llibreria Finestres', 'The art-book corner is dangerous for my wallet.'],
    ['Paradiso', 'Enter through the pastrami fridge. Stay for hours.'],
    ['Quimet & Quimet', 'Montaditos and vermut, standing room only, perfect.'],
  ],
  sofia: [
    ['Bar Brutal', 'The wine list reads like a manifesto.'],
    ['Paradiso', 'A pastrami shop hiding one of the best bars anywhere.'],
    ['Fundació Joan Miró', 'Miró plus the Montjuïc light. Unbeatable.'],
    ['Con Gracia', 'A tasting menu that still feels personal.'],
    ["Mimo's Born", 'Tiny, warm, exactly what Born should taste like.'],
    ['La Central del Raval', 'I go in for one book and leave with five.'],
    ['Bodega Biarritz 1881', 'Tiny, chaotic, the anchovies are non-negotiable.'],
    ['Mercat de Sant Antoni', 'Sunday mornings here are a whole personality.'],
    ['Dr. Stravinsky', 'Cocktails like little science experiments.'],
    ['Recinte Modernista de Sant Pau', 'More beautiful than the Sagrada Família, no queue.'],
  ],
  amelie: [
    ['Bar Brutal', 'Recovering Parisian approves of the chilled reds.'],
    ['MACBA', 'The collection rotations deserve more credit.'],
    ['CCCB', 'The exhibitions nobody talks about are the best ones.'],
    ['Syra Coffee Gràcia', 'Takeaway cortado, plaça bench, perfect morning.'],
    ['La Pubilla', 'The menú del migdia against which I judge all others.'],
    ['Hofmann Pastisseria', 'Croissants with a pastry-school pedigree.'],
    ['Els Encants Vells', 'Flea-market roulette. I always lose, happily.'],
    ['La Paloma', 'Old ballroom, young crowd. Go on a Thursday.'],
    ['Casa Usher', 'A bookshop that feels like a friend’s living room.'],
    ['Park Güell', 'Before 9am it belongs to runners and me.'],
  ],
  theo: [
    ['Three Marks Coffee', 'Espresso nerds without the attitude.'],
    ["Satan's Coffee Corner", 'No oat-milk apologies, just great coffee.'],
    ['Carretera de les Aigües', "The city's best walk, full stop."],
    ['Sala Apolo', 'Mondays. Nasty Mondays.'],
    ['Quimet & Quimet', 'Five square meters of genius.'],
    ['Can Lluís', '110 years of doing one thing properly.'],
    ['Bunkers del Carmel', 'Sunset with the whole city at your feet.'],
    ['La Central del Raval', 'The basement is where the good stuff hides.'],
    ['Cervecería Catalana', "Yes it's busy. It's busy because it's good."],
    ['Baluard Barceloneta', 'Bread worth crossing the city for.'],
  ],
  lucia: [
    ['Park Güell', 'Sunrise yoga spot before the gates even matter.'],
    ['Bunkers del Carmel', 'Bring vermut, watch the city change color.'],
    ['Mercat de Sant Antoni', 'Sunday book market, then vermut. The ritual.'],
    ['Quimet & Quimet', 'My sunset-vermut headquarters.'],
    ['La Pepita', 'The pepitas. All of them.'],
    ['Vai Moana', "A beach bar that doesn't feel like a tourist trap."],
    ['Piscines Bernat Picornell', 'Outdoor laps with Montjuïc views.'],
    ['Syra Coffee Gràcia', 'Coffee for the plaça, not the laptop.'],
    ['Bar Cañete', 'Where I take everyone who visits.'],
    ['Parc de la Ciutadella', 'Picnic HQ. Bring a frisbee.'],
  ],
};

async function seedTastemakers(prisma) {
  // neighborhood backfill on the curated pool (no-op when already set)
  const places = await prisma.place.findMany({
    where: { city: CITY, neighborhood: null },
    select: { id: true, address: true },
  });
  for (const place of places) {
    const hit = Object.entries(NEIGHBORHOODS).find(([kw]) => place.address.includes(kw));
    if (hit) {
      await prisma.place.update({
        where: { id: place.id },
        data: { neighborhood: hit[1] },
      });
    }
  }

  for (const [username, list] of Object.entries(LISTS)) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { _count: { select: { picks: true } } },
    });
    if (!user) {
      console.log(`tastemakers: no user "${username}" — skipped`);
      continue;
    }

    if (!user.isTastemaker || !user.publishedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isTastemaker: true, publishedAt: user.publishedAt ?? user.createdAt },
      });
    }

    if (user._count.picks > 0) continue; // already has a list — don't touch it

    let rank = 0;
    for (const [placeName, note] of list) {
      const place = await prisma.place.findFirst({
        where: { name: placeName, city: CITY },
      });
      if (!place) {
        console.log(`tastemakers: place "${placeName}" not found — skipped`);
        continue;
      }
      rank++;
      await prisma.pick.create({
        data: { userId: user.id, placeId: place.id, note, rank },
      });
    }
    console.log(`tastemakers: ${username} published ${rank} picks`);
  }
}

module.exports = { seedTastemakers };

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  seedTastemakers(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
