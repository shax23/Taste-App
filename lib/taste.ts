// Curated-list domain logic: pick categories, Barcelona scoping, overlap scoring.

export const LIST_SIZE = 10;
export const CITY = 'Barcelona';

/** The six pick categories. Stored lowercase on Place.category. */
export const PICK_CATEGORIES = [
  { slug: 'cafe', label: 'Cafe', emoji: '☕', color: '#C8602A' },
  { slug: 'restaurant', label: 'Restaurant', emoji: '🍽️', color: '#2D6A4F' },
  { slug: 'bar', label: 'Bar', emoji: '🍷', color: '#7B2D8E' },
  { slug: 'area', label: 'Neighborhood / Area', emoji: '🏘️', color: '#3A6EA5' },
  { slug: 'activity', label: 'Activity / Spot', emoji: '🧗', color: '#E9A826' },
  { slug: 'shop', label: 'Shop', emoji: '🛍️', color: '#B5443C' },
] as const;

export type PickCategory = (typeof PICK_CATEGORIES)[number]['slug'];

/** Interest taxonomy category → the pick categories it hints at, for suggestions. */
export const INTEREST_CATEGORY_PICKS: Record<string, PickCategory[]> = {
  food: ['cafe', 'restaurant', 'bar', 'shop'],
  movement: ['activity'],
  culture: ['activity', 'shop'],
  lifestyle: ['shop', 'area', 'cafe'],
  nightlife: ['bar'],
};

/** Legacy Place.category values → pick category. */
const LEGACY_MAP: Record<string, PickCategory> = {
  cafe: 'cafe',
  restaurant: 'restaurant',
  bar: 'bar',
  club: 'bar',
  park: 'activity',
  studio: 'activity',
  gallery: 'activity',
  market: 'shop',
  bookshop: 'shop',
  bakery: 'shop',
  area: 'area',
  activity: 'activity',
  shop: 'shop',
};

export function toPickCategory(raw: string): PickCategory {
  return LEGACY_MAP[raw] ?? 'activity';
}

export function categoryMeta(raw: string) {
  const slug = toPickCategory(raw);
  return PICK_CATEGORIES.find((c) => c.slug === slug)!;
}

// ---------------------------------------------------------------- overlap

export type OverlapInput = {
  placeId: string;
  neighborhood: string | null;
  category: string;
};

export type OverlapResult = {
  sharedPlaceIds: Set<string>;
  sharedPlaceCount: number;
  sharedNeighborhoods: string[];
  sharedCategories: PickCategory[];
  score: number;
  percent: number; // 0–100, 10 exact shared places = 100
};

/**
 * Match logic. Primary: exact shared places (same placeId, weight 3).
 * Secondary, lighter: shared neighborhoods (1) and shared categories (0.5).
 */
export function computeOverlap(mine: OverlapInput[], theirs: OverlapInput[]): OverlapResult {
  const myPlaceIds = new Set(mine.map((p) => p.placeId));
  const sharedPlaceIds = new Set(theirs.filter((p) => myPlaceIds.has(p.placeId)).map((p) => p.placeId));

  const norm = (s: string) => s.trim().toLowerCase();
  const myNeighborhoods = new Set(mine.map((p) => p.neighborhood).filter(Boolean).map((n) => norm(n!)));
  const sharedNeighborhoodSet = new Set(
    theirs
      .map((p) => p.neighborhood)
      .filter((n): n is string => !!n && myNeighborhoods.has(norm(n)))
      .map((n) => n.trim())
  );

  const myCategories = new Set(mine.map((p) => toPickCategory(p.category)));
  const sharedCategories = [...new Set(theirs.map((p) => toPickCategory(p.category)))].filter((c) =>
    myCategories.has(c)
  );

  const score =
    sharedPlaceIds.size * 3 + sharedNeighborhoodSet.size * 1 + sharedCategories.length * 0.5;
  const percent = Math.min(100, Math.round((score / (LIST_SIZE * 3)) * 100));

  return {
    sharedPlaceIds,
    sharedPlaceCount: sharedPlaceIds.size,
    sharedNeighborhoods: [...sharedNeighborhoodSet],
    sharedCategories,
    score,
    percent,
  };
}
