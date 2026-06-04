import { prisma } from './prisma';

export type CredibilityBreakdown = {
  totalScore: number;
  tasteSignalStrength: number; // 0–100
  peerValidationDensity: number; // 0–100
  consistencyBonus: number; // 0–20
  importedFollowerScore: number; // 0–20
  tier: Tier;
};

export type Tier = 'Emerging' | 'Established' | 'Trusted' | 'Authority';

export function tierForScore(score: number): Tier {
  if (score > 85) return 'Authority';
  if (score > 60) return 'Trusted';
  if (score > 30) return 'Established';
  return 'Emerging';
}

export const TIER_COLORS: Record<Tier, string> = {
  Emerging: 'var(--score-low)',
  Established: 'var(--score-mid)',
  Trusted: 'var(--score-high)',
  Authority: 'var(--score-high)',
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Credibility scoring algorithm.
 *
 * Taste Signal Strength (40%):
 *   +1 per interest-tagged post (recent posts weighted 2x), cap 30
 *   +15 if >70% of tagged posts align to ≤3 interest categories
 *   normalized to 0–100 against a raw max of 45
 *
 * Peer Validation Density (45%):
 *   +3 per validation, 2x when validator shares ≥1 interest, capped at 75 pts (25 validations)
 *   +10 velocity bonus for >5 validations in last 30 days
 *   normalized to 0–100 against a raw max of 85
 *
 * Consistency Bonus (15%, expressed 0–20):
 *   +10 active ≥3 of last 4 weeks, +5 new place posted in last 2 weeks,
 *   -5 if zero posts in last 30 days
 *
 * Imported Follower Score (cold-start, decays to zero at 90 days):
 *   followers / 5000 * 20 (max 20) * max(0, 1 - daysSinceCreation / 90)
 */
export async function calculateCredibility(userId: string): Promise<CredibilityBreakdown> {
  const now = Date.now();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      interests: { include: { interest: true } },
      posts: { include: { interests: { include: { interest: true } } } },
      receivedValidations: {
        include: {
          validator: { include: { interests: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // ---- Taste Signal Strength (40%) ----
  const taggedPosts = user.posts.filter((p) => p.interests.length > 0);
  let postPoints = 0;
  for (const post of taggedPosts) {
    const isRecent = now - post.createdAt.getTime() <= 30 * DAY;
    postPoints += isRecent ? 2 : 1;
  }
  postPoints = Math.min(30, postPoints);

  // Interest category consistency: >70% of tagged posts within ≤3 categories
  let consistencyRatioBonus = 0;
  if (taggedPosts.length > 0) {
    const categoryCounts = new Map<string, number>();
    for (const post of taggedPosts) {
      const categories = new Set(post.interests.map((pi) => pi.interest.category));
      for (const cat of categories) {
        categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
      }
    }
    const top3 = [...categoryCounts.values()].sort((a, b) => b - a).slice(0, 3);
    const covered = top3.reduce((a, b) => a + b, 0);
    if (covered / taggedPosts.length > 0.7) consistencyRatioBonus = 15;
  }

  const tasteSignalStrength = Math.min(100, ((postPoints + consistencyRatioBonus) / 45) * 100);

  // ---- Peer Validation Density (45%) ----
  const userInterestIds = new Set(user.interests.map((ui) => ui.interestId));
  let validationPoints = 0;
  const countedValidations = user.receivedValidations.slice(0, 25); // cap 25 validations
  for (const v of countedValidations) {
    const sharesInterest = v.validator.interests.some((vi) => userInterestIds.has(vi.interestId));
    validationPoints += sharesInterest ? 6 : 3; // shared-interest validations worth 2x
  }
  validationPoints = Math.min(75, validationPoints);

  const recentValidations = user.receivedValidations.filter(
    (v) => now - v.createdAt.getTime() <= 30 * DAY
  );
  const velocityBonus = recentValidations.length > 5 ? 10 : 0;

  const peerValidationDensity = Math.min(100, ((validationPoints + velocityBonus) / 85) * 100);

  // ---- Consistency Bonus (15%, 0–20 scale) ----
  let consistencyBonus = 0;
  const weeksActive = new Set<number>();
  for (const post of user.posts) {
    const age = now - post.createdAt.getTime();
    if (age <= 28 * DAY) weeksActive.add(Math.floor(age / (7 * DAY)));
  }
  if (weeksActive.size >= 3) consistencyBonus += 10;

  const recentPlacePost = user.posts.some(
    (p) => p.placeId && now - p.createdAt.getTime() <= 14 * DAY
  );
  if (recentPlacePost) consistencyBonus += 5;

  const postsLast30d = user.posts.filter((p) => now - p.createdAt.getTime() <= 30 * DAY);
  if (postsLast30d.length === 0) consistencyBonus -= 5;

  consistencyBonus = Math.max(0, Math.min(20, consistencyBonus));

  // ---- Imported Follower Score (cold-start, decays) ----
  const daysSinceCreation = (now - user.createdAt.getTime()) / DAY;
  const decay = Math.max(0, 1 - daysSinceCreation / 90);
  const importedFollowerScore =
    Math.min(20, (user.importedFollowers / 5000) * 20) * decay;

  // ---- Total: weighted sum, clamped to 0–100 ----
  const totalScore = Math.max(
    0,
    Math.min(
      100,
      tasteSignalStrength * 0.4 +
        peerValidationDensity * 0.45 +
        (consistencyBonus / 20) * 100 * 0.15 +
        importedFollowerScore
    )
  );

  return {
    totalScore: round1(totalScore),
    tasteSignalStrength: round1(tasteSignalStrength),
    peerValidationDensity: round1(peerValidationDensity),
    consistencyBonus: round1(consistencyBonus),
    importedFollowerScore: round1(importedFollowerScore),
    tier: tierForScore(totalScore),
  };
}

/** Recalculate and persist a user's credibility score. */
export async function recalculateAndStore(userId: string): Promise<CredibilityBreakdown> {
  const breakdown = await calculateCredibility(userId);
  await prisma.credibilityScore.upsert({
    where: { userId },
    create: {
      userId,
      totalScore: breakdown.totalScore,
      tasteSignalStrength: breakdown.tasteSignalStrength,
      peerValidationDensity: breakdown.peerValidationDensity,
      consistencyBonus: breakdown.consistencyBonus,
      importedFollowerScore: breakdown.importedFollowerScore,
      lastCalculated: new Date(),
    },
    update: {
      totalScore: breakdown.totalScore,
      tasteSignalStrength: breakdown.tasteSignalStrength,
      peerValidationDensity: breakdown.peerValidationDensity,
      consistencyBonus: breakdown.consistencyBonus,
      importedFollowerScore: breakdown.importedFollowerScore,
      lastCalculated: new Date(),
    },
  });
  return breakdown;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
