const assert = require('node:assert/strict');
const G = require('../dist/engine.js');
let paths = 0, outcomes = 0;
const found = new Set();
function walk(state) {
  assert(state.cash >= 0);
  assert(state.energy >= 0 && state.energy <= 100);
  assert(state.mood >= 0 && state.mood <= 100);
  assert.equal(state.history.length, state.step);
  if (state.step === 4) {
    paths++;
    const available = G.meals.filter(m => m.price <= state.cash);
    assert(available.length > 0, 'Every path must have an affordable meal');
    for (const meal of G.meals) {
      if (meal.price > state.cash) { assert.throws(() => G.dine(state, meal.id)); continue; }
      const after = G.dine(state, meal.id);
      assert.equal(after.cash, state.cash - meal.price);
      assert.equal(after.energy, Math.min(100, state.energy + meal.energy));
      assert.equal(after.mood, Math.min(100, state.mood + meal.mood));
      assert.equal(G.roles.find(r => r.id === after.roleId).cash - after.cash, meal.price - after.history.reduce((n, h) => n + h.cash, 0));
      found.add(G.ending(after).key); outcomes++;
      assert.throws(() => G.dine(after, meal.id), 'Must not charge twice');
      assert.throws(() => G.choose(after, 0));
    }
    assert.throws(() => G.choose(state, 0));
    return;
  }
  const before = JSON.stringify(state);
  for (let i = 0; i < 3; i++) {
    const next = G.choose(state, i);
    assert.equal(JSON.stringify(state), before, 'Choice must not mutate previous state');
    walk(next);
  }
}
for (const role of G.roles) {
  const state = G.start(role.id);
  assert.throws(() => G.dine(state, 'simple'));
  assert.throws(() => G.ending(state));
  assert.throws(() => G.choose(state, 99));
  walk(state);
  for (let i = 0; i < 3; i++) {
    let s = G.start(role.id);
    for (let j = 0; j < 4; j++) s = G.choose(s, i);
    assert.equal(G.ending(G.dine(s, 'simple')).key, ['steady', 'social', 'free'][i]);
  }
}
assert.throws(() => G.start('unknown'));
assert.equal(paths, 243);
assert.equal(found.size, 3);
console.log(`PASS: ${paths} story paths, ${outcomes} affordable meal endings, all 3 endings reachable. Budget, bounds, immutability, invalid actions and double charges checked.`);
