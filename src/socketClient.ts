/**
 * socketClient.ts
 * Singleton Socket.IO client that connects the React frontend to the
 * Mnemosync Hub (localhost:3001).
 *
 * Usage:
 *   import { hub, connectHub } from './socketClient';
 *   connectHub();
 *   hub.emit('face_detected', { name, relation, summary });
 *   hub.on('cognitive_alert', handler);
 */

import { io, Socket } from 'socket.io-client';

const HUB_URL = (import.meta as any).env?.VITE_HUB_URL ?? 'http://localhost:5000';

let _socket: Socket | null = null;

/** Returns (and lazily creates) the singleton socket instance. */
export function getHub(): Socket {
    if (!_socket) {
        _socket = io(HUB_URL, {
            transports: ['websocket'],
            reconnectionAttempts: Infinity,
            reconnectionDelay: 3000,
            query: { clientType: 'react' },
        });

        _socket.on('connect', () =>
            console.log('[Hub] ✅ Connected to Mnemosync Hub')
        );
        _socket.on('disconnect', (reason) =>
            console.warn('[Hub] ❌ Disconnected:', reason)
        );
        _socket.on('connect_error', (err) =>
            console.warn('[Hub] Connection error (hub may not be running):', err.message)
        );
    }
    return _socket;
}

/** Connect (no-op if already connected). */
export function connectHub(): Socket {
    return getHub();
}

// ── Typed emit helpers ────────────────────────────────────────────────────────

export function emitFaceDetected(payload: {
    name: string;
    relation: string;
    summary?: string;
}) {
    getHub().emit('face_detected', payload);
}

export function emitConversationEnded(payload: {
    transcript: string;
    participants: string[];
    timestamp?: string;
}) {
    getHub().emit('conversation_ended', {
        ...payload,
        timestamp: payload.timestamp ?? new Date().toISOString(),
    });
}

export function emitTaskReminder(payload: { task: string; time: string }) {
    getHub().emit('task_reminder', payload);
}

// ── Typed listener helpers ────────────────────────────────────────────────────

export interface CognitiveAlert {
    severity: 'low' | 'moderate' | 'high';
    reason: string;
    sentiment?: string;
    confusion_level?: number;
    agitation_detected?: boolean;
    timestamp: string;
}

export function onCognitiveAlert(handler: (alert: CognitiveAlert) => void) {
    getHub().on('cognitive_alert', handler);
    return () => {
        getHub().off('cognitive_alert', handler);
    };
}

export function onWearableStatus(handler: (data: Record<string, unknown>) => void) {
    getHub().on('wearable_status', handler);
    return () => {
        getHub().off('wearable_status', handler);
    };
}
