(async () => {
  // The public game never connects to loopback or asks visitors for credentials.
  if (location.hostname !== '127.0.0.1' || location.port !== '8766') return;
  const card = document.createElement('details'); card.className = 'calendar-card';
  const title = document.createElement('summary'); title.textContent = '现实支线 · 今天有什么新鲜事？'; card.append(title);
  const body = document.createElement('div'); card.append(body);
  document.querySelector('#app').before(card);
  try {
    const response = await fetch('/api/calendar');
    if (!response.ok) throw new Error('bridge');
    const calendar = await response.json();
    if (calendar.mode !== 'live') {
      const link = document.createElement('a'); link.href = './connect'; link.textContent = '连接我的官方 MCP，查看当期活动'; body.append(link); return;
    }
    title.textContent = '现实支线已解锁 · 官方当期活动';
    const intro = document.createElement('p'); intro.textContent = '想安排一次现实中的聚餐？以下是官方活动信息，不是游戏虚构剧情。';
    const source = document.createElement('p'); source.className = 'tiny'; source.textContent = `来源：${calendar.source} · ${calendar.tool} · 查询于 ${new Date(calendar.fetchedAt).toLocaleString()}`;
    const text = document.createElement('pre'); text.textContent = calendar.text;
    body.append(intro, source, text);
  } catch (_) { body.textContent = '本地 MCP 桥接未连接，仍可正常玩完整游戏。'; }
})();
