(() => {
  'use strict';
  const G = window.LifeGame;
  const app = document.querySelector('#app');
  const totalEndings = Object.keys(G.endings).length;
  const storageKey = 'maimen-endings-v2';
  let state = null, selected = 'student', feedback = false, busy = false;
  let collection = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) collection = [...new Set(saved.filter(x => typeof x === 'string' && Object.hasOwn(G.endings, x)))];
  } catch (_) { /* A blocked storage API should never block a game. */ }
  const burger = `<svg viewBox="0 0 360 300" aria-hidden="true" class="burger-art"><ellipse cx="180" cy="265" rx="130" ry="17" fill="#541c20" opacity=".12"/><g transform="rotate(-9 180 150)"><path d="M65 131C69 40 291 40 295 131Z" fill="#eda73b" stroke="#612a24" stroke-width="5"/><path d="M80 110C112 49 242 54 272 107" fill="none" stroke="#ffc960" stroke-width="13" stroke-linecap="round"/><g stroke="#fff1c8" stroke-width="7" stroke-linecap="round"><path d="M122 86l7 4m40-17l6 5m42 0l-3 6m31 14l7-2m-98 12l5-4"/></g><path d="M60 145q18-18 38 0t38 0t38 0t38 0t38 0t48 0l-5 25H66Z" fill="#7b9948" stroke="#612a24" stroke-width="5"/><rect x="60" y="170" width="240" height="32" rx="16" fill="#74382b" stroke="#612a24" stroke-width="5"/><path d="M64 163h229l-56 29-62-18-51 22Z" fill="#ffcc45" stroke="#612a24" stroke-width="4"/><path d="M67 209h227q-2 44-47 44H114q-47 0-47-44Z" fill="#e8a044" stroke="#612a24" stroke-width="5"/><path d="M93 231q70 18 174 0" fill="none" stroke="#f8bc61" stroke-width="10" stroke-linecap="round"/></g></svg>`;
  function toast(text) {
    const el = document.querySelector('#toast');
    el.textContent = text; el.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('visible'), 2400);
  }
  function focusHeading() {
    const h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function gallery() {
    return `<details class="ending-gallery"><summary>人生档案室 <b>${collection.length} / ${totalEndings}</b><span>展开查看已解锁人生 ↓</span></summary>
      <div class="gallery-grid">${G.routes.map(r => {
        const entries = Object.values(G.endings).filter(e => e.routeId === r.id);
        return `<section><h3>${r.icon} ${r.label} <small>${entries.filter(e => collection.includes(e.key)).length}/4</small></h3>
          ${entries.map(e => `<p class="${collection.includes(e.key) ? 'unlocked' : ''}">${collection.includes(e.key) ? '✓ ' + e.title : '？ 尚未发生的人生'}</p>`).join('')}</section>`;
      }).join('')}</div></details>`;
  }
  function renderHome() {
    state = null; feedback = false;
    app.innerHTML = `<section class="home-grid"><div class="hero-copy">
      <div class="eyebrow"><span class="short-line"></span> ONE LUNCH. NINE WRONG TURNS.</div>
      <h1>只想吃饭，<br>怎么<span class="underlined">人生变了？</span></h1>
      <p class="intro">出门前是普通人，回家时成了宇宙客服。<br>你选的每一步，命运都会认真地理解错。</p>
      <div class="hero-art">${burger}<span class="art-star star-one">✦</span><span class="art-star star-two">?!</span>
        <div class="round-stamp">人生正在<br><b>逐渐失控</b></div><span class="art-caption">THIS WAS SUPPOSED TO BE A LUNCH BREAK.</span></div>
      <div class="game-facts"><span>↗ 9 条分支路线</span><span>⚑ ${totalEndings} 种离谱人生</span><span>↶ 随时回到岔路</span></div>
      </div><section class="ticket select-ticket"><div class="ticket-top"><span>CHAOS EDITION / 失控版</span><span>VER. 2.0</span></div>
      <div class="ticket-body"><span class="eyebrow muted">STEP 01 · 选个倒霉蛋</span><h2>今天，从谁开始？</h2><p class="section-sub">请选择你希望被命运误会的身份。</p>
      <div class="role-list">${G.roles.map(r => `<button class="role-card ${r.id === selected ? 'selected' : ''}" data-role="${r.id}" aria-pressed="${r.id === selected}">
        <span class="role-emoji">${r.icon}</span><span class="role-info"><small>${r.label} · 启动资金 ¥${r.cash}</small><strong>${r.name}</strong><span>${r.subtitle}</span></span><span class="role-radio" aria-hidden="true"></span></button>`).join('')}</div>
      <button class="primary start-button" id="start">开始，后果自负！ <span>↗</span></button>
      <p class="tiny center">3 次选择改变职业轨迹 · 约 3 分钟 · 可回溯</p></div>
      <div class="ticket-bottom"><span>已发生的人生 <b>${collection.length} / ${totalEndings}</b></span><span>下一次能有多离谱？</span></div></section></section>${gallery()}`;
    app.querySelectorAll('[data-role]').forEach(el => el.onclick = () => {
      selected = el.dataset.role; renderHome();
      app.querySelector(`[data-role="${selected}"]`).focus({ preventScroll: true });
    });
    document.querySelector('#start').onclick = () => { state = G.start(selected); renderGame(); focusHeading(); };
  }
  function sidebar() {
    const role = G.roles.find(r => r.id === state.roleId), route = G.route(state);
    return `<aside class="status-panel"><span class="eyebrow muted">IDENTITY MAY CHANGE</span>
      <div class="player"><span>${role.icon}</span><div><h2>${role.name}</h2><small>开局身份 · 仅供参考</small></div></div>
      <div class="wallet"><span>剩余现金</span><strong><small>¥</small>${state.cash}<small>.00</small></strong></div>
      <div class="stat"><div><span>🧠 理智</span><b>${state.energy} / 100</b></div><div class="meter"><i style="width:${state.energy}%"></i></div></div>
      <div class="stat mood"><div><span>🌀 离谱值</span><b>${state.mood} / 100</b></div><div class="meter"><i style="width:${state.mood}%"></i></div></div>
      <div class="worldline"><small>当前世界线</small><strong>${route ? route.icon + ' ' + route.label : '尚未发生事故'}</strong><span>${state.identity}</span></div>
      ${state.inventory.length ? `<div class="inventory"><small>你现在居然有</small>${state.inventory.map(x => `<span>▣ ${x}</span>`).join('')}</div>` : ''}
      <div class="mini-note"><span>✳ 命运备注</span><p>${route ? '世界线已经分叉。回到上个岔路可以恢复当时的身份、物品和数值。' : role.intro}</p></div>
      <div class="sidebar-actions">${state.history.length ? '<button class="text-button" id="back-choice">↶ 回到上个岔路</button>' : ''}<button class="text-button" id="restart">重选角色</button></div>
      <p class="tiny">理智与离谱值仅为游戏表现，结局由选择决定。</p></aside>`;
  }
  function goBack() { state = G.rewind(state); feedback = false; renderGame(); focusHeading(); }
  function bindSidebar() {
    document.querySelector('#restart').onclick = () => {
      if (window.confirm('结束这一局，重新挑一个倒霉蛋？')) { renderHome(); focusHeading(); }
    };
    const back = document.querySelector('#back-choice');
    if (back) back.onclick = goBack;
  }
  function effect(o) {
    return [o.cash ? `现金 ${o.cash > 0 ? '+' : '−'}¥${Math.abs(o.cash)}` : null,
      o.energy ? `理智 ${o.energy > 0 ? '+' : '−'}${Math.abs(o.energy)}` : null,
      o.mood ? `离谱值 ${o.mood > 0 ? '+' : '−'}${Math.abs(o.mood)}` : null].filter(Boolean).join(' · ');
  }
  function renderGame() {
    const current = feedback ? null : G.scene(state);
    const step = feedback ? state.step : state.step + 1;
    const labels = ['一念之差', '越描越黑', '人生拐弯'];
    const last = state.history.at(-1), route = G.route(state);
    app.innerHTML = `<section class="play-layout">${sidebar()}<section class="story-panel">
      <nav class="progress" aria-label="剧情进度">${labels.map((label, i) => `<span class="${i < step ? 'active' : ''}"><i>${i + 1}</i><span>${label}</span></span>`).join('')}</nav>
      <div class="story-content"><div class="eyebrow muted">CHAPTER 0${step} / 0${G.totalStages}<span class="chapter-line"></span>${route ? route.label : '命运尚未开机'}</div>
      ${feedback ? `<div class="feedback-emoji">${state.endingId ? '⚑' : '?!'}</div><h1>${state.endingId ? '事情，彻底定性了。' : '事情开始不对劲了。'}</h1>
        <p class="story-lead">${last.reply}</p>
        ${last.identity ? `<div class="identity-change"><small>身份发生变化</small><strong>${last.identity}</strong><span>获得物品：${last.item}</span></div>` : ''}
        ${state.step === 1 ? `<div class="identity-change"><small>已进入新世界线</small><strong>${route.icon} ${route.label}</strong><span>命运已经听见了。建议想好下一句再说。</span></div>` : ''}
        <div class="choice-memory">全怪你选了：${last.choice}</div><button class="primary continue" id="next">${state.endingId ? '先吃一口，再看三年后' : '我倒要看看还能怎样'} <span>→</span></button>`
        : `<h1>${current.title}</h1><p class="story-lead">${current.text}</p>
        <div class="chat-bubble"><small>${current.speaker}</small><p>${current.message}</p></div>
        <div class="choose-label">接下来的人生，取决于你这一次嘴硬。</div>
        <div class="options">${current.options.map((o, i) => `<button class="option" data-choice="${i}"><span class="option-letter">${String.fromCharCode(65 + i)}</span>
          <span><strong>${o.title}</strong><small>${o.desc}</small><em>${effect(o)}${o.finish ? ' · 决定最终人生' : ' · 进入不同事件'}</em></span><span class="option-arrow">↗</span></button>`).join('')}</div>`}
      </div></section></section>`;
    bindSidebar();
    if (feedback) document.querySelector('#next').onclick = () => { feedback = false; state.endingId ? renderMeals() : renderGame(); focusHeading(); };
    else app.querySelectorAll('[data-choice]').forEach(el => el.onclick = () => { state = G.choose(state, Number(el.dataset.choice)); feedback = true; renderGame(); focusHeading(); });
  }
  function renderMeals() {
    app.innerHTML = `<section class="play-layout">${sidebar()}<section class="story-panel"><div class="story-content meal-content">
      <div class="eyebrow muted">CAREER CHANGED. LUNCH PENDING.</div><h1>人生已脱轨，先把饭吃完。</h1>
      <p class="story-lead">职业轨迹已被你改写。还有 <b>¥${state.cash}</b>，吃完这顿，直接快进到三年后。</p>
      <div class="demo-note">ⓘ 虚构套餐与模拟价格。点餐影响小尾声，不会覆盖你已经选定的人生。</div>
      <div class="meal-grid">${G.meals.map(m => `<button class="meal-card" data-meal="${m.id}" ${state.cash < m.price ? 'disabled' : ''}>
        <span class="meal-emoji">${m.icon}</span><h2>${m.name}</h2><p>${m.items}</p><small>${m.note}</small><span class="meal-effects">理智 +${m.energy}${m.mood ? ' · 离谱值 +' + m.mood : ''}</span>
        <div><strong>¥${m.price}<small>.00</small></strong><span>${state.cash < m.price ? '预算不足' : '吃完看结局 ↗'}</span></div></button>`).join('')}</div>
      <p class="tiny">游戏内消费，不创建真实订单。猫国目前也不报销。</p></div></section></section>`;
    bindSidebar();
    app.querySelectorAll('[data-meal]').forEach(el => el.onclick = () => {
      state = G.dine(state, el.dataset.meal);
      collection = [...new Set([...collection, G.ending(state).key])];
      try { localStorage.setItem(storageKey, JSON.stringify(collection)); } catch (_) {}
      renderEnding(); focusHeading();
    });
  }
  function renderEnding() {
    const e = G.ending(state), meal = G.meals.find(m => m.id === state.mealId), role = G.roles.find(r => r.id === state.roleId);
    app.innerHTML = `<section class="ending-layout"><div class="ending-copy">
      <div class="eyebrow"><span class="short-line"></span> THREE YEARS LATER / 三年后</div><div class="ending-icon">${e.icon}</div>
      <span class="ending-tag">${e.routeLabel} · 第 ${Object.keys(G.endings).indexOf(e.key) + 1} 号人生</span><h1>${e.title}</h1>
      <p class="ending-quote">“${e.quote}”</p><p class="intro future-story">${e.description}</p>
      <div class="meal-epilogue"><small>而这一切，始于那顿午饭</small><p>${e.mealEpilogue}</p></div>
      <div class="end-stats"><div><strong>${state.energy}</strong><span>残存理智</span></div><div><strong>${state.mood}</strong><span>离谱指数</span></div><div><strong>¥${state.cash}</strong><span>当日余额</span></div></div>
      <div class="end-actions"><button class="primary" id="rewind">回到上个岔路 ↶</button><button class="secondary" id="again">换个人生开局</button><button class="secondary" id="share">复制事故报告</button></div>
      <p class="tiny">已收集 ${collection.length} / ${totalEndings} 种人生。回溯会恢复选择前的状态，已解锁记录保留。</p></div>
      <section class="ticket receipt"><div class="ticket-top"><span>LIFE INCIDENT REPORT</span><span>CASE ${String(Object.keys(G.endings).indexOf(e.key) + 1).padStart(2, '0')}</span></div>
      <div class="ticket-body"><h2>人生事故小票</h2><p class="receipt-sub">麦门人生模拟器 / 你当时真是这么选的</p><div class="receipt-divider"></div>
      <div class="receipt-row"><span>出门时</span><b>${role.name}</b></div><div class="receipt-row"><span>三年后</span><b>${e.title}</b></div>
      <div class="journey">${state.history.map((h, i) => `<div><span>0${i + 1}</span><p><b>${h.title}</b><br>↳ ${h.choice}${h.identity ? '<br><em>身份 → ' + h.identity + '</em>' : ''}</p></div>`).join('')}</div>
      <div class="receipt-row"><span>遗留证物</span><b>${state.inventory.join('、') || '一张小票'}</b></div>
      <div class="receipt-meal"><span>${meal.icon}</span><div><b>${meal.name}</b><small>${meal.items}</small></div><strong>¥${meal.price}</strong></div>
      <div class="receipt-divider"></div><div class="receipt-row total"><span>当日花费</span><b>¥${role.cash - state.cash}.00</b></div>
      <div class="receipt-row"><span>人生维修费</span><b>暂时无法估算</b></div><div class="barcode" aria-hidden="true"></div>
      <p class="tiny center">NO REFUNDS ON DESTINY. BUT YOU CAN REWIND.<br>这是虚构游戏记录，不是实际消费凭证。</p></div></section></section>${gallery()}`;
    document.querySelector('#rewind').onclick = goBack;
    document.querySelector('#again').onclick = () => { renderHome(); focusHeading(); };
    document.querySelector('#share').onclick = async () => {
      if (busy) return; busy = true;
      const text = `🍟 麦门人生事故报告：${e.title}\n${e.quote}\n\n出门时我是${role.name}：\n${state.history.map(h => '→ ' + h.choice).join('\n')}\n\n${e.description}\n\n最后吃了${meal.name}，当日余额 ¥${state.cash}。\n麦门人生模拟器 · 虚构剧情与模拟价格，非官方试玩。`;
      try {
        if (!navigator.clipboard) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(text); toast('事故报告已复制。建议别发给导师。');
      } catch (_) {
        document.querySelector('#share-text').value = text;
        document.querySelector('#share-dialog').showModal(); document.querySelector('#share-text').select();
      } finally { busy = false; }
    };
  }
  document.querySelector('#close-share').onclick = () => document.querySelector('#share-dialog').close();
  document.querySelector('.brand').onclick = event => {
    event.preventDefault();
    if (!state || state.mealId || window.confirm('结束这场事故，返回首页？')) { renderHome(); focusHeading(); }
  };
  renderHome();
})();
