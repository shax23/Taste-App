// Interest taxonomy — the canonical list seeded into the database.
// Categories: food, movement, culture, lifestyle, nightlife

export type InterestDef = {
  slug: string;
  label: string;
  category: 'food' | 'movement' | 'culture' | 'lifestyle' | 'nightlife';
  emoji: string;
};

export const INTEREST_TAXONOMY: InterestDef[] = [
  // Food & Drink
  { slug: 'specialty-coffee', label: 'Specialty Coffee', category: 'food', emoji: '☕' },
  { slug: 'natural-wine', label: 'Natural Wine', category: 'food', emoji: '🍷' },
  { slug: 'ramen', label: 'Ramen', category: 'food', emoji: '🍜' },
  { slug: 'farmers-market', label: 'Farmers Markets', category: 'food', emoji: '🥬' },
  { slug: 'cocktail-bars', label: 'Cocktail Bars', category: 'food', emoji: '🍸' },
  { slug: 'bakeries', label: 'Bakeries', category: 'food', emoji: '🥐' },
  // Movement
  { slug: 'bouldering', label: 'Bouldering', category: 'movement', emoji: '🧗' },
  { slug: 'yoga', label: 'Yoga', category: 'movement', emoji: '🧘' },
  { slug: 'running', label: 'Running', category: 'movement', emoji: '🏃' },
  { slug: 'martial-arts', label: 'Martial Arts', category: 'movement', emoji: '🥋' },
  { slug: 'cycling', label: 'Cycling', category: 'movement', emoji: '🚴' },
  { slug: 'swimming', label: 'Swimming', category: 'movement', emoji: '🏊' },
  // Culture
  { slug: 'contemporary-art', label: 'Contemporary Art', category: 'culture', emoji: '🎨' },
  { slug: 'vinyl-records', label: 'Vinyl Records', category: 'culture', emoji: '🎶' },
  { slug: 'architecture', label: 'Architecture', category: 'culture', emoji: '🏛️' },
  { slug: 'independent-cinema', label: 'Independent Cinema', category: 'culture', emoji: '🎬' },
  { slug: 'bookshops', label: 'Bookshops', category: 'culture', emoji: '📚' },
  // Lifestyle
  { slug: 'slow-living', label: 'Slow Living', category: 'lifestyle', emoji: '🌿' },
  { slug: 'vintage-fashion', label: 'Vintage Fashion', category: 'lifestyle', emoji: '🧥' },
  { slug: 'plant-based', label: 'Plant-Based', category: 'lifestyle', emoji: '🥗' },
  { slug: 'urban-gardening', label: 'Urban Gardening', category: 'lifestyle', emoji: '🪴' },
  { slug: 'wellness', label: 'Wellness', category: 'lifestyle', emoji: '🫧' },
  // Nightlife
  { slug: 'techno', label: 'Techno', category: 'nightlife', emoji: '🎛️' },
  { slug: 'jazz-bars', label: 'Jazz Bars', category: 'nightlife', emoji: '🎷' },
  { slug: 'rooftop-bars', label: 'Rooftop Bars', category: 'nightlife', emoji: '🌆' },
  { slug: 'underground-events', label: 'Underground Events', category: 'nightlife', emoji: '🕳️' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  movement: 'Movement',
  culture: 'Culture',
  lifestyle: 'Lifestyle',
  nightlife: 'Nightlife',
};

export const CATEGORIES = ['food', 'movement', 'culture', 'lifestyle', 'nightlife'] as const;

export const PLACE_CATEGORY_COLORS: Record<string, string> = {
  cafe: '#C8602A',
  restaurant: '#2D6A4F',
  bar: '#7B2D8E',
  park: '#4C8C4A',
  studio: '#E9A826',
  gallery: '#3A6EA5',
  market: '#B5443C',
  bookshop: '#6B4E2E',
  club: '#1F1F2E',
  bakery: '#D98E32',
};
