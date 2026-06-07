/**
 * Seed script — Barcelona-only. 12 users, 20 places, posts and
 * cross-validations rich enough that credibility tiers are meaningfully varied.
 *
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { INTEREST_TAXONOMY } from '../lib/interests';
import { recalculateAndStore } from '../lib/credibility';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

const PASSWORD = 'taste123';

// ---------------------------------------------------------------- places
type PlaceDef = {
  key: string;
  name: string;
  category: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

const PLACES: PlaceDef[] = [
  // Coffee
  { key: 'nomad', name: 'Nømad Coffee Lab', category: 'cafe', address: 'Passatge Sert 12, El Born', city: 'Barcelona', lat: 41.3900, lng: 2.1760 },
  { key: 'federal', name: 'Federal Café', category: 'cafe', address: 'Carrer del Parlament 39, Sant Antoni', city: 'Barcelona', lat: 41.3787, lng: 2.1648 },
  { key: 'satan', name: "Satan's Coffee Corner", category: 'cafe', address: 'Carrer de l\'Arc de Sant Ramon del Call 11, Gòtic', city: 'Barcelona', lat: 41.3835, lng: 2.1751 },
  { key: 'naif', name: 'Naïf', category: 'cafe', address: 'Carrer de Santa Creu 9, Sant Antoni', city: 'Barcelona', lat: 41.3790, lng: 2.1630 },
  // Bars & wine
  { key: 'brutal', name: 'Bar Brutal', category: 'bar', address: 'Carrer de la Princesa 14, El Born', city: 'Barcelona', lat: 41.3851, lng: 2.1818 },
  { key: 'calders', name: 'Bar Calders', category: 'bar', address: 'Carrer del Parlament 25, Sant Antoni', city: 'Barcelona', lat: 41.3788, lng: 2.1635 },
  { key: 'morro', name: 'Morro Fi', category: 'bar', address: 'Carrer del Consell de Cent 171, Eixample', city: 'Barcelona', lat: 41.3835, lng: 2.1590 },
  { key: 'schmucks', name: 'Two Schmucks', category: 'bar', address: 'Carrer del Rosselló 15, Eixample', city: 'Barcelona', lat: 41.3962, lng: 2.1618 },
  // Nightlife
  { key: 'apolo', name: 'Sala Apolo', category: 'club', address: 'Carrer Nou de la Rambla 113, Paral·lel', city: 'Barcelona', lat: 41.3756, lng: 2.1665 },
  { key: 'razz', name: 'Razzmatazz', category: 'club', address: 'Carrer dels Almogàvers 122, Poblenou', city: 'Barcelona', lat: 41.3990, lng: 2.1962 },
  // Culture & art
  { key: 'macba', name: 'MACBA', category: 'gallery', address: 'Plaça dels Àngels 1, Raval', city: 'Barcelona', lat: 41.3833, lng: 2.1667 },
  { key: 'arts', name: 'Fundació Antoni Tàpies', category: 'gallery', address: 'Carrer d\'Aragó 255, Eixample', city: 'Barcelona', lat: 41.3913, lng: 2.1655 },
  // Markets
  { key: 'santantoni', name: 'Mercat de Sant Antoni', category: 'market', address: 'Carrer del Comte d\'Urgell 1, Sant Antoni', city: 'Barcelona', lat: 41.3792, lng: 2.1615 },
  { key: 'boqueria', name: 'Mercat de la Boqueria', category: 'market', address: 'La Rambla 91, Raval', city: 'Barcelona', lat: 41.3815, lng: 2.1718 },
  // Movement
  { key: 'sharma', name: 'Sharma Climbing BCN', category: 'studio', address: 'Carrer de Luther King 9, Zona Franca', city: 'Barcelona', lat: 41.4225, lng: 2.1622 },
  { key: 'espai', name: 'Espai Joliu', category: 'studio', address: 'Carrer de Badajoz 95, Poblenou', city: 'Barcelona', lat: 41.4007, lng: 2.1993 },
  // Parks & outdoor
  { key: 'ciutadella', name: 'Parc de la Ciutadella', category: 'park', address: 'Passeig de Picasso, El Born', city: 'Barcelona', lat: 41.3864, lng: 2.1869 },
  { key: 'bunkers', name: 'Turó de la Rovira', category: 'park', address: 'Carrer de Marià Labèrnia, Carmel', city: 'Barcelona', lat: 41.4163, lng: 2.1551 },
  // Restaurants
  { key: 'parking', name: 'Parking Pizza', category: 'restaurant', address: 'Carrer de Londres 98, Eixample', city: 'Barcelona', lat: 41.3925, lng: 2.1548 },
  // Bookshop
  { key: 'laie', name: 'Laie Llibreria Cafè', category: 'bookshop', address: 'Carrer de Pau Claris 85, Eixample', city: 'Barcelona', lat: 41.3921, lng: 2.1680 },
];

// ---------------------------------------------------------------- users
type PostDef = {
  daysAgo: number;
  content: string;
  placeKey?: string;
  interests: string[];
  postType?: 'checkin' | 'list' | 'moment';
};

type UserDef = {
  username: string;
  displayName: string;
  city: string; // neighbourhood / barrio
  bio: string;
  interests: string[];
  importedFollowers: number;
  createdDaysAgo: number;
  posts: PostDef[];
  validationPlan: [string, number, number][];
};

const USERS: UserDef[] = [
  // ───────────── AUTHORITY tier (85+) ─────────────
  {
    username: 'mira',
    displayName: 'Mira Soler',
    city: 'El Born',
    bio: 'Third-wave coffee and third-sector wine. I map Barcelona one counter at a time.',
    interests: ['specialty-coffee', 'natural-wine', 'bakeries', 'contemporary-art', 'slow-living'],
    importedFollowers: 4200,
    createdDaysAgo: 25,
    posts: [
      { daysAgo: 2, content: 'The single-origin espresso flight at Nømad right now is the best it has been all year. Ask for the Colombia La Cristalina.', placeKey: 'nomad', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 4, content: 'Bar Brutal on a Tuesday night: zero wait, full attention from the somm, and a chilled Trepat you will think about for days.', placeKey: 'brutal', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 7, content: 'MACBA for the Miró drawings show, then a cortado standing at the bar. Slow mornings are a discipline.', placeKey: 'macba', interests: ['contemporary-art', 'slow-living'], postType: 'moment' },
      { daysAgo: 10, content: 'Five bakeries in El Born ranked by croissant lamination. Yes, I took calipers.', interests: ['bakeries'], postType: 'list' },
      { daysAgo: 14, content: 'A natural wine primer for people who think they hate natural wine: start with whites from Penedès, not the funky reds.', interests: ['natural-wine'], postType: 'list' },
      { daysAgo: 18, content: "Filter coffee tasting notes are 50% suggestion, 100% fun. Fight me over a V60 at Satan's.", placeKey: 'satan', interests: ['specialty-coffee'], postType: 'moment' },
      { daysAgo: 22, content: 'Gallery-hopping route for Saturday: MACBA to Tàpies, two espressos, one vermut. The order matters.', interests: ['contemporary-art', 'specialty-coffee'], postType: 'list' },
      { daysAgo: 26, content: 'The best pa amb tomàquet in the city is at a bakery with no name on the door in Gràcia. DM for coordinates.', interests: ['bakeries', 'slow-living'], postType: 'moment' },
    ],
    validationPlan: [
      ['tom', 4, 3], ['jules', 4, 3], ['liam', 3, 2], ['sara', 3, 2],
      ['lucia', 3, 2], ['claudia', 3, 1], ['anya', 2, 1], ['raj', 2, 1],
    ],
  },
  {
    username: 'tom',
    displayName: 'Tom Archer',
    city: 'Poblenou',
    bio: 'Came for a month, stayed for the light. Architecture, records, and slow mornings in a city that earns them.',
    interests: ['architecture', 'vinyl-records', 'specialty-coffee', 'contemporary-art', 'slow-living'],
    importedFollowers: 3800,
    createdDaysAgo: 30,
    posts: [
      { daysAgo: 1, content: "Federal before a long walk. The flat white here is the most consistent cup in Sant Antoni, and that's saying something.", placeKey: 'federal', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 3, content: 'The Tàpies foundation rehang is worth going back for. The Informalism room finally breathes the way it should.', placeKey: 'arts', interests: ['contemporary-art', 'architecture'], postType: 'checkin' },
      { daysAgo: 6, content: 'Poblenou at 7am: just you, the seagulls, and a city reclaiming its industrial bones. Bring a camera.', interests: ['architecture', 'slow-living'], postType: 'moment' },
      { daysAgo: 9, content: 'Crate-digging in El Raval. Found a first press of a Canet Valls set I thought I would never see in the wild.', interests: ['vinyl-records'], postType: 'moment' },
      { daysAgo: 13, content: 'Five modernista details you are walking past every day without seeing them. A thread.', interests: ['architecture'], postType: 'list' },
      { daysAgo: 17, content: "Razzmatazz on a Friday isn't a club night, it's urban anthropology.", placeKey: 'razz', interests: ['vinyl-records'], postType: 'moment' },
      { daysAgo: 21, content: 'MACBA on a quiet Tuesday: the gift of living in the same city as this building.', placeKey: 'macba', interests: ['contemporary-art'], postType: 'checkin' },
      { daysAgo: 27, content: 'Morning coffee ritual: Satan\'s for the first one, Federal for a second when I need the terrace.', interests: ['specialty-coffee', 'slow-living'], postType: 'list' },
    ],
    validationPlan: [
      ['mira', 4, 3], ['sara', 4, 3], ['liam', 3, 2], ['jules', 3, 2],
      ['claudia', 3, 2], ['raj', 3, 1], ['diego', 2, 1], ['mira', 2, 1],
    ],
  },

  // ───────────── TRUSTED tier (61–85) ─────────────
  {
    username: 'sara',
    displayName: 'Sara Vidal',
    city: 'Gràcia',
    bio: 'Gràcia born, El Born curious. Natural wine, yoga at dawn, and the best terrace in the neighbourhood.',
    interests: ['natural-wine', 'yoga', 'contemporary-art', 'farmers-market', 'slow-living'],
    importedFollowers: 1800,
    createdDaysAgo: 55,
    posts: [
      { daysAgo: 2, content: 'Bar Brutal just listed a Monastery Wines Vermell that drinks like velvet and costs nothing. Order it before anyone notices.', placeKey: 'brutal', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 7, content: 'Sant Antoni market Sunday morning — the mushroom stall near the back will change your risotto forever.', placeKey: 'santantoni', interests: ['farmers-market'], postType: 'checkin' },
      { daysAgo: 12, content: 'Rooftop yoga in Gràcia, six people, one judgmental pigeon. Peak Barcelona morning.', interests: ['yoga', 'slow-living'], postType: 'moment' },
      { daysAgo: 18, content: 'Tàpies retrospective: seeing his work in the city that made him lands differently.', placeKey: 'arts', interests: ['contemporary-art'], postType: 'checkin' },
      { daysAgo: 25, content: 'A vermut at Morro Fi before the Gràcia festival crowds arrive is a form of self-care.', placeKey: 'morro', interests: ['natural-wine', 'slow-living'], postType: 'moment' },
      { daysAgo: 40, content: 'Three yoga studios in Gràcia ranked by who lets you stay for a coffee after class.', interests: ['yoga'], postType: 'list' },
    ],
    validationPlan: [
      ['mira', 3, 2], ['tom', 3, 2], ['jules', 2, 1], ['lucia', 2, 1], ['anya', 1, 1],
    ],
  },
  {
    username: 'jules',
    displayName: 'Jules Moreau',
    city: 'Gràcia',
    bio: 'Recovering Parisian. Came for the light, stayed for the vermut. Bakeries and slow Sundays.',
    interests: ['bakeries', 'slow-living', 'natural-wine', 'vintage-fashion', 'plant-based'],
    importedFollowers: 1400,
    createdDaysAgo: 70,
    posts: [
      { daysAgo: 2, content: 'Naïf for weekend brunch: the eggs are the excuse, the coffee is the reason, the terrace is the reward.', placeKey: 'naif', interests: ['bakeries', 'slow-living'], postType: 'checkin' },
      { daysAgo: 8, content: 'Six months in and I still cannot choose between Morro Fi and Calders for a Thursday evening. Both. Always both.', placeKey: 'calders', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 14, content: 'Vintage hunting in El Raval: patience required, treasures guaranteed. Wore the 80s linen blazer out of the stall.', interests: ['vintage-fashion'], postType: 'moment' },
      { daysAgo: 20, content: 'Plant-based eating in Barcelona is underrated — if you know where to look. A list for those who do not.', interests: ['plant-based'], postType: 'list' },
      { daysAgo: 30, content: 'Croissant rankings by neighbourhood: Born wins on lamination, Gràcia wins on charm, Sant Antoni wins on volume.', interests: ['bakeries'], postType: 'list' },
      { daysAgo: 45, content: 'The Sant Antoni market book section on Sunday. Every paperback a story, every cover a mood.', placeKey: 'santantoni', interests: ['slow-living'], postType: 'moment' },
    ],
    validationPlan: [
      ['mira', 3, 2], ['sara', 3, 2], ['lucia', 2, 1], ['raj', 2, 1], ['anya', 1, 1],
    ],
  },
  {
    username: 'liam',
    displayName: 'Liam O\'Brien',
    city: 'El Born',
    bio: 'Dublin to Barcelona. Running the seafront, reading in the Born, drinking well everywhere in between.',
    interests: ['specialty-coffee', 'running', 'bookshops', 'natural-wine', 'jazz-bars'],
    importedFollowers: 600,
    createdDaysAgo: 80,
    posts: [
      { daysAgo: 4, content: "Satan's before an early run. One shot standing at the bar, no sitting, no overthinking.", placeKey: 'satan', interests: ['specialty-coffee', 'running'], postType: 'checkin' },
      { daysAgo: 9, content: 'Barceloneta to Bogatell and back: 14k with the Mediterranean on your left. Beats any treadmill in any city.', interests: ['running'], postType: 'moment' },
      { daysAgo: 15, content: 'Laie has the best architecture section in the city and a coffee counter to prove it.', placeKey: 'laie', interests: ['bookshops', 'specialty-coffee'], postType: 'checkin' },
      { daysAgo: 23, content: 'Jazz at a basement bar off Passeig de Gràcia — quartet, no mics, room held its breath. Barcelona at its best.', interests: ['jazz-bars'], postType: 'moment' },
      { daysAgo: 33, content: 'Five things I did not expect to love about running in Barcelona: the light at 7am, the Montjuïc stairs, the coffee at the end.', interests: ['running', 'specialty-coffee'], postType: 'list' },
    ],
    validationPlan: [
      ['tom', 3, 2], ['mira', 2, 1], ['raj', 2, 1], ['diego', 2, 1], ['claudia', 1, 1],
    ],
  },

  // ───────────── ESTABLISHED tier (31–60) ─────────────
  {
    username: 'claudia',
    displayName: 'Claudia Frei',
    city: 'Eixample',
    bio: 'Left Berlin, brought the habits. Bouldering, techno, and early mornings in a city that never really sleeps.',
    interests: ['bouldering', 'techno', 'vinyl-records', 'specialty-coffee', 'plant-based'],
    importedFollowers: 850,
    createdDaysAgo: 95,
    posts: [
      { daysAgo: 5, content: 'Sharma reset the orange circuit. The slab section is humbling. Go before 17:00 or you are queuing.', placeKey: 'sharma', interests: ['bouldering'], postType: 'checkin' },
      { daysAgo: 13, content: 'Apolo on a weeknight — Nitsa club downstairs, no tourists, just the city dancing with itself.', placeKey: 'apolo', interests: ['techno'], postType: 'checkin' },
      { daysAgo: 22, content: 'Finger strength is a lifestyle, not a hobby. Hangboard on the terrace at dawn, Federal after.', placeKey: 'federal', interests: ['bouldering', 'specialty-coffee'], postType: 'moment' },
      { daysAgo: 40, content: 'Record hunting in Barcelona tip: the weekend stalls near El Raval beat the shops for price, not selection. Go early.', interests: ['vinyl-records'], postType: 'list' },
    ],
    validationPlan: [
      ['tom', 2, 1], ['liam', 2, 1], ['sara', 1, 0], ['raj', 1, 1],
    ],
  },
  {
    username: 'lucia',
    displayName: 'Lucía Ferrer',
    city: 'Gràcia',
    bio: 'Yoga at sunrise, vermut at sunset. Born and raised in Gràcia, still discovering it.',
    interests: ['yoga', 'wellness', 'natural-wine', 'farmers-market', 'slow-living'],
    importedFollowers: 300,
    createdDaysAgo: 100,
    posts: [
      { daysAgo: 5, content: 'Rooftop yoga at sunrise, then a cortado at Federal. The sequence is sacred.', placeKey: 'federal', interests: ['yoga', 'slow-living'], postType: 'moment' },
      { daysAgo: 18, content: 'Sant Antoni Sunday: mushroom stall, flower stall, bread stall. In that order, always.', placeKey: 'santantoni', interests: ['farmers-market'], postType: 'checkin' },
      { daysAgo: 32, content: 'Breathwork before espresso. The order matters more than you think.', interests: ['wellness'], postType: 'moment' },
      { daysAgo: 50, content: 'A vermut and olives at Morro Fi after a long practice is also wellness. I do not make the rules.', placeKey: 'morro', interests: ['natural-wine', 'wellness'], postType: 'moment' },
    ],
    validationPlan: [
      ['mira', 2, 1], ['sara', 2, 1], ['jules', 1, 0],
    ],
  },
  {
    username: 'raj',
    displayName: 'Raj Menon',
    city: 'Sant Antoni',
    bio: 'Mumbai via London, now planted in Sant Antoni. Coffee in the morning, cocktails at midnight.',
    interests: ['specialty-coffee', 'cocktail-bars', 'architecture', 'natural-wine', 'slow-living'],
    importedFollowers: 920,
    createdDaysAgo: 110,
    posts: [
      { daysAgo: 5, content: "Two Schmucks is doing a hibiscus mezcal sour that shouldn't work and absolutely does.", placeKey: 'schmucks', interests: ['cocktail-bars'], postType: 'checkin' },
      { daysAgo: 12, content: 'Naïf on a slow morning — the kind of café that makes you grateful you moved here.', placeKey: 'naif', interests: ['specialty-coffee', 'slow-living'], postType: 'checkin' },
      { daysAgo: 20, content: 'Three months in Sant Antoni and I still get lost in the Eixample grid on purpose. The courtyards are the reward.', interests: ['architecture', 'slow-living'], postType: 'moment' },
      { daysAgo: 55, content: 'Cocktail bars in Barcelona ranked by the bartender actually wanting to talk to you.', interests: ['cocktail-bars'], postType: 'list' },
    ],
    validationPlan: [
      ['liam', 2, 1], ['claudia', 1, 0], ['tom', 1, 1],
    ],
  },
  {
    username: 'anya',
    displayName: 'Anya Petrov',
    city: 'Barceloneta',
    bio: 'Swims before the city wakes up. Farmers markets, wellness, and the kind of slow that takes effort.',
    interests: ['swimming', 'wellness', 'farmers-market', 'slow-living', 'plant-based'],
    importedFollowers: 420,
    createdDaysAgo: 120,
    posts: [
      { daysAgo: 6, content: 'Barceloneta at 7am: cold water, empty beach, the whole Mediterranean to yourself. Worth the alarm.', interests: ['swimming', 'slow-living'], postType: 'moment' },
      { daysAgo: 13, content: 'La Boqueria before 9am belongs to the locals. After that, you are in the way.', placeKey: 'boqueria', interests: ['farmers-market'], postType: 'checkin' },
      { daysAgo: 24, content: 'Open-water swimming off the breakwater — you forget the city is right there until you turn around.', interests: ['swimming', 'wellness'], postType: 'moment' },
    ],
    validationPlan: [
      ['sara', 1, 0], ['jules', 1, 0], ['lucia', 1, 1],
    ],
  },

  // ───────────── EMERGING tier ─────────────
  {
    username: 'diego',
    displayName: 'Diego Santos',
    city: 'Poblenou',
    bio: 'Bogotá → Barcelona. Cycling the city until it makes sense.',
    interests: ['cycling', 'specialty-coffee', 'cocktail-bars', 'slow-living'],
    importedFollowers: 180,
    createdDaysAgo: 45,
    posts: [
      { daysAgo: 7, content: 'Sunrise ride from Poblenou to Montjuïc and back. 40k before the city wakes up. Coffee at Federal after.', placeKey: 'federal', interests: ['cycling', 'specialty-coffee'], postType: 'moment' },
      { daysAgo: 20, content: 'Two Schmucks at midnight: three strangers became a table, two cocktails became four. Classic.', placeKey: 'schmucks', interests: ['cocktail-bars'], postType: 'checkin' },
    ],
    validationPlan: [
      ['liam', 1, 1], ['raj', 1, 0],
    ],
  },
  {
    username: 'noa',
    displayName: 'Noa Klein',
    city: 'Gràcia',
    bio: 'Tel Aviv → Berlin → Barcelona. Still adjusting to the late dinner times.',
    interests: ['yoga', 'wellness', 'farmers-market', 'contemporary-art', 'slow-living'],
    importedFollowers: 220,
    createdDaysAgo: 60,
    posts: [
      { daysAgo: 8, content: 'Parc de la Ciutadella on a weekday morning: a secret the city has not yet ruined.', placeKey: 'ciutadella', interests: ['wellness', 'slow-living'], postType: 'moment' },
      { daysAgo: 22, content: 'Sant Antoni market on Sunday is when Barcelona feels like the city it is trying to be.', placeKey: 'santantoni', interests: ['farmers-market'], postType: 'checkin' },
    ],
    validationPlan: [
      ['sara', 1, 0], ['lucia', 1, 0],
    ],
  },
  {
    username: 'hugo',
    displayName: 'Hugo Björn',
    city: 'Sarrià',
    bio: 'Malmö to Sarrià. Running, reading, and figuring out how to live at this latitude.',
    interests: ['running', 'bookshops', 'architecture', 'specialty-coffee'],
    importedFollowers: 150,
    createdDaysAgo: 35,
    posts: [
      { daysAgo: 9, content: 'Bunkers del Carmel at dusk: the whole city laid out below you, and it still does not look real.', placeKey: 'bunkers', interests: ['running', 'architecture'], postType: 'moment' },
      { daysAgo: 21, content: 'Laie on a rainy Tuesday. Good bookshops and bad weather are the same gift.', placeKey: 'laie', interests: ['bookshops'], postType: 'checkin' },
    ],
    validationPlan: [
      ['liam', 1, 0], ['tom', 1, 0],
    ],
  },
];

// ---------------------------------------------------------------- main
async function main() {
  console.log('Seeding…');
  await prisma.$executeRawUnsafe('DELETE FROM Validation');
  await prisma.$executeRawUnsafe('DELETE FROM PostInterest');
  await prisma.$executeRawUnsafe('DELETE FROM Post');
  await prisma.$executeRawUnsafe('DELETE FROM CredibilityScore');
  await prisma.$executeRawUnsafe('DELETE FROM UserInterest');
  await prisma.$executeRawUnsafe('DELETE FROM User');
  await prisma.$executeRawUnsafe('DELETE FROM Place');
  await prisma.$executeRawUnsafe('DELETE FROM Interest');

  // interests
  const interests: Record<string, string> = {};
  for (const def of INTEREST_TAXONOMY) {
    const i = await prisma.interest.create({ data: def });
    interests[def.slug] = i.id;
  }

  // places
  const places: Record<string, string> = {};
  for (const { key, ...placeData } of PLACES) {
    const p = await prisma.place.create({ data: placeData });
    places[key] = p.id;
  }

  // users
  const userIds: Record<string, string> = {};
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const def of USERS) {
    const user = await prisma.user.create({
      data: {
        username: def.username,
        displayName: def.displayName,
        city: def.city,
        bio: def.bio,
        passwordHash: hash,
        importedFollowers: def.importedFollowers,
        createdAt: daysAgo(def.createdDaysAgo),
        avatarUrl: `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${def.username}&backgroundColor=f2e4d8`,
        credibilityScore: { create: {} },
        interests: {
          create: def.interests.map((slug) => ({
            interestId: interests[slug],
            strength: 1.0,
          })),
        },
      },
    });
    userIds[def.username] = user.id;

    // posts
    for (const post of def.posts) {
      const created = await prisma.post.create({
        data: {
          userId: user.id,
          placeId: post.placeKey ? places[post.placeKey] : null,
          content: post.content,
          postType: post.postType ?? 'checkin',
          createdAt: daysAgo(post.daysAgo),
          interests: {
            create: post.interests.map((slug) => ({ interestId: interests[slug] })),
          },
        },
      });
      // strengthen user interest
      for (const slug of post.interests) {
        await prisma.userInterest.updateMany({
          where: { userId: user.id, interestId: interests[slug] },
          data: { strength: { increment: 0.2 } },
        });
      }
      void created;
    }
  }

  // validations
  for (const def of USERS) {
    const validatedUserId = userIds[def.username];
    for (const [validatorUsername, total, recent] of def.validationPlan) {
      const validatorId = userIds[validatorUsername];
      if (!validatorId) continue;

      const posts = await prisma.post.findMany({
        where: { userId: validatedUserId },
        orderBy: { createdAt: 'desc' },
      });
      if (posts.length === 0) continue;

      for (let i = 0; i < total; i++) {
        const post = posts[i % posts.length];
        const isRecent = i < recent;
        await prisma.validation.create({
          data: {
            validatorId,
            validatedUserId,
            postId: post.id,
            createdAt: daysAgo(isRecent ? Math.floor(Math.random() * 25) : Math.floor(Math.random() * 90) + 30),
          },
        });
      }
    }
  }

  // credibility
  for (const username of Object.keys(userIds)) {
    await recalculateAndStore(userIds[username]);
  }

  console.log(`Done — ${USERS.length} users, ${PLACES.length} places.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
