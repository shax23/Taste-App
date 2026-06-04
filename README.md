# Taste

Interest-based social discovery. Explore what people with similar interests are
actually doing in real life — the cafes they visit, the neighborhoods they roam,
the activities they join. Discovery happens through shared taste, not follower
graphs.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · SQLite via Prisma ·
NextAuth (credentials) · Leaflet · Recharts · Framer Motion

Fully offline-capable: the database is a local SQLite file, auth is local
credentials. (Map tiles, fonts, and avatar images load from the network when
available; everything else works without it.)

## Setup

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then open http://localhost:3000.

## Demo accounts

Every seeded user signs in with password `taste123`. Try:

| Username | Tier        | City      |
| -------- | ----------- | --------- |
| `mira`   | Authority   | Barcelona |
| `kenji`  | Authority   | Tokyo     |
| `jonas`  | Trusted     | Berlin    |
| `lucia`  | Established | Barcelona |
| `emma`   | Emerging    | Berlin    |

## Credibility scoring

Implemented in `lib/credibility.ts`:

- **Taste Signal Strength (40%)** — consistent interest-tagged posting; recent
  posts weighted 2x; bonus for category focus
- **Peer Validation Density (45%)** — "I tried this" confirmations, worth double
  when the validator shares an interest; velocity bonus
- **Consistency Bonus (15%)** — active most weeks, posting new places
- **Imported Follower Score** — cold-start credit that decays to zero at 90 days

Tiers: 0–30 Emerging · 31–60 Established · 61–85 Trusted · 86–100 Authority
