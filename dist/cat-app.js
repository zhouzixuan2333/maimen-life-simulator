(() => {
  'use strict';
  const G = window.CatGame, V = window.CatScene, app = document.querySelector('#app');
  const saveKey = 'maimen-cat-life-v1', prefsKey = 'maimen-cat-motion-v1', namesKey = 'maimen-cat-names-v1';
  let preferredNames = G.names(), editing = null;
  let state = null, feedback = false, saved = null, lastView = null, storageError = false, cardBusy = false, petTimer;
  let motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { const raw = JSON.parse(localStorage.getItem(saveKey) || 'null'); if (raw) { G.restore(raw.game); saved = raw; } const pref = localStorage.getItem(prefsKey); if (pref !== null) motion = pref === 'on'; } catch (_) { /* A broken save must never block a new game. */ }
  try { preferredNames = G.names(JSON.parse(localStorage.getItem(namesKey) || '{}')); } catch (_) { /* Invalid name preferences use defaults. */ }
  document.body.classList.toggle('still', !motion);
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function safe(text) { return escapeHtml(G.text(state || { names: preferredNames }, text)); }
  const roles = { cat: '小猫', clerk: '店员', regular: '下班的熟客', cats: '猫朋友' };
  function editButton(key, n = state.names) { return `<button type="button" class="name-edit" data-name="${key}" aria-label="修改${roles[key]}的名字">${escapeHtml(n[key])}<span aria-hidden="true"> ✎</span></button>`; }
  function nameRow() {
    if (feedback || state.step > 1) return '';
    const keys = state.step === 0 ? ['clerk', 'regular'] : ['cats'];
    return `<div class="name-row"><span>点名字可改</span>${keys.map(k => `<span>${roles[k]} ${editButton(k)}</span>`).join('')}</div>`;
  }
  function rememberNames() {
    preferredNames = { ...state.names };
    try { localStorage.setItem(namesKey, JSON.stringify(preferredNames)); } catch (_) { /* Current save still keeps names. */ }
  }
  function openName(key, isNew = false) {
    editing = { key, isNew };
    document.querySelector('#name-title').textContent = isNew ? '这辈子做猫，想叫什么？' : `给${roles[key]}换个名字`;
    document.querySelector('#name-help').textContent = isNew ? '最多 8 个字。留空就叫小橘，以后还能改。' : '后面的剧情、回忆和小票都会用这个名字。留空恢复默认。';
    document.querySelector('#name-input').value = (isNew ? preferredNames : state.names)[key];
    document.querySelector('#name-error').textContent = '';
    document.querySelector('#name-confirm').textContent = isNew ? '就叫这个，出发' : '记住这个名字';
    document.querySelector('#name-dialog').showModal();
    document.querySelector('#name-input').focus();
    document.querySelector('#name-input').select();
  }
  function wireNames() { app.querySelectorAll('[data-name]').forEach(b => { b.onclick = () => openName(b.dataset.name); }); }
  function focus() { const h = app.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } window.scrollTo({ top: 0, behavior: 'instant' }); }
  function save() {
    saved = { game: G.serialize(state), feedback };
    try { localStorage.setItem(saveKey, JSON.stringify(saved)); storageError = false; } catch (_) { storageError = true; }
  }
  function visual(v, action) { const html = V.html(v, lastView, action); lastView = { ...v }; return html; }
  function wirePet() {
    const pet = app.querySelector('.pet-cat'); if (!pet) return;
    pet.onclick = () => {
      const scene = app.querySelector('.cat-stage'); scene.classList.remove('petting');
      void scene.offsetWidth; scene.classList.add('petting');
      scene.querySelector('.pet-reply').textContent = state && state.wet ? '等我甩干，再摸。' : state && G.view(state, feedback).mood === 'asleep' ? '呼噜……今天不营业。' : '呼噜。你可以继续。';
      clearTimeout(petTimer); petTimer = setTimeout(() => { scene.classList.remove('petting'); scene.querySelector('.pet-reply').textContent = ''; }, 2100);
    };
  }
  function home() {
    state = null; feedback = false; lastView = null;
    const v = { ...G.view(G.start(0, 2, preferredNames)), mood: 'neutral', fed: false };
    app.innerHTML = `<section class="home"><p class="eyebrow">麦当劳门口 · 一只猫的七天</p><h1>这班，<span>猫不上。</span></h1><p class="intro">好消息：这辈子不用打卡。<br>坏消息：<strong>今天的饭还没着落。</strong></p>
      ${visual(v)}<p class="cat-caption">${safe('这是小橘。摸摸它，看看它理不理你。')}</p>
      <button class="primary" id="start">先混口饭再说 <span>→</span></button><p class="under-button">陪它过七天，看看日子会变成什么样。</p>
      ${saved ? `<button class="secondary resume" id="resume">${saved.game.choices.length === 14 && !saved.feedback ? '看看我的猫后来怎样了' : `继续养 ${escapeHtml(G.names(saved.game.names).cat)} · 第 ${Math.min(7, Math.floor((saved.game.choices.length - (saved.feedback ? 1 : 0)) / 2) + 1)} 天`} <span>↗</span></button>` : ''}
      <details class="how"><summary>怎么养？不用做功课。</summary><p>看看发生了什么，选一个想做的事就行。认识人、交朋友，也可以自己找个地方睡觉。</p><p>不需要选对，也不用等现实时间。想改主意，随时可以回头。</p></details>
      <div class="versions"><a href="harbor.html">去码头五回合版</a><span>·</span><a href="classic.html">原版离谱人生</a></div></section>`;
    document.querySelector('#start').onclick = () => openName('cat', true);
    const resume = document.querySelector('#resume'); if (resume) resume.onclick = () => { state = G.restore(saved.game); feedback = Boolean(saved.feedback) && state.step > 0; render(); focus(); };
    wirePet();
  }
  function begin(seed, n = preferredNames, version = 2) { state = G.start(seed, version, n); rememberNames(); feedback = false; lastView = null; render(); focus(); }
  function chips(v) { return `<div class="life-chips"><span>${v.wet ? '💧 毛淋湿了' : v.fed ? '🐟 今天有饭了' : '🥣 肚子还空着'}</span><span>⌂ ${G.homeName(v.home)}</span>${v.items.includes('bowl') ? `<span class="bowl-name">碗上写着「${escapeHtml(v.names.cat)}」</span>` : ''}</div>`; }
  function journal() {
    return `<details class="pocket"><summary>我的家当与熟人 <span>${state.items.length} 件物品 · ${Object.values(state.bonds).filter(n => n).length} 位朋友</span></summary><div class="pocket-inner"><h3>${editButton('cat')} 的家当</h3>${state.items.length ? state.items.map(k => `<p><b>${k === 'bowl' ? escapeHtml(state.names.cat) + '的专属饭碗' : safe(G.story.items[k].name)}</b><span>${safe(G.story.items[k].purpose)}</span></p>`).join('') : '<p>暂时没有家当，先把自己安顿好。</p>'}<h3>谁认识我 · 点名字可改</h3>${Object.entries(G.story.people).map(([k, p]) => `<p><b>${p.emoji} ${roles[k]} ${editButton(k)}</b><span>${G.relation(state.bonds[k])}</span></p>`).join('')}${state.flags.includes('dryspot') ? '<p><b>我记住的路</b><span>屋檐下可以避雨，后面遇到麻烦时能用上。</span></p>' : ''}</div></details>`;
  }
  function render(action = '') {
    save(); if (state.step === 14 && !feedback) return ending();
    const sc = G.scene(state), h = state.history.at(-1), v = G.view(state, feedback);
    const day = feedback ? h.day : sc.day;
    if (feedback && h.event === 'rain') v.weather = 'rain';
    const dayTitle = state.version === 2 ? ['先混口饭', '找个落脚处', '开始被记住', '今天有点麻烦', '想过怎样的日子', '约好的事发生了', '今天我做主'][day - 1] : G.story.days[day - 1];
    app.innerHTML = `<section class="play"><div class="day-line"><span>第 <b>${day}</b> 天 / 7</span><span>${dayTitle}</span><span>${feedback ? h.part : sc.part}</span></div>
      <div class="day-track" aria-label="已完成 ${state.step} 次，共十四次选择">${Array.from({ length: 7 }, (_, i) => `<i class="${i + 1 < day ? 'done' : i + 1 === day ? 'current' : ''}"></i>`).join('')}</div>
      ${visual(v, action)}${chips(v)}
      ${feedback ? `<article class="feedback"><p class="eyebrow">刚刚 · ${safe(h.label)}</p><h1>${safe(h.rewards[0].text)}</h1><p class="story">${safe(h.reply)}</p><div class="rewards" aria-label="这次行动带来的变化">${h.rewards.map(r => `<span class="${r.type}">${safe(r.text)}</span>`).join('')}</div><button class="primary" id="next">${state.step === 14 ? safe('看看小橘混成了什么样') : state.step % 2 === 0 ? '睡醒，看看明天' : '然后呢？'} <span>→</span></button></article>`
      : `<article class="scene"><h1>${safe(sc.title)}</h1><p class="story">${safe(sc.text)}</p><div class="choices">${sc.options.filter(o => !o.hidden).map((o, i) => `<button class="choice" data-option="${o.id}" ${o.locked ? 'disabled' : ''}><span class="choice-top"><i>${String.fromCharCode(65 + i)}</i><b>${safe(o.label)}</b><span aria-hidden="true">${o.locked ? '⌑' : '↗'}</span></span><span class="choice-hint">${safe(o.locked ? o.reason : o.hint)}</span></button>`).join('')}</div></article>`}
      ${nameRow()}${journal()}<div class="play-actions">${state.step ? '<button id="back" class="text-button">↶ 回到上个选择</button>' : ''}<button id="home" class="text-button">回首页</button><small>${storageError ? '未能存档，请勿关闭' : '已自动存档'}</small></div></section>`;
    if (feedback) document.querySelector('#next').onclick = () => { feedback = false; render(); focus(); };
    else app.querySelectorAll('[data-option]').forEach(button => button.onclick = () => {
      state = G.choose(state, button.dataset.option); feedback = true;
      const h = state.history.at(-1), action = state.wet ? 'shake' : h.rewards.some(r => r.type === 'item') ? 'item' : h.rewards.some(r => r.type === 'food') ? 'eat' : state.mood === 'playful' ? 'play' : 'happy';
      render(action); focus();
    });
    navigation(); wirePet(); wireNames();
  }
  function navigation() {
    const back = document.querySelector('#back'); if (back) back.onclick = () => { state = G.rewind(state); feedback = false; render(); focus(); };
    document.querySelector('#home').onclick = () => { home(); focus(); };
  }
  function ending() {
    const e = G.result(state), v = G.view(state, true);
    app.innerHTML = `<section class="ending"><p class="eyebrow">${safe('七天过去，小橘的日子变成了这样')}</p>${visual(v)}<p class="ending-tag">${e.hidden || e.id === 'boss' ? '隐藏人生，混出来了' : '我的猫咪生活'}</p><h1>${safe(e.title)}</h1><p class="lead">${safe(e.lead)}</p><p class="story">${safe(e.text)}</p>
      ${e.memories ? `<details class="history"><summary>这段生活，是这样混出来的</summary>${e.memories.map(m => `<div><b>${safe(m.label)}</b><p>${safe(m.reply)}</p></div>`).join('')}</details>` : ''}
      <div class="results"><span>住处<b>${G.homeName(state.home)}</b></span><span>家当<b>${state.items.length} 件</b></span><span>熟人<b>${Object.values(state.bonds).filter(n => n).length} 位</b></span></div>
      <button class="primary" id="share">给我的猫拍张小票 <span>↗</span></button><p class="retry-hint">${safe(e.next)}</p><button class="secondary" id="retry">同样的七天，换个活法 <span>↻</span></button>${journal()}
      <details class="history"><summary>回看这十四次选择</summary>${state.history.map(h => `<div><small>第 ${h.day} 天 · ${h.part}</small><b>${safe(h.label)}</b><p>${safe(h.reply)}</p></div>`).join('')}</details>
      <div class="play-actions"><button class="text-button" id="back">↶ 改最后一个选择</button><button class="text-button" id="home">回首页，换一周</button><small>${storageError ? '未能存档，请勿关闭' : '已自动存档'}</small></div></section>`;
    document.querySelector('#retry').onclick = () => begin(state.seed, state.names, state.version);
    document.querySelector('#share').onclick = async () => {
      if (cardBusy) return; cardBusy = true;
      const button = document.querySelector('#share'); button.disabled = true; button.textContent = G.text(state, '正在给小橘拍照…');
      const snapshot = state;
      try {
        const url = await V.card(snapshot, e, G);
        if (state !== snapshot) return;
        document.querySelector('#share-dialog h2').textContent = snapshot.names.cat + '的生活小票';
        document.querySelector('#card-image').alt = snapshot.names.cat + '和它七天后的生活小票';
        document.querySelector('#download-card').download = snapshot.names.cat.replace(/[\\/:*?"<>|]/g, '_') + '的七天.png';
        document.querySelector('#card-image').src = url;
        document.querySelector('#download-card').href = url;
        document.querySelector('#share-dialog').showModal();
      } catch (_) { button.textContent = '图片没加载好，点这里再试'; }
      finally { cardBusy = false; button.disabled = false; if (button.textContent.includes('拍照')) button.innerHTML = '给我的猫拍张小票 <span>↗</span>'; }
    };
    navigation(); wirePet(); wireNames();
  }
  const toggle = document.querySelector('#motion-toggle');
  function motionLabel() { toggle.textContent = motion ? '动画 开' : '动画 关'; toggle.setAttribute('aria-pressed', String(motion)); }
  toggle.onclick = () => { motion = !motion; document.body.classList.toggle('still', !motion); try { localStorage.setItem(prefsKey, motion ? 'on' : 'off'); } catch (_) {} motionLabel(); };
  motionLabel();
  document.querySelector('#close-share').onclick = () => document.querySelector('#share-dialog').close();
  document.querySelector('#name-cancel').onclick = () => document.querySelector('#name-dialog').close();
  document.querySelector('#name-form').onsubmit = event => {
    event.preventDefault();
    try {
      const value = document.querySelector('#name-input').value;
      if (editing.isNew) {
        const n = G.names({ ...preferredNames, cat: value });
        document.querySelector('#name-dialog').close(); begin(undefined, n);
      } else {
        state = G.rename(state, editing.key, value); rememberNames();
        document.querySelector('#name-dialog').close(); render();
      }
    } catch (error) { document.querySelector('#name-error').textContent = error.message; }
  };
  document.querySelector('.brand').onclick = e => { e.preventDefault(); home(); focus(); };
  home();
})();
