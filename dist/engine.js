(function (root) {
  'use strict';
  const story = typeof module !== 'undefined' && module.exports ? require('./story.js') : root.LifeStory;
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
  const clamp = n => Math.max(0, Math.min(100, n));
  function start(id) {
    const role = roles.find(r => r.id === id);
    if (!role) throw new Error('请选择有效角色');
    return { roleId: id, nodeId: id, routeId: null, identity: role.name, inventory: [], cash: role.cash, energy: role.energy, mood: role.mood, step: 0, history: [], mealId: null, endingId: null };
  }
  function scene(state) { return nodes[state.nodeId] || null; }
  function route(state) { return story.routes.find(r => r.id === state.routeId) || null; }
  function choose(state, index) {
    const current = scene(state);
    if (!current || state.endingId || state.mealId) throw new Error('剧情已经结束');
    if (!Number.isInteger(index) || !current.options[index]) throw new Error('无效选择');
    const option = current.options[index];
    const cash = state.cash + (option.cash || 0);
    if (cash < 0) throw new Error('预算不足');
    const nextRoute = option.route || state.routeId;
    return {
      ...state, cash, energy: clamp(state.energy + (option.energy || 0)), mood: clamp(state.mood + (option.mood || 0)),
      step: state.step + 1, nodeId: option.next || null, routeId: nextRoute,
      endingId: option.finish || null, identity: option.identity || state.identity,
      inventory: option.item ? [...state.inventory, option.item] : [...state.inventory],
      history: [...state.history, { nodeId: current.id, optionIndex: index, title: current.title, choice: option.title, reply: option.reply, cash: option.cash || 0, identity: option.identity || null, item: option.item || null, routeId: nextRoute }]
    };
  }
  function dine(state, id) {
    const meal = meals.find(m => m.id === id);
    if (!state.endingId || state.mealId || !meal || meal.price > state.cash) throw new Error('套餐不可选');
    return { ...state, cash: state.cash - meal.price, energy: clamp(state.energy + meal.energy), mood: clamp(state.mood + meal.mood), mealId: id };
  }
  function ending(state) {
    if (!state.mealId || !endings[state.endingId]) throw new Error('请先选择套餐');
    return { ...endings[state.endingId], mealEpilogue: meals.find(m => m.id === state.mealId).epilogue };
  }
  function rewind(state) {
    if (!state.history.length) throw new Error('没有可以回溯的选择');
    // Replay choices, rather than reversing deltas: clamped values and inventory must restore exactly.
    return state.history.slice(0, -1).reduce((previous, h) => choose(previous, h.optionIndex), start(state.roleId));
  }
  const api = { roles, meals, endings, routes: story.routes, nodes, totalStages: 3, start, scene, route, choose, dine, ending, rewind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LifeGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
