const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('../dist/cat-engine.js');
const chapters = require('../dist/cat-chapters.js');
const play = (ids, seed = 0, names) => ids.reduce((s, id) => G.choose(s, id), G.start(seed, 2, names));
let rng = 92477, transitions = 0;
const random = () => (rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0);
const endings = new Map(), branchCoverage = new Set(), branchChoices = new Set();
for (let run = 0; run < 2400; run++) {
  let s = G.start(run % 6, 2, { cat: '团子', clerk: '小满', regular: '阿远' });
  while (s.step < 14) {
    const sc = G.scene(s), valid = sc.options.filter(o => !o.locked && !o.hidden);
    assert.ok(valid.length);
    for (const o of sc.options.filter(o => o.locked)) assert.throws(() => G.choose(s, o.id));
    // Scale the full PRNG output; modulo 2 would only use the LCG's alternating low bit.
    const o = valid[Math.floor(random() / 4294967296 * valid.length)], before = structuredClone(s);
    const next = G.choose(s, o.id);
    assert.deepEqual(s, before);
    assert.deepEqual(G.rewind(next), s);
    if (run % 50 === 0) assert.deepEqual(G.restore(G.serialize(next)), next);
    assert.deepEqual(next.names, s.names);
    assert.equal(new Set(next.items).size, next.items.length);
    assert.ok(Object.values(next.bonds).every(n => n >= 0 && n <= 3));
    if (next.wet) assert.equal(G.view(next, true).mood, 'wet');
    if ([11, 12, 13].includes(s.step)) { branchCoverage.add(sc.id); branchChoices.add(sc.id + '/' + o.id); }
    s = next; transitions++;
  }
  const e = G.result(s);
  assert.equal(e.memories.length, 2);
  assert.equal(G.view(s).wet, false);
  assert.ok(G.homeName(s.home));
  endings.set(e.id, s);
}
assert.deepEqual([...endings.keys()].sort(), Object.keys(chapters.paths).sort(), 'all eight lives reachable from legal play');
assert.equal(branchCoverage.size, 24, 'eight distinct arcs each have three follow-up scenes');
assert.equal(branchChoices.size, 48, 'both visible choices in all new follow-up scenes are exercised');
const common = ['bag', 'follow', 'mat', 'wait', 'bowl', 'nest', 'clerk', 'towel'];
const sweet = play([...common, 'people', 'sweet', 'bowl', 'continue', 'continue', 'continue']);
assert.equal(G.result(sweet).id, 'sweet');
assert.ok(sweet.flags.includes('sharedDinner'));
assert.ok(G.text(sweet, G.result(sweet).text).includes('老周'));
const earlierPreview = play([...common, 'people', 'sweet', 'bowl', 'slow', 'slow', 'slow']);
assert.deepEqual(G.restore(G.serialize(earlierPreview)), earlierPreview, 'earlier local V2 slow choices still replay');
assert.equal(G.scene(G.rewind(sweet)).options.filter(o => !o.hidden).length, 2);
const garden = play([...common, 'streets', 'garden', 'bowl', 'continue', 'continue', 'continue']);
assert.equal(G.result(garden).id, 'garden');
assert.equal(G.view(garden).spot, 'garden');
assert.equal(garden.home, 'garden');
const switched = G.choose(G.rewind(sweet), 'change');
assert.equal(G.result(switched).id, 'garden');
assert.equal(G.view(switched).together, false);
assert.ok(G.result(switched).memories.at(-1).label.includes('花架'));
assert.deepEqual(G.rewind(switched), G.rewind(sweet));
// First-time introductions and dry weather must not invent prior encounters/rain.
const stranger = play(['belly', 'follow', 'cap', 'share'], 1);
assert.equal(stranger.bonds.clerk, 0);
assert.ok(G.scene(stranger).text.includes('还没和你打过招呼'));
const noRain = play(['belly', 'follow', 'cap', 'share', 'route', 'friend', 'friend'], 1);
assert.equal(noRain.wet, false);
assert.ok(G.scene(noRain).options.every(o => !/擦干|醒来.*干了/.test(o.reply)));
const wet = play([...common.slice(0, 6), 'play', 'sun', 'people', 'sweet', 'dash'], 2);
assert.equal(wet.wet, true);
for (const o of G.scene(wet).options.filter(o => !o.locked)) assert.equal(G.choose(wet, o.id).wet, false);
// Display-time naming avoids recursive replacements and preserves replay semantics.
let named = G.rename(sweet, 'cat', '小麦');
named = G.rename(named, 'clerk', '团子');
named = G.rename(named, 'regular', '小橘');
assert.equal(G.text(named, '小橘、小麦、阿周、老周'), '小麦、团子、小橘、小橘');
assert.deepEqual(G.restore(G.serialize(named)), named);
assert.deepEqual(G.rewind(named).names, named.names);
assert.deepEqual(G.rename(named, 'cat', '').names.cat, '小橘');
assert.throws(() => G.rename(named, 'cat', '一二三四五六七八九'));
assert.throws(() => G.rename(named, '__proto__', 'bad'));
assert.throws(() => G.restore({ version: 2, seed: 0, names: { cat: 123 }, choices: [] }));
assert.equal(G.names({ cat: '  团子\n  ' }).cat, '团子');
assert.equal(G.names({ cat: '\u202e团子' }).cat, '团子');
// The SVG image used by both live scenes and exported cards escapes player text.
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/cat-scene.js'), 'utf8'), context);
const V = context.window.CatScene;
const oddName = G.rename(sweet, 'cat', '<喵&"');
const svg = V.foreground(G.view(oddName, true));
assert.ok(svg.includes('&lt;喵&amp;&quot;'));
assert.ok(!svg.includes('<喵'));
for (const s of endings.values()) {
  const v = G.view(s, true);
  assert.ok(V.placeNames[v.spot]);
  assert.ok(!V.html(v).includes('undefined'));
}
// A pre-expansion save lacking names still restores its original rules/outcome.
const legacy = G.restore({ version: 1, seed: 0, choices: ['bag', 'follow', 'mat', 'wait', 'bowl', 'nest', 'clerk', 'towel', 'share', 'greet', 'bowl', 'seat', 'ticket', 'dock'] });
assert.equal(G.result(legacy).id, 'boss');
assert.equal(legacy.names.regular, '老周');
console.log(`Cat v2: 2400 lives, ${transitions} transitions, eight endings, 24 branch scenes; names, legacy saves, exact rewind, causal text and SVG escaping passed.`);
