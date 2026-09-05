import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.request import urlopen

from services.pulse.home_server import Handler, PulseHome


class UpstreamHandler(__import__("http.server").server.BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            body = json.dumps({"status": "healthy", "service": "fixture"}).encode()
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *_args):
        pass


class PulseHomeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.upstream = ThreadingHTTPServer(("127.0.0.1", 0), UpstreamHandler)
        cls.upstream_thread = threading.Thread(target=cls.upstream.serve_forever, daemon=True)
        cls.upstream_thread.start()
        base = f"http://127.0.0.1:{cls.upstream.server_port}"
        service = PulseHome("fixture-home", base, base)
        Handler.service = service
        cls.pulse = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.pulse_thread = threading.Thread(target=cls.pulse.serve_forever, daemon=True)
        cls.pulse_thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.pulse.shutdown()
        cls.upstream.shutdown()

    def get(self, path):
        with urlopen(f"http://127.0.0.1:{self.pulse.server_port}{path}") as response:
            return response.status, json.loads(response.read())

    def test_house_now_is_live_envelope(self):
        status, payload = self.get("/house-now")
        self.assertEqual(status, 200)
        self.assertEqual(payload["meta"]["source"], "live")
        self.assertEqual(payload["data"]["house_id"], "fixture-home")

    def test_devices_is_live_read_only_envelope(self):
        status, payload = self.get("/devices")
        self.assertEqual(status, 200)
        self.assertEqual(payload["meta"]["source"], "live")
        self.assertEqual(payload["data"], [])


if __name__ == "__main__":
    unittest.main()
