const assert = require('node:assert/strict');
const G = require('../dist/engine.js');
const found = new Set(), visited = new Set(), paths = new Set();
let mealOutcomes = 0;

function walk(state, ancestors = []) {
  assert(state.cash >= 0);
  assert(state.energy >= 0 && state.energy <= 100);
  assert(state.mood >= 0 && state.mood <= 100);
  assert.equal(state.history.length, state.step);
  assert(state.step <= G.totalStages, 'Story must not cycle');
  if (state.endingId) {
    assert.equal(state.step, 3);
    assert.equal(G.scene(state), null);
    assert.throws(() => G.choose(state, 0));
    assert.throws(() => G.ending(state));
    const key = `${state.roleId}:${state.history.map(h => h.optionIndex).join(',')}`;
    assert(!paths.has(key)); paths.add(key);
    assert(!found.has(state.endingId), 'Each story path must have a distinct authored future');
    found.add(state.endingId);
    assert.equal(state.inventory.length, 1, 'Second choice must leave a persistent story prop');
    const available = G.meals.filter(m => m.price <= state.cash);
    assert(available.length > 0, 'Every route must allow lunch');
    const snapshot = JSON.stringify(state);
    for (const meal of G.meals) {
      if (meal.price > state.cash) { assert.throws(() => G.dine(state, meal.id)); continue; }
      const after = G.dine(state, meal.id);
      const e = G.ending(after);
      assert.equal(e.key, state.endingId, 'Meal selection must not overwrite the branch ending');
      assert.equal(e.routeId, state.routeId);
      assert(e.description.includes('三年后'));
      assert.equal(after.cash, state.cash - meal.price);
      assert.equal(after.energy, Math.min(100, state.energy + meal.energy));
      assert.equal(after.mood, Math.min(100, state.mood + meal.mood));
      assert.equal(G.roles.find(r => r.id === state.roleId).cash - after.cash, meal.price - state.history.reduce((n, h) => n + h.cash, 0));
      assert.deepEqual(G.rewind(after), ancestors.at(-1), 'Rewind after dining must also restore spent money and stats');
      assert.throws(() => G.dine(after, meal.id), 'No repeated charges');
      assert.throws(() => G.choose(after, 0));
      mealOutcomes++;
    }
    assert.equal(JSON.stringify(state), snapshot, 'Dining must not mutate input');
    assert.throws(() => G.dine({ ...state, cash: 0 }, 'simple'));
    assert.throws(() => G.dine(state, 'unknown'));
    return;
  }
  const current = G.scene(state);
  assert(current, `Missing scene for ${state.nodeId}`);
  visited.add(current.id);
  assert.equal(current.stage, state.step + 1);
  const targets = current.options.map(o => o.next || o.finish);
  assert.equal(new Set(targets).size, current.options.length, 'Sibling choices must lead to different events or endings');
  const snapshot = JSON.stringify(state);
  current.options.forEach((option, index) => {
    assert(option.next ? G.nodes[option.next] : G.endings[option.finish], 'Every exit must exist');
    const next = G.choose(state, index);
    assert.equal(JSON.stringify(state), snapshot, 'Choices must not mutate input');
    assert.deepEqual(G.rewind(next), state, 'Backtracking must restore the exact previous state');
    if (state.step === 0) assert.notEqual(G.scene(next).title, current.title);
    if (state.step === 1) { assert.notEqual(next.identity, state.identity); assert(next.inventory.includes(option.item)); }
    walk(next, [...ancestors, state]);
  });
}
for (const role of G.roles) {
  const start = G.start(role.id);
  assert.throws(() => G.dine(start, 'simple'));
  assert.throws(() => G.rewind(start));
  for (const invalid of [-1, 100, 0.5, '0', NaN]) assert.throws(() => G.choose(start, invalid));
  walk(start);
}
assert.throws(() => G.start('unknown'));
assert.equal(paths.size, 36);
assert.equal(found.size, Object.keys(G.endings).length);
assert.equal(found.size, 36);
assert.equal(visited.size, Object.keys(G.nodes).length);
assert.equal(visited.size, 30);
assert.equal(mealOutcomes, 108);
assert.equal(new Set(Object.values(G.endings).map(e => e.description)).size, 36);
assert.equal(new Set(Object.values(G.endings).map(e => e.title)).size, 36);
// Concrete regression: same character, different first decision -> different life.
let academic = G.start('student'), detective = G.start('student');
academic = G.choose(academic, 0); detective = G.choose(detective, 1);
assert.equal(academic.routeId, 'paper'); assert.equal(detective.routeId, 'detective');
assert.notEqual(G.scene(academic).title, G.scene(detective).title);
academic = G.choose(academic, 0);
const fork = academic;
const honest = G.dine(G.choose(fork, 0), 'simple');
const antenna = G.dine(G.choose(fork, 1), 'simple');
assert.equal(G.ending(honest).title, '食堂编外院士');
assert.equal(G.ending(antenna).title, '土豆通信首席科学家');
assert.deepEqual(G.rewind(antenna), fork);
assert.deepEqual(G.rewind(G.rewind(antenna)), G.choose(G.start('student'), 0));
console.log(`PASS: ${visited.size} scenes, ${paths.size} distinct paths/endings, ${mealOutcomes} meals. All exits valid; sibling choices diverge; resources, inventory, repeat-charge protection and exact rewind verified.`);
