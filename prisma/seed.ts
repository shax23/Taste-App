/**
 * Seed script — populates Taste with 15 users, 20 places, posts and
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

const PASSWORD = 'taste123'; // every seed user shares this dev password

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
  // Barcelona
  { key: 'nomad', name: 'Nømad Coffee Lab', category: 'cafe', address: 'Passatge Sert 12', city: 'Barcelona', lat: 41.39, lng: 2.176 },
  { key: 'brutal', name: 'Bar Brutal', category: 'bar', address: 'Carrer de la Princesa 14', city: 'Barcelona', lat: 41.3851, lng: 2.1818 },
  { key: 'sharma', name: 'Sharma Climbing BCN', category: 'studio', address: 'Carrer de Luther King 9', city: 'Barcelona', lat: 41.4225, lng: 2.1622 },
  { key: 'macba', name: 'MACBA', category: 'gallery', address: 'Plaça dels Àngels 1', city: 'Barcelona', lat: 41.3833, lng: 2.1667 },
  // Berlin
  { key: 'bonanza', name: 'Bonanza Coffee Roasters', category: 'cafe', address: 'Adalbertstraße 70', city: 'Berlin', lat: 52.5009, lng: 13.4194 },
  { key: 'wildthings', name: 'Wild Things Wine Bar', category: 'bar', address: 'Weserstraße 172', city: 'Berlin', lat: 52.4885, lng: 13.4313 },
  { key: 'boulderklub', name: 'Boulderklub Kreuzberg', category: 'studio', address: 'Ohlauer Straße 38', city: 'Berlin', lat: 52.4937, lng: 13.4252 },
  { key: 'markthalle', name: 'Markthalle Neun', category: 'market', address: 'Eisenbahnstraße 42', city: 'Berlin', lat: 52.5022, lng: 13.4313 },
  // Tokyo
  { key: 'onibus', name: 'Onibus Coffee Nakameguro', category: 'cafe', address: '2-14-1 Kamimeguro', city: 'Tokyo', lat: 35.6447, lng: 139.6986 },
  { key: 'afuri', name: 'AFURI Ramen Ebisu', category: 'restaurant', address: '1-1-7 Ebisu', city: 'Tokyo', lat: 35.6479, lng: 139.7106 },
  { key: 'tsutaya', name: 'Daikanyama T-Site', category: 'bookshop', address: '17-5 Sarugakucho', city: 'Tokyo', lat: 35.6491, lng: 139.6993 },
  { key: 'yoyogi', name: 'Yoyogi Park', category: 'park', address: '2-1 Yoyogikamizonocho', city: 'Tokyo', lat: 35.6712, lng: 139.6949 },
  // Seoul
  { key: 'anthracite', name: 'Anthracite Coffee Hannam', category: 'cafe', address: '240 Itaewon-ro', city: 'Seoul', lat: 37.5346, lng: 127.0026 },
  { key: 'gwangjang', name: 'Gwangjang Market', category: 'market', address: '88 Changgyeonggung-ro', city: 'Seoul', lat: 37.5701, lng: 126.9996 },
  { key: 'vurt', name: 'vurt.', category: 'club', address: 'Worldcup buk-ro 12', city: 'Seoul', lat: 37.5563, lng: 126.9105 },
  // New York
  { key: 'sey', name: 'Sey Coffee', category: 'cafe', address: '18 Grattan St, Brooklyn', city: 'New York', lat: 40.7057, lng: -73.9335 },
  { key: 'fourhorsemen', name: 'The Four Horsemen', category: 'bar', address: '295 Grand St, Brooklyn', city: 'New York', lat: 40.7128, lng: -73.9573 },
  { key: 'moma-ps1', name: 'MoMA PS1', category: 'gallery', address: '22-25 Jackson Ave, Queens', city: 'New York', lat: 40.7456, lng: -73.9472 },
  // London
  { key: 'prufrock', name: 'Prufrock Coffee', category: 'cafe', address: '23-25 Leather Ln', city: 'London', lat: 51.5204, lng: -0.1091 },
  { key: 'phonox', name: 'Phonox', category: 'club', address: '418 Brixton Rd', city: 'London', lat: 51.4655, lng: -0.1146 },
];

// ---------------------------------------------------------------- users
type PostDef = {
  daysAgo: number;
  content: string;
  placeKey?: string;
  interests: string[]; // slugs
  postType?: 'checkin' | 'list' | 'moment';
};

type UserDef = {
  username: string;
  displayName: string;
  city: string;
  bio: string;
  interests: string[];
  importedFollowers: number;
  createdDaysAgo: number;
  posts: PostDef[];
  /** [validator username, total validations, recent (<30d) count] */
  validationPlan: [string, number, number][];
};

/** Realistic photo portraits (randomuser.me) keyed by username. */
export const PORTRAITS: Record<string, string> = {
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

const USERS: UserDef[] = [
  // ───────────── AUTHORITY tier (85+) ─────────────
  {
    username: 'mira',
    displayName: 'Mira Soler',
    city: 'Barcelona',
    bio: 'Third-wave coffee and third-sector wine. I map Barcelona one counter at a time.',
    interests: ['specialty-coffee', 'natural-wine', 'bakeries', 'contemporary-art', 'slow-living'],
    importedFollowers: 4200,
    createdDaysAgo: 25,
    posts: [
      { daysAgo: 2, content: 'The single-origin espresso flight at Nømad right now is the best it has been all year. Ask for the Colombia La Cristalina.', placeKey: 'nomad', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 4, content: 'Bar Brutal on a Tuesday night: zero wait, full attention from the somm, and a chilled Trepat you will think about for days.', placeKey: 'brutal', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 7, content: 'My weekend loop: MACBA for the Miró drawings show, then a cortado standing at the bar. Slow mornings are a discipline.', placeKey: 'macba', interests: ['contemporary-art', 'slow-living'], postType: 'moment' },
      { daysAgo: 10, content: 'Five bakeries in El Born ranked by croissant lamination. Yes, I took calipers. No, I am not sorry.', interests: ['bakeries'], postType: 'list' },
      { daysAgo: 14, content: 'A natural wine primer for people who think they hate natural wine: start with whites from Penedès, not the funky reds.', interests: ['natural-wine'], postType: 'list' },
      { daysAgo: 18, content: 'Filter coffee tasting notes are 50% suggestion, 100% fun. Fight me over a V60.', placeKey: 'nomad', interests: ['specialty-coffee'], postType: 'moment' },
      { daysAgo: 22, content: 'Gallery-hopping route for Saturday: three spaces, two espressos, one vermut. The order matters.', interests: ['contemporary-art', 'specialty-coffee'], postType: 'list' },
      { daysAgo: 26, content: 'The best pa amb tomàquet in the city is at a bakery with no name on the door. DM for coordinates.', interests: ['bakeries', 'slow-living'], postType: 'moment' },
    ],
    validationPlan: [
      ['jonas', 4, 3], ['amelie', 4, 3], ['theo', 3, 2], ['sofia', 3, 2],
      ['lucia', 3, 2], ['marcus', 3, 1], ['nina', 2, 1], ['oliver', 2, 1],
    ],
  },
  {
    username: 'kenji',
    displayName: 'Kenji Watanabe',
    city: 'Tokyo',
    bio: 'Ramen taxonomist. Coffee pilgrim. I believe a city reveals itself through its counters.',
    interests: ['ramen', 'specialty-coffee', 'bookshops', 'architecture', 'jazz-bars'],
    importedFollowers: 5000,
    createdDaysAgo: 30,
    posts: [
      { daysAgo: 1, content: 'AFURI yuzu shio at 11:40, before the queue forms. The broth is lighter than you expect and better than you hope.', placeKey: 'afuri', interests: ['ramen'], postType: 'checkin' },
      { daysAgo: 3, content: 'Onibus Nakameguro under the train tracks. Single origin Ethiopia, train rumble overhead, perfect ten minutes.', placeKey: 'onibus', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 6, content: 'Daikanyama T-Site at opening hour is the quietest place in Tokyo. Architecture section, second floor, window seat.', placeKey: 'tsutaya', interests: ['bookshops', 'architecture'], postType: 'checkin' },
      { daysAgo: 9, content: 'A jazz kissa crawl through Shibuya: three rooms, three eras of records, zero conversation. Heaven.', interests: ['jazz-bars'], postType: 'list' },
      { daysAgo: 13, content: 'Tsukemen vs ramen is not a debate, it is a mood diagnosis. Today: tsukemen weather.', interests: ['ramen'], postType: 'moment' },
      { daysAgo: 17, content: 'The brutalist stairwell near Yoyogi entrance nobody photographs. Concrete ages better than glass.', placeKey: 'yoyogi', interests: ['architecture'], postType: 'moment' },
      { daysAgo: 21, content: 'Eight ramen shops that justify a layover in Tokyo, ranked by broth conviction.', interests: ['ramen'], postType: 'list' },
      { daysAgo: 27, content: 'Morning pages at a kissaten, afternoon pages at a bookshop. The city is a reading room if you let it be.', interests: ['bookshops', 'specialty-coffee'], postType: 'moment' },
    ],
    validationPlan: [
      ['yuna', 4, 3], ['theo', 4, 3], ['sofia', 3, 2], ['amelie', 3, 2],
      ['jonas', 3, 2], ['priya', 3, 1], ['daniel', 2, 1], ['mira', 2, 1],
    ],
  },

  // ───────────── TRUSTED tier (61–85) ─────────────
  {
    username: 'jonas',
    displayName: 'Jonas Keller',
    city: 'Berlin',
    bio: 'Boulder problems and bakery queues. Kreuzberg is a personality.',
    interests: ['bouldering', 'specialty-coffee', 'techno', 'plant-based'],
    importedFollowers: 800,
    createdDaysAgo: 60,
    posts: [
      { daysAgo: 3, content: 'Boulderklub reset the orange circuit — the slab section will humble you. Go before 17:00 or wait in line.', placeKey: 'boulderklub', interests: ['bouldering'], postType: 'checkin' },
      { daysAgo: 6, content: 'Bonanza flat white after a morning session. The Kreuzberg roastery does it better than the Mitte one, sorry.', placeKey: 'bonanza', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 12, content: 'Vegan döner crawl results: the seitan one wins on texture, the mushroom one wins on soul.', interests: ['plant-based'], postType: 'list' },
      { daysAgo: 19, content: 'Closing set at 7am, walked home through Görlitzer in the rain. Some nights deserve documentation.', interests: ['techno'], postType: 'moment' },
      { daysAgo: 25, content: 'Markthalle Neun on Thursday: plant-based street food night. Get the jackfruit thing, thank me later.', placeKey: 'markthalle', interests: ['plant-based'], postType: 'checkin' },
      { daysAgo: 40, content: 'Finger strength is a lifestyle, not a hobby. Hangboard review thread incoming.', interests: ['bouldering'], postType: 'moment' },
    ],
    validationPlan: [
      ['mira', 3, 2], ['amelie', 3, 2], ['nina', 2, 1], ['marcus', 2, 1], ['kenji', 1, 1],
    ],
  },
  {
    username: 'amelie',
    displayName: 'Amélie Fournier',
    city: 'Berlin',
    bio: 'Natural wine, contemporary art, and the spaces in between. Recovering Parisian.',
    interests: ['natural-wine', 'contemporary-art', 'vintage-fashion', 'cocktail-bars'],
    importedFollowers: 1500,
    createdDaysAgo: 70,
    posts: [
      { daysAgo: 2, content: 'Wild Things poured a Slovenian orange that tasted like apricot skin and good decisions.', placeKey: 'wildthings', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 8, content: 'Hamburger Bahnhof rehang is worth the trip alone. The Beuys room finally breathes.', interests: ['contemporary-art'], postType: 'moment' },
      { daysAgo: 11, content: 'Vintage shopping route: three shops in Neukölln, one hour, one perfect wool coat. Efficiency is elegance.', interests: ['vintage-fashion'], postType: 'list' },
      { daysAgo: 16, content: 'A negroni variation with fino sherry instead of vermouth. The bartender called it a mistake. It was not.', interests: ['cocktail-bars'], postType: 'moment' },
      { daysAgo: 24, content: 'Pet-nat season never ends if you refuse to acknowledge the calendar.', placeKey: 'wildthings', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 35, content: 'Gallery weekend survival kit: comfortable shoes, low expectations, high curiosity.', interests: ['contemporary-art'], postType: 'list' },
    ],
    validationPlan: [
      ['mira', 3, 2], ['jonas', 3, 2], ['sofia', 2, 1], ['lucia', 2, 1], ['nina', 1, 1],
    ],
  },
  {
    username: 'theo',
    displayName: 'Theo Park',
    city: 'London',
    bio: 'Espresso before noon, jazz after dark. Walking London until it makes sense.',
    interests: ['specialty-coffee', 'jazz-bars', 'bookshops', 'running'],
    importedFollowers: 600,
    createdDaysAgo: 80,
    posts: [
      { daysAgo: 4, content: 'Prufrock still sets the standard. The guest roaster this month is from Aarhus and it shows.', placeKey: 'prufrock', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 9, content: 'Sunday morning 10k along the canal, ending at a bookshop with a coffee bar. The routine is the reward.', interests: ['running', 'bookshops'], postType: 'moment' },
      { daysAgo: 15, content: 'Late set at a basement jazz bar in Dalston — quartet, no mics, room held its breath. This is why cities exist.', interests: ['jazz-bars'], postType: 'moment' },
      { daysAgo: 23, content: 'Five London bookshops with serious coffee, ranked by both axes. The Pareto frontier is two shops long.', interests: ['bookshops', 'specialty-coffee'], postType: 'list' },
      { daysAgo: 33, content: 'Track Tuesday: 6x800 and a flat white. Balance.', interests: ['running'], postType: 'moment' },
    ],
    validationPlan: [
      ['kenji', 3, 2], ['mira', 2, 1], ['oliver', 2, 1], ['priya', 2, 1], ['daniel', 1, 1],
    ],
  },
  {
    username: 'sofia',
    displayName: 'Sofía Reyes',
    city: 'New York',
    bio: 'Wine lists and gallery walls. Brooklyn-based, globally hungry.',
    interests: ['natural-wine', 'contemporary-art', 'cocktail-bars', 'specialty-coffee'],
    importedFollowers: 2000,
    createdDaysAgo: 55,
    posts: [
      { daysAgo: 3, content: 'Four Horsemen still has the best by-the-glass list in the borough. The Jura section is quietly expanding.', placeKey: 'fourhorsemen', interests: ['natural-wine'], postType: 'checkin' },
      { daysAgo: 7, content: 'PS1 on a Friday afternoon: the video installation upstairs deserves an hour, not a walkthrough.', placeKey: 'moma-ps1', interests: ['contemporary-art'], postType: 'checkin' },
      { daysAgo: 13, content: 'Sey is operating on another level right now. The Kenyan washed tastes like blackcurrant cordial.', placeKey: 'sey', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 20, content: 'Three-stop art crawl in LIC before everything moves to Tribeca. Catch it while it is still scrappy.', interests: ['contemporary-art'], postType: 'list' },
      { daysAgo: 31, content: 'A martini should be cold enough to hurt. Non-negotiable.', interests: ['cocktail-bars'], postType: 'moment' },
    ],
    validationPlan: [
      ['mira', 3, 2], ['amelie', 2, 1], ['kenji', 2, 1], ['daniel', 2, 1], ['lucia', 1, 1],
    ],
  },
  {
    username: 'yuna',
    displayName: 'Yuna Choi',
    city: 'Seoul',
    bio: 'Finding the quiet corners of a loud city. Coffee, techno, and everything in between.',
    interests: ['specialty-coffee', 'techno', 'vintage-fashion', 'farmers-market'],
    importedFollowers: 1200,
    createdDaysAgo: 65,
    posts: [
      { daysAgo: 2, content: 'Anthracite Hannam at golden hour: concrete, light, and a pour-over that needs no milk.', placeKey: 'anthracite', interests: ['specialty-coffee'], postType: 'checkin' },
      { daysAgo: 8, content: 'vurt. on Saturday — four hours of hypnotic minimal, no phones on the floor. Seoul techno is criminally underrated.', placeKey: 'vurt', interests: ['techno'], postType: 'checkin' },
      { daysAgo: 14, content: 'Gwangjang at 8am before the tour groups: bindaetteok straight off the griddle, market ladies running the show.', placeKey: 'gwangjang', interests: ['farmers-market'], postType: 'checkin' },
      { daysAgo: 22, content: 'Vintage hunting in Dongmyo: patience required, treasures guaranteed. Wore the 90s bomber out of the stall.', interests: ['vintage-fashion'], postType: 'moment' },
      { daysAgo: 38, content: 'Seoul cafe interiors are a design language of their own. A thread on the new brutalist wave.', interests: ['specialty-coffee'], postType: 'list' },
    ],
    validationPlan: [
      ['kenji', 3, 2], ['jonas', 2, 1], ['theo', 2, 1], ['nina', 2, 1],
    ],
  },

  // ───────────── ESTABLISHED tier (31–60) ─────────────
  {
    username: 'lucia',
    displayName: 'Lucía Ferrer',
    city: 'Barcelona',
    bio: 'Yoga at sunrise, vermut at sunset.',
    interests: ['yoga', 'wellness', 'natural-wine', 'farmers-market'],
    importedFollowers: 300,
    createdDaysAgo: 100,
    posts: [
      { daysAgo: 5, content: 'Rooftop yoga in Gràcia, six people, one slightly judgmental pigeon. Perfect morning.', interests: ['yoga'], postType: 'moment' },
      { daysAgo: 18, content: 'The Sunday market near Sant Antoni has a mushroom stall that will change your risotto forever.', interests: ['farmers-market'], postType: 'checkin' },
      { daysAgo: 32, content: 'Breathwork before espresso. The order matters more than you think.', interests: ['wellness'], postType: 'moment' },
      { daysAgo: 50, content: 'A vermut and olives after a long practice is also wellness. I do not make the rules.', interests: ['natural-wine', 'wellness'], postType: 'moment' },
    ],
    validationPlan: [
      ['mira', 2, 1], ['amelie', 1, 1], ['priya', 1, 0],
    ],
  },
  {
    username: 'marcus',
    displayName: 'Marcus Webb',
    city: 'London',
    bio: 'Cycling the city, drinking the good stuff.',
    interests: ['cycling', 'cocktail-bars', 'specialty-coffee'],
    importedFollowers: 450,
    createdDaysAgo: 110,
    posts: [
      { daysAgo: 5, content: 'Regents Park loops at 6am: 40k before the city wakes up. The light over the boating lake never gets old.', interests: ['cycling'], postType: 'moment' },
      { daysAgo: 12, content: 'Found a basement bar in Soho doing a fig-leaf gimlet. London cocktails are in a quietly great era.', interests: ['cocktail-bars'], postType: 'checkin' },
      { daysAgo: 20, content: 'Prufrock before a century ride. Carb-loading on cardamom buns counts.', placeKey: 'prufrock', interests: ['specialty-coffee', 'cycling'], postType: 'checkin' },
      { daysAgo: 55, content: 'Hill repeats in the rain build character and destroy drivetrains.', interests: ['cycling'], postType: 'moment' },
    ],
    validationPlan: [
      ['theo', 2, 1], ['jonas', 1, 0], ['oliver', 1, 1],
    ],
  },
  {
    username: 'nina',
    displayName: 'Nina Hoffmann',
    city: 'Berlin',
    bio: 'Records, raves, and slow Sundays.',
    interests: ['vinyl-records', 'techno', 'slow-living'],
    importedFollowers: 700,
    createdDaysAgo: 95,
    posts: [
      { daysAgo: 6, content: 'Dug out a first-press Basic Channel from a crate in Neukölln for 8 euro. The seller knew. He just respected the hunt.', interests: ['vinyl-records'], postType: 'moment' },
      { daysAgo: 13, content: 'Open-air season is starting. The first outdoor kick drum of the year hits different.', interests: ['techno'], postType: 'moment' },
      { daysAgo: 25, content: 'Sunday: records, coffee, no phone until noon. Protect the ritual.', interests: ['slow-living', 'vinyl-records'], postType: 'moment' },
      { daysAgo: 60, content: 'A guide to Berlin record shops that still smell like record shops.', interests: ['vinyl-records'], postType: 'list' },
    ],
    validationPlan: [
      ['jonas', 2, 1], ['yuna', 1, 0], ['amelie', 1, 0],
    ],
  },
  {
    username: 'oliver',
    displayName: 'Oliver Bennett',
    city: 'London',
    bio: 'Architecture nerd with a running habit.',
    interests: ['architecture', 'running', 'bookshops'],
    importedFollowers: 250,
    createdDaysAgo: 120,
    posts: [
      { daysAgo: 6, content: 'Barbican conservatory on a grey day: brutalism and tropical plants, the unlikeliest perfect pairing.', interests: ['architecture'], postType: 'checkin' },
      { daysAgo: 13, content: 'Long run along the South Bank, stopping at every plaque like the nerd I am. 18k of accidental history.', interests: ['running', 'architecture'], postType: 'moment' },
      { daysAgo: 24, content: 'The architecture section at the big Foyles deserves its own postcode.', interests: ['bookshops', 'architecture'], postType: 'checkin' },
    ],
    validationPlan: [
      ['theo', 2, 1], ['marcus', 1, 0], ['kenji', 1, 0],
    ],
  },
  {
    username: 'priya',
    displayName: 'Priya Nair',
    city: 'New York',
    bio: 'Plant-based eating, gallery walks, early yoga.',
    interests: ['plant-based', 'yoga', 'contemporary-art', 'bakeries'],
    importedFollowers: 350,
    createdDaysAgo: 85,
    posts: [
      { daysAgo: 6, content: 'The new vegan bakery in Greenpoint does a miso-caramel morning bun that should be illegal before 9am.', interests: ['plant-based', 'bakeries'], postType: 'checkin' },
      { daysAgo: 13, content: 'PS1 then a green juice, because balance is a myth we maintain together.', placeKey: 'moma-ps1', interests: ['contemporary-art'], postType: 'checkin' },
      { daysAgo: 24, content: 'Yoga at sunrise on the roof. The skyline does half the work.', interests: ['yoga'], postType: 'moment' },
      { daysAgo: 58, content: 'A list of plant-based tasting menus that actually commit to the bit.', interests: ['plant-based'], postType: 'list' },
    ],
    validationPlan: [
      ['lucia', 1, 0], ['sofia', 1, 1], ['kenji', 1, 0],
    ],
  },
  {
    username: 'daniel',
    displayName: 'Daniel Cho',
    city: 'Seoul',
    bio: 'Swimming laps and sampling pours.',
    interests: ['swimming', 'specialty-coffee', 'ramen'],
    importedFollowers: 150,
    createdDaysAgo: 75,
    posts: [
      { daysAgo: 12, content: 'Morning laps at the Olympic pool, then a hand-drip at Anthracite. Seoul mornings are undefeated.', placeKey: 'anthracite', interests: ['swimming', 'specialty-coffee'], postType: 'checkin' },
      { daysAgo: 30, content: 'A tonkotsu place in Hongdae that simmers for 18 hours. You can taste every one of them.', interests: ['ramen'], postType: 'checkin' },
      { daysAgo: 47, content: 'Open-water season prep: cold showers and colder resolve.', interests: ['swimming'], postType: 'moment' },
    ],
    validationPlan: [
      ['kenji', 1, 1], ['yuna', 1, 0], ['theo', 1, 0],
    ],
  },

  // ───────────── EMERGING tier (0–30) ─────────────
  {
    username: 'emma',
    displayName: 'Emma Lindqvist',
    city: 'Berlin',
    bio: 'New in town. Following my nose.',
    interests: ['bakeries', 'urban-gardening', 'independent-cinema'],
    importedFollowers: 80,
    createdDaysAgo: 130,
    posts: [
      { daysAgo: 45, content: 'The kino around the corner shows 35mm on Sundays. I know where my weekends went.', interests: ['independent-cinema'], postType: 'moment' },
      { daysAgo: 70, content: 'Started a balcony garden with three herbs and unreasonable optimism.', interests: ['urban-gardening'], postType: 'moment' },
      { daysAgo: 95, content: 'Cardamom knots ranked across four bakeries. Preliminary findings: all of them.', interests: ['bakeries'], postType: 'list' },
    ],
    validationPlan: [['nina', 1, 0]],
  },
  {
    username: 'leo',
    displayName: 'Leo Martinez',
    city: 'Barcelona',
    bio: 'Martial arts, rooftops, and finding my people.',
    interests: ['martial-arts', 'rooftop-bars', 'running'],
    importedFollowers: 40,
    createdDaysAgo: 140,
    posts: [
      { daysAgo: 50, content: 'First BJJ class in a new city is the fastest way to make friends and lose arguments.', interests: ['martial-arts'], postType: 'moment' },
      { daysAgo: 80, content: 'Rooftop season scouting report: the one near the cathedral wins on view, loses on pour.', interests: ['rooftop-bars'], postType: 'checkin' },
      { daysAgo: 110, content: 'Beach run at dawn. The city forgives everything before 8am.', interests: ['running'], postType: 'moment' },
    ],
    validationPlan: [],
  },
  {
    username: 'hana',
    displayName: 'Hana Suzuki',
    city: 'Tokyo',
    bio: 'Quiet places, loud records.',
    interests: ['vinyl-records', 'underground-events', 'cocktail-bars'],
    importedFollowers: 60,
    createdDaysAgo: 125,
    posts: [
      { daysAgo: 55, content: 'A listening bar in Shimokitazawa where the owner picks every record and you do not talk during side A.', interests: ['vinyl-records', 'cocktail-bars'], postType: 'checkin' },
      { daysAgo: 90, content: 'Warehouse show in Kawasaki, lineup announced day-of. Tokyo underground keeps its secrets well.', interests: ['underground-events'], postType: 'moment' },
      { daysAgo: 115, content: 'Highball technique is real and I will die on this hill.', interests: ['cocktail-bars'], postType: 'moment' },
    ],
    validationPlan: [['kenji', 1, 0]],
  },
];

// ---------------------------------------------------------------- main
async function main() {
  console.log('Seeding Taste…');

  // wipe in FK-safe order
  await prisma.validation.deleteMany();
  await prisma.postInterest.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.credibilityScore.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();

  // interests
  const interestBySlug = new Map<string, string>();
  for (const def of INTEREST_TAXONOMY) {
    const interest = await prisma.interest.create({ data: def });
    interestBySlug.set(def.slug, interest.id);
  }
  console.log(`  ${interestBySlug.size} interests`);

  // places
  const placeByKey = new Map<string, string>();
  for (const def of PLACES) {
    const { key, ...data } = def;
    const place = await prisma.place.create({
      data: {
        ...data,
        coverImage: `https://picsum.photos/seed/${key}/800/600`,
      },
    });
    placeByKey.set(key, place.id);
  }
  console.log(`  ${placeByKey.size} places`);

  // users + interests + posts
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userByUsername = new Map<string, string>();
  const postsByUsername = new Map<string, { id: string }[]>();

  for (const def of USERS) {
    const user = await prisma.user.create({
      data: {
        username: def.username,
        displayName: def.displayName,
        passwordHash,
        bio: def.bio,
        avatarUrl:
          PORTRAITS[def.username] ??
          `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${def.username}&backgroundColor=f2e4d8`,
        city: def.city,
        importedFollowers: def.importedFollowers,
        createdAt: daysAgo(def.createdDaysAgo),
      },
    });
    userByUsername.set(def.username, user.id);

    for (const slug of def.interests) {
      await prisma.userInterest.create({
        data: { userId: user.id, interestId: interestBySlug.get(slug)!, strength: 1.0 },
      });
    }

    const created: { id: string }[] = [];
    for (const post of def.posts) {
      const p = await prisma.post.create({
        data: {
          userId: user.id,
          placeId: post.placeKey ? placeByKey.get(post.placeKey)! : null,
          content: post.content,
          postType: post.postType ?? 'moment',
          createdAt: daysAgo(post.daysAgo),
        },
      });
      for (const slug of post.interests) {
        await prisma.postInterest.create({
          data: { postId: p.id, interestId: interestBySlug.get(slug)! },
        });
      }
      created.push(p);
    }
    postsByUsername.set(def.username, created);
  }
  console.log(`  ${userByUsername.size} users`);

  // validations
  const NOTES = [
    'Went exactly because of this. Delivered.',
    'This was exactly right.',
    'Tried it last weekend — spot on.',
    'You were right about this one.',
    null,
    null,
  ];
  let validationCount = 0;
  for (const def of USERS) {
    const targetId = userByUsername.get(def.username)!;
    const targetPosts = postsByUsername.get(def.username)!;
    if (targetPosts.length === 0) continue;

    for (const [validatorUsername, total, recent] of def.validationPlan) {
      const validatorId = userByUsername.get(validatorUsername);
      if (!validatorId) {
        throw new Error(`Unknown validator ${validatorUsername} for ${def.username}`);
      }
      for (let i = 0; i < total; i++) {
        const post = targetPosts[validationCount % targetPosts.length];
        const isRecent = i < recent;
        await prisma.validation.create({
          data: {
            validatorId,
            validatedUserId: targetId,
            postId: post.id,
            note: NOTES[validationCount % NOTES.length],
            createdAt: isRecent ? daysAgo(2 + (i % 20)) : daysAgo(35 + ((i * 7) % 40)),
          },
        });
        validationCount++;
      }
    }
  }
  console.log(`  ${validationCount} validations`);

  // credibility scores
  for (const def of USERS) {
    const userId = userByUsername.get(def.username)!;
    const breakdown = await recalculateAndStore(userId);
    console.log(
      `  ${def.username.padEnd(8)} → ${String(breakdown.totalScore).padStart(5)} (${breakdown.tier})`
    );
  }

  console.log('Done. Sign in with any username (e.g. "mira") and password "taste123".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
