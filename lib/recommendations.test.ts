// Run with:  npm run test:recommend   (or: npx tsx lib/recommendations.test.ts)

import assert from 'node:assert/strict';
import {
  recommendPlacesInCategory,
  computeRankScore,
  COMPATIBILITY_THRESHOLD,
  MAX_RESULTS,
  EXAMPLE_WORLD,
} from './recommendations';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const { me, others } = EXAMPLE_WORLD;

console.log(
  `recommendations — threshold = ${COMPATIBILITY_THRESHOLD}, max = ${MAX_RESULTS}\n`
);

// In this world every "compatible" user shares the restaurant category (general,
// X=1) AND the Zentro yoga studio (specific, 3X=3) => compatibility 4. Gia also
// shares Bar Cañete specifically => 6. `low` only shares restaurant generally
// (1, below threshold) so its pick must never surface.

// 1) A category with MORE than 5 qualifying places: caps at 5, ordered correctly.
test('restaurant: 6 qualifying places cap to 5, ranked by strength', () => {
  const recs = recommendPlacesInCategory(me, others, 'restaurant');

  assert.equal(recs.length, MAX_RESULTS); // 6 distinct qualify -> capped to 5

  const names = recs.map((r) => r.name);
  assert.deepEqual(names, ['Tickets', 'Bar Cañete', 'Bar Mut', 'Disfrutar', 'Pinotxo']);

  // Tickets has two supporters (Ana + Fer) -> strongest
  assert.equal(recs[0].name, 'Tickets');
  assert.equal(recs[0].supporterCount, 2);
  assert.equal(recs[0].rankScore, computeRankScore([
    { id: 'u1', compatibility: 4 },
    { id: 'u6', compatibility: 4 },
  ])); // 1*8 + 0.5*2 = 9
  assert.equal(recs[0].rankScore, 9);

  // Bar Cañete: single but very-compatible supporter (Gia = 6) -> second
  assert.equal(recs[1].name, 'Bar Cañete');
  assert.equal(recs[1].supporterCount, 1);
  assert.equal(recs[1].rankScore, 6.5); // 1*6 + 0.5*1
  assert.deepEqual(recs[1].supporters.map((s) => s.name), ['Gia']);

  // rankScore is non-increasing across the list
  for (let i = 1; i < recs.length; i++) {
    assert.ok(recs[i - 1].rankScore >= recs[i].rankScore);
  }

  // the 6th distinct restaurant (Quimet) was dropped by the cap
  assert.ok(!names.includes('Quimet'));

  // low-compatibility user's pick never appears
  assert.ok(!names.includes('Should Not Appear'));
});

// 2) A category with NO qualifying places: empty result.
test('club: no compatible user has the category -> empty', () => {
  const recs = recommendPlacesInCategory(me, others, 'club');
  assert.deepEqual(recs, []);
});

// 3) De-duplication: shared place appears once with combined strength.
test('dedupe: a place liked by several appears once, combined', () => {
  const recs = recommendPlacesInCategory(me, others, 'restaurant');
  const tickets = recs.filter((r) => r.name === 'Tickets');
  assert.equal(tickets.length, 1);
  assert.equal(tickets[0].supporters.length, 2);
});

// 4) Threshold gating: raise the bar so only Gia (6) qualifies.
test('threshold gates sources (only the 6-score user at threshold 6)', () => {
  const recs = recommendPlacesInCategory(me, others, 'restaurant', { threshold: 6 });
  assert.deepEqual(recs.map((r) => r.name), ['Bar Cañete']);
});

// 5) Unknown category -> empty, not a crash.
test('unknown category -> empty', () => {
  assert.deepEqual(recommendPlacesInCategory(me, others, 'opera'), []);
});

console.log(`\n${passed} passed`);

console.log('\nExample — recommended restaurants for Me:');
console.log(JSON.stringify(recommendPlacesInCategory(me, others, 'restaurant'), null, 2));
