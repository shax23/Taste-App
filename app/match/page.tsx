import { redirect } from 'next/navigation';

// Matching now lives on the home page, ranked by curated-list overlap
// (shared places first, then shared neighborhoods/categories).
export default function MatchPage() {
  redirect('/');
}
