"""
SWAB — Smart Wearable Ambient Bridge
Connects to the Mnemosync Socket Hub and converts face-detection events
into spoken TTS audio cues using pyttsx3 (offline, no API key needed).
"""

import asyncio
import os
import sys
import threading

import pyttsx3
import socketio

# Windows consoles default to cp1252, which crashes on the emoji in our logs
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Configuration ─────────────────────────────────────────────────────────────
HUB_URL = os.getenv("HUB_URL", "http://localhost:3001")

# ── TTS engine (runs in a background thread to avoid blocking the event loop) ─
_tts_engine = pyttsx3.init()
_tts_engine.setProperty("rate", 165)      # words per minute
_tts_engine.setProperty("volume", 0.95)


def _speak_blocking(text: str):
    """Speak text synchronously (called from a thread pool)."""
    try:
        _tts_engine.say(text)
        _tts_engine.runAndWait()
    except Exception as e:
        print(f"[SWAB] TTS error: {e}")


def speak_async(text: str):
    """Fire-and-forget TTS — runs in a daemon thread so it doesn't block."""
    t = threading.Thread(target=_speak_blocking, args=(text,), daemon=True)
    t.start()


def format_cue(name: str, relation: str, summary: str | None = None) -> str:
    """
    Build a natural-sounding audio cue for the patient.
    e.g. "Sarah is approaching. She is your daughter.
          Last time you spoke, you discussed the family dinner."
    """
    cue = f"{name} is approaching. They are your {relation}."
    if summary and summary.strip() and summary.lower() not in ("no previous conversation found.", ""):
        cue += f" Last time, {summary.strip()}"
    return cue


# ── Socket.IO async client ────────────────────────────────────────────────────
sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=0)


@sio.event
async def connect():
    print("[SWAB] ✅  Connected to Mnemosync Hub — SWAB Ready")


@sio.event
async def disconnect():
    print("[SWAB] ❌  Disconnected from Hub — will retry...")


@sio.on("face_detected")
async def on_face_detected(data):
    """
    Fired by the React frontend when the vision system identifies a person.
    data: { name: str, relation: str, summary: str }
    """
    name = data.get("name", "Someone")
    relation = data.get("relation", "visitor")
    summary = data.get("summary", "")

    cue = format_cue(name, relation, summary)
    print(f"[SWAB] 🔊 Speaking: \"{cue}\"")

    # Speak in background thread — doesn't block Socket.IO event loop
    speak_async(cue)

    # Acknowledge back to hub
    await sio.emit("wearable_status", {
        "event": "face_detected",
        "spoken": cue,
        "name": name,
    })


@sio.on("task_reminder")
async def on_task_reminder(data):
    """
    Fired when a task reminder fires in the main app.
    data: { task: str, time: str }
    """
    task = data.get("task", "You have an upcoming task.")
    cue = f"Reminder: {task}"
    print(f"[SWAB] 🔔 Reminder cue: \"{cue}\"")
    speak_async(cue)

    await sio.emit("wearable_status", {
        "event": "task_reminder",
        "spoken": cue,
    })


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    print(f"[SWAB] Connecting to hub at {HUB_URL} ...")
    while True:
        try:
            await sio.connect(HUB_URL, transports=["websocket"], auth={"clientType": "swab"})
            await sio.wait()
        except Exception as e:
            print(f"[SWAB] Connection failed: {e} — retrying in 5s")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
