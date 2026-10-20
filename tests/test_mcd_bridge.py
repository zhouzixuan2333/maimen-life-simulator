import importlib.util
import io
import json
import threading
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch
from pathlib import Path

spec = importlib.util.spec_from_file_location('bridge', Path(__file__).resolve().parents[1] / 'scripts/mcd_bridge.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class Response(io.BytesIO):
    def __init__(self, body, headers=None):
        super().__init__(body)
        self.headers = headers or {'Content-Type': 'application/json'}


class BridgeTests(unittest.TestCase):
    def test_json_and_sse(self):
        message = {'jsonrpc': '2.0', 'id': 7, 'result': {'text': 'hello'}}
        self.assertEqual(b.read_result(Response(json.dumps(message).encode()), 7), message['result'])
        stream = ': keepalive\n\ndata: {"method":"notice"}\n\ndata: ' + json.dumps(message) + '\n\n'
        self.assertEqual(b.read_result(Response(stream.encode(), {'Content-Type': 'text/event-stream'}), 7), message['result'])

    def test_limits_and_error(self):
        with self.assertRaises(b.BridgeError):
            b.read_result(Response(b'x' * (b.MAX_RESPONSE + 1)), 1)
        with self.assertRaises(b.BridgeError):
            b.rpc_result({'id': 1, 'error': {'message': 'private upstream error'}}, 1)
        with self.assertRaises(b.BridgeError):
            b.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.invalid')

    def test_live_contract_and_redaction(self):
        calls = []
        class FakeOpener:
            def open(self, request, timeout):
                payload = json.loads(request.data); calls.append(payload)
                self_outer.assertEqual(request.full_url, b.ENDPOINT)
                self_outer.assertEqual(request.get_header('Authorization'), 'Bearer test-token')
                if payload['method'] != 'initialize':
                    self_outer.assertEqual(request.get_header('Mcp-session-id'), 'test-session')
                responses = {
                    'initialize': {'protocolVersion': '2025-03-26'},
                    'tools/list': {'tools': [{'name': 'campaign-calendar', 'inputSchema': {'type': 'object'}}]},
                    'tools/call': {'content': [{'type': 'text', 'text': '今日活动 test-token'}]},
                }
                if payload['method'] == 'notifications/initialized':
                    return Response(b'')
                return Response(json.dumps({'id': payload['id'], 'result': responses[payload['method']]}).encode(),
                                {'Content-Type': 'application/json', 'Mcp-Session-Id': 'test-session'})
        self_outer = self
        result = b.McdClient('test-token', opener=FakeOpener()).calendar()
        self.assertNotIn('test-token', result['text'])
        self.assertEqual(result['mode'], 'live')
        self.assertEqual([c['method'] for c in calls], ['initialize', 'notifications/initialized', 'tools/list', 'tools/call'])
        self.assertEqual(calls[-1]['params'], {'name': 'campaign-calendar', 'arguments': {}})

    def test_required_unknown_arg_blocks_call(self):
        client = b.McdClient('fake')
        with patch.object(client, 'rpc', side_effect=[{'protocolVersion': '2025-03-26'}, None, {'tools': [{'name': 'campaign-calendar', 'inputSchema': {'required': ['unknown']}}]}]) as rpc:
            with self.assertRaises(b.BridgeError):
                client.calendar()
            self.assertEqual(rpc.call_count, 3)

    def test_tool_error_not_live(self):
        client = b.McdClient('fake')
        with patch.object(client, 'rpc', side_effect=[{'protocolVersion': '2025-03-26'}, None, {'tools': [{'name': 'campaign-calendar'}]}, {'isError': True, 'content': [{'type': 'text', 'text': 'fake'}]}]):
            with self.assertRaises(b.BridgeError): client.calendar()

    def test_http_error_hides_response(self):
        class BadOpener:
            def open(self, *args, **kwargs):
                raise urllib.error.HTTPError(b.ENDPOINT, 401, 'secret-token', {}, None)
        with self.assertRaisesRegex(b.BridgeError, 'Token 无效'):
            b.McdClient('fake', opener=BadOpener()).rpc('initialize', {})

    def test_invalid_tokens(self):
        for value in [None, '', 'Bearer abc', 'a\nb', 'a' * 8193]:
            with self.assertRaises(b.BridgeError): b.McdClient(value)

    def test_loopback_and_csrf(self):
        server = b.make_server(0)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        base = 'http://' + server.authority
        try:
            with urllib.request.urlopen(base + '/api/calendar') as r:
                self.assertEqual(json.load(r), {'mode': 'offline'})
            with urllib.request.urlopen(base + '/api/setup') as r: nonce = json.load(r)['nonce']
            for name in ['style.css', 'app.js', 'engine.js', 'events.js', 'story.js', 'calendar.js', 'index.html', 'classic.html', 'harbor-engine.js', 'harbor.js', 'harbor.css', 'harbor.html', 'cat-chapters.js', 'cat-story.js', 'cat-engine.js', 'cat-scene.js', 'cat-app.js', 'cat.css', 'assets/cat-states.png']:
                with urllib.request.urlopen(base + '/' + name + '?v=3.1') as r:
                    self.assertEqual(r.read(), (b.ROOT / 'dist' / name).read_bytes())
            for path in ['/../README.md', '/.env', '/scripts/mcd_bridge.py',
                         '/../README.md?v=3.1', '/app.js/../README.md?v=3.1',
                         '/%2e%2e/README.md?v=3.1']:
                with self.assertRaises(urllib.error.HTTPError): urllib.request.urlopen(base + path)
            for origin, given_nonce in [('https://evil.invalid', nonce), (base, 'wrong')]:
                request = urllib.request.Request(base + '/api/connect', json.dumps({'nonce': given_nonce, 'token': 'fake'}).encode(), {'Content-Type': 'application/json', 'Origin': origin})
                with self.assertRaises(urllib.error.HTTPError) as cm: urllib.request.urlopen(request)
                self.assertEqual(cm.exception.code, 403)
            request = urllib.request.Request(base + '/api/setup', headers={'Host': 'evil.invalid'})
            with self.assertRaises(urllib.error.HTTPError): urllib.request.urlopen(request)
        finally:
            server.shutdown(); server.server_close(); thread.join()

if __name__ == '__main__': unittest.main()
