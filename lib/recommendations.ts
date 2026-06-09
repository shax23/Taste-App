// Category-based recommendations sourced ONLY from high-compatibility users.
//
// For the Explore tab: when the current user taps a category, surface a short
// list of specific places in that category — but only places that come from the
// preferences of OTHER users the current user is highly compatible with (per
// lib/compatibility.ts), never a global/popular list.

import { computeCompatibility, type User } from './compatibility';

/** Most places to return for a category. */
export const MAX_RESULTS = 5;

/**
 * Minimum compatibility score for another user's preferences to count as a
 * recommendation source. Tune alongside compatibility.ts's BASE_WEIGHT.
 */
export const COMPATIBILITY_THRESHOLD = 3;

/**
 * Ranking weights — the tunable heart of "which recommendations surface first".
 *   compatibility: weight on the summed compatibility of the place's supporters
 *                  (a place liked by a very-compatible person ranks higher)
 *   popularity:    extra weight per supporter (a place liked by SEVERAL
 *                  compatible people ranks above one liked by a single person)
 * Note: the compatibility sum already grows with more supporters; `popularity`
 * is an explicit additional lever on top of that.
 */
export const RANK_WEIGHTS = {
  compatibility: 1,
  popularity: 0.5,
};

export interface Supporter {
  id: string;
  name?: string;
  compatibility: number; // this supporter's compatibility with the current user
}

export interface PlaceRecommendation {
  name: string;
  category: string;
  supporters: Supporter[]; // the compatible users who like this place
  supporterCount: number;
  rankScore: number; // computed ranking strength (higher = stronger)
}

/** Ranking score for one place from its supporters. Separated so it's tunable. */
export function computeRankScore(supporters: Supporter[]): number {
  const compatibilitySum = supporters.reduce((sum, s) => sum + s.compatibility, 0);
  return (
    RANK_WEIGHTS.compatibility * compatibilitySum +
    RANK_WEIGHTS.popularity * supporters.length
  );
}

function normName(s: string): string {
  return s.trim().toLowerCase();
}

export interface RecommendOptions {
  threshold?: number;
  maxResults?: number;
}

/**
 * Recommend specific places in `category`, drawn only from users whose
 * compatibility with `currentUser` is at or above the threshold.
 *
 * - De-duplicates places (case-insensitive): a place liked by several compatible
 *   users appears once, with all supporters combined into its ranking strength.
 * - Ranks by `computeRankScore`, tie-broken by supporter count then name.
 * - Returns at most `maxResults`; fewer (or empty) when fewer qualify.
 */
export function recommendPlacesInCategory(
  currentUser: User,
  others: User[],
  category: string,
  opts: RecommendOptions = {}
): PlaceRecommendation[] {
  const threshold = opts.threshold ?? COMPATIBILITY_THRESHOLD;
  const maxResults = opts.maxResults ?? MAX_RESULTS;

  // place (normalized) -> { display name, supporters }
  const byPlace = new Map<string, { name: string; supporters: Supporter[] }>();

  for (const other of others) {
    if (other.id === currentUser.id) continue;

    const { score } = computeCompatibility(currentUser, other);
    if (score < threshold) continue; // not high-compatibility enough

    const items = other.preferences[category];
    if (items === undefined) continue; // this user has no preference in the category

    for (const item of items) {
      const key = normName(item);
      if (!key) continue;
      const entry = byPlace.get(key) ?? { name: item, supporters: [] };
      // de-dupe supporters in case a user lists the same place twice
      if (!entry.supporters.some((s) => s.id === other.id)) {
        entry.supporters.push({ id: other.id, name: other.name, compatibility: score });
      }
      byPlace.set(key, entry);
    }
  }

  return [...byPlace.values()]
    .map((entry) => ({
      name: entry.name,
      category,
      supporters: entry.supporters,
      supporterCount: entry.supporters.length,
      rankScore: computeRankScore(entry.supporters),
    }))
    .sort(
      (a, b) =>
        b.rankScore - a.rankScore ||
        b.supporterCount - a.supporterCount ||
        a.name.localeCompare(b.name)
    )
    .slice(0, maxResults);
}

// ---------------------------------------------------------------- examples

/**
 * Example world: `me` plus a cast of others. The "compatible" users all share
 * `me`'s specific yoga studio (Zentro = 3X, at threshold), so their restaurant
 * picks become recommendation sources. `lowMatch` only shares the restaurant
 * category generally (X, below threshold), so their picks must NOT surface.
 */
export const EXAMPLE_WORLD = {
  me: {
    id: 'me',
    name: 'Me',
    preferences: {
      restaurant: ['Bar Cañete'],
      yoga: ['Zentro Urban Yoga'],
    },
  } as User,
  others: [
    // high-compatibility (share Zentro = 3X) — restaurant picks qualify
    { id: 'u1', name: 'Ana', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Tickets'] } },
    { id: 'u2', name: 'Ben', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Disfrutar'] } },
    { id: 'u3', name: 'Cleo', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Bar Mut'] } },
    { id: 'u4', name: 'Dani', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Pinotxo'] } },
    { id: 'u5', name: 'Eli', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Quimet'] } },
    { id: 'u6', name: 'Fer', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Tickets'] } }, // 2nd Tickets supporter
    // extra-compatible (shares Zentro 3X AND Bar Cañete 3X = 6) — strong single supporter
    { id: 'u7', name: 'Gia', preferences: { yoga: ['Zentro Urban Yoga'], restaurant: ['Bar Cañete'] } },
    // low-compatibility (only general restaurant overlap = X) — must NOT surface
    { id: 'low', name: 'Lo', preferences: { restaurant: ['Should Not Appear'] } },
  ] as User[],
} satisfies { me: User; others: User[] };
