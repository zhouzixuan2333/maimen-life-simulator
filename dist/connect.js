(() => {
  const form = document.querySelector('#connect-form'), status = document.querySelector('#connection-status');
  const local = location.hostname === '127.0.0.1' && location.port === '8766';
  if (!local) { form.hidden = true; status.textContent = '连接入口仅在本机桥接服务可用。请运行 python3 scripts/mcd_bridge.py，再打开 http://127.0.0.1:8766/connect。'; return; }
  form.onsubmit = async event => {
    event.preventDefault();
    const input = document.querySelector('#token'), button = form.querySelector('button');
    let token = input.value.trim(); input.value = ''; button.disabled = true;
    status.textContent = '正在连接官方 MCP 并查询活动，请稍候…';
    try {
      const setup = await fetch('/api/setup').then(r => r.json());
      const response = await fetch('/api/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, nonce: setup.nonce }) });
      token = '';
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '查询失败');
      status.textContent = '已成功查询官方活动！点击“返回游戏”查看现实支线卡。关闭服务后活动缓存消失，再连接需重新输入 Token。';
    } catch (error) { status.textContent = error.message === 'Failed to fetch' ? '请确认本地桥接服务仍在运行。' : error.message; }
    finally { token = ''; button.disabled = false; }
  };
})();
