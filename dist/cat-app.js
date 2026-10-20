(() => {
  'use strict';
  const G = window.CatGame, V = window.CatScene, app = document.querySelector('#app');
  const saveKey = 'maimen-cat-life-v1', prefsKey = 'maimen-cat-motion-v1';
  let state = null, feedback = false, saved = null, lastView = null, storageError = false, cardBusy = false, petTimer;
  let motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { const raw = JSON.parse(localStorage.getItem(saveKey) || 'null'); if (raw) { G.restore(raw.game); saved = raw; } const pref = localStorage.getItem(prefsKey); if (pref !== null) motion = pref === 'on'; } catch (_) { /* A broken save must never block a new game. */ }
  document.body.classList.toggle('still', !motion);
  function safe(text) { return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
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
    const v = { ...G.view(G.start(0)), mood: 'neutral', fed: false };
    app.innerHTML = `<section class="home"><p class="eyebrow">麦当劳门口 · 一只猫的七天</p><h1>这班，<span>猫不上。</span></h1><p class="intro">好消息：这辈子不用打卡。<br>坏消息：<strong>今天的饭还没着落。</strong></p>
      ${visual(v)}<p class="cat-caption">这是小橘。摸摸它，看看它理不理你。</p>
      <button class="primary" id="start">先混口饭再说 <span>→</span></button><p class="under-button">做十四次选择，看看这只猫能混成什么样。</p>
      ${saved ? `<button class="secondary resume" id="resume">${saved.game.choices.length === 14 && !saved.feedback ? '看看我的猫后来怎样了' : `继续养小橘 · 第 ${Math.min(7, Math.floor(saved.game.choices.length / 2) + 1)} 天`} <span>↗</span></button>` : ''}
      <details class="how"><summary>怎么养？不用做功课。</summary><p>每次选一个猫能做的行动。小橘会认识人、交猫朋友、得到物件，也会找到舒服的落脚处。</p><p>前面混熟的人、记住的路，会让后面多一些办法。选错可以回头，不用等现实时间，也不会因为没来玩就饿死。</p></details>
      <div class="versions"><a href="harbor.html">去码头五回合版</a><span>·</span><a href="classic.html">原版离谱人生</a></div></section>`;
    document.querySelector('#start').onclick = () => begin();
    const resume = document.querySelector('#resume'); if (resume) resume.onclick = () => { state = G.restore(saved.game); feedback = Boolean(saved.feedback) && state.step > 0; render(); focus(); };
    wirePet();
  }
  function begin(seed) { state = G.start(seed); feedback = false; lastView = null; render(); focus(); }
  function chips(v) { return `<div class="life-chips"><span>${v.wet ? '💧 毛淋湿了' : v.fed ? '🐟 今天有饭了' : '🥣 肚子还空着'}</span><span>⌂ ${G.homeName(v.home)}</span></div>`; }
  function journal() {
    return `<details class="pocket"><summary>我的家当与熟人 <span>${state.items.length} 件物品 · ${Object.values(state.bonds).filter(n => n).length} 位朋友</span></summary><div class="pocket-inner"><h3>小橘的家当</h3>${state.items.length ? state.items.map(k => `<p><b>${G.story.items[k].name}</b><span>${G.story.items[k].purpose}</span></p>`).join('') : '<p>暂时没有家当，先把自己安顿好。</p>'}<h3>谁认识我</h3>${Object.entries(G.story.people).map(([k, p]) => `<p><b>${p.emoji} ${p.name}</b><span>${G.relation(state.bonds[k])}</span></p>`).join('')}${state.flags.includes('dryspot') ? '<p><b>我记住的路</b><span>屋檐下可以避雨，后面遇到麻烦时能用上。</span></p>' : ''}</div></details>`;
  }
  function render(action = '') {
    save(); if (state.step === 14 && !feedback) return ending();
    const sc = G.scene(state), h = state.history.at(-1), v = G.view(state, feedback);
    const day = feedback ? h.day : sc.day;
    if (feedback && h.event === 'rain') v.weather = 'rain';
    app.innerHTML = `<section class="play"><div class="day-line"><span>第 <b>${day}</b> 天 / 7</span><span>${G.story.days[day - 1]}</span><span>${feedback ? h.part : sc.part}</span></div>
      <div class="day-track" aria-label="已完成 ${state.step} 次，共十四次选择">${Array.from({ length: 7 }, (_, i) => `<i class="${i + 1 < day ? 'done' : i + 1 === day ? 'current' : ''}"></i>`).join('')}</div>
      ${visual(v, action)}${chips(v)}
      ${feedback ? `<article class="feedback"><p class="eyebrow">刚刚 · ${safe(h.label)}</p><h1>${safe(h.rewards[0].text)}</h1><p class="story">${safe(h.reply)}</p><div class="rewards" aria-label="这次行动带来的变化">${h.rewards.map(r => `<span class="${r.type}">${safe(r.text)}</span>`).join('')}</div><button class="primary" id="next">${state.step === 14 ? '看看小橘混成了什么样' : state.step % 2 === 0 ? '睡醒，看看明天' : '然后呢？'} <span>→</span></button></article>`
      : `<article class="scene"><h1>${safe(sc.title)}</h1><p class="story">${safe(sc.text)}</p><div class="choices">${sc.options.map((o, i) => `<button class="choice" data-option="${o.id}" ${o.locked ? 'disabled' : ''}><span class="choice-top"><i>${String.fromCharCode(65 + i)}</i><b>${safe(o.label)}</b><span aria-hidden="true">${o.locked ? '⌑' : '↗'}</span></span><span class="choice-hint">${safe(o.locked ? o.reason : o.hint)}</span></button>`).join('')}</div></article>`}
      ${journal()}<div class="play-actions">${state.step ? '<button id="back" class="text-button">↶ 回到上个选择</button>' : ''}<button id="home" class="text-button">回首页</button><small>${storageError ? '未能存档，请勿关闭' : '已自动存档'}</small></div></section>`;
    if (feedback) document.querySelector('#next').onclick = () => { feedback = false; render(); focus(); };
    else app.querySelectorAll('[data-option]').forEach(button => button.onclick = () => {
      state = G.choose(state, button.dataset.option); feedback = true;
      const h = state.history.at(-1), action = state.wet ? 'shake' : h.rewards.some(r => r.type === 'item') ? 'item' : h.rewards.some(r => r.type === 'food') ? 'eat' : state.mood === 'playful' ? 'play' : 'happy';
      render(action); focus();
    });
    navigation(); wirePet();
  }
  function navigation() {
    const back = document.querySelector('#back'); if (back) back.onclick = () => { state = G.rewind(state); feedback = false; render(); focus(); };
    document.querySelector('#home').onclick = () => { home(); focus(); };
  }
  function ending() {
    const e = G.result(state), v = G.view(state, true);
    app.innerHTML = `<section class="ending"><p class="eyebrow">七天过去，小橘的日子变成了这样</p>${visual(v)}<p class="ending-tag">${e.id === 'boss' ? '隐藏人生，混出来了' : '我的猫咪生活'}</p><h1>${safe(e.title)}</h1><p class="lead">${safe(e.lead)}</p><p class="story">${safe(e.text)}</p><div class="results"><span>住处<b>${G.homeName(state.home)}</b></span><span>家当<b>${state.items.length} 件</b></span><span>熟人<b>${Object.values(state.bonds).filter(n => n).length} 位</b></span></div>
      <button class="primary" id="share">给我的猫拍张小票 <span>↗</span></button><p class="retry-hint">${safe(e.next)}</p><button class="secondary" id="retry">同样的七天，换个活法 <span>↻</span></button>${journal()}
      <details class="history"><summary>回看这十四次选择</summary>${state.history.map(h => `<div><small>第 ${h.day} 天 · ${h.part}</small><b>${safe(h.label)}</b><p>${safe(h.reply)}</p></div>`).join('')}</details>
      <div class="play-actions"><button class="text-button" id="back">↶ 改最后一个选择</button><button class="text-button" id="home">回首页，换一周</button><small>${storageError ? '未能存档，请勿关闭' : '已自动存档'}</small></div></section>`;
    document.querySelector('#retry').onclick = () => begin(state.seed);
    document.querySelector('#share').onclick = async () => {
      if (cardBusy) return; cardBusy = true;
      const button = document.querySelector('#share'); button.disabled = true; button.textContent = '正在给小橘拍照…';
      const snapshot = state;
      try {
        const url = await V.card(snapshot, e, G);
        document.querySelector('#card-image').src = url;
        document.querySelector('#download-card').href = url;
        document.querySelector('#share-dialog').showModal();
      } catch (_) { button.textContent = '图片没加载好，点这里再试'; }
      finally { cardBusy = false; button.disabled = false; if (button.textContent.includes('拍照')) button.innerHTML = '给我的猫拍张小票 <span>↗</span>'; }
    };
    navigation(); wirePet();
  }
  const toggle = document.querySelector('#motion-toggle');
  function motionLabel() { toggle.textContent = motion ? '动画 开' : '动画 关'; toggle.setAttribute('aria-pressed', String(motion)); }
  toggle.onclick = () => { motion = !motion; document.body.classList.toggle('still', !motion); try { localStorage.setItem(prefsKey, motion ? 'on' : 'off'); } catch (_) {} motionLabel(); };
  motionLabel();
  document.querySelector('#close-share').onclick = () => document.querySelector('#share-dialog').close();
  document.querySelector('.brand').onclick = e => { e.preventDefault(); home(); focus(); };
  home();
})();
