(function (root) {
  'use strict';
  const SIZE = 400, HEIGHT = 260;
  const moodNames = { neutral: '眯眼坐着', hungry: '肚子饿了，等着开饭', happy: '满足地趴着', proud: '得意地坐着', asleep: '蜷起来睡着了', wet: '毛湿漉漉地贴着身体', annoyed: '有点嫌弃，但仍然很可爱', playful: '伸爪准备玩耍' };
  const poseIndex = { neutral: 0, hungry: 1, happy: 2, proud: 3, asleep: 4, wet: 5, annoyed: 6, playful: 7 };
  // Align the padded atlas poses to a shared floor; sleeping/wet poses occupy less of their cell.
  const feet = [424, 412, 420, 417, 360, 374, 379, 383];
  const poseOffset = mood => (417 - feet[poseIndex[mood] ?? 0]) / 443.5;
  const colors = { door: '#ede2cc', street: '#eadcc5', shelter: '#dedfce', dock: '#f6d8ad' };
  const placeNames = { door: '麦当劳门外', street: '街角小巷', shelter: '屋檐下', dock: '日落码头' };
  function background(v) {
    const door = `<rect x="0" y="0" width="400" height="191" fill="#e9dfcd"/><rect x="22" y="43" width="168" height="136" rx="4" fill="#aebbb3"/><path d="M105 44V178M22 105H190" stroke="#647b73" stroke-width="5"/><rect x="221" y="48" width="138" height="132" rx="5" fill="#eee7d8" stroke="#c7b69d" stroke-width="3"/><rect x="221" y="48" width="138" height="32" fill="#a54132"/><text x="290" y="69" text-anchor="middle" font-size="13" fill="#fff4cd" font-family="sans-serif">麦当劳 · 门外</text><path d="M0 23H400V45H0Z" fill="#ac4735"/><path d="M0 24H400" stroke="#d6a34b" stroke-width="5"/><rect x="243" y="98" width="95" height="54" rx="3" fill="#e5d7bc"/><path d="M255 138l14-23 14 10 20-19 22 32" fill="none" stroke="#c2b28f" stroke-width="3"/>`;
    const street = `<rect width="400" height="190" fill="#e7d8bf"/><path d="M0 185V45L122 12V190M400 185V25L308 6V190" fill="#c5bb9e"/><path d="M121 32L304 22V190H121Z" fill="#eee5d3"/><path d="M124 187L208 119 307 187" fill="#d3c9af"/><path d="M28 74H89V113H28ZM327 59H372V99H327Z" fill="#879c8e"/><path d="M0 30Q170 104 400 20" fill="none" stroke="#a29176" stroke-width="2"/><path d="M47 44v19M335 42v17" stroke="#a29176" stroke-width="3"/><circle cx="58" cy="157" r="26" fill="#9baa79"/><rect x="42" y="174" width="33" height="27" fill="#ad7154"/>`;
    const shelter = `<rect width="400" height="197" fill="#dfdfcc"/><rect x="25" y="54" width="355" height="138" fill="#e9e5d5"/><path d="M0 34L400 19V53L0 69Z" fill="#758c7b"/><path d="M32 68V205M374 54V205" stroke="#a59072" stroke-width="9"/><path d="M40 119H367M40 156H367" stroke="#d3ceba" stroke-width="2"/><path d="M308 100h40v88h-40z" fill="#c9cfb7"/><path d="M327 170q-26-28-11-49q25 14 11 49q28-38 25-58" fill="none" stroke="#8b9b70" stroke-width="7"/>`;
    const dock = `<rect width="400" height="260" fill="#f7d6ac"/><circle cx="315" cy="73" r="37" fill="#df8560"/><path d="M0 118Q90 102 190 118T400 110V260H0Z" fill="#83b3b0"/><path class="water-ripple" d="M0 146Q100 135 197 150T400 140M0 178Q107 166 250 181T400 168" fill="none" stroke="#c7ddd0" stroke-width="2"/><path d="M0 202L400 169V260H0Z" fill="#b68d68"/><path d="M0 222L400 189M0 245L400 212" stroke="#8c6c50" stroke-width="2"/><path d="M19 87q8-8 16 0q8-8 16 0M110 62q6-6 12 0q6-6 12 0" fill="none" stroke="#a67658" stroke-width="2"/><rect x="315" y="165" width="38" height="32" rx="5" fill="#aa593d"/><path d="M322 165v-14h23v14" fill="none" stroke="#aa593d" stroke-width="4"/><path d="M332 146l-3-15M340 146v-19M347 148l3-15" stroke="#e6b54a" stroke-width="5"/>`;
    const scene = ({ door, street, shelter, dock })[v.spot] || door;
    const floor = v.spot !== 'dock' ? '<path d="M0 191H400V260H0Z" fill="#d3c4a8"/><path d="M0 219H400M63 192L45 260M332 192L357 260" stroke="#c5b797" stroke-width="1"/>' : '';
    let furniture = '';
    if (v.spot !== 'dock') {
      if (v.home === 'chair') furniture += '<path d="M112 217V146H237V217M112 192H237" fill="none" stroke="#795d45" stroke-width="9"/><path d="M117 150H231V173H117Z" fill="#b89163"/>';
      if (v.items.includes('box') && v.home !== 'chair') furniture += '<path d="M77 196H253L265 239H66Z" fill="#b99162"/><path d="M77 196L62 182H238L253 196Z" fill="#dfbd86"/><path d="M77 196H253L244 208H87Z" fill="#876847"/>';
      if (v.items.includes('mat')) furniture += `<ellipse cx="165" cy="${v.home === 'chair' ? 192 : 224}" rx="${v.home === 'chair' ? 61 : 91}" ry="17" fill="${v.wet ? '#788c88' : '#b8b89a'}"/><path d="${v.home === 'chair' ? 'M111 192Q166 178 222 192' : 'M88 224Q166 207 239 223'}" fill="none" stroke="#d9d6ba" stroke-width="3"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="${colors[v.spot] || colors.door}"/>${scene}${floor}${furniture}</svg>`;
  }
  function foreground(v) {
    let parts = '';
    if (v.spot !== 'dock' && v.home === 'box' && v.items.includes('box')) parts += '<path d="M68 220H264L264 242H66Z" fill="#bb9566"/><path d="M69 220H264" stroke="#e6c690" stroke-width="3"/><path d="M111 224v17M224 224v17" stroke="#a27f55" stroke-width="1"/>';
    if (v.fed && !v.items.includes('bowl')) parts += '<ellipse cx="300" cy="235" rx="27" ry="8" fill="#e9d9b8"/><path d="M285 234l5-3 5 3 6-4 6 3 7-1" stroke="#8e6948" stroke-width="4" fill="none"/>';
    if (v.items.includes('bowl')) parts += '<g><ellipse cx="301" cy="227" rx="29" ry="10" fill="#8c604c"/><path d="M271 221h60l-7 19h-45z" fill="#ad5843"/><ellipse cx="301" cy="221" rx="30" ry="9" fill="#ecd5a4"/><path d="M287 220l4 3 5-4 5 4 6-5 5 4" stroke="#977453" stroke-width="4" fill="none"/></g>';
    if (v.items.includes('toy')) parts += '<ellipse cx="50" cy="235" rx="11" ry="5" fill="#779e99" stroke="#4b7f78" stroke-width="2"/>';
    if (v.items.includes('sign')) parts += '<g transform="translate(320 158)"><path d="M12 27L4 74M40 27l9 47" stroke="#90714c" stroke-width="5"/><rect x="0" y="0" width="54" height="40" rx="5" fill="#f2e5c1" stroke="#b39a6d" stroke-width="2"/><text x="27" y="17" text-anchor="middle" fill="#796047" font-size="10" font-family="sans-serif">请勿</text><text x="27" y="31" text-anchor="middle" fill="#796047" font-size="10" font-family="sans-serif">打扰</text></g>';
    // The scarf stays on the cat in upright poses; it is folded beside sleeping/wet cats.
    if (v.items.includes('scarf')) parts += ['neutral', 'hungry', 'proud', 'playful'].includes(v.mood)
      ? `<g transform="translate(${v.mood === 'neutral' ? 203 : v.mood === 'proud' ? 169 : 180} ${(v.mood === 'hungry' ? 155 : 140) + poseOffset(v.mood) * 218 - (v.home === 'chair' && v.spot !== 'dock' ? 42 : 0)})"><path d="M-28-8Q0 7 28-8l-7 13-19 4-25-8Z" fill="#ad4136"/><path d="M17 3l12 24-18-4-3-17Z" fill="#b9493d"/></g>`
      : '<path d="M225 229l27-8 18 14-33 6Z" fill="#b9493d"/><path d="M239 225l8 12" stroke="#d57758" stroke-width="3"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">${parts}</svg>`;
  }
  function sprite(mood, extra = '') {
    const index = poseIndex[mood] ?? 0;
    return `<span class="cat-sprite ${extra}" style="--pose-offset:${poseOffset(mood) * 100}%;--pose-x:${(index % 4) * 100 / 3}%;--pose-y:${index > 3 ? 100 : 0}%"></span>`;
  }
  function html(v, prev, action = '') {
    const changed = prev && prev.mood !== v.mood;
    const rain = v.weather === 'rain' ? `<div class="rain" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${i * 7 + 1}%;--delay:${-(i % 5) * .23}s"></i>`).join('')}</div>` : '';
    return `<div class="cat-stage spot-${v.spot} home-${v.home} mood-${v.mood} ${action ? 'react-' + action : ''}" role="group" aria-label="${placeNames[v.spot]}，小橘${moodNames[v.mood]}">
      ${prev && prev.spot !== v.spot ? `<div class="scene-bg old-scene" aria-hidden="true">${background(prev)}</div>` : ''}<div class="scene-bg ${prev && prev.spot !== v.spot ? 'new-scene' : ''}" aria-hidden="true">${background(v)}</div>
      ${rain}
      <div class="cat-actor"><div class="cat-idle">${changed ? sprite(prev.mood, 'old-pose') : ''}${sprite(v.mood, changed ? 'new-pose' : '')}</div></div>
      <div class="scene-props ${action === 'item' ? 'new-item' : ''}" aria-hidden="true">${foreground(v)}</div>
      ${v.mood === 'asleep' ? '<span class="sleep-z" aria-hidden="true">z<span>z</span></span>' : ''}
      ${v.friends && (v.spot === 'street' || v.spot === 'shelter') ? '<div class="friend-cat" aria-label="猫朋友也在身边">🐈</div>' : ''}
      <button type="button" class="pet-cat" aria-label="摸摸小橘"></button><span class="pet-reply" role="status"></span>
      <span class="place-label">${placeNames[v.spot]}</span>
    </div>`;
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  }
  function svgImage(svg) { return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`); }
  function wrap(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    for (const char of text) { if (ctx.measureText(line + char).width > maxWidth) { ctx.fillText(line, x, y); line = char; y += lineHeight; } else line += char; }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }
  async function card(s, result, game) {
    const v = game.view(s, true);
    const [bg, cat, fg] = await Promise.all([svgImage(background(v)), loadImage('assets/cat-states.png'), svgImage(foreground(v))]);
    const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 1050;
    const c = canvas.getContext('2d'); c.fillStyle = '#f8f1e3'; c.fillRect(0, 0, 800, 1050);
    c.fillStyle = '#9d4334'; c.font = 'bold 23px sans-serif'; c.fillText('麦门人生 / 这班，猫不上', 48, 63);
    c.font = '17px sans-serif'; c.fillStyle = '#8d7a63'; c.fillText('小橘的第七天 · 我的猫咪生活小票', 48, 101);
    c.save(); c.translate(40, 131); c.scale(1.8, 1.8); c.drawImage(bg, 0, 0, SIZE, HEIGHT);
    const pose = poseIndex[v.mood], cellW = cat.width / 4, cellH = cat.height / 2;
    c.drawImage(cat, (pose % 4) * cellW, Math.floor(pose / 4) * cellH, cellW, cellH, 62, (v.home === 'chair' && v.spot !== 'dock' ? -10 : 32) + poseOffset(v.mood) * 218, 218, 218);
    c.drawImage(fg, 0, 0, SIZE, HEIGHT); c.restore();
    c.fillStyle = '#423b2f'; c.font = 'bold 32px sans-serif'; let y = wrap(c, result.title, 48, 650, 704, 44);
    c.fillStyle = '#7a6a55'; c.font = '22px sans-serif'; y = wrap(c, result.lead, 48, y + 15, 704, 34);
    c.font = '19px sans-serif'; y = wrap(c, `住处：${game.homeName(s.home)}  ·  认识了 ${Object.values(s.bonds).filter(n => n > 0).length} 位朋友`, 48, y + 22, 704, 29);
    y = wrap(c, `我的家当：${s.items.map(k => game.story.items[k].name).join('、') || '还没有物件，但已经记住了路'}`, 48, y + 10, 704, 29);
    c.fillStyle = '#aa4937'; c.font = 'bold 20px sans-serif'; c.fillText('不上班，也能混出自己的日子。', 48, 969);
    c.fillStyle = '#9a8a73'; c.font = '15px sans-serif'; c.fillText('非官方虚构游戏 · maimen-life-simulator', 48, 1005);
    return canvas.toDataURL('image/png');
  }
  root.CatScene = { html, card, moodNames, placeNames, background, foreground };
})(window);
