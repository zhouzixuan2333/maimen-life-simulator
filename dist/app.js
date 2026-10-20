(() => {
  'use strict';
  const G = window.LifeGame;
  const app = document.querySelector('#app');
  const totalEndings = Object.keys(G.endings).length;
  const storageKey = 'maimen-endings-v2';
  let state = null, selected = 'student', feedback = false, busy = false;
  let collection = [];
  let resumeRecord = null, saveFailed = false;
  const sessionKey = 'maimen-session-v3';
  let sceneFrame = 0, wholeScene = false;
  function resetReading() { sceneFrame = 0; }
  function paragraphs(text) {
    // Sentence boundaries only change layout; every original character is retained.
    const parts = typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter('zh', { granularity: 'sentence' }).segment(text), x => x.segment)
      : [text];
    return parts.map(x => `<p>${x}</p>`).join('');
  }
  try {
    const saved = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    if (saved) { const restored = G.restore(saved.game); resumeRecord = { game: G.serialize(restored), feedback: Boolean(saved.feedback) && restored.history.length > 0 }; }
  } catch (_) { /* Ignore invalid saves without rendering untrusted content. */ }
  function saveProgress() {
    if (!state) return;
    resumeRecord = { game: G.serialize(state), feedback };
    try { localStorage.setItem(sessionKey, JSON.stringify(resumeRecord)); saveFailed = false; }
    catch (_) { saveFailed = true; }
  }
  function discardProgress() {
    resumeRecord = null;
    try { localStorage.removeItem(sessionKey); } catch (_) {}
  }
  function resumeGame() {
    if (!resumeRecord) return;
    resetReading();
    state = G.restore(resumeRecord.game); selected = state.roleId; feedback = Boolean(resumeRecord.feedback);
    if (state.mealId) renderEnding();
    else if (state.endingId && !feedback) renderMeals();
    else renderGame();
    focusHeading();
  }
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
    const playPanel = state ? app.querySelector('.play-layout') : null;
    if (playPanel) playPanel.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function gallery() {
    return `<details class="ending-gallery"><summary>人生档案室 <b>${collection.length} / ${totalEndings}</b><span>展开查看已解锁人生 ↓</span></summary>
      <div class="gallery-grid">${G.routes.map(r => {
        const entries = Object.values(G.endings).filter(e => e.routeId === r.id);
        return `<section><h3>${r.icon} ${r.label} <small>${entries.filter(e => collection.includes(e.key)).length}/${entries.length}</small></h3>
          ${entries.map(e => `<p class="${collection.includes(e.key) ? 'unlocked' : ''}">${collection.includes(e.key) ? '✓ ' + e.title : e.secret ? '🔒 隐藏人生 · 待满足条件' : '？ 尚未发生的人生'}</p>`).join('')}</section>`;
      }).join('')}</div></details>`;
  }
  function renderHome() {
    state = null; feedback = false; resetReading();
    app.innerHTML = `<section class="home-grid"><div class="hero-copy">
      <div class="eyebrow"><span class="short-line"></span> ONE LUNCH. NINE WRONG TURNS.</div>
      <h1>只想吃饭，<br>怎么<span class="underlined">人生变了？</span></h1>
      <p class="intro">出门前是普通人，回家时成了宇宙客服。<br>你选的每一步，命运都会认真地理解错。</p>
      <div class="hero-art">${burger}<span class="art-star star-one">✦</span><span class="art-star star-two">?!</span>
        <div class="round-stamp">人生正在<br><b>逐渐失控</b></div><span class="art-caption">THIS WAS SUPPOSED TO BE A LUNCH BREAK.</span></div>
      <div class="game-facts"><span>🎲 3 次随机遭遇</span><span>▣ 道具解锁选项</span><span>⚑ ${totalEndings} 种人生</span></div>
      </div><section class="ticket select-ticket"><div class="ticket-top"><span>LONG PLAY / 长篇失控版</span><span>VER. 3.0</span></div>
      <div class="ticket-body"><span class="eyebrow muted">STEP 01 · 选个倒霉蛋</span><h2>今天，从谁开始？</h2><p class="section-sub">请选择你希望被命运误会的身份。</p>
      <div class="role-list">${G.roles.map(r => `<button class="role-card ${r.id === selected ? 'selected' : ''}" data-role="${r.id}" aria-pressed="${r.id === selected}">
        <span class="role-emoji">${r.icon}</span><span class="role-info"><small>${r.label} · 启动资金 ¥${r.cash}</small><strong>${r.name}</strong><span>${r.subtitle}</span></span><span class="role-radio" aria-hidden="true"></span></button>`).join('')}</div>
      <button class="primary start-button" id="start">开始，后果自负！ <span>↗</span></button>
      ${resumeRecord ? `<button class="secondary resume-button" id="resume">${resumeRecord.game.mealId ? '查看上次人生' : `继续上次冒险 · 已完成 ${resumeRecord.game.choices.length}/9 次选择`} →</button>` : ''}
      <p class="tiny center">每局 9 次选择 · 约 8 分钟 · 本机自动存档</p></div>
      <div class="ticket-bottom"><span>已发生的人生 <b>${collection.length} / ${totalEndings}</b></span><span>下一次能有多离谱？</span></div></section></section>${gallery()}`;
    app.querySelectorAll('[data-role]').forEach(el => el.onclick = () => {
      selected = el.dataset.role; renderHome();
      app.querySelector(`[data-role="${selected}"]`).focus({ preventScroll: true });
    });
    document.querySelector('#start').onclick = () => { state = G.start(selected); renderGame(); focusHeading(); };
    const resume = document.querySelector('#resume'); if (resume) resume.onclick = resumeGame;
  }
  function sidebar() {
    const role = G.roles.find(r => r.id === state.roleId), route = G.route(state);
    return `<aside class="player-tools"><details class="status-drawer"><summary><span>${role.icon} <b>${state.identity}</b></span><span>¥${state.cash} · 背包 ${state.inventory.length} <span class="drawer-hint">查看 ▾</span></span></summary><div class="status-panel"><span class="eyebrow muted">IDENTITY MAY CHANGE</span>
      <div class="player"><span>${role.icon}</span><div><h2>${role.name}</h2><small>开局身份 · 仅供参考</small></div></div>
      <div class="wallet"><span>剩余现金</span><strong><small>¥</small>${state.cash}<small>.00</small></strong></div>
      <div class="stat"><div><span>🧠 理智</span><b>${state.energy} / 100</b></div><div class="meter"><i style="width:${state.energy}%"></i></div></div>
      <div class="stat mood"><div><span>🌀 离谱值</span><b>${state.mood} / 100</b></div><div class="meter"><i style="width:${state.mood}%"></i></div></div>
      <div class="worldline"><small>当前世界线</small><strong>${route ? route.icon + ' ' + route.label : '尚未发生事故'}</strong><span>${state.identity}</span></div>
      ${state.inventory.length ? `<div class="inventory"><small>背包 · 选项会检查这些物品</small>${state.inventory.map(x => `<span>▣ ${x}</span>`).join('')}</div>` : ''}
      <div class="quest-status"><span class="${state.flags.includes('validated') ? 'done' : ''}">${state.flags.includes('validated') ? '✓' : '○'} 资格认证</span><span class="${state.flags.includes('resolved') ? 'done' : ''}">${state.flags.includes('resolved') ? '✓' : '○'} 身份危机已解决</span><span class="${state.credential && state.inventory.includes(state.credential) ? 'done' : ''}">${state.credential && state.inventory.includes(state.credential) ? '✓' : '○'} 持有原始凭证</span></div>
      <div class="mini-note"><span>✳ 命运备注</span><p>${route ? '随机事件每局固定。回溯不会重新抽签，换一个选择仍会改变物品和后续条件。' : role.intro}</p></div>
      </div></details><div class="sidebar-actions">${state.history.length ? '<button class="text-button" id="back-choice">↶ 回到上个岔路</button>' : ''}<button class="text-button" id="restart">重选角色</button><span class="tiny save-status">${saveFailed ? '未能存档，请勿关闭页面' : '已自动存档'}</span></div></aside>`;
  }
  function goBack() { state = G.rewind(state); feedback = false; resetReading(); renderGame(); focusHeading(); }
  function bindSidebar() {
    document.querySelector('#restart').onclick = () => {
      if (window.confirm('结束这一局，重新挑一个倒霉蛋？')) { discardProgress(); renderHome(); focusHeading(); }
    };
    const back = document.querySelector('#back-choice');
    if (back) back.onclick = goBack;
  }
  function effect(o) {
    return [o.cash ? `现金 ${o.cash > 0 ? '+' : '−'}¥${Math.abs(o.cash)}` : null,
      o.energy ? `理智 ${o.energy > 0 ? '+' : '−'}${Math.abs(o.energy)}` : null,
      o.mood ? `离谱值 ${o.mood > 0 ? '+' : '−'}${Math.abs(o.mood)}` : null].filter(Boolean).join(' · ');
  }
  function sceneReading(current, route) {
    const showChoices = wholeScene || sceneFrame === 1;
    return `<div class="reading-toolbar"><span>${wholeScene ? '整幕阅读' : sceneFrame === 0 ? '① 发生了什么' : '② 轮到你了'}</span><button class="text-button" id="reading-mode">${wholeScene ? '切回分镜' : '整幕展开'}</button></div>
      <h1>${current.title}</h1>
      ${!showChoices || wholeScene ? `<div class="scene-card"><span class="scene-icon" aria-hidden="true">${current.random ? '🎲' : route?.icon || '🍟'}</span><div class="narration">${paragraphs(current.text)}</div></div>` : `<details class="scene-recap"><summary>回看刚才发生的事</summary><div class="narration">${paragraphs(current.text)}</div></details>`}
      ${showChoices ? `<div class="dialogue-card"><span class="dialogue-label">${current.speaker}</span><div class="dialogue-message">${paragraphs(current.message)}</div></div>
        <div class="choose-label">你打算怎么办？<span>点开看说明，再决定</span></div>
        <div class="options">${current.options.map((o, i) => `<article class="choice-card ${o.disabledReason ? 'choice-locked' : ''}">
          <button class="option" id="option-${i}" data-preview="${i}" aria-expanded="false" aria-controls="choice-detail-${i}"><span class="option-letter">${String.fromCharCode(65 + i)}</span><span><strong>${o.title}</strong>${o.disabledReason ? `<em class="lock-reason">🔒 ${o.disabledReason}</em>` : o.finish ? '<em>⚑ 决定最终人生</em>' : ''}</span><span class="option-arrow" aria-hidden="true">＋</span></button>
          <div class="choice-detail" id="choice-detail-${i}" hidden><p>${o.desc}</p>${effect(o) ? `<div class="effect-chips">${effect(o).split(' · ').map(x => `<span>${x}</span>`).join('')}</div>` : ''}
          ${o.disabledReason ? '<p class="unavailable-note">条件未满足，看看其他办法。</p>' : `<button class="primary choice-confirm" data-choice="${i}" aria-label="就这么办：${o.title}">就这么办 <span>→</span></button>`}</div>
        </article>`).join('')}</div>` : '<button class="primary read-next" id="read-next">接着看 <span>→</span></button><p class="tiny reading-hint">按自己的节奏读，下一幕才需要做选择。</p>'}`;
  }
  function renderGame() {
    saveProgress();
    const current = feedback ? null : G.scene(state);
    const step = feedback ? state.step : state.step + 1;
    const labels = G.chapterLabels;
    const last = state.history.at(-1), route = G.route(state);
    app.innerHTML = `<section class="play-layout">${sidebar()}<section class="story-panel">
      <div class="chapter-header"><span>第 ${step} / ${G.totalStages} 章 · ${labels[step - 1]}</span><span>${route ? route.icon + ' ' + route.label : '命运尚未开机'}</span></div>
      <details class="chapter-map"><summary><span class="chapter-track" aria-hidden="true">${labels.map((_, i) => `<i class="${i < step ? 'active' : ''}"></i>`).join('')}</span><span>章节地图</span></summary><nav class="progress" aria-label="剧情进度">${labels.map((label, i) => `<span class="${i < step ? 'active' : ''}" ${i === step - 1 ? 'aria-current="step"' : ''}><i>${i + 1}</i><span>${label}</span></span>`).join('')}</nav></details>
      <div class="story-content">${!feedback && current.random ? '<div class="random-banner">🎲 随机遭遇 · 本局回溯时保留同一事件</div>' : ''}
      ${feedback ? `<div class="feedback-heading"><span class="feedback-emoji">${state.endingId ? '⚑' : '?!'}</span><h1>${state.endingId ? '事情，彻底定性了。' : '事情开始不对劲了。'}</h1></div>
        <div class="choice-memory">你刚刚：${last.choice}</div><div class="scene-card feedback-card"><div class="narration">${paragraphs(last.reply)}</div></div>
        ${last.identity ? `<div class="identity-change"><small>身份发生变化</small><strong>${last.identity}</strong></div>` : ''}
        ${last.gained.length || last.consumed.length || last.cash ? `<div class="item-changes">${last.gained.map(x => `<span>＋ 获得：${x}</span>`).join('')}${last.consumed.map(x => `<span class="spent">− 消耗 / 寄存：${x}</span>`).join('')}${last.cash ? `<span>现金 ${last.cash > 0 ? '+' : '−'}¥${Math.abs(last.cash)}</span>` : ''}</div>` : ''}
        ${state.step === 1 ? `<div class="identity-change"><small>已进入新世界线</small><strong>${route.icon} ${route.label}</strong><span>命运已经听见了。建议想好下一句再说。</span></div>` : ''}
        <button class="primary continue" id="next">${state.endingId ? '先吃一口，再看三年后' : '我倒要看看还能怎样'} <span>→</span></button>`
        : sceneReading(current, route)}
      </div></section></section>`;
    bindSidebar();
    if (feedback) document.querySelector('#next').onclick = () => { feedback = false; resetReading(); state.endingId ? renderMeals() : renderGame(); focusHeading(); };
    else {
      document.querySelector('#reading-mode').onclick = () => {
        wholeScene = !wholeScene; renderGame(); document.querySelector('#reading-mode').focus({ preventScroll: true });
      };
      const readNext = document.querySelector('#read-next');
      if (readNext) readNext.onclick = () => { sceneFrame = 1; renderGame(); focusHeading(); };
      app.querySelectorAll('[data-preview]').forEach(el => el.onclick = () => {
        const expand = el.getAttribute('aria-expanded') !== 'true';
        app.querySelectorAll('[data-preview]').forEach(button => {
          const open = button === el && expand;
          button.setAttribute('aria-expanded', String(open));
          button.querySelector('.option-arrow').textContent = open ? '−' : '＋';
          document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
        });
      });
      app.querySelectorAll('[data-choice]').forEach(el => el.onclick = () => { state = G.choose(state, Number(el.dataset.choice)); feedback = true; resetReading(); renderGame(); focusHeading(); });
    }
  }
  function renderMeals() {
    saveProgress();
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
    saveProgress();
    const e = G.ending(state), meal = G.meals.find(m => m.id === state.mealId), role = G.roles.find(r => r.id === state.roleId);
    app.innerHTML = `<section class="ending-layout"><div class="ending-copy">
      <div class="eyebrow"><span class="short-line"></span> THREE YEARS LATER / 三年后</div><div class="ending-icon">${e.icon}</div>
      <span class="ending-tag">${e.routeLabel} · 第 ${Object.keys(G.endings).indexOf(e.key) + 1} 号人生</span><h1>${e.title}</h1>
      <p class="ending-quote">“${e.quote}”</p><div class="intro future-story">${paragraphs(e.description)}</div>${e.consequences.length ? `<details class="consequences"><summary>前面的选择，留下了 ${e.consequences.length} 个后果</summary>${e.consequences.map(x => `<p>${x}</p>`).join('')}</details>` : ''}
      <div class="meal-epilogue"><small>而这一切，始于那顿午饭</small><p>${e.mealEpilogue}</p></div>
      <div class="end-stats"><div><strong>${state.energy}</strong><span>残存理智</span></div><div><strong>${state.mood}</strong><span>离谱指数</span></div><div><strong>¥${state.cash}</strong><span>当日余额</span></div></div>
      <div class="end-actions"><button class="primary" id="rewind">回到上个岔路 ↶</button><button class="secondary" id="again">换个人生开局</button><button class="secondary" id="share">复制事故报告</button></div>
      <p class="tiny">已收集 ${collection.length} / ${totalEndings} 种人生。回溯会恢复选择前的状态，已解锁记录保留。</p></div>
      <section class="ticket receipt"><div class="ticket-top"><span>LIFE INCIDENT REPORT</span><span>CASE ${String(Object.keys(G.endings).indexOf(e.key) + 1).padStart(2, '0')}</span></div>
      <div class="ticket-body"><h2>人生事故小票</h2><p class="receipt-sub">麦门人生模拟器 / 你当时真是这么选的</p><div class="receipt-divider"></div>
      <div class="receipt-row"><span>出门时</span><b>${role.name}</b></div><div class="receipt-row"><span>三年后</span><b>${e.title}</b></div>
      <details class="journey-log"><summary>展开完整的 ${state.history.length} 次人生转折 ↓</summary><div class="journey">${state.history.map((h, i) => `<div><span>0${i + 1}</span><p><b>${h.title}</b><br>↳ ${h.choice}${h.identity ? '<br><em>身份 → ' + h.identity + '</em>' : ''}${h.gained.length ? '<br><em>获得：' + h.gained.join('、') + '</em>' : ''}${h.consumed.length ? '<br><em>失去：' + h.consumed.join('、') + '</em>' : ''}</p></div>`).join('')}</div></details>
      <div class="receipt-row"><span>遗留证物</span><b>${state.inventory.join('、') || '一张小票'}</b></div>
      <div class="receipt-meal"><span>${meal.icon}</span><div><b>${meal.name}</b><small>${meal.items}</small></div><strong>¥${meal.price}</strong></div>
      <div class="receipt-divider"></div><div class="receipt-row total"><span>当日支出</span><b>¥${meal.price - state.history.reduce((sum, h) => sum + Math.min(0, h.cash), 0)}.00</b></div>
      <div class="receipt-row"><span>途中收入</span><b>¥${state.history.reduce((sum, h) => sum + Math.max(0, h.cash), 0)}.00</b></div><div class="receipt-row"><span>人生维修费</span><b>暂时无法估算</b></div><div class="barcode" aria-hidden="true"></div>
      <p class="tiny center">NO REFUNDS ON DESTINY. BUT YOU CAN REWIND.<br>这是虚构游戏记录，不是实际消费凭证。</p></div></section></section>${gallery()}`;
    document.querySelector('#rewind').onclick = goBack;
    document.querySelector('#again').onclick = () => { renderHome(); focusHeading(); };
    document.querySelector('#share').onclick = async () => {
      if (busy) return; busy = true;
      const text = `🍟 麦门人生事故报告：${e.title}\n${e.quote}\n\n出门时我是${role.name}：\n${state.history.map(h => '→ ' + h.choice).join('\n')}\n\n${e.description}\n${e.consequences.join('\n')}\n\n最后吃了${meal.name}，当日余额 ¥${state.cash}。\n麦门人生模拟器 · 虚构剧情与模拟价格，非官方试玩。`;
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
