const assert = require('node:assert/strict');
const engine = require('../dist/cat-engine.js');
// Keep the shipped v1 story and all existing saves replayable.
const G = { ...engine, start: seed => engine.start(seed, 1) };
let count = 0, transitions = 0, locked = 0;
const endings = new Set(), coverage = new Set(), events = new Set();
const play = (ids, seed = 0) => ids.reduce((s, id) => G.choose(s, id), G.start(seed));
let rng = 424242;
const random = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng; };
for (let run = 0; run < 1200; run++) {
  let s = G.start(run % 6);
  for (let step = 0; step < 14; step++) {
    const scene = G.scene(s), before = structuredClone(s);
    assert.equal(scene.day, Math.floor(step / 2) + 1);
    assert.equal(scene.options.length, 3);
    const valid = scene.options.filter(o => !o.locked);
    assert.ok(valid.length, 'at least one legal option at every step');
    for (const o of scene.options.filter(o => o.locked)) {
      assert.ok(o.reason, 'locked options explain their missing prerequisite');
      assert.throws(() => G.choose(s, o.id)); locked++;
    }
    const option = valid[random() % valid.length];
    coverage.add(`${step}/${scene.id}/${option.id}`);
    if ([6, 10].includes(step)) events.add(scene.id);
    const next = G.choose(s, option.id); transitions++;
    assert.deepEqual(s, before, 'choosing does not mutate prior state');
    assert.equal(next.step, step + 1);
    assert.equal(next.history.length, step + 1);
    assert.equal(new Set(next.items).size, next.items.length);
    assert.ok(next.items.every(key => G.story.items[key]));
    assert.ok(Object.values(next.bonds).every(n => Number.isInteger(n) && n >= 0 && n <= 3));
    assert.ok(next.history.at(-1).rewards.length, 'every action reports its result');
    assert.ok(G.moods.includes(next.mood));
    assert.equal(G.view(next, true).wet, next.wet);
    assert.equal(G.view(next, true).fed, next.fed);
    if (next.wet) assert.equal(G.view(next, true).mood, 'wet');
    assert.deepEqual(G.rewind(next), s, 'rewind restores items, relationships, wetness and routes');
    if (run % 10 === 0) assert.deepEqual(G.restore(G.serialize(next)), next, 'restore replays exact same life');
    s = next;
  }
  assert.equal(G.scene(s), null);
  assert.throws(() => G.choose(s, 'sleep'));
  endings.add(G.result(s).id); count++;
}
assert.deepEqual([...events].sort(), ['absence', 'photo', 'rain']);
assert.deepEqual([...endings].sort(), ['boss', 'crew', 'free', 'regular']);
// 12 nonrandom scenes × 3 options; 2 random positions × 3 events × 3 options.
assert.equal(coverage.size, 54, 'all action branches are reachable, not just all endings');
const boss = play(['bag', 'follow', 'mat', 'wait', 'bowl', 'nest', 'clerk', 'towel', 'share', 'greet', 'bowl', 'seat', 'ticket', 'dock']);
assert.equal(G.result(boss).id, 'boss');
assert.equal(boss.spot, 'dock');
assert.deepEqual(G.restore({ ...G.serialize(boss), bonds: { clerk: 99 }, items: [] }), boss, 'saved stats cannot override replay');
const rain = play(['belly', 'explore', 'roof', 'home', 'route', 'nest', 'dash']);
assert.equal(rain.wet, true);
assert.equal(G.view(rain, true).mood, 'wet');
const dry = G.choose(rain, 'sun');
assert.equal(dry.wet, false);
assert.equal(dry.mood, 'asleep');
assert.deepEqual(G.rewind(dry), rain);
const lateRain = play(['bag', 'follow', 'mat', 'wait', 'bowl', 'nest', 'play', 'towel', 'share', 'greet', 'dash'], 2);
assert.equal(lateRain.wet, true);
assert.equal(lateRain.history.at(-1).rewards.some(r => r.type === 'food'), false, 'automatic breakfast is not falsely attributed to running through rain');
assert.equal(G.choose(lateRain, 'seat').wet, false, 'late rain also has a drying action immediately afterward');
const withBowl = play(['bag', 'box', 'mat', 'wait', 'bowl', 'nest']);
assert.equal(G.view(withBowl).fed, true, 'bowl gives real next-day breakfast');
const withoutBowl = play(['belly', 'explore', 'roof', 'home']);
assert.equal(G.view(withoutBowl).fed, false, 'food does not silently last forever');
assert.ok(G.scene(withoutBowl).options.find(o => o.id === 'bowl').locked);
assert.equal(G.story.eventIds(0).length, new Set(G.story.eventIds(0)).size, 'two events never duplicate');
for (const seed of [-1, 2 ** 32, '0', null, NaN]) assert.throws(() => G.start(seed));
for (const save of [null, {}, { version: 2 }, { version: 1, seed: 0, choices: ['missing'] },
  { version: 1, seed: 0, choices: Array(15).fill('rub') }, { version: 1, seed: 0, choices: [null] },
  { version: 1, seed: 0, choices: ['belly', 'box', 'mat'] }]) assert.throws(() => G.restore(save));
assert.throws(() => G.rewind(G.start(0)));
assert.throws(() => G.result(G.start(0)));
console.log(`Cat life: ${count} complete lives, ${transitions} transitions, ${locked} locked rejections; all 54 action branches, 4 endings, 3 incidents, save/rewind and visual-state invariants passed.`);
