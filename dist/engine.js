(function (root) {
  'use strict';
  const roles = [
    { id: 'student', icon: '🎓', name: '论文赶工人', subtitle: 'DDL 可以等，午饭不能。', label: '校园副本', cash: 30, energy: 45, mood: 55, intro: '导师发来一句“有空聊聊吗”。你看了一眼空白文档，又看了一眼时间。今天的生存任务：把自己照顾好。' },
    { id: 'worker', icon: '💼', name: '下班逃跑家', subtitle: '今天的最后一个需求：快乐。', label: '职场副本', cash: 40, energy: 35, mood: 45, intro: '17:59，电脑右下角亮起一条消息。你已经穿好了外套。今天的生存任务：夺回属于自己的时间。' },
    { id: 'wanderer', icon: '🎧', name: '周末漫游者', subtitle: '没有计划，也是一种计划。', label: '自由副本', cash: 50, energy: 65, mood: 60, intro: '闹钟没响，世界也没塌。天气刚好，你决定出门走走。今天的生存任务：给平平无奇的一天加点料。' }
  ];
  const openings = {
    student: { title: '导师的消息，已送达。', text: '“论文怎么样了？”光标闪了三下。室友在旁边问：“要不先去吃饭？”', speaker: '导师 · 11:38', message: '不急，今天给我看看就行。', options: [
      { title: '先列提纲，给大脑一个交代', desc: '把大问题拆小，出门时心里轻一点。', energy: -8, mood: 12, tag: 'steady', reply: '你写出了三个小标题。虽然正文还没来，但方向终于来了。' },
      { title: '带上室友，边走边聊', desc: '一个人的卡壳，换两个人的脑洞。', energy: 5, mood: 10, tag: 'social', reply: '室友听了半天：“所以你是想说这个？”你突然知道下一段怎么写了。' },
      { title: '关上文档，给自己放半小时假', desc: '允许暂停，也是一种推进。', energy: 12, mood: 5, tag: 'free', reply: '你把手机调成勿扰。今天第一次听见窗外的鸟叫。' }
    ] },
    worker: { title: '17:59 的“在吗”。', text: '同事发来：“有个小地方想改一下。”你停在电梯门口，决定先弄清楚这个“小”到底有多小。', speaker: '同事 · 17:59', message: '在吗？就一个小调整～', options: [
      { title: '问清截止时间，约明早处理', desc: '边界感，是下班人的超能力。', energy: 8, mood: 12, tag: 'steady', reply: '对方说：“明天下午前就行。”电梯门开了，你准时走了进去。' },
      { title: '五分钟说清楚，再一起下楼', desc: '把来回打字变成一次短对话。', energy: -5, mood: 15, tag: 'social', reply: '原来只是改个标题。五分钟后，你多了一个饭搭子。' },
      { title: '记进待办，先去吃顿好饭', desc: '明天的你，明天再说。', energy: 12, mood: 5, tag: 'free', reply: '你记下需求，合上电脑。晚风吹过来，今天终于开始属于你。' }
    ] },
    wanderer: { title: '今天，往哪边走？', text: '路口有三条路。你没有必须要去的地方，这大概就是周末最奢侈的事。', speaker: '好友 · 12:06', message: '今天什么安排？', options: [
      { title: '沿着河边慢慢走', desc: '熟悉的路线，也能走出新心情。', energy: -5, mood: 12, tag: 'steady', reply: '你发现上周还光秃秃的树，今天已经有了新叶。' },
      { title: '叫上朋友，随机挑一条街', desc: '目的地不重要，同行的人重要。', energy: 5, mood: 10, tag: 'social', reply: '朋友十分钟就到了。你们决定：今天谁也不问“接下来干嘛”。' },
      { title: '跟着一只路过的猫走一小段', desc: '今日导航：喵。', energy: -8, mood: 18, tag: 'free', reply: '猫带你走到了一个阳光很好的小广场，然后自己下班了。' }
    ] }
  };
  const scenes = [
    { title: '路上，掉落一个小惊喜。', text: '街角有一台即时拍照机，旁边的小店在卖明信片。你想给今天留下一点什么。', speaker: '内心弹幕', message: '普通的一天，也值得被记住。', options: [
      { title: '拍一张有点傻的照片', desc: '花 ¥8，把这一刻装进口袋。', cash: -8, energy: 0, mood: 18, tag: 'free', reply: '倒计时结束前，你做了一个自己都没想到的表情。这张必须留着。' },
      { title: '买张明信片，写给一个朋友', desc: '花 ¥5，留一句很久没说的话。', cash: -5, energy: 0, mood: 14, tag: 'social', reply: '你写下：“今天路过这里，突然想到你。”短短一行，刚刚好。' },
      { title: '用手机拍下这一束光', desc: '免费。好心情不必总是付费。', cash: 0, energy: 3, mood: 8, tag: 'steady', reply: '照片没有滤镜。你把它设成壁纸，手机看起来也轻松了一点。' }
    ] },
    { title: '突然下起了太阳雨。', text: '离餐厅还有一段路，雨却抢先到了。路边的屋檐很宽，公交站就在转角。', speaker: '天气 · 即兴演出', message: '本场小雨，预计一首歌后结束。', options: [
      { title: '屋檐下听完一首歌', desc: '把等待变成一次小休息。', energy: 8, mood: 5, tag: 'steady', reply: '歌还没播完，雨就停了。你突然觉得慢一点也没关系。' },
      { title: '坐一站公交，看窗上的水滴', desc: '花 ¥2，买一段移动的风景。', cash: -2, energy: 12, mood: 3, tag: 'free', reply: '水滴在玻璃上比赛。你支持的那一颗，最后拐了个弯。' },
      { title: '和旁边等雨的人聊两句', desc: '从“这雨真突然”开始。', energy: 2, mood: 12, tag: 'social', reply: '对方指了指天空：“你看，彩虹。”你差一点就错过了。' }
    ] },
    { title: '到店了，先把自己安顿好。', text: '你推开门，闻到熟悉的香味。吃什么还没决定，先挑一个属于今天的位置。', speaker: '今日小任务', message: '现在，没有人催你。', options: [
      { title: '靠窗坐，看城市继续忙碌', desc: '给自己一点安静。', energy: 8, mood: 5, tag: 'steady', reply: '你坐下来的那一刻，肩膀终于松了。' },
      { title: '给饭搭子留个位子', desc: '顺便分享刚才发生的小事。', energy: 3, mood: 12, tag: 'social', reply: '“我跟你说，刚刚可有意思了。”今天的故事有了听众。' },
      { title: '坐在角落，画一张今日速写', desc: '画得像不像都算数。', energy: 5, mood: 8, tag: 'free', reply: '你画了一个歪歪扭扭的自己，但嘴角画得特别上扬。' }
    ] }
  ];
  const meals = [
    { id: 'simple', icon: '🍔', name: '小小满足餐', items: '汉堡 + 小份薯条 + 水', price: 12, energy: 16, mood: 7, note: '留点预算，也留点小快乐。' },
    { id: 'chicken', icon: '🍗', name: '快乐充电餐', items: '鸡腿堡 + 小份薯条 + 无糖茶', price: 18, energy: 23, mood: 12, note: '今天辛苦了，坐下来慢慢吃。' },
    { id: 'picnic', icon: '🥪', name: '漫游补给餐', items: '双层汉堡 + 玉米杯 + 无糖茶', price: 24, energy: 28, mood: 14, note: '吃完，继续探索今天。' }
  ];
  const endings = {
    steady: { title: '把日子过稳的人', icon: '🌤️', quote: '大事慢慢来，小事好好过。', description: '你没有把每一分钟都塞满。给事情排了顺序，也给自己留了位置。今天的你，稳稳接住了自己。' },
    social: { title: '人间快乐连接器', icon: '🫶', quote: '一顿饭的快乐，可以从一个人传到另一个人。', description: '你把普通的片段讲成了故事，也让身边的人加入其中。有些好心情，聊着聊着就长出来了。' },
    free: { title: '今日自由冒险家', icon: '🪁', quote: '人生偶尔偏航，也能抵达好地方。', description: '你给今天留了一点意外的空间。一张照片、一场小雨、一段没计划的路，都变成了你的独家收藏。' }
  };
  const clamp = n => Math.max(0, Math.min(100, n));
  function start(id) {
    const role = roles.find(r => r.id === id);
    if (!role) throw new Error('请选择有效角色');
    return { roleId: id, cash: role.cash, energy: role.energy, mood: role.mood, step: 0, history: [], mealId: null, tags: { steady: 0, social: 0, free: 0 } };
  }
  function scene(state) { return state.step === 0 ? openings[state.roleId] : scenes[state.step - 1]; }
  function choose(state, index) {
    if (state.step >= 4 || state.mealId) throw new Error('剧情已经结束');
    const current = scene(state), option = current.options[index];
    if (!option || state.cash + (option.cash || 0) < 0) throw new Error('无效选择');
    return { ...state, cash: state.cash + (option.cash || 0), energy: clamp(state.energy + option.energy), mood: clamp(state.mood + option.mood), step: state.step + 1, tags: { ...state.tags, [option.tag]: state.tags[option.tag] + 1 }, history: [...state.history, { title: current.title, choice: option.title, reply: option.reply, cash: option.cash || 0 }] };
  }
  function dine(state, id) {
    const meal = meals.find(m => m.id === id);
    if (state.step !== 4 || state.mealId || !meal || meal.price > state.cash) throw new Error('套餐不可选');
    return { ...state, cash: state.cash - meal.price, energy: clamp(state.energy + meal.energy), mood: clamp(state.mood + meal.mood), mealId: id };
  }
  function ending(state) {
    if (!state.mealId) throw new Error('请先选择套餐');
    const key = Object.keys(endings).reduce((a, b) => state.tags[b] > state.tags[a] ? b : a);
    return { key, ...endings[key] };
  }
  const api = { roles, meals, endings, start, scene, choose, dine, ending };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LifeGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
