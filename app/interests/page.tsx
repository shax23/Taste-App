import { redirect } from 'next/navigation';

// The interest-picker was retired in the curated-list pivot.
// Onboarding now means building your 10-place Barcelona list.
export default function InterestsPage() {
  redirect('/onboarding');
}
