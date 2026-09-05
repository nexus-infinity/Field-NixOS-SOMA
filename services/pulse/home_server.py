#!/usr/bin/env python3
"""Read-only PULSE Home contract for FIELD-NixOS-SOMA.

This service is deliberately narrow. It exposes the browser relay's read-only
contract and derives its live envelope from the existing SOMA Train Station and
Monitoring services. It does not control Google Home, discover devices, or
write state.
"""

from __future__ import annotations

import argparse
import json
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import URLError
from urllib.request import Request, urlopen


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_json(url: str, timeout: float = 2.0) -> dict | None:
    request = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                return None
            value = json.loads(response.read().decode("utf-8"))
            return value if isinstance(value, dict) else None
    except (OSError, URLError, ValueError, TimeoutError):
        return None


class PulseHome:
    def __init__(self, house_id: str, train_station_url: str, monitoring_url: str):
        self.house_id = house_id
        self.train_station_url = train_station_url.rstrip("/")
        self.monitoring_url = monitoring_url.rstrip("/")

    def observe(self) -> tuple[dict, dict] | None:
        observed_at = now_iso()
        train = get_json(f"{self.train_station_url}/health")
        monitoring = get_json(f"{self.monitoring_url}/health")
        if not train:
            return None

        upstream = {
            "train_station": {
                "status": train.get("status", "unknown"),
                "endpoint": self.train_station_url,
            },
            "monitoring": {
                "status": monitoring.get("status", "unknown") if monitoring else "unavailable",
                "endpoint": self.monitoring_url,
            },
        }
        meta = {
            "timestamp": observed_at,
            "source": "live",
            "authority": "FIELD-NixOS-SOMA Train Station runtime observation",
            "upstream": upstream,
            "device_inventory": "not_yet_seated",
        }
        return train, {"meta": meta, "monitoring": monitoring}

    def house_now(self) -> dict | None:
        observation = self.observe()
        if observation is None:
            return None
        train, context = observation
        meta = context["meta"]
        house = {
            "house_id": self.house_id,
            "state": "attention_needed",
            "next_action": {
                "title": "Seat the physical device registry",
                "description": "SOMA runtime is live; household device identities are not yet seated in PULSE.",
                "target_type": "survey",
                "target_id": "device-scan",
                "action_route": "/devices",
            },
            "unresolved_count": 0,
            "scan_freshness": meta["timestamp"],
            "active_rooms": [],
            "network_confidence": 0.0,
            "media_now": None,
            "highlights": [
                {
                    "id": "soma-runtime-live",
                    "title": "SOMA runtime observed",
                    "description": "Train Station and Monitoring are responding on the sovereign SOMA host.",
                    "severity": "info",
                }
            ],
        }
        return {"data": house, "meta": meta}

    def devices(self) -> dict | None:
        observation = self.observe()
        if observation is None:
            return None
        _, context = observation
        return {"data": [], "meta": context["meta"]}


class Handler(BaseHTTPRequestHandler):
    service: PulseHome

    def log_message(self, fmt: str, *args: object) -> None:
        print(fmt % args, flush=True)

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_json({"status": "healthy", "service": "pulse-home", "source": "live"})
            return
        if self.path == "/house-now":
            payload = self.service.house_now()
        elif self.path == "/devices":
            payload = self.service.devices()
        else:
            self.send_json({"error": "not_found", "meta": {"source": "live"}}, 404)
            return
        if payload is None:
            self.send_json(
                {
                    "error": {
                        "code": "UPSTREAM_UNAVAILABLE",
                        "message": "SOMA runtime dependencies are unavailable",
                    },
                    "meta": {"timestamp": now_iso(), "source": "unavailable"},
                },
                503,
            )
            return
        self.send_json(payload)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=9000)
    parser.add_argument("--house-id", default="willowie")
    parser.add_argument("--train-station-url", default="http://127.0.0.1:8520")
    parser.add_argument("--monitoring-url", default="http://127.0.0.1:9630")
    args = parser.parse_args()

    service = PulseHome(args.house_id, args.train_station_url, args.monitoring_url)
    Handler.service = service
    server = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"PULSE Home read-only service listening on :{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
