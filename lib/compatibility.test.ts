// Run with:  npm run test:compat   (or: npx tsx lib/compatibility.test.ts)
//
// Self-contained assertions using node's built-in assert — no test framework
// needed. Exits non-zero on the first failure.

import assert from 'node:assert/strict';
import {
  computeCompatibility,
  BASE_WEIGHT as X,
  EXAMPLE_USERS,
  type User,
} from './compatibility';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const { amir, bea, cy } = EXAMPLE_USERS;

console.log(`compatibility — X = ${X}\n`);

// 1) General-only match: two users share a category but no specific item.
test('general-only match awards X', () => {
  const u1: User = { id: '1', preferences: { restaurant: ['Tickets'] } };
  const u2: User = { id: '2', preferences: { restaurant: ['Disfrutar'] } };
  const { score, breakdown } = computeCompatibility(u1, u2);
  assert.equal(score, X);
  assert.equal(breakdown.length, 1);
  assert.equal(breakdown[0].kind, 'general');
  assert.equal(breakdown[0].points, X);
  assert.deepEqual(breakdown[0].sharedItems, []);
});

// 2) Specific match: same exact item -> 3X, and it does NOT double count as X + 3X.
test('specific match awards 3X (not X + 3X)', () => {
  const u1: User = { id: '1', preferences: { yoga: ['Zentro Urban Yoga', 'Hot Yoga BCN'] } };
  const u2: User = { id: '2', preferences: { yoga: ['Zentro Urban Yoga'] } };
  const { score, breakdown } = computeCompatibility(u1, u2);
  assert.equal(score, 3 * X);
  assert.equal(breakdown.length, 1);
  assert.equal(breakdown[0].kind, 'specific');
  assert.equal(breakdown[0].points, 3 * X);
  assert.deepEqual(breakdown[0].sharedItems, ['Zentro Urban Yoga']);
});

// 3) No overlap: no shared categories -> 0 and an empty breakdown.
test('no overlap scores 0', () => {
  const { score, breakdown } = computeCompatibility(amir, cy);
  assert.equal(score, 0);
  assert.deepEqual(breakdown, []);
});

// 4) Mixed: Amir & Bea share restaurant (general) + yoga (specific). Club is
//    one-sided, so it scores nothing.
test('mixed: general + specific sum correctly, one-sided category ignored', () => {
  const { score, breakdown } = computeCompatibility(amir, bea);
  assert.equal(score, X + 3 * X); // restaurant X + yoga 3X = 4X
  const byCat = Object.fromEntries(breakdown.map((m) => [m.category, m]));
  assert.equal(byCat.restaurant.kind, 'general');
  assert.equal(byCat.yoga.kind, 'specific');
  assert.equal(byCat.yoga.points, 3 * X);
  assert.equal(byCat.club, undefined); // Bea has no club preference
});

// 5) Empty category (general interest, no specific items) still matches as general.
test('shared category with empty item lists matches as general', () => {
  const u1: User = { id: '1', preferences: { climbing: [] } };
  const u2: User = { id: '2', preferences: { climbing: [] } };
  const { score, breakdown } = computeCompatibility(u1, u2);
  assert.equal(score, X);
  assert.equal(breakdown[0].kind, 'general');
});

// 6) Matching is case-insensitive / trimmed.
test('specific match is case-insensitive and trimmed', () => {
  const u1: User = { id: '1', preferences: { restaurant: ['  Bar Cañete  '] } };
  const u2: User = { id: '2', preferences: { restaurant: ['bar cañete'] } };
  const { score } = computeCompatibility(u1, u2);
  assert.equal(score, 3 * X);
});

console.log(`\n${passed} passed`);

// Pretty-print one full result so the breakdown shape is visible.
console.log('\nExample — Amir × Bea:');
console.log(JSON.stringify(computeCompatibility(amir, bea), null, 2));
