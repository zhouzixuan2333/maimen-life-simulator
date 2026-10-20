const assert = require('node:assert/strict');
const G = require('../dist/engine.js');
const reached = new Set(), randomSeen = new Set();
let runs = 0, transitions = 0, lockedChecks = 0, meals = 0;
function step(s, i) {
  const before = JSON.stringify(s), current = G.scene(s);
  assert(current);
  assert(current.options.some(o => !o.disabledReason), 'No softlocks');
  if (current.random) randomSeen.add(current.id.split('-').slice(2).join('-'));
  current.options.forEach((o, j) => { if (o.disabledReason) { assert.throws(() => G.choose(s, j)); lockedChecks++; } });
  const next = G.choose(s, i);
  assert.equal(JSON.stringify(s), before, 'Immutable transitions');
  assert(next.cash >= 12, 'Events preserve minimum meal budget');
  assert(next.energy >= 0 && next.energy <= 100 && next.mood >= 0 && next.mood <= 100);
  assert.equal(next.history.length, next.step);
  assert.deepEqual(next.eventIds, s.eventIds, 'Choices never redraw encounters');
  assert.equal(new Set(next.eventIds).size, 3);
  const h = next.history.at(-1);
  for (const item of h.consumed) { assert(s.inventory.includes(item)); assert(!next.inventory.includes(item) || h.gained.includes(item)); }
  for (const item of h.gained) assert(next.inventory.includes(item));
  assert.deepEqual(G.rewind(next), s, 'Rewind restores exact seed, cash, inventory, flags and identity');
  assert.deepEqual(G.restore(JSON.parse(JSON.stringify(G.serialize(next)))), next, 'Save restore is exact');
  transitions++;
  return next;
}
function finish(s) {
  assert.equal(s.step, 9); assert.equal(G.scene(s), null);
  assert.equal(s.history.filter(h => h.random).length, 3);
  assert.throws(() => G.choose(s, 0));
  assert.throws(() => G.ending(s));
  for (const meal of G.meals) {
    if (meal.price > s.cash) { assert.throws(() => G.dine(s, meal.id)); continue; }
    const before = JSON.stringify(s), after = G.dine(s, meal.id), ending = G.ending(after);
    reached.add(ending.key);
    assert.equal(after.cash, s.cash - meal.price);
    assert.equal(JSON.stringify(s), before);
    assert.equal(ending.key, s.endingId);
    assert.deepEqual(G.rewind(after), G.rewind(s));
    assert.deepEqual(G.restore(G.serialize(after)), after);
    assert.throws(() => G.dine(after, meal.id));
    const initial = G.roles.find(r => r.id === s.roleId).cash;
    assert.equal(after.cash, initial + s.history.reduce((sum, h) => sum + h.cash, 0) - meal.price);
    meals++;
  }
  assert.throws(() => G.dine({ ...s, cash: 0 }, 'simple'));
  runs++;
}
// Safe routes plus varied legal decisions across 24 deterministic worlds.
for (let seed = 0; seed < 24; seed++) {
  for (const role of G.roles) for (let route = 0; route < 3; route++) for (let branch = 0; branch < 2; branch++) {
    for (let policy = 0; policy < 3; policy++) {
      let s = step(step(G.start(role.id, seed), route), branch);
      while (s.step < 8) {
        const current = G.scene(s);
        const legal = current.options.map((o, i) => o.disabledReason ? -1 : i).filter(i => i >= 0);
        let i;
        if (policy === 0) {
          // Preserve original credentials, certify, rest, resolve: all hidden endings remain reachable.
          i = current.random ? current.options.length - 1 : s.step === 3 ? 0 : s.step === 5 ? 3 : 0;
        } else i = legal[(seed + s.step * 7 + branch + policy * 5) % legal.length];
        assert(!current.options[i].disabledReason);
        s = step(s, i);
      }
      for (let i = 0; i < G.scene(s).options.length; i++) {
        if (!G.scene(s).options[i].disabledReason) finish(step(s, i));
      }
    }
  }
}
assert.equal(reached.size, 45);
assert.equal(randomSeen.size, 6);
assert(new Set(Array.from({ length: 24 }, (_, seed) => G.start('student', seed).eventIds.join(','))).size > 12);
assert.deepEqual(G.start('student', 42), G.start('student', 42));
assert.equal(Object.values(G.endings).filter(e => e.secret).length, 9);
// Concrete causal scenario: pawn original -> trial blocked -> profession earns favor -> redeem -> resolve -> secret.
let specialSeed;
for (let seed = 0; seed < 10000; seed++) {
  const ids = G.start('worker', seed).eventIds;
  if (ids[0] === 'pawnshop' && ids[1] === 'printer' && ids[2] === 'checkpoint') { specialSeed = seed; break; }
}
assert.notEqual(specialSeed, undefined);
let s = step(step(G.start('worker', specialSeed), 0), 0);
const credential = s.credential;
s = step(s, 0); // pawn
assert(!s.inventory.includes(credential)); assert(s.inventory.includes('万能通行证'));
assert(G.scene(s).options[0].disabledReason.includes(credential));
s = step(s, 2); // improvise trial
assert(!s.flags.includes('validated'));
assert.equal(G.scene(s).options[1].disabledReason, '', 'Manager can approve printer leave');
s = step(s, 1); // gain favor by identity
s = step(s, 0); // redeem original
assert(s.inventory.includes(credential)); assert.equal(s.cash, 34);
s = step(s, 1); // consume favor at crisis
assert(!s.inventory.includes('人情券')); assert(s.flags.includes('resolved'));
s = step(s, 0); // show credential at checkpoint
assert.equal(G.scene(s).options[2].disabledReason, '');
s = step(s, 2);
assert.equal(G.ending(G.dine(s, 'simple')).title, '散会权终身持有人');
assert(G.ending(G.dine(s, 'simple')).consequences.some(x => x.includes('赎回')));
// Same random world, different acquired identity: researcher cannot authorize printer leave.
let student = G.start('student', specialSeed);
for (const choice of [0, 0, 3, 0]) student = G.choose(student, choice);
assert(G.scene(student).options[1].disabledReason.includes('管理者'));
assert.throws(() => G.choose(student, 1));
// Carry original but defer crisis: secret must stay locked; ordinary endings still work.
let deferred = G.start('student', 5);
while (deferred.step < 8) {
  const sc = G.scene(deferred);
  const i = deferred.step < 2 ? 0 : deferred.step === 6 ? 2 : sc.random ? sc.options.length - 1 : deferred.step === 5 ? 3 : 0;
  deferred = G.choose(deferred, i);
}
assert(G.scene(deferred).options[2].disabledReason.includes('身份危机'));
assert.throws(() => G.choose(deferred, 2));
const ordinary = G.dine(G.choose(deferred, 0), 'simple');
assert(G.ending(ordinary).consequences.some(x => x.includes('汇报会')));
// Duplicate consumable purchases cannot charge without adding stock.
const stocked = { ...student, step: 5, inventory: [...student.inventory, '宇宙胶带'] };
assert(G.scene(stocked).options[1].disabledReason.includes('已持有'));
assert.throws(() => G.choose(stocked, 1));
const latePawn = { ...student, step: 7, eventIds: ['printer', 'courier', 'pawnshop'] };
assert(G.scene(latePawn).options[0].desc.includes('无法赎回'));
// Budget floor, malformed saves and wrong input are rejected.
const low = { ...student, cash: 12 };
const supply = { ...low, step: 5 };
assert(G.scene(supply).options[1].disabledReason.includes('现金不足'));
assert.throws(() => G.choose(supply, 1));
for (const value of [null, {}, { version: 2 }, { version: 3, seed: 1, roleId: 'student', choices: [99] }, { version: 3, seed: 1, roleId: 'student', choices: [], mealId: 'simple' }]) assert.throws(() => G.restore(value));
for (const bad of [-1, 4294967296, NaN, 0.5, '1']) assert.throws(() => G.start('student', bad));
for (const bad of [-1, 99, NaN, '0']) assert.throws(() => G.choose(G.start('student', 0), bad));
assert.throws(() => G.rewind(G.start('worker', 0)));
// A V3 save has no narrative fields. Replaying it must hydrate the new full-scene log
// without changing the on-disk contract or making previously valid choices unusable.
const legacySave = { version: 3, seed: 274, roleId: 'wanderer', choices: [0, 0], mealId: null };
const legacyRestored = G.restore(legacySave);
assert.deepEqual(G.serialize(legacyRestored), legacySave);
for (const entry of legacyRestored.history) {
  for (const field of ['text', 'message', 'desc', 'reply']) assert(typeof entry[field] === 'string' && entry[field].length > 0, `Missing replay field: ${field}`);
}
assert.deepEqual(G.restore(G.serialize(G.rewind(legacyRestored))), G.rewind(legacyRestored));
console.log(`PASS: ${runs} nine-choice runs, ${transitions} transitions, ${lockedChecks} rejected locked choices, ${meals} meal outcomes; all 45 endings and 6 encounters reached. Exact save/rewind, seeded randomness, identity gates, item consumption/redemption, delayed consequences and V3 full-scene log migration verified. UI demo seed: ${specialSeed}.`);
