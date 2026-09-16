/**
 * Mnemosync Socket Hub — Central Pub/Sub Router
 * Port: 3001
 *
 * Channels:
 *   Inbound from React  : conversation_ended | face_detected | task_reminder
 *   Inbound from modules: cognitive_alert    | wearable_status
 *   Relay to all clients: (all events are re-broadcast)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// ── Health check endpoint ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', clients: io.engine.clientsCount });
});

// ── Track connected clients by type ─────────────────────────────────────────
const clients = {
    react: new Set(),
    cbae: new Set(),
    swab: new Set(),
};

// ── Connection handler ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
    const clientType = socket.handshake.query.clientType || socket.handshake.auth?.clientType || 'unknown';
    console.log(`[HUB] ✅  Connected: ${clientType} (${socket.id})`);

    if (clients[clientType]) clients[clientType].add(socket.id);

    // ── React → Hub events ──────────────────────────────────────────────────

    /** React emits when a face is identified by the vision system */
    socket.on('face_detected', (data) => {
        console.log(`[HUB] 👤 face_detected:`, data);
        // Relay to SWAB for TTS cue
        socket.broadcast.emit('face_detected', data);
    });

    /** React emits when a conversation recording ends */
    socket.on('conversation_ended', (data) => {
        console.log(`[HUB] 💬 conversation_ended — transcript length: ${data?.transcript?.length ?? 0}`);
        // Relay to CBAE for NLP analysis
        socket.broadcast.emit('conversation_ended', data);
    });

    /** React emits when a task reminder fires */
    socket.on('task_reminder', (data) => {
        console.log(`[HUB] ⏰ task_reminder:`, data);
        socket.broadcast.emit('task_reminder', data);
    });

    // ── Module → Hub events ─────────────────────────────────────────────────

    /** CBAE emits when it detects a cognitive anomaly */
    socket.on('cognitive_alert', (data) => {
        console.log(`[HUB] 🚨 cognitive_alert [${data?.severity}]: ${data?.reason}`);
        // Relay alert back to React frontend
        socket.broadcast.emit('cognitive_alert', data);
    });

    /** SWAB emits a status after speaking a cue */
    socket.on('wearable_status', (data) => {
        console.log(`[HUB] 🔊 wearable_status:`, data);
        socket.broadcast.emit('wearable_status', data);
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        console.log(`[HUB] ❌ Disconnected: ${clientType} (${socket.id})`);
        if (clients[clientType]) clients[clientType].delete(socket.id);
    });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`\n🧠 Mnemosync Hub running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
});
