"""Loopback-only calendar bridge. Stdlib only; tokens are never persisted or logged."""
import argparse
import datetime
import functools
import json
import secrets
import socket
import urllib.error
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = 'https://mcp.mcd.cn'
MAX_RESPONSE = 2 * 1024 * 1024


class BridgeError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BridgeError('官方接口发生重定向，已停止连接。')


def rpc_result(message, request_id):
    if isinstance(message, dict) and message.get('id') == request_id:
        if 'error' in message:
            raise BridgeError('官方 MCP 返回调用错误，请检查权限和工具参数。')
        if 'result' in message:
            return message['result']
    return None


def read_result(response, request_id):
    if 'text/event-stream' not in response.headers.get('Content-Type', ''):
        raw = response.read(MAX_RESPONSE + 1)
        if len(raw) > MAX_RESPONSE:
            raise BridgeError('官方响应过大。')
        result = rpc_result(json.loads(raw), request_id)
        if result is not None:
            return result
    else:
        data, size = [], 0
        while True:
            raw = response.readline(MAX_RESPONSE + 1)
            if not raw:
                break
            size += len(raw)
            if size > MAX_RESPONSE:
                raise BridgeError('官方响应过大。')
            line = raw.decode('utf-8').rstrip('\r\n')
            if line.startswith('data:'):
                data.append(line[5:].lstrip(' '))
            if not line and data:
                result = rpc_result(json.loads('\n'.join(data)), request_id)
                data = []
                if result is not None:
                    return result
    raise BridgeError('官方接口未返回匹配的结果。')


class McdClient:
    def __init__(self, token, opener=None):
        if not isinstance(token, str) or not token.strip() or len(token) > 8192 or any(c.isspace() for c in token):
            raise BridgeError('请填写有效 Token，不要包含 Bearer 前缀或空格。')
        self.token, self.session, self.number = token, None, 0
        self.protocol = '2025-03-26'
        self.opener = opener or urllib.request.build_opener(NoRedirect())

    def rpc(self, method, params, notification=False):
        self.number += 1
        payload = {'jsonrpc': '2.0', 'method': method, 'params': params}
        if not notification:
            payload['id'] = self.number
        headers = {'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json',
                   'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': self.protocol}
        if self.session:
            headers['Mcp-Session-Id'] = self.session
        request = urllib.request.Request(ENDPOINT, json.dumps(payload).encode(), headers, method='POST')
        try:
            with self.opener.open(request, timeout=20) as response:
                if response.headers.get('Mcp-Session-Id'):
                    self.session = response.headers['Mcp-Session-Id']
                if notification:
                    return None
                return read_result(response, self.number)
        except urllib.error.HTTPError as error:
            raise BridgeError({401: 'Token 无效或过期，请重新激活。', 403: 'Token 没有访问权限。',
                               429: '官方接口限流，请稍后再试。'}.get(error.code, '官方服务暂时不可用。')) from None
        except (urllib.error.URLError, TimeoutError, socket.timeout):
            raise BridgeError('连接官方服务超时或失败，请稍后再试。') from None
        except (ValueError, UnicodeError):
            raise BridgeError('官方响应格式无法解析。') from None

    def calendar(self):
        init = self.rpc('initialize', {'protocolVersion': self.protocol, 'capabilities': {},
                        'clientInfo': {'name': 'maimen-life-simulator', 'version': '3.1.0'}})
        protocol = init.get('protocolVersion')
        if protocol not in ('2025-03-26', '2025-06-18', '2025-11-25'):
            raise BridgeError('官方要求的协议版本暂不支持。')
        self.protocol = protocol
        self.rpc('notifications/initialized', {}, notification=True)
        catalog, cursor = [], None
        for _ in range(10):
            page = self.rpc('tools/list', {'cursor': cursor} if cursor else {})
            catalog.extend(page.get('tools', []))
            cursor = page.get('nextCursor')
            if not cursor:
                break
        tool = next((t for t in catalog if t.get('name') == 'campaign-calendar'), None)
        if not tool:
            raise BridgeError('此连接未提供 campaign-calendar 工具。')
        schema, arguments = tool.get('inputSchema', {}), {}
        for key in schema.get('required', []):
            prop = schema.get('properties', {}).get(key, {})
            if 'default' not in prop:
                raise BridgeError('活动日历工具新增必填参数，需要按当前工具定义更新接入。')
            arguments[key] = prop['default']
        result = self.rpc('tools/call', {'name': 'campaign-calendar', 'arguments': arguments})
        if result.get('isError'):
            raise BridgeError('活动日历查询失败；没有使用模拟数据冒充结果。')
        parts = [c['text'] for c in result.get('content', []) if c.get('type') == 'text' and isinstance(c.get('text'), str)]
        if not parts and result.get('structuredContent'):
            parts = [json.dumps(result['structuredContent'], ensure_ascii=False)]
        text = '\n\n'.join(parts).strip()
        if not text:
            raise BridgeError('活动日历暂时没有可展示的内容。')
        # Defense in depth: upstream text must never echo our credential back into the UI.
        text = text.replace(self.token, '[已隐藏凭据]')
        return {'source': ENDPOINT, 'tool': 'campaign-calendar', 'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'text': text[:60000], 'mode': 'live'}


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

    def host_ok(self):
        return self.headers.get('Host') == self.server.authority

    def send_json(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.host_ok():
            return self.send_json(403, {'error': '仅允许本机来源'})
        if self.path == '/api/calendar':
            return self.send_json(200, self.server.calendar or {'mode': 'offline'})
        if self.path == '/api/setup':
            return self.send_json(200, {'nonce': self.server.nonce})
        if self.path == '/api/status':
            return self.send_json(200, {'connected': bool(self.server.calendar)})
        # Serve an explicit static allowlist, never the repository, configuration or tokens.
        files = {'/': 'index.html', '/connect': 'connect.html', '/connect.html': 'connect.html'}
        files.update({'/' + name: name for name in ('index.html', 'app.js', 'engine.js', 'events.js', 'story.js', 'style.css', 'calendar.js', 'connect.js', 'classic.html', 'harbor-engine.js', 'harbor.js', 'harbor.css', 'harbor.html', 'cat-story.js', 'cat-engine.js', 'cat-scene.js', 'cat-app.js', 'cat.css', 'assets/cat-states.png')})
        static_path = self.path.partition('?')[0]
        if static_path not in files:
            return self.send_json(404, {'error': '未找到页面'})
        self.path = '/' + files[static_path]
        super().do_GET()

    def do_HEAD(self):
        # Avoid exposing arbitrary files through the base class HEAD handler.
        self.send_error(405)

    def do_POST(self):
        if not self.host_ok() or self.headers.get('Origin') != 'http://' + self.server.authority:
            return self.send_json(403, {'error': '仅允许本机连接页面'})
        if self.path != '/api/connect' or self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.send_json(400, {'error': '请求格式无效'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 10000:
                raise ValueError()
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict) or not secrets.compare_digest(str(data.get('nonce', '')), self.server.nonce):
                return self.send_json(403, {'error': '请刷新连接页面再试'})
            client = McdClient(data.pop('token', None))
            try:
                calendar = client.calendar()
            finally:
                client.token = ''
            self.server.calendar = calendar
            # Only non-sensitive metadata is retained locally as a verification receipt.
            receipt = {k: calendar[k] for k in ('source', 'tool', 'fetchedAt', 'mode')}
            receipt['characters'] = len(calendar['text'])
            git_dir = ROOT / '.git'
            if git_dir.is_dir():
                (git_dir / 'mcd-verification.json').write_text(json.dumps(receipt, ensure_ascii=False))
            return self.send_json(200, {'ok': True, 'fetchedAt': calendar['fetchedAt']})
        except BridgeError as error:
            return self.send_json(400, {'error': str(error)})
        except (ValueError, TypeError, UnicodeError):
            return self.send_json(400, {'error': '输入格式无效'})
        except Exception:
            return self.send_json(502, {'error': '连接未完成，请稍后重试；凭据未保存。'})


def make_server(port=8766):
    server = HTTPServer(('127.0.0.1', port), functools.partial(Handler, directory=str(ROOT / 'dist')))
    server.authority = '127.0.0.1:' + str(server.server_port)
    server.nonce, server.calendar = secrets.token_urlsafe(32), None
    return server


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8766)
    args = parser.parse_args()
    server = make_server(args.port)
    print('本地 MCP 连接入口：http://' + server.authority + '/connect', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
