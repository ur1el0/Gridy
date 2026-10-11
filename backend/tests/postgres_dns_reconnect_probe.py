"""Disposable CI probe for PostgreSQL hostname reconnection after DNS reassignment."""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.db import close_old_connections, connection
from django.db.utils import DatabaseError


class ProbeHandler(BaseHTTPRequestHandler):
    def _respond(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/probe":
            self._respond(404, {"status": "not_found"})
            return

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT inet_server_addr()::text")
                server_address = cursor.fetchone()[0]
        except DatabaseError:
            # Match Django's request-boundary cleanup: mark a dead connection
            # unusable so the next request opens a new connection using DNS.
            try:
                close_old_connections()
            except Exception:
                connection.close()
            self._respond(503, {"status": "database_unavailable"})
            return

        close_old_connections()
        self._respond(200, {"status": "ok", "server_address": server_address})

    def log_message(self, format_string, *args):
        # Keep the disposable smoke log limited to explicit status messages.
        return


def serve():
    server = HTTPServer(("0.0.0.0", 8000), ProbeHandler)
    print("Disposable PostgreSQL DNS probe listening on port 8000.", flush=True)
    server.serve_forever()


def request_probe():
    try:
        with urlopen("http://127.0.0.1:8000/probe", timeout=10) as response:
            status_code = response.status
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        status_code = error.code
        payload = json.loads(error.read().decode("utf-8"))
    except (OSError, URLError):
        print(json.dumps({"http_status": 0, "payload": {"status": "probe_unreachable"}}))
        return 2

    print(json.dumps({"http_status": status_code, "payload": payload}))
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"serve", "request"}:
        raise SystemExit("Use the serve or request mode.")
    raise SystemExit(serve() if sys.argv[1] == "serve" else request_probe())
