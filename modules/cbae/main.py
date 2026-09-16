"""
CBAE — Cognitive & Behavioral Analysis Engine
Connects to the Mnemosync Socket Hub and analyses conversation transcripts
for signs of agitation, confusion, or cognitive decline.

Uses Google Gemini (via REST) for sentiment/NLP so no heavy local model is needed.
Falls back to a lightweight keyword heuristic if the API key is absent.
"""

import asyncio
import json
import os
import re
import sys
from datetime import datetime

import aiohttp
import socketio

# Windows consoles default to cp1252, which crashes on the emoji in our logs
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Configuration ─────────────────────────────────────────────────────────────
HUB_URL = os.getenv("HUB_URL", "http://localhost:3001")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBOSp25QjJRHC4MRGJOHzNx6ItTEIQ7zZY")
GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY
)

# Agitation / confusion markers for keyword fallback
AGITATION_KEYWORDS = [
    "i don't know", "i don't remember", "who are you", "where am i",
    "i'm scared", "i'm confused", "leave me alone", "stop", "help",
    "i forgot", "what day", "why are you here", "i want to go home",
]
COGNITIVE_DECLINE_MARKERS = [
    "what's happening", "i can't", "i don't understand", "i'm lost",
    "what did you say", "say that again", "i forgot again",
]

# ── Socket.IO async client ────────────────────────────────────────────────────
sio = socketio.AsyncClient(reconnection=True, reconnection_attempts=0)


# ── Gemini NLP helper ─────────────────────────────────────────────────────────
async def analyze_with_gemini(transcript: str) -> dict:
    """
    Ask Gemini to score a transcript for:
      - sentiment (POSITIVE / NEUTRAL / NEGATIVE)
      - agitation (bool)
      - confusion_level (0-10)
      - summary (one sentence)
    Returns a dict; falls back to heuristic on any error.
    """
    prompt = f"""
You are a clinical NLP assistant for an Alzheimer's care app.
Analyze the following transcript and respond ONLY with valid JSON (no markdown).

Transcript:
\"\"\"
{transcript}
\"\"\"

Return exactly this JSON structure:
{{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "agitation_detected": true | false,
  "confusion_level": <integer 0-10>,
  "severity": "low" | "moderate" | "high",
  "reason": "<one sentence explanation>"
}}
"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            async with session.post(GEMINI_ENDPOINT, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                data = await resp.json()
                raw = data["candidates"][0]["content"]["parts"][0]["text"]
                # Strip markdown fences if present
                raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
                return json.loads(raw)
    except Exception as e:
        print(f"[CBAE] Gemini error, using heuristic fallback: {e}")
        return _heuristic_analysis(transcript)


def _heuristic_analysis(transcript: str) -> dict:
    """Lightweight keyword-based fallback when Gemini is unavailable."""
    text = transcript.lower()
    agitation = any(kw in text for kw in AGITATION_KEYWORDS)
    confusion = any(kw in text for kw in COGNITIVE_DECLINE_MARKERS)

    if agitation:
        return {
            "sentiment": "NEGATIVE",
            "agitation_detected": True,
            "confusion_level": 8,
            "severity": "high",
            "reason": "Agitation keywords detected in transcript.",
        }
    if confusion:
        return {
            "sentiment": "NEGATIVE",
            "agitation_detected": False,
            "confusion_level": 6,
            "severity": "moderate",
            "reason": "Cognitive confusion markers detected in transcript.",
        }
    return {
        "sentiment": "NEUTRAL",
        "agitation_detected": False,
        "confusion_level": 2,
        "severity": "low",
        "reason": "No significant distress detected.",
    }


# ── Socket event handlers ─────────────────────────────────────────────────────
@sio.event
async def connect():
    print("[CBAE] ✅  Connected to Mnemosync Hub")


@sio.event
async def disconnect():
    print("[CBAE] ❌  Disconnected from Hub — will retry...")


@sio.on("conversation_ended")
async def on_conversation_ended(data):
    """
    Fired by the React frontend when a conversation recording ends.
    data: { transcript: str, participants: list, timestamp: str }
    """
    transcript = data.get("transcript", "")
    if not transcript.strip():
        return

    print(f"[CBAE] 💬 Analysing transcript ({len(transcript)} chars)...")
    analysis = await analyze_with_gemini(transcript)
    print(f"[CBAE] 📊 Result: {analysis}")

    # Only alert if severity is moderate or high
    if analysis.get("severity") in ("moderate", "high"):
        alert_payload = {
            "severity": analysis["severity"],
            "reason": analysis["reason"],
            "sentiment": analysis.get("sentiment"),
            "confusion_level": analysis.get("confusion_level"),
            "agitation_detected": analysis.get("agitation_detected"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await sio.emit("cognitive_alert", alert_payload)
        print(f"[CBAE] 🚨 Alert emitted → severity={alert_payload['severity']}")


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    print(f"[CBAE] Connecting to hub at {HUB_URL} ...")
    while True:
        try:
            await sio.connect(HUB_URL, transports=["websocket"], auth={"clientType": "cbae"})
            await sio.wait()
        except Exception as e:
            print(f"[CBAE] Connection failed: {e} — retrying in 5s")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
