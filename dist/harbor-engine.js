(function (root) {
  'use strict';
  const deadline = 90;
  const places = ['办公室', '街角', '麦当劳', '河堤', '码头'];
  const incidents = [
    ['前面的路堵住了。', '车一动不动。同事发来消息：“我已经把堵车这件事，从地图上看懂了。”', 'traffic'],
    ['下起一阵太阳雨。', '雨不大，但刚好够让所有人犹豫。你看了一眼天色：晚霞可不会加班等你。', 'rain'],
    ['河边大路临时封闭。', '路牌写着“散步的人请绕行”。你觉得它对散步的理解，略微有些强制。', 'detour']
  ];
  function start(seed) {
    if (seed === undefined) seed = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('无效的出发编号');
    return { seed, step: 0, minutes: 0, cash: 12, buddy: false, fries: false, shortcut: false, history: [] };
  }
  function clock(minutes) {
    const total = 17 * 60 + 30 + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  function scene(s) {
    if (s.step === 5) return null;
    let node;
    if (s.step === 0) node = {
      title: '17:30。电脑合上，同事叫住了你。', icon: '💻',
      text: '“帮我改完最后一页，我补贴十块薯条钱。然后一起走？”',
      options: [
        { title: '帮他改完，一起出发', minutes: 25, cash: 10, buddy: true,
          reply: '你删掉了最后一页。同事看了看：“确实好多了。”十块钱到账，他拎包跟上。' },
        { title: '先约他一起走，PPT 明天再说', minutes: 10, buddy: true,
          reply: '同事认真想了十分钟，决定让明天的自己也参与一下公司建设。你有搭子了。' },
        { title: '我先走，你忙完再联系', minutes: 5,
          reply: '你先溜出了办公室。电梯里没有工作群信号，这五分钟很有价值。' }
      ]
    };
    if (s.step === 1) node = {
      title: '街角，有只猫走得很像认识路。', icon: '🐈',
      text: '沿着这条街能到麦当劳。路边小店在找人搬货，猫则钻进了一条通往河边的小巷。',
      options: [
        { title: '跟猫走一段，记住河边小路', minutes: 8, shortcut: true,
          reply: '猫带你穿过小巷，又绕回大街。你记住了去河边的近路。它看着你，像在等五星好评。' },
        { title: '帮小店搬货，赚点零钱', minutes: 20, cash: 8,
          reply: '你搬了三箱纸杯，赚到八块钱。老板问你明天来不来，你说今天只负责路过。' },
        s.buddy
          ? { title: '和搭子分头问路', minutes: 5, shortcut: true,
            reply: '你还在打开地图，同事已经问到了近路。他说这叫把开会时的嘴用在正经地方。' }
          : { title: '打电话，约同事在店里碰头', minutes: 10, buddy: true,
            reply: '同事接得很快：“我正等一个合理下班的理由。”你说薯条，他说充分。' }
      ]
    };
    if (s.step === 2) node = {
      title: '到麦当劳了。薯条，安排上？', icon: '🍟',
      text: `你有 ¥${s.cash}。拿上薯条，就能往码头走了。这里的价格和等候时间都是游戏设定。`,
      options: [
        { title: '买一份薯条，等新的一锅', minutes: 10, cash: -12, fries: true,
          reply: '薯条装进纸袋，店员说小心烫。你点点头，终于有一件事值得认真等十分钟。' },
        { title: '选现成的薯条饮料组合，早点走', minutes: 5, cash: -18, fries: true,
          reply: '你拎起现成的纸袋，省下五分钟。今天的时间管理，第一次有了香味。' },
        { title: '先不买，继续往码头方向走', minutes: 5,
          reply: '你走出了店门，手上空空的。薯条这一项还没完成，最后出发前还有一次回店的机会。' }
      ]
    };
    if (s.step === 3) {
      const event = incidents[s.seed % incidents.length];
      node = { title: event[0], text: event[1], icon: event[2] === 'rain' ? '🌦️' : '🚧', event: event[2],
        options: [
          { title: event[2] === 'rain' ? '等雨小一点，再走大路' : '沿着大路慢慢绕过去', minutes: [20, 18, 25][s.seed % 3],
            reply: '你绕到了河边。路上每块广告牌都看清了，代价是晚霞已经开始上班。' },
          { title: '花点零钱，搭车绕过这一段', minutes: [10, 12, 15][s.seed % 3], cash: -4,
            reply: '车把你放在河堤入口。你和钱包交换了一下意见：今天可以接受。' },
          { title: '走刚才记住的小路', minutes: [7, 9, 7][s.seed % 3], requiresShortcut: true,
            reply: '熟悉的巷口出现了。你顺利绕过这段麻烦：刚才认真问路，真的用上了。' }
        ] };
    }
    if (s.step === 4) node = {
      title: '最后一段路。晚霞已经在码头等了。', icon: '🌅',
      text: `现在 ${clock(s.minutes)}。${s.fries ? '薯条带着。' : '还没拿到薯条，可以先回店补上。'}${s.buddy ? '搭子也在。' : '搭子还没约到，也可以再打一次电话。'}19:00 前到达，就能赶上日落。`,
      options: [
        { title: '沿河慢慢走到码头', minutes: 20, arrive: true,
          reply: '你走到了码头，找了个靠水的位置。工作群的消息还在跳，你把手机翻了个面。' },
        { title: '抄近路，直接到码头', minutes: 10, requiresShortcut: true, arrive: true,
          reply: '你穿过小路，码头就在眼前。原来提前认识一点路，真的可以少绕很多弯。' },
        !s.fries
          ? { title: '回店买薯条，再赶去码头', minutes: 35, cash: -12, fries: true, arrive: true,
            reply: '你拎着补买的薯条赶到了。跑得有点急，但这次手里有东西，心里也有底。' }
          : !s.buddy
            ? { title: '约同事直接在码头见', minutes: 30, buddy: true, arrive: true,
              reply: '你们在码头碰了头。他说找你花了点时间，因为你发的位置叫“有水的地方”。' }
            : { title: '花 ¥4 坐车，直接到码头', minutes: 10, cash: -4, arrive: true,
              reply: '你们坐车到了码头。同事把车费记进“今日精神团建”，财务暂时不知情。' }
      ]
    };
    return { ...node, options: node.options.map(o => ({
      ...o, cash: o.cash || 0,
      disabledReason: o.requiresShortcut && !s.shortcut ? '还不认识小路：第 2 步可以问路'
        : s.cash + (o.cash || 0) < 0 ? `还差 ¥${-(s.cash + o.cash)}` : ''
    })) };
  }
  function choose(s, index) {
    const node = scene(s);
    if (!node || !Number.isInteger(index) || !node.options[index]) throw new Error('无效选择');
    const o = node.options[index];
    if (o.disabledReason) throw new Error(o.disabledReason);
    return { ...s, step: s.step + 1, minutes: s.minutes + o.minutes, cash: s.cash + o.cash,
      buddy: s.buddy || Boolean(o.buddy), fries: s.fries || Boolean(o.fries), shortcut: s.shortcut || Boolean(o.shortcut),
      history: [...s.history, { index, title: o.title, reply: o.reply, minutes: o.minutes, cash: o.cash,
        arrive: Boolean(o.arrive), buddy: Boolean(o.buddy && !s.buddy), fries: Boolean(o.fries && !s.fries), shortcut: Boolean(o.shortcut && !s.shortcut) }]
    };
  }
  function goals(s) {
    return [{ label: '约到搭子', done: s.buddy, icon: '👋' }, { label: '拿到薯条', done: s.fries, icon: '🍟' },
      { label: '日落前到码头', done: s.step === 5 && s.minutes <= deadline, icon: '🌅' }];
  }
  function outcome(s) {
    if (s.step !== 5) throw new Error('还没到终点');
    const late = s.minutes > deadline;
    if (!late && s.fries && s.buddy) return { id: 'together', title: '薯条、搭子、晚霞。全齐了。', icon: '🍟',
      text: '你们坐在码头，决定先别讨论人生的意义。同事伸手拿薯条的时候，答案好像也没那么着急了。',
      advice: '今天的三个目标全部完成。下次试试少花一点钱，或者更早到达。' };
    if (!late && s.fries) return { id: 'solo', title: '一个人的薯条，也赶上了晚霞。', icon: '🌇',
      text: '旁边的位置空着，但风景没少一半。你先替朋友看了一场日落，下次再带他来。',
      advice: '完成了 2 个目标。想凑齐三个：第 1、2 步可以约搭子，最后一段也能打电话。' };
    return { id: 'almost', title: late ? '到了码头，晚霞刚刚下班。' : '人到了，薯条还在店里。', icon: '🌙',
      text: late ? '码头亮起了灯。今天也算成功出门，只是你想赶上的那一刻，得留给下一次。' : '你摸了摸空空的手，决定以后清单上最香的那一项，不能跳过。',
      advice: [late ? `晚了 ${s.minutes - deadline} 分钟。第 2 步记住小路，后面能省时间。` : '',
        !s.fries ? '第 3 步留 ¥12 买薯条，别只顾着赶路。' : '',
        !s.buddy ? '还差一个搭子，可以早点约同事。' : ''].filter(Boolean).join(' ') };
  }
  function serialize(s) { return { version: 1, seed: s.seed, choices: s.history.map(h => h.index) }; }
  function restore(saved) {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.choices) || saved.choices.length > 5 || !Number.isInteger(saved.seed)) throw new Error('存档无效');
    return saved.choices.reduce((s, i) => choose(s, i), start(saved.seed));
  }
  function rewind(s) {
    if (!s.history.length) throw new Error('没有可以回头的选择');
    return restore({ ...serialize(s), choices: s.history.slice(0, -1).map(h => h.index) });
  }
  const api = { start, scene, choose, goals, outcome, serialize, restore, rewind, clock, places, deadline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HarborGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
