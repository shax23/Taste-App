// Compatibility scoring between two users based on their category preferences.
//
// A user's preferences are organized by category (e.g. "restaurant", "yoga",
// "club"). Being present in a category means a *general* interest in it. The
// strings inside a category are *specific* items (a named restaurant, a
// particular yoga studio, etc.).
//
// Scoring (per category, summed across all categories):
//   - share the category but no specific item in common -> BASE_WEIGHT (X)
//   - share at least one specific item in common         -> 3 * BASE_WEIGHT
//   A specific match is the STRONGER match and does not also count as a general
//   match (3X, never X + 3X). No shared category -> no points.

/** Base weight X. Tune this single constant to reweight the whole model. */
export const BASE_WEIGHT = 1;

/** Multiplier for a specific-item match vs. a general category match. */
export const SPECIFIC_MULTIPLIER = 3;

/**
 * A user's preferences: category name -> specific items in that category.
 * Presence of a category key signals general interest; the array holds the
 * specific items (it may be empty when the user likes the category broadly but
 * named nothing specific).
 */
export type UserPreferences = Record<string, string[]>;

export interface User {
  id: string;
  name?: string;
  preferences: UserPreferences;
}

export type MatchKind = 'general' | 'specific';

export interface CategoryMatch {
  category: string;
  kind: MatchKind;
  points: number;
  /** the specific items both users share (only for `kind: 'specific'`) */
  sharedItems: string[];
}

export interface CompatibilityResult {
  score: number;
  breakdown: CategoryMatch[];
}

/** Normalize an item for comparison: case-insensitive, trimmed. */
function normItem(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Compute the compatibility score between two users.
 *
 * Only categories present in BOTH users' preferences can score. For each such
 * category we award the stronger of the two possible matches: 3X when they
 * share a specific item, otherwise X for the shared general interest.
 *
 * @returns the total score and a per-category breakdown for debuggability.
 */
export function computeCompatibility(a: User, b: User): CompatibilityResult {
  const breakdown: CategoryMatch[] = [];

  for (const category of Object.keys(a.preferences)) {
    const aItems = a.preferences[category];
    const bItems = b.preferences[category];

    // The other user has no preference in this category -> no match, no points.
    if (bItems === undefined) continue;

    // specific overlap (case-insensitive), preserving a's original casing
    const bSet = new Set(bItems.map(normItem));
    const sharedItems = aItems.filter((item) => bSet.has(normItem(item)));

    if (sharedItems.length > 0) {
      // specific match wins outright — 3X, not X + 3X
      breakdown.push({
        category,
        kind: 'specific',
        points: SPECIFIC_MULTIPLIER * BASE_WEIGHT,
        sharedItems,
      });
    } else {
      // shared category but no specific item in common -> general match
      breakdown.push({
        category,
        kind: 'general',
        points: BASE_WEIGHT,
        sharedItems: [],
      });
    }
  }

  const score = breakdown.reduce((sum, m) => sum + m.points, 0);
  return { score, breakdown };
}

// ---------------------------------------------------------------- examples

/** A few illustrative users for demos and tests. */
export const EXAMPLE_USERS = {
  // shares the restaurant category with Bea (general) and a specific yoga studio
  amir: {
    id: 'amir',
    name: 'Amir',
    preferences: {
      restaurant: ['Bar Cañete', 'Disfrutar'],
      yoga: ['Zentro Urban Yoga'],
      club: ['Razzmatazz'],
    },
  },
  // general restaurant overlap with Amir, exact-same yoga studio, no club
  bea: {
    id: 'bea',
    name: 'Bea',
    preferences: {
      restaurant: ['Tickets', 'Quimet & Quimet'],
      yoga: ['Zentro Urban Yoga'],
    },
  },
  // no categories in common with Amir at all
  cy: {
    id: 'cy',
    name: 'Cy',
    preferences: {
      cycling: ['Carretera de les Aigües'],
      coffee: ['Nømad'],
    },
  },
} satisfies Record<string, User>;
