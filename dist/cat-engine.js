(function (root) {
  'use strict';
  const story = typeof module !== 'undefined' && module.exports ? require('./cat-story.js') : root.CatStory;
  const moods = ['neutral', 'hungry', 'happy', 'proud', 'asleep', 'wet', 'annoyed', 'playful'];
  const defaultNames = { cat: '小橘', clerk: '小麦', regular: '老周', cats: '狸花' };
  function names(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('名字格式无效');
    const result = {};
    for (const [key, fallback] of Object.entries(defaultNames)) {
      if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error('名字需要是文字');
      const name = (value[key] ?? fallback).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '').trim().replace(/\s+/g, ' ') || fallback;
      if ([...name].length > 8) throw new Error('名字最多 8 个字');
      result[key] = name;
    }
    return result;
  }
  function text(s, value) {
    const n = s?.names || defaultNames;
    const keys = { 小橘: 'cat', 小麦: 'clerk', 阿周: 'regular', 老周: 'regular', 狸花: 'cats' };
    return String(value).replace(/小橘|小麦|阿周|老周|狸花/g, match => n[keys[match]]);
  }
  function rename(s, key, value) {
    if (!Object.hasOwn(defaultNames, key)) throw new Error('不能修改这个名字');
    return { ...s, names: names({ ...s.names, [key]: value }) };
  }
  function start(seed, version = 2, nameValues) {
    if (seed === undefined) seed = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('出发编号无效');
    if (![1, 2].includes(version)) throw new Error('故事版本无效');
    return { version, names: names(nameValues), seed, step: 0, fed: false, wet: false, mood: 'hungry', spot: 'door', home: 'street', items: [], bonds: { clerk: 0, regular: 0, cats: 0 }, routes: { social: 0, explorer: 0, crew: 0 }, flags: [], lastDay: 0, history: [] };
  }
  function eligible(s, rule) {
    if (!rule) return true;
    if (rule.all) return rule.all.every(r => eligible(s, r));
    if (rule.any) return rule.any.some(r => eligible(s, r));
    if (rule.item) return s.items.includes(rule.item);
    if (rule.flag) return s.flags.includes(rule.flag);
    if (rule.bond) return s.bonds[rule.bond] >= rule.min;
    return false;
  }
  function scene(s) {
    const node = story.node(s);
    return node && { ...node, day: Math.floor(s.step / 2) + 1, part: s.step % 2 === 0 ? '白天' : '傍晚', options: node.options.map(o => ({ ...o, locked: !eligible(s, o.gate), reason: eligible(s, o.gate) ? '' : o.gate.note })) };
  }
  function choose(s, id) {
    const node = scene(s), o = node && node.options.find(o => o.id === id);
    if (!o) throw new Error('没有这个行动');
    if (o.locked) throw new Error(o.reason || '还不能这么做');
    const effect = o.effect, day = node.day;
    const next = { ...s, step: s.step + 1, spot: node.spot, lastDay: day, fed: day === s.lastDay ? s.fed : s.items.includes('bowl'), items: [...s.items], flags: [...s.flags], bonds: { ...s.bonds }, routes: { ...s.routes }, history: [...s.history] };
    const rewards = [];
    for (const key of ['fed', 'wet', 'mood', 'spot', 'home']) if (effect[key] !== undefined) next[key] = effect[key];
    for (const key of effect.items || []) if (!next.items.includes(key)) { next.items.push(key); rewards.push({ type: 'item', text: `得到${story.items[key].name}` }); }
    for (const key of effect.flags || []) if (!next.flags.includes(key)) { next.flags.push(key); if (key === 'dryspot') rewards.push({ type: 'route', text: '记住了避雨处' }); }
    for (const [key, delta] of Object.entries(effect.bonds || {})) {
      next.bonds[key] = Math.min(3, next.bonds[key] + delta);
      if (next.bonds[key] > s.bonds[key]) rewards.push({ type: 'bond', text: `${story.people[key].name} · ${relation(next.bonds[key])}` });
    }
    for (const [key, delta] of Object.entries(effect.routes || {})) next.routes[key] += delta;
    if (effect.milestone) rewards.unshift({ type: 'life', text: effect.milestone });
    if (effect.fed && !(day === s.lastDay ? s.fed : s.items.includes('bowl'))) rewards.push({ type: 'food', text: '今天有饭了' });
    if (s.wet && !next.wet) rewards.push({ type: 'dry', text: '毛和垫子都干了' });
    if (!s.wet && next.wet) rewards.push({ type: 'wet', text: '毛淋湿了，下一步能弄干' });
    if (next.home !== s.home) rewards.push({ type: 'home', text: `住处：${homeName(next.home)}` });
    if (!rewards.length) rewards.push({ type: 'life', text: effect.mood === 'asleep' ? '安心睡了一觉' : effect.mood === 'playful' ? '和朋友玩了一会儿' : '又把日子混熟了一点' });
    // Wet fur takes precedence over happy/proud poses until a drying action happens.
    if (next.wet) next.mood = 'wet';
    next.history.push({ id, day, part: node.part, event: node.id, title: node.title, label: o.label, reply: o.reply, rewards, mood: next.mood });
    return next;
  }
  function relation(level) { return ['还不认识', '认识你了', '愿意等你', '会替你撑腰'][level]; }
  function homeName(home) { return ({ street: '临时墙角', box: '纸箱办公室', shelter: '避雨的屋檐', chair: '门外专属座位', garden: '花架下的小窝' })[home]; }
  function view(s, feedback = false) {
    const sc = scene(s), newDay = sc && sc.day > s.lastDay;
    const fed = newDay ? s.items.includes('bowl') : s.fed;
    const mood = s.wet ? 'wet' : !feedback && newDay && !fed ? 'hungry' : s.mood;
    const life = s.flags.find(f => f.startsWith('ending:'))?.slice(7) || s.flags.find(f => f.startsWith('arc:'))?.slice(4);
    return { mood, fed: feedback ? s.fed : fed, wet: s.wet, spot: feedback || !sc ? s.spot : sc.spot, weather: !feedback && sc && sc.weather || '', home: s.home, items: s.items, names: s.names, life, friends: s.bonds.cats >= 2, together: life === 'sweet' && s.flags.includes('sharedDinner'), day: feedback || !sc ? s.lastDay : sc.day };
  }
  function result(s) {
    if (s.step !== 14) throw new Error('七天还没过完');
    if (s.version === 2) {
      const e = story.ending(s);
      return { ...e, memories: s.history.filter(h => e.steps.includes(h.day * 2 - (h.part === '白天' ? 2 : 1))).slice(-2).map(h => ({ label: h.label, reply: h.reply })) };
    }
    const hidden = s.items.includes('bowl') && s.items.includes('sign') && s.bonds.clerk >= 2 && s.bonds.regular >= 2 && s.bonds.cats >= 2 && s.flags.includes('weathered');
    if (hidden) return { id: 'boss', title: '店长的猫？你是店长的店长。', lead: '你没上过一天班，但大家已经学会先问你的意见。', text: '小麦负责添饭，阿周负责陪玩，狸花负责带路。你负责偶尔睁眼。七天前的临时路过，如今已经成了这里最稳定的岗位。', next: '这次人和猫都被你混熟了。再来一局，试试完全靠自己找门路。' };
    // Ties follow the player's final leisure preference, then the stable route order.
    const preference = s.flags.includes('catday') ? 'crew' : s.flags.includes('dock') ? 'social' : 'explorer';
    const order = [preference, ...['social', 'explorer', 'crew'].filter(k => k !== preference)];
    const route = order.reduce((best, k) => s.routes[k] > s.routes[best] ? k : best, order[0]);
    return ({
      social: { id: 'regular', title: s.items.includes('bowl') ? '你没找工作，找到了长期饭票。' : '你还没开口，已经有人认出你。', lead: '从“哪来的小橘”，混成了“今天怎么还没来”。', text: '有人认得你的脚步，有人愿意等你一会儿。你没有变得更勤快，只是终于不用每一天都从头介绍自己。', next: '下次试试自己探索屋檐和小路，看看没人安排时，你能混得多自在。' },
      explorer: { id: 'free', title: '这条街，没有你睡不明白的地方。', lead: '别人等人安排，你已经给自己安排好了。', text: '哪里避雨，哪里晒太阳，什么时候最安静，你都清楚。你不需要拥有整条街，只要总有一个舒服的地方可以回去。', next: '下次多和熟客打招呼，也许会有人主动邀请你去更远的地方。' },
      crew: { id: 'crew', title: '一只猫出门，一群猫下班。', lead: '你没建群，但朋友们都知道去哪里找你。', text: '饭可以一起吃，麻烦可以一起躲，瓶盖可以踢一下午。你混出来的排面，是一声招呼就有猫愿意跟上。', next: '下次也认识一下店员和熟客，看看人类能给猫的日子添点什么。' }
    })[route];
  }
  function serialize(s) { return { version: s.version, seed: s.seed, names: { ...s.names }, choices: s.history.map(h => h.id) }; }
  function restore(data) {
    if (!data || ![1, 2].includes(data.version) || !Number.isInteger(data.seed) || !Array.isArray(data.choices) || data.choices.length > 14 || data.choices.some(x => typeof x !== 'string')) throw new Error('存档无效');
    return data.choices.reduce((s, id) => choose(s, id), start(data.seed, data.version, data.names));
  }
  function rewind(s) {
    if (!s.step) throw new Error('还没有可以回头的选择');
    return restore({ ...serialize(s), choices: s.history.slice(0, -1).map(h => h.id) });
  }
  const api = { start, scene, choose, result, serialize, restore, rewind, view, relation, homeName, moods, story, names, defaultNames, text, rename };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
