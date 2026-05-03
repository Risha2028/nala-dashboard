"""
mqtt_subscriber.py
Bridges HiveMQ MQTT broker → Supabase for Nala's ball launcher IoT system.

Listens on topic 'nala/throws', parses throw events, and writes to
the `throws` table in Supabase. Session management is handled separately
(e.g. via dashboard).

Requirements:
    pip install paho-mqtt supabase python-dotenv

Environment variables (set in .env or shell):
    SUPABASE_URL       – e.g. https://xxxx.supabase.co
    SUPABASE_KEY       – service-role or anon key
    MQTT_BROKER        – default: broker.hivemq.com
    MQTT_PORT          – default: 1883
    MQTT_TOPIC         – default: nala/throws
"""

import json
import logging
import os
import signal
import sys
import time
import uuid
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Configuration ────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("nala.bridge")

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]

MQTT_BROKER: str = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT: int = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC: str = os.getenv("MQTT_TOPIC", "nala/throws")
MQTT_CLIENT_ID: str = os.getenv("MQTT_CLIENT_ID", f"nala-bridge-{uuid.uuid4().hex[:8]}")
MQTT_KEEPALIVE: int = 60

# ── Supabase client ───────────────────────────────────────────────────────────

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
log.info("Supabase client initialised → %s", SUPABASE_URL)


# ── Payload validation ────────────────────────────────────────────────────────

REQUIRED_FIELDS = {"session_id", "throw_number", "motor_speed", "return_time"}


def validate_payload(data: dict) -> tuple[bool, str]:
    """Return (ok, error_message). Empty string means no error."""
    missing = REQUIRED_FIELDS - data.keys()
    if missing:
        return False, f"Missing fields: {missing}"
    if not isinstance(data["motor_speed"], (int, float)) or not (0 <= data["motor_speed"] <= 100):
        return False, f"motor_speed out of range: {data['motor_speed']}"
    if not isinstance(data["return_time"], (int, float)) or data["return_time"] < 0:
        return False, f"return_time must be non-negative: {data['return_time']}"
    return True, ""


# ── Database write ────────────────────────────────────────────────────────────

def insert_throw(data: dict) -> None:
    """Write a validated throw payload to Supabase `throws` table."""
    row = {
        "session_id":   data["session_id"],
        "throw_number": int(data["throw_number"]),
        "motor_speed":  float(data["motor_speed"]),
        "return_time":  float(data["return_time"]),
        # Use device timestamp if provided, otherwise server UTC now
        "timestamp": data.get("timestamp") or datetime.now().isoformat(),
    }

    try:
        result = supabase.table("throws").insert(row).execute()
        log.info(
            "✓ Throw #%d inserted (session %s, motor=%s%%, return=%.1fs)",
            row["throw_number"],
            row["session_id"],
            row["motor_speed"],
            row["return_time"],
        )
        return result
    except Exception as exc:
        log.error("Supabase insert failed: %s | row=%s", exc, row)
        raise


# ── MQTT callbacks ────────────────────────────────────────────────────────────

def on_connect(client: mqtt.Client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        log.info("Connected to MQTT broker %s:%d", MQTT_BROKER, MQTT_PORT)
        client.subscribe(MQTT_TOPIC, qos=1)
        log.info("Subscribed to topic: %s", MQTT_TOPIC)
    else:
        log.error("MQTT connection failed — reason code: %s", reason_code)


def on_disconnect(client: mqtt.Client, userdata, disconnect_flags, reason_code, properties=None):
    if reason_code != 0:
        log.warning("Unexpected MQTT disconnect (code %s) — will auto-reconnect", reason_code)


def on_message(client: mqtt.Client, userdata, msg: mqtt.MQTTMessage):
    log.debug("← [%s] %s", msg.topic, msg.payload)

    # ── Parse JSON ──────────────────────────────────────────────────────────
    try:
        data = json.loads(msg.payload.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        log.warning("Malformed payload (skipped): %s | raw=%r", exc, msg.payload[:120])
        return

    # ── Validate ────────────────────────────────────────────────────────────
    ok, err = validate_payload(data)
    if not ok:
        log.warning("Invalid throw payload (skipped): %s | data=%s", err, data)
        return

    # ── Persist ─────────────────────────────────────────────────────────────
    try:
        insert_throw(data)
    except Exception:
        # Already logged inside insert_throw; don't crash the loop
        pass


def on_subscribe(client, userdata, mid, reason_codes, properties=None):
    log.info("Subscription confirmed (mid=%d)", mid)


def on_log(client, userdata, level, buf):
    log.debug("MQTT: %s", buf)


# ── Graceful shutdown ─────────────────────────────────────────────────────────

_client_ref: mqtt.Client | None = None


def _handle_signal(sig, frame):
    log.info("Shutdown signal received (%s) — disconnecting…", signal.Signals(sig).name)
    if _client_ref:
        _client_ref.disconnect()
    sys.exit(0)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    global _client_ref

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    client = mqtt.Client(
        client_id=MQTT_CLIENT_ID,
        protocol=mqtt.MQTTv5,
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    )

    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message
    client.on_subscribe  = on_subscribe
    client.on_log        = on_log

    _client_ref = client

    log.info("Connecting to %s:%d …", MQTT_BROKER, MQTT_PORT)
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=MQTT_KEEPALIVE)

    # Blocking loop — handles reconnects automatically
    client.loop_forever(retry_first_connection=True)


if __name__ == "__main__":
    main()
