(function (root) {
  'use strict';
  const story = typeof module !== 'undefined' && module.exports ? require('./story.js') : root.LifeStory;
  const events = typeof module !== 'undefined' && module.exports ? require('./events.js') : root.LifeEvents;
  const roles = [
    { id: 'student', icon: '🎓', name: '论文赶工人', subtitle: '论文没动，学术地位可能先动了。', label: '校园事故', cash: 30, energy: 75, mood: 5, intro: '导师问进度。你每多说一句话，世界就多一个误会。', choices: [
      ['回复“正在收尾”，先稳住导师', '你指的是收起电脑，他理解成了研究成果。', '导师回了个大拇指，顺手把你加进了“国际研讨会主讲人”群。你连群名里的三个词都不敢点开看。', 'paper'],
      ['先吃饭，论文又不会自己跑掉', '论文没跑，但有人说薯条跑了。', '你把电脑一扣，端着午饭坐下。室友忽然压低声音：“停。有人动过我的薯条。”', 'detective'],
      ['把电脑日期改成昨天，增加一天寿命', '如果 DDL 属于时间问题，就从时间下手。', '时间改好了。室友刚打完的喷嚏倒吸了回去，你隐约觉得自己改的可能不只是日期。', 'time']
    ] },
    { id: 'worker', icon: '💼', name: '下班逃跑家', subtitle: '17:59，你的命运收到一条新需求。', label: '职场事故', cash: 40, energy: 60, mood: 10, intro: '老板问“在吗”。你很在，但不想在这个意义上在。', choices: [
      ['回复“拉个会吧”，把问题扔回去', '这句话的危险程度，取决于谁真的来了。', '你随手建了个会。老板拉了总监，总监拉了老板的老板。你终于知道了什么叫把事情做大。', 'meeting'],
      ['让 AI 扮演自己，先去吃饭', '本人的职责：离线。分身的职责：收到。', '你刚走出大门，AI 发来通知：“已替您完成今日社交。另：我刚获得了晋升提名。”', 'double'],
      ['提上饭袋，钻进最先来的电梯', '去几楼不重要，离开工位最重要。', '电梯停在创业中心。一个穿西装的人看见纸袋，热情握手：“这就是你们的样品吧？”', 'pitch']
    ] },
    { id: 'wanderer', icon: '🎧', name: '周末漫游者', subtitle: '出门前是市民，回家时不一定。', label: '城市事故', cash: 50, energy: 80, mood: 5, intro: '今天没安排。命运看见空档，决定亲自排一下。', choices: [
      ['跟着一只看起来很有编制的猫', '它走路的气势，比你上班还确定。', '猫拐进小巷，回头确认你跟上了。你开始怀疑这不是偶遇，是招聘。', 'cat'],
      ['到店取餐，看看今天排到几号', '一次正常到不能再正常的操作。按理说。', '机器吐出 404 号。你看向取餐屏，屏幕也在看你。', 'portal'],
      ['去广场坐着，谁也不搭理', '非常遗憾，广场的鸽子不这么想。', '你刚坐下，鸽子就围了上来。它们不是来抢食的，其中一只甚至带了简历。', 'pigeon']
    ] }
  ];
  const meals = [
    { id: 'simple', icon: '🍔', name: '经费保命餐', items: '汉堡 + 小份薯条 + 水', price: 12, energy: 8, mood: 0, note: '人设可以崩，现金流不能断。', epilogue: '新身份的第一笔预算，你用来吃饭。财务系统表示：这是今天唯一一笔看得懂的支出。' },
    { id: 'chicken', icon: '🍗', name: '压惊工作餐', items: '鸡腿堡 + 小份薯条 + 无糖茶', price: 18, energy: 15, mood: 3, note: '你需要解释，但更需要午饭。', epilogue: '你试图边吃边解释今天发生了什么。邻桌听完，默默把自己的取餐号翻了个面。' },
    { id: 'picnic', icon: '🥪', name: '新官上任餐', items: '双层汉堡 + 玉米杯 + 无糖茶', price: 24, energy: 20, mood: 6, note: '职位到手了，工资还在路上。', epilogue: '你给新身份拍了第一张工作照。照片里最清楚的是汉堡，大家于是默认它才是负责人。' }
  ];
  const nodes = {}, endings = {};
  for (const role of roles) {
    nodes[role.id] = {
      id: role.id, stage: 1, title: role.id === 'student' ? '导师问：“论文怎么样了？”' : role.id === 'worker' ? '17:59，老板发来一个“在吗”。' : '今天没有计划。真是一个危险的计划。',
      text: role.intro, speaker: '命运 · 尚未意识到事情的严重性', message: '你现在做出的选择，将决定接下来要解释多少事情。',
      options: role.choices.map(([title, desc, reply, next]) => ({ title, desc, reply, next, route: next, energy: -6, mood: 12 }))
    };
  }
  for (const route of story.routes) {
    nodes[route.id] = { id: route.id, stage: 2, title: route.title, text: route.text, speaker: route.label, message: route.message, options: [] };
    route.branches.forEach((branch, index) => {
      const nodeId = `${route.id}-${index}`;
      nodes[route.id].options.push({ title: branch.choice, desc: branch.desc, reply: branch.reply, next: nodeId, identity: branch.identity, item: branch.item, energy: index === 0 ? -12 : -8, mood: index === 0 ? 20 : 16 });
      nodes[nodeId] = { id: nodeId, stage: 3, title: branch.scene[0], text: branch.scene[1], speaker: '事态升级 · 已经不是吃顿饭能解决的了', message: branch.scene[2], options: [] };
      branch.outcomes.forEach(([choice, reply, title, quote, future], finalIndex) => {
        const id = `${nodeId}-${finalIndex}`;
        endings[id] = { key: id, routeId: route.id, routeLabel: route.label, title, quote, description: future, icon: route.icon };
        nodes[nodeId].options.push({ title: choice, desc: '这次选择将决定三年后的你。', reply, finish: id, energy: finalIndex === 0 ? -9 : -14, mood: finalIndex === 0 ? 18 : 25 });
      });
    });
  }
  const tags = { paper: 'research', detective: 'sleuth', time: 'time', meeting: 'manager', double: 'ai', pitch: 'founder', cat: 'cat', portal: 'cosmic', pigeon: 'pigeon' };
  const tagNames = { research: '学术专家', sleuth: '调查员', time: '时空从业者', manager: '管理者', ai: 'AI 同行', founder: '创业者', cat: '猫国代表', cosmic: '宇宙事务人员', pigeon: '鸽界同行' };
  for (const r of story.routes) {
    const [title, quote, description] = events.secrets[r.id];
    const key = `${r.id}-secret`;
    endings[key] = { key, routeId: r.id, routeLabel: r.label, title, quote, description, icon: r.icon, secret: true };
  }
  const totalStages = 9;
  const chapterLabels = ['一念之差', '身份变更', '意外来客', '资格试炼', '节外生枝', '整备时间', '身份危机', '最后插曲', '人生拐弯'];
  const clamp = n => Math.max(0, Math.min(100, n));
  function drawEvents(seed) {
    let n = seed >>> 0;
    const random = () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const ids = events.randomEvents.map(e => e.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids.slice(0, 3);
  }
  function start(id, seed) {
    const role = roles.find(r => r.id === id);
    if (!role) throw new Error('请选择有效角色');
    if (seed === undefined) seed = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('无效命运编号');
    return { version: 3, seed, eventIds: drawEvents(seed), roleId: id, routeId: null, branchId: null, identity: role.name, identityTag: null, credential: null, inventory: [], flags: [], cash: role.cash, energy: role.energy, mood: role.mood, step: 0, history: [], mealId: null, endingId: null };
  }
  function route(state) { return story.routes.find(r => r.id === state.routeId) || null; }
  function conditions(state, o) {
    const unmet = [];
    if (o.requiresItem && !state.inventory.includes(o.requiresItem)) unmet.push(`需要：${o.requiresItem}`);
    if (o.requiresTag && state.identityTag !== o.requiresTag) unmet.push(`需要身份：${tagNames[o.requiresTag]}`);
    if (o.requiresAnyTag && !o.requiresAnyTag.includes(state.identityTag)) unmet.push(`需要身份：${o.requiresAnyTag.map(x => tagNames[x]).join(' / ')}`);
    if (o.requiresFlag && !state.flags.includes(o.requiresFlag)) unmet.push(o.requiresFlag === 'validated' ? '需要先通过资格试炼' : o.requiresFlag === 'resolved' ? '需要先解决身份危机' : '需要曾寄存原始物品');
    if (o.absentItem && state.inventory.includes(o.absentItem)) unmet.push(`已持有：${o.absentItem}`);
    if (o.cash < 0 && state.cash + o.cash < 12) unmet.push('需留 ¥12 吃饭，当前现金不足');
    for (const item of o.consume || []) if (!state.inventory.includes(item) && item !== o.requiresItem) unmet.push(`需要：${item}`);
    return unmet.join('；');
  }
  function normalize(state, raw) {
    const expand = value => typeof value === 'string' ? value.replaceAll('$credential', state.credential || '原始凭证') : Array.isArray(value) ? value.map(expand) : value;
    return { ...raw, stage: state.step + 1, options: raw.options.map(source => {
      const o = Object.fromEntries(Object.entries(source).map(([k, v]) => [k, expand(v)]));
      if (o.flags?.includes('pawned') && state.step > 5) o.desc = '道具柜已经关门：本局无法赎回原件，会失去隐藏人生的资格。';
      return { ...o, disabledReason: conditions(state, o) };
    }) };
  }
  function scene(state) {
    if (state.endingId || state.mealId) return null;
    let raw;
    if (state.step === 0) raw = nodes[state.roleId];
    else if (state.step === 1) raw = nodes[state.routeId];
    else if ([2, 4, 7].includes(state.step)) {
      const slot = { 2: 0, 4: 1, 7: 2 }[state.step];
      const event = events.randomEvents.find(e => e.id === state.eventIds[slot]);
      raw = { ...event, id: `random-${slot}-${event.id}`, speaker: `随机事件 ${slot + 1}/3 · 本局已固定`, random: true };
    } else if (state.step === 3) {
      const t = events.routeTrials[state.routeId];
      raw = { id: `${state.routeId}-trial`, title: t[0], text: `${t[1]}你现在的身份是「${state.identity}」。`, speaker: '资格试炼 · 背包里的东西开始有用了', message: '工作人员：不能只报头衔，得拿出点东西。', options: [
        { title: t[2], desc: '需要原始物品，使用后保留；通过试炼。', requiresItem: state.credential, flags: ['validated'], reply: t[4], energy: -3 },
        { title: t[3], desc: '消耗宇宙胶带，通过试炼。', requiresItem: '宇宙胶带', consume: ['宇宙胶带'], flags: ['validated'], reply: `${t[4]}胶带用光了，但论证看起来牢固多了。`, mood: 8 },
        { title: '凭记忆即兴发挥，申请先干后补材料', desc: '可以继续，但不会获得资格认证；后面还能找人帮忙。', flags: ['improvised'], reply: '对方在你的档案上写了“先观察”。你暂时过关，但后面不能再靠同一句话蒙混过去。', energy: -9, mood: 7 }
      ] };
    } else if (state.step === 5) {
      raw = { id: 'supply', title: '道具柜就要关门了，你只能办一件事。', text: '老板正在把“今天营业”翻成“昨天倒闭”。你的背包开始有故事，钱包开始有意见。接下来是身份复核，最好想好要用什么。', speaker: '整备回合 · 不随机', message: '老板：原件、胶带、人情，总得带一样。', options: [
        { title: '花 ¥6 赎回「$credential」', desc: '仅寄存过且尚未持有原件时可选。', requiresFlag: 'pawned', absentItem: '$credential', give: ['$credential'], cash: -6, reply: '老板把原件递给你，还附送一句：“看吧，人生售后是有用的。”你决定不跟他争。' },
        { title: '花 ¥5 买宇宙胶带', desc: '保留到后续随机事件；不能代替现在缺失的资格。', give: ['宇宙胶带'], absentItem: '宇宙胶带', cash: -5, reply: '你把胶带塞进背包。世界破不破另说，至少你有维修意愿。' },
        { title: '帮老板盘点一会儿，换一张人情券', desc: '理智 −10；人情券可帮你解决身份危机。', give: ['人情券'], energy: -10, reply: '库存只有三件，账上有三百件。你没问，老板也没解释。他郑重欠了你一个人情。' },
        { title: '什么都不买，坐着恢复一下理智', desc: '理智 +15；保留所有物品和现金。', energy: 15, reply: '你盯着墙发呆。墙上写着“发呆免费”，你第一次觉得这家店很诚实。' }
      ] };
    } else if (state.step === 6) {
      const t = events.routeTrials[state.routeId];
      raw = { id: `${state.routeId}-crisis`, title: t[5], text: t[6], speaker: `身份危机 · ${state.identity}`, message: '主持人：上次的资格认证，或者能担保你的人，带来了吗？', options: [
        { title: '提交此前通过的资格认证', desc: '资格试炼成功后可选，正式解决身份危机。', requiresFlag: 'validated', flags: ['resolved'], reply: '他们核对了你的记录，终于把“临时”两个字划掉。你得到正式认可，后面的隐藏选项开始有希望了。', energy: 4 },
        { title: '兑现一张人情券，请人替自己担保', desc: '消耗人情券，同样能解决身份危机。', requiresItem: '人情券', consume: ['人情券'], flags: ['resolved'], reply: '担保人打来电话。你不知道他到底解释了什么，现场所有人突然都开始喊你老师。', mood: 8 },
        { title: '申请延期，以“项目仍在推进”暂时脱身', desc: '可以继续普通结局，但本局隐藏结局保持锁定。', flags: ['debt'], reply: '他们同意延期，同时给你排了一个每周例会。问题暂时没了，日历永久少了一块。', energy: -8, mood: 9 }
      ] };
    } else if (state.step === 8) {
      const original = nodes[state.branchId];
      raw = { ...original, options: [...original.options, {
        title: '拿着原始凭证，正式接管这场离谱事故', desc: '隐藏人生：需解决身份危机，并仍持有原始物品。', requiresFlag: 'resolved', requiresItem: state.credential,
        finish: `${state.routeId}-secret`, reply: '你把原件和复核结果一起放在桌上。所有人第一次发现，你不仅能解释这件事，还真的有手续。', mood: 12
      }] };
    }
    return raw ? normalize(state, raw) : null;
  }
  function choose(state, index) {
    const current = scene(state);
    if (!current) throw new Error('剧情已经结束');
    if (!Number.isInteger(index) || !current.options[index]) throw new Error('无效选择');
    const option = current.options[index];
    if (option.disabledReason) throw new Error(option.disabledReason);
    const gained = [...(option.give || []), ...(option.item ? [option.item] : [])];
    const consumed = [...(option.consume || [])];
    const nextRoute = option.route || state.routeId;
    return {
      ...state, cash: state.cash + (option.cash || 0), energy: clamp(state.energy + (option.energy || 0)), mood: clamp(state.mood + (option.mood || 0)),
      step: state.step + 1, routeId: nextRoute, branchId: state.step === 1 ? option.next : state.branchId,
      endingId: option.finish || null, identity: option.identity || state.identity, identityTag: state.step === 1 ? tags[nextRoute] : state.identityTag,
      credential: option.item || state.credential,
      inventory: [...new Set([...state.inventory.filter(x => !consumed.includes(x)), ...gained])],
      flags: [...new Set([...state.flags, ...(option.flags || [])])],
      history: [...state.history, { nodeId: current.id, optionIndex: index, title: current.title, choice: option.title, reply: option.reply, cash: option.cash || 0, identity: option.identity || null, item: option.item || null, gained, consumed, routeId: nextRoute, random: Boolean(current.random) }]
    };
  }
  function dine(state, id) {
    const meal = meals.find(m => m.id === id);
    if (!state.endingId || state.mealId || !meal || meal.price > state.cash) throw new Error('套餐不可选');
    return { ...state, cash: state.cash - meal.price, energy: clamp(state.energy + meal.energy), mood: clamp(state.mood + meal.mood), mealId: id };
  }
  function ending(state) {
    if (!state.mealId || !endings[state.endingId]) throw new Error('请先选择套餐');
    const consequences = [];
    if (state.flags.includes('debt')) consequences.push('当年延期的身份复核没有消失：你现在每周都得开一次“还在推进”汇报会。');
    if (state.flags.includes('pawned')) consequences.push(state.inventory.includes(state.credential) ? '你赎回的那份原件如今被锁在保险柜里。柜门上写着：不再换通行证。' : '人生售后中心还保管着你的原件，老板每逢周年都会发来一张续保广告。');
    if (state.flags.includes('futureDebt')) consequences.push('三年前拒收的包裹终于又到了。这一次，快递鸽戴着工龄徽章。');
    if (state.flags.includes('watched') && !state.flags.includes('cleared')) consequences.push('宇宙回访部门仍在找你解释“为什么只是吃饭就变成这样”。');
    if (state.flags.includes('registered')) consequences.push('你始终留着那次核验记录，因为那是第一个官方承认你没有胡说的时刻。');
    return { ...endings[state.endingId], consequences, mealEpilogue: meals.find(m => m.id === state.mealId).epilogue };
  }
  function rewind(state) {
    if (!state.history.length) throw new Error('没有可以回溯的选择');
    return state.history.slice(0, -1).reduce((previous, h) => choose(previous, h.optionIndex), start(state.roleId, state.seed));
  }
  function serialize(state) { return { version: 3, seed: state.seed, roleId: state.roleId, choices: state.history.map(h => h.optionIndex), mealId: state.mealId }; }
  function restore(saved) {
    if (!saved || saved.version !== 3 || !Array.isArray(saved.choices) || saved.choices.length > totalStages || !Number.isInteger(saved.seed)) throw new Error('存档无效');
    let state = saved.choices.reduce((s, i) => choose(s, i), start(saved.roleId, saved.seed));
    if (saved.mealId !== null && saved.mealId !== undefined) state = dine(state, saved.mealId);
    return state;
  }
  const api = { roles, meals, endings, routes: story.routes, nodes, totalStages, chapterLabels, randomEvents: events.randomEvents, start, scene, route, choose, dine, ending, rewind, serialize, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LifeGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
