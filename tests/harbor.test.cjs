const assert = require('node:assert/strict');
const G = require('../dist/harbor-engine.js');

const play = (seed, choices) => choices.reduce(G.choose, G.start(seed));
const outcomeIds = new Set(), eventIds = new Set();
let endings = 0, transitions = 0;
function walk(s) {
  assert.deepEqual(G.restore(G.serialize(s)), s, 'save replays exactly');
  assert.equal(s.history.length, s.step);
  assert.ok(s.cash >= 0);
  assert.equal(s.cash, 12 + s.history.reduce((n, h) => n + h.cash, 0));
  assert.equal(s.minutes, s.history.reduce((n, h) => n + h.minutes, 0));
  if (s.step === 5) {
    endings++;
    const e = G.outcome(s);
    outcomeIds.add(e.id);
    assert.equal(G.scene(s), null);
    assert.throws(() => G.choose(s, 0));
    assert.equal(e.id === 'together', s.buddy && s.fries && s.minutes <= 90);
    assert.equal(G.goals(s)[2].done, s.minutes <= 90);
    assert.ok(s.history.at(-1).arrive);
    return;
  }
  assert.throws(() => G.outcome(s));
  const node = G.scene(s);
  if (node.event) eventIds.add(node.event);
  let legal = 0;
  node.options.forEach((option, index) => {
    const before = JSON.stringify(s);
    if (option.disabledReason) assert.throws(() => G.choose(s, index));
    else {
      legal++; transitions++;
      const next = G.choose(s, index);
      assert.equal(next.minutes - s.minutes, option.minutes);
      assert.equal(next.cash - s.cash, option.cash);
      assert.deepEqual(G.rewind(next), s, 'rewind restores money, goals and route knowledge');
      walk(next);
    }
    assert.equal(JSON.stringify(s), before, 'choices never mutate their input');
  });
  assert.ok(legal > 0, 'no soft locks');
}
for (const seed of [0, 1, 2]) walk(G.start(seed));
assert.deepEqual([...outcomeIds].sort(), ['almost', 'solo', 'together']);
assert.equal(eventIds.size, 3);

const success = play(0, [1, 2, 0, 2, 1]);
assert.equal(G.outcome(success).id, 'together');
assert.equal(success.minutes, 42);
assert.equal(success.cash, 0);
assert.equal(G.outcome(play(0, [2, 0, 0, 2, 1])).id, 'solo');
assert.equal(G.outcome(play(0, [0, 1, 0, 0, 0])).id, 'almost');
assert.equal(G.outcome(play(0, [2, 0, 2, 2, 1])).id, 'almost');
assert.equal(G.outcome({ ...success, minutes: 90 }).id, 'together');
assert.equal(G.outcome({ ...success, minutes: 91 }).id, 'almost');
assert.equal(G.clock(90), '19:00');

const withBuddy = play(0, [1]);
const alone = play(0, [2]);
assert.ok(G.scene(withBuddy).options[2].shortcut, 'a buddy unlocks asking directions together');
assert.ok(G.scene(alone).options[2].buddy, 'solo players can still invite a friend');
assert.ok(G.scene(play(0, [2, 1, 0])).options[2].disabledReason);
assert.equal(G.scene(play(0, [2, 0, 0])).options[2].disabledReason, '');
assert.notEqual(G.scene(play(0, [1, 2, 0])).options[0].minutes,
  G.scene(play(2, [1, 2, 0])).options[0].minutes, 'random road conditions change costs');
assert.deepEqual(G.restore({ ...G.serialize(success), cash: 9999 }), success, 'ignore injected stats');
for (const saved of [null, {}, { version: 2 }, { version: 1, seed: -1, choices: [] },
  { version: 1, seed: 0, choices: [9] }, { version: 1, seed: 0, choices: ['0'] },
  { version: 1, seed: 0, choices: [2, 0, 1] }, // not enough money
  { version: 1, seed: 0, choices: [2, 1, 0, 2] }, // unknown shortcut
  { version: 1, seed: 0, choices: Array(6).fill(0) }]) {
  assert.throws(() => G.restore(saved));
}
assert.throws(() => G.rewind(G.start(0)));
for (const index of [-1, 1.5, '1', null]) assert.throws(() => G.choose(G.start(0), index));
console.log(`Harbor: ${endings} complete paths, ${transitions} transitions; 3 outcomes and 3 incidents verified.`);
