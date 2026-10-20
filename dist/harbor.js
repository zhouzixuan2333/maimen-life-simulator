(() => {
  'use strict';
  const G = window.HarborGame, app = document.querySelector('#app'), key = 'maimen-harbor-v1';
  let state = null, feedback = false, saved = null, storageFailed = false;
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    if (data) { G.restore(data.game); saved = data; }
  } catch (_) { /* Invalid or unavailable browser storage must not block play. */ }
  const landscape = `<svg class="landscape" viewBox="0 0 600 230" role="img" aria-label="一袋薯条、两把椅子，远处是码头的晚霞">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#ffcf95"/><stop offset="1" stop-color="#ffe8bc"/></linearGradient></defs>
    <rect width="600" height="230" rx="22" fill="url(#sky)"/><circle cx="445" cy="100" r="49" fill="#e95f3f"/>
    <path d="M0 135Q130 118 280 136T600 133V230H0Z" fill="#6aabae"/><path d="M0 160Q120 148 250 165T600 160M0 194Q180 181 370 196T600 189" fill="none" stroke="#c4ded0" stroke-width="3"/>
    <path d="M270 164H600V182H270Z" fill="#9b6949"/><path d="M325 180V230M540 180V230" stroke="#74523b" stroke-width="10"/>
    <path d="M350 165V130H389V164M412 165V130H451V164" fill="none" stroke="#764731" stroke-width="7" stroke-linejoin="round"/>
    <path d="M369 130L373 104H394L400 130Z" fill="#b94333"/><path d="M375 112V93M382 111V89M390 112V95" stroke="#f7bc45" stroke-width="6"/>
    <path d="M100 64q12-12 24 0q12-12 24 0M194 83q9-9 18 0q9-9 18 0" fill="none" stroke="#854f39" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  function focusMain() {
    const h = app.querySelector('h1');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function save() {
    saved = { game: G.serialize(state), feedback };
    try { localStorage.setItem(key, JSON.stringify(saved)); storageFailed = false; }
    catch (_) { storageFailed = true; }
  }
  function goalList(s) {
    const goals = s ? G.goals(s) : [{ icon: '👋', label: '约到搭子' }, { icon: '🍟', label: '拿到薯条' }, { icon: '🌅', label: '日落前到码头' }];
    return `<ol class="goals" aria-label="今天的三个目标">${goals.map(g => `<li class="${g.done ? 'done' : ''}"><span aria-hidden="true">${g.done ? '✓' : g.icon}</span><b>${g.label}</b><small>${g.done ? '已完成' : '待完成'}</small></li>`).join('')}</ol>`;
  }
  function home() {
    state = null; feedback = false;
    app.innerHTML = `<section class="home"><p class="eyebrow">麦当劳主题 · 五回合下班冒险</p>
      <h1>人生先放一边。<br>去码头<span>整点薯条。</span></h1>
      <p class="lead">今天只做一件事：<br><b>19:00 前，和搭子带着薯条到码头。</b></p>
      ${landscape}${goalList(null)}
      <button class="primary" id="start">下班，出发！ <span>→</span></button>
      <p class="home-note">17:30 出发 · 口袋里 ¥12 · 约 3 分钟一局</p>
      ${saved ? `<button class="secondary" id="resume">${saved.game.choices.length === 5 && !saved.feedback ? '看看上次的日落' : '继续刚才的出发'} →</button>` : ''}
      <details class="how"><summary>怎么玩？</summary><p>每步选一件事。看看会花多少时间、零钱，能不能约到人或拿到薯条。最后到码头时，三个目标全亮就算完成。</p><p>认识小路，后面就能抄近道；约到搭子，也能一起问路。选错可以回头。</p></details>
      <a class="classic-link" href="./classic.html">想看离谱故事？玩原来的九回合版 ↗</a></section>`;
    document.querySelector('#start').onclick = () => begin();
    const resume = document.querySelector('#resume');
    if (resume) resume.onclick = () => { state = G.restore(saved.game); feedback = Boolean(saved.feedback) && state.step > 0; render(); focusMain(); };
  }
  function begin(seed) { state = G.start(seed); feedback = false; render(); focusMain(); }
  function status() {
    const remaining = G.deadline - state.minutes;
    return `<section class="status" aria-label="当前状态"><div><small>现在</small><strong>${G.clock(state.minutes)}</strong><span class="${remaining < 0 ? 'warning' : ''}">${remaining >= 0 ? `离日落 ${remaining} 分钟` : `晚了 ${-remaining} 分钟`}</span></div>
      <div><small>零钱</small><strong>¥${state.cash}</strong><span>游戏金额</span></div>
      <div><small>小路</small><strong>${state.shortcut ? '认识了 ✓' : '还不认识'}</strong><span>${state.shortcut ? '能用近路选项' : '第 2 步可以问路'}</span></div></section>${goalList(state)}`;
  }
  function effects(o) {
    return `<span class="effect time">用时 ${o.minutes} 分钟</span>${o.cash ? `<span class="effect ${o.cash > 0 ? 'gain' : 'cost'}">${o.cash > 0 ? '+' : '−'}¥${Math.abs(o.cash)}</span>` : ''}${o.buddy ? '<span class="effect gain">搭子 +1</span>' : ''}${o.fries ? '<span class="effect gain">拿到薯条</span>' : ''}${o.shortcut ? '<span class="effect gain">记住小路</span>' : ''}${o.arrive ? '<span class="effect gain">抵达码头</span>' : ''}`;
  }
  function map() {
    return `<nav class="map" aria-label="出发路线">${G.places.map((p, i) => `<span class="${i < state.step ? 'passed' : i === state.step ? 'current' : ''}" ${i === state.step ? 'aria-current="step"' : ''}><i>${i < state.step ? '✓' : i + 1}</i>${p}</span>`).join('')}</nav>`;
  }
  function render() {
    save();
    if (state.step === 5 && !feedback) return ending();
    const sc = feedback ? null : G.scene(state), h = state.history.at(-1);
    const gains = feedback ? [h.buddy ? '搭子约好了' : '', h.fries ? '薯条拿到了' : '', h.shortcut ? '你记住了小路' : '', h.cash > 0 ? `零钱 +¥${h.cash}` : ''].filter(Boolean) : [];
    app.innerHTML = `<section class="play"><div class="mission"><span>今天的目标</span><b>19:00 前，带搭子和薯条到码头</b></div>${status()}${map()}
      ${feedback ? `<article class="scene feedback"><p class="eyebrow">第 ${state.step} / 5 步 · 刚刚发生的事</p>
        <h1>${gains[0] || (state.step === 5 ? '到码头了。' : '这一步，走完了。')}</h1>
        <p class="chosen">你选择：${h.title}</p><p class="story">${h.reply}</p>
        <div class="feedback-effects" aria-label="这次行动的变化">${effects(h)}</div>
        ${state.minutes > G.deadline ? '<p class="notice">已经错过日落，仍可完成这次出发。结算时可以回头试另一条路。</p>' : ''}
        <button class="primary" id="next">${state.step === 5 ? '看看今天完成了什么' : '继续往前走'} <span>→</span></button></article>`
        : `<article class="scene"><p class="eyebrow">第 ${state.step + 1} / 5 步 · ${G.places[state.step]} ${sc.event ? '· 随机路况' : ''}</p>
        <div class="scene-heading"><span class="scene-icon" aria-hidden="true">${sc.icon}</span><h1>${sc.title}</h1></div><p class="story">${sc.text}</p>
        <div class="choices">${sc.options.map((o, i) => `<button class="choice" data-choice="${i}" ${o.disabledReason ? 'disabled' : ''}>
          <span class="choice-title"><span class="letter">${String.fromCharCode(65 + i)}</span><b>${o.title}</b><span aria-hidden="true">→</span></span>
          <span class="choice-effects">${effects(o)}</span>
          ${o.disabledReason ? `<span class="lock">🔒 ${o.disabledReason}</span>` : state.minutes + o.minutes > G.deadline ? `<span class="warning">选完是 ${G.clock(state.minutes + o.minutes)}，会错过日落</span>` : `<span class="after-time">选完是 ${G.clock(state.minutes + o.minutes)}</span>`}
        </button>`).join('')}</div></article>`}
      <div class="play-actions">${state.step ? '<button class="text-button" id="back">↶ 回到上一步</button>' : ''}<button class="text-button" id="home">回首页</button><span>${storageFailed ? '未能存档，请勿关闭' : '已自动存档'}</span></div></section>`;
    if (feedback) document.querySelector('#next').onclick = () => { feedback = false; render(); focusMain(); };
    else app.querySelectorAll('[data-choice]').forEach(button => button.onclick = () => {
      state = G.choose(state, Number(button.dataset.choice)); feedback = true; render(); focusMain();
    });
    bindNavigation();
  }
  function bindNavigation() {
    const back = document.querySelector('#back');
    if (back) back.onclick = () => { state = G.rewind(state); feedback = false; render(); focusMain(); };
    document.querySelector('#home').onclick = () => { home(); focusMain(); };
  }
  function ending() {
    const e = G.outcome(state), done = G.goals(state).filter(g => g.done).length;
    app.innerHTML = `<section class="ending"><p class="eyebrow">今天的出发记录 · ${done} / 3 个目标完成</p>${landscape}
      <h1>${e.title}</h1>${goalList(state)}<p class="story">${e.text}</p>
      <div class="result-stats"><span>到达 <b>${G.clock(state.minutes)}</b></span><span>还剩 <b>¥${state.cash}</b></span><span>同行 <b>${state.buddy ? '2 人' : '1 人'}</b></span></div>
      <p class="advice">${e.advice}</p>
      <button class="primary" id="retry">同一条路，再试一次 <span>↻</span></button>
      <div class="end-actions"><button class="secondary" id="back">回到最后一个选择</button><button class="secondary" id="share">复制今天的小票</button></div>
      <details class="history"><summary>这一路，我是怎么选的？</summary>${state.history.map((h, i) => `<div><b>${i + 1}. ${h.title}</b><p>${h.reply}</p><small>${h.minutes} 分钟${h.cash ? ` · 零钱 ${h.cash > 0 ? '+' : '−'}¥${Math.abs(h.cash)}` : ''}</small></div>`).join('')}</details>
      <button class="text-button" id="home">回首页，换一天出发 →</button><p class="save-note">${storageFailed ? '未能存档，请勿关闭页面' : '已自动存档'}</p></section>`;
    document.querySelector('#retry').onclick = () => begin(state.seed);
    bindNavigation();
    document.querySelector('#share').onclick = async () => {
      const text = `🍟 去码头整点薯条\n${e.title}\n${G.clock(state.minutes)} 到达 · 剩余 ¥${state.cash} · ${done}/3 个目标完成\n${e.text}\n麦门人生模拟器 · 虚构游戏记录，不是实际消费凭证。`;
      try { await navigator.clipboard.writeText(text); document.querySelector('#share').textContent = '小票已复制 ✓'; }
      catch (_) {
        document.querySelector('#share-text').value = text; document.querySelector('#share-dialog').showModal();
        document.querySelector('#share-text').select();
      }
    };
  }
  document.querySelector('#close-share').onclick = () => document.querySelector('#share-dialog').close();
  document.querySelector('.brand').onclick = event => { event.preventDefault(); home(); focusMain(); };
  home();
})();
