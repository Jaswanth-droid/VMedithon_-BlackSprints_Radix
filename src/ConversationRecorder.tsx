import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageSquare, Users, Trash2, UserPlus, Fingerprint, HelpCircle } from 'lucide-react';
import { addDate, generateId } from './memoryDatabase';
import { SpeakerDetector } from './speakerDetector';
import { getVoicePrintEngine } from './voicePrint';
import { extractOccasions, parseDateFromText, type Occasion } from './occasionExtractor';

interface ConversationEntry {
    speaker: string;
    text: string;
    timestamp: Date;
}

// Simple token-Jaccard similarity for repeated-question detection.
function similarity(a: string, b: string): number {
    const ta = new Set(a.split(/\s+/).filter(Boolean));
    const tb = new Set(b.split(/\s+/).filter(Boolean));
    if (ta.size === 0 || tb.size === 0) return 0;
    let inter = 0;
    ta.forEach(t => { if (tb.has(t)) inter++; });
    return inter / (ta.size + tb.size - inter);
}

function normalizeQuestion(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isQuestion(text: string): boolean {
    const t = text.trim();
    return /\?$/.test(t) ||
        /^(what|when|where|who|whom|whose|why|how|which|is|are|am|do|does|did|can|could|should|would|will|have|has|had)\b/i.test(t);
}

// Helper: local fallback summary when no model is available.
const generateMockResponse = (text: string, visitorName: string, visitorRelation: string): string => {
    const occasions = extractOccasions(text);
    const dateStr = occasions.length
        ? occasions.map(o => `${o.title} (${o.when})`).join(', ')
        : 'None';
    return `
VISITOR: ${visitorName}, ${visitorRelation}
SUMMARY: You had a conversation with ${visitorName}. ${occasions.length ? 'You talked about: ' + occasions.map(o => o.title).join(', ') + '.' : 'You chatted about everyday things.'}
DATES: ${dateStr}
ACTIONS: None
`;
};

interface ConversationRecorderProps {
    onDateDetected: (event: string) => void;
    onConversationUpdate: (summary: string, visitorInfo?: { name: string; relation: string }) => void;
    /** Fired for each precise occasion extracted from speech (event + when). */
    onOccasion?: (occasion: Occasion) => void;
    /** Fired when a known voice/face is recognised — drives the recall card + reassurance. */
    onPersonRecognized?: (info: { name: string; relation: string; source: 'voice' | 'face' }) => void;
    /** Fired when the patient repeats the same question several times in a short window. */
    onRepeatedQuestion?: (question: string, times: number) => void;
    primaryModel: any;
    backupModel: any;
    identifiedPerson: { name: string; relation: string } | null;
    patientName?: string;
}

export default function ConversationRecorder({
    onDateDetected,
    onConversationUpdate,
    onOccasion,
    onPersonRecognized,
    onRepeatedQuestion,
    primaryModel,
    backupModel,
    identifiedPerson,
    patientName = 'User'
}: ConversationRecorderProps) {
    const [isListening, setIsListening] = useState(false);
    const [conversations, setConversations] = useState<ConversationEntry[]>([]);
    const [currentSpeaker, setCurrentSpeaker] = useState<'You' | 'Visitor'>('You');
    const [lastSummary, setLastSummary] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [visitorInfo, setVisitorInfo] = useState<{ name: string; relation: string } | null>(null);
    const [repeatedNotice, setRepeatedNotice] = useState<string | null>(null);

    // Voice-ID enrolment UI
    const engineRef = useRef(getVoicePrintEngine());
    const [profiles, setProfiles] = useState(engineRef.current.getProfiles());
    const [enrolling, setEnrolling] = useState<'owner' | 'family' | null>(null);
    const [voiceMsg, setVoiceMsg] = useState<string>('');
    const [familyName, setFamilyName] = useState('');
    const [familyRelation, setFamilyRelation] = useState('');

    const recognitionRef = useRef<any>(null);
    const primarySpeakerRef = useRef<string | null>(null);
    const lastSpeakerChangeTimeRef = useRef<number>(Date.now());
    const isManualSwitchRef = useRef<boolean>(false);
    const currentSpeakerRef = useRef<'You' | 'Visitor'>(currentSpeaker);
    const conversationsRef = useRef<ConversationEntry[]>([]);
    const recentQuestionsRef = useRef<{ norm: string; raw: string; ts: number; count: number }[]>([]);
    const lastRecognizedRef = useRef<string>('');

    // Created ONCE — the old code rebuilt this on every render and lost state.
    const detectorRef = useRef(new SpeakerDetector());

    useEffect(() => { currentSpeakerRef.current = currentSpeaker; }, [currentSpeaker]);
    useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

    const isListeningRef = useRef(isListening);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const updateSpeaker = useCallback((newSpeaker: 'You' | 'Visitor', manual = false) => {
        if (currentSpeakerRef.current === newSpeaker && !manual) return;
        setCurrentSpeaker(newSpeaker);
        currentSpeakerRef.current = newSpeaker;
        lastSpeakerChangeTimeRef.current = Date.now();
        if (manual) isManualSwitchRef.current = true;
    }, []);

    // Resolve the owner's name: prefer an enrolled voice owner, else first face ID.
    const getOwnerName = useCallback((): string | null => {
        const owner = engineRef.current.getOwner();
        if (owner) return owner.name;
        return primarySpeakerRef.current;
    }, []);

    // Track identified person for the face-based baseline (owner) only.
    useEffect(() => {
        if (!identifiedPerson) return;
        if (!primarySpeakerRef.current && !engineRef.current.getOwner()) {
            primarySpeakerRef.current = identifiedPerson.name;
        }
    }, [identifiedPerson]);

    // Update past "Visitor" labels once a visitor name is known.
    useEffect(() => {
        if (visitorInfo && visitorInfo.name && visitorInfo.name !== 'the visitor') {
            setConversations(prev => prev.map(entry => ({
                ...entry,
                speaker: entry.speaker === 'Visitor' ? visitorInfo.name : entry.speaker
            })));
        }
    }, [visitorInfo]);

    // ---- Repeated-question detection (Alzheimer's reassurance) ----
    const checkRepeatedQuestion = useCallback((text: string) => {
        if (!isQuestion(text)) return;
        const norm = normalizeQuestion(text);
        if (!norm) return;
        const now = Date.now();
        recentQuestionsRef.current = recentQuestionsRef.current.filter(q => now - q.ts < 10 * 60 * 1000);
        const match = recentQuestionsRef.current.find(q => similarity(q.norm, norm) > 0.75);
        if (match) {
            match.count++;
            match.ts = now;
            const times = match.count + 1;
            if (times >= 2) {
                setRepeatedNotice(`You've asked "${match.raw}" ${times} times. That's completely okay — here's the answer again.`);
                onRepeatedQuestion?.(match.raw, times);
                window.setTimeout(() => setRepeatedNotice(null), 12000);
            }
        } else {
            recentQuestionsRef.current.push({ norm, raw: text.trim(), ts: now, count: 0 });
        }
    }, [onRepeatedQuestion]);

    // ---- Conversation analysis ----
    const analyzeConversation = useCallback(async (convos: ConversationEntry[]) => {
        if (!primaryModel || convos.length === 0 || isProcessing) return;
        setIsProcessing(true);
        try {
            const conversationText = convos.map(c => `${c.speaker}: "${c.text}"`).join('\n');
            const visitorName = visitorInfo?.name || 'the visitor';
            const visitorRelation = visitorInfo?.relation || 'someone';

            let response = '';
            const prompt = `You are helping an Alzheimer's patient named ${patientName} remember a conversation.

Participants:
- "You" = ${patientName} (the patient)
- "Visitor" = ${visitorName} (${visitorRelation})

Conversation:
${conversationText}

Give a gentle, caring summary. Respond EXACTLY in this format:
VISITOR: [visitor name and relationship, or "Unknown visitor"]
SUMMARY: [warm 1-2 sentence summary spoken directly to ${patientName}]
DATES: [specific occasions/appointments with their time, or "None"]
ACTIONS: [promises or tasks, or "None"]
TRANSCRIPT:
[Speaker]: "corrected text"`;

            try {
                const result = await primaryModel.generateContent(prompt);
                response = result.response.text();
            } catch (primaryError: any) {
                console.warn('[Conversation] Primary failed, trying backup...', primaryError?.message);
                if (backupModel) {
                    try {
                        const result = await backupModel.generateContent(prompt);
                        response = result.response.text();
                    } catch {
                        response = generateMockResponse(conversationText, visitorName, visitorRelation);
                    }
                } else {
                    response = generateMockResponse(conversationText, visitorName, visitorRelation);
                }
            }

            const visitorMatch = response.match(/VISITOR:\s*(.+?)(?=SUMMARY:|$)/s);
            const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=DATES:|$)/s);

            let extractedVisitor = visitorInfo;
            if (visitorMatch) {
                const vText = visitorMatch[1].trim();
                if (!vText.toLowerCase().includes('unknown')) {
                    extractedVisitor = {
                        name: vText.split(',')[0].trim(),
                        relation: vText.includes(',') ? vText.split(',')[1].trim() : 'visitor'
                    };
                    setVisitorInfo(extractedVisitor);
                }
            }
            if (summaryMatch) {
                const summary = summaryMatch[1].trim();
                setLastSummary(summary);
                onConversationUpdate(summary, extractedVisitor || undefined);
            }

            // (Occasions are extracted per-utterance in handleSpeechResult to avoid re-duplication)

            // Transcript correction
            const transcriptMatch = response.match(/TRANSCRIPT:\s*(.+)$/s);
            if (transcriptMatch) {
                const lines = transcriptMatch[1].trim().split('\n');
                setConversations(prev => {
                    const next = [...prev];
                    lines.forEach((line, idx) => {
                        if (idx < next.length) {
                            const m = line.match(/^(.+?):\s*"(.*)"$/);
                            if (m) { next[idx].speaker = m[1].trim(); next[idx].text = m[2].trim(); }
                        }
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error('Conversation analysis error:', error);
        }
        setIsProcessing(false);
    }, [primaryModel, backupModel, isProcessing, onConversationUpdate, onDateDetected, onOccasion, patientName, visitorInfo]);

    const analyzeRef = useRef(analyzeConversation);
    useEffect(() => { analyzeRef.current = analyzeConversation; }, [analyzeConversation]);

    // ---- Speech result handler ----
    const handleSpeechResult = useCallback((transcript: string) => {
        if (!transcript.trim()) return;

        // Voice-first speaker identification (real audio), face as fallback.
        const decision = detectorRef.current.detectSpeaker(identifiedPerson, getOwnerName());
        updateSpeaker(decision.label);

        // Surface a recognised person for the recall card / reassurance greeting.
        const recognizedKey = `${decision.resolvedName}:${decision.source}`;
        if (decision.isKnownVoice && decision.source === 'voice' && recognizedKey !== lastRecognizedRef.current) {
            lastRecognizedRef.current = recognizedKey;
            const prof = engineRef.current.getProfiles().find(p => p.name === decision.resolvedName);
            if (!decision.isOwner) {
                setVisitorInfo({ name: prof?.name || decision.resolvedName, relation: prof?.relation || 'visitor' });
            }
            onPersonRecognized?.({
                name: decision.resolvedName,
                relation: prof?.relation || (decision.isOwner ? 'you' : 'visitor'),
                source: 'voice'
            });
        } else if (decision.source === 'face' && identifiedPerson && recognizedKey !== lastRecognizedRef.current) {
            lastRecognizedRef.current = recognizedKey;
            if (!decision.isOwner) setVisitorInfo({ name: identifiedPerson.name, relation: identifiedPerson.relation });
            onPersonRecognized?.({ name: identifiedPerson.name, relation: identifiedPerson.relation, source: 'face' });
        }

        let speakerName: string;
        if (decision.isOwner) speakerName = 'You';
        else if (decision.isKnownVoice) speakerName = decision.resolvedName;
        else if (currentSpeakerRef.current === 'Visitor') speakerName = visitorInfo?.name && visitorInfo.name !== 'the visitor' ? visitorInfo.name : 'Visitor';
        else speakerName = 'You';

        const newEntry: ConversationEntry = { speaker: speakerName, text: transcript, timestamp: new Date() };

        // Append via ref (avoids side-effects inside a state updater / StrictMode double-fire).
        const updated = [...conversationsRef.current, newEntry];
        conversationsRef.current = updated;
        setConversations(updated);

        checkRepeatedQuestion(transcript);

        // Real-time precise occasion extraction.
        const occasions = extractOccasions(transcript);
        occasions.forEach(occ => {
            const icon = occ.type === 'reminder' ? '✅' : '📅';
            onDateDetected(`${icon} ${occ.title} — ${occ.when}`);
            onOccasion?.(occ);
            addDate({
                id: generateId(),
                date: (occ.date || parseDateFromText(occ.when)).toISOString(),
                event: `${occ.title} — ${occ.when}`,
                type: occ.type === 'reminder' ? 'reminder' : 'appointment',
                createdAt: occ.date || new Date()
            } as any).catch(() => {});
        });

        if (updated.length % 3 === 0 || updated.length === 1) {
            analyzeRef.current(updated);
        }
    }, [identifiedPerson, getOwnerName, updateSpeaker, visitorInfo, onDateDetected, onOccasion, onPersonRecognized, checkRepeatedQuestion]);

    const speechHandlerRef = useRef(handleSpeechResult);
    useEffect(() => { speechHandlerRef.current = handleSpeechResult; }, [handleSpeechResult]);

    // ---- Web Speech API init (once) ----
    useEffect(() => {
        const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SR) {
            const rec = new SR();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';
            rec.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                if (event.results[current].isFinal) speechHandlerRef.current(transcript);
            };
            rec.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') setIsListening(false);
            };
            rec.onend = () => {
                if (isListeningRef.current) {
                    try { rec.start(); } catch { /* restart race, ignore */ }
                }
            };
            recognitionRef.current = rec;
        }
        return () => {
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
            engineRef.current.stop();
        };
    }, []);

    // ---- Toggle listening ----
    const toggleListening = useCallback(async () => {
        if (isListening) {
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
            engineRef.current.stop();
            setIsListening(false);

            if (conversationsRef.current.length > 0 && !lastSummary) {
                const text = conversationsRef.current.map(c => `${c.speaker}: "${c.text}"`).join(' | ');
                const fallback = `Conversation recorded: ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`;
                onConversationUpdate(fallback, visitorInfo || undefined);
                if (primaryModel) analyzeRef.current(conversationsRef.current);
            }
        } else {
            setConversations([]);
            conversationsRef.current = [];
            setLastSummary('');
            setVisitorInfo(null);
            recentQuestionsRef.current = [];
            lastRecognizedRef.current = '';

            // Start the voiceprint analyser (best-effort) then the speech recognizer.
            await engineRef.current.start();
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }, [isListening, lastSummary, visitorInfo, primaryModel, onConversationUpdate]);

    // ---- Voice enrolment ----
    const enrollOwner = useCallback(async () => {
        setEnrolling('owner');
        setVoiceMsg(`Recording ${patientName}'s voice — please speak normally for ~4 seconds...`);
        const ok = await engineRef.current.start();
        if (!ok) { setVoiceMsg('Microphone unavailable. Allow mic access to enrol a voice.'); setEnrolling(null); return; }
        const name = primarySpeakerRef.current || patientName || 'Owner';
        const prof = await engineRef.current.enroll(name, 'Self', true, 4000);
        primarySpeakerRef.current = prof?.name || name;
        setProfiles(engineRef.current.getProfiles());
        setVoiceMsg(prof ? `Owner voice enrolled as "${prof.name}".` : 'Could not capture enough audio. Try again in a quiet room.');
        setEnrolling(null);
    }, [patientName]);

    const enrollFamily = useCallback(async () => {
        if (!familyName.trim()) { setVoiceMsg('Enter a name first.'); return; }
        setEnrolling('family');
        setVoiceMsg(`Recording ${familyName}'s voice — speak normally for ~4 seconds...`);
        const ok = await engineRef.current.start();
        if (!ok) { setVoiceMsg('Microphone unavailable.'); setEnrolling(null); return; }
        const prof = await engineRef.current.enroll(familyName.trim(), familyRelation.trim() || 'family', false, 4000);
        setProfiles(engineRef.current.getProfiles());
        setVoiceMsg(prof ? `Enrolled "${prof.name}" (${prof.relation}).` : 'Could not capture audio. Try again.');
        setFamilyName(''); setFamilyRelation('');
        setEnrolling(null);
    }, [familyName, familyRelation]);

    const ownerProfile = profiles.find(p => p.isOwner);
    const familyProfiles = profiles.filter(p => !p.isOwner);

    const clearConversation = () => {
        setConversations([]);
        conversationsRef.current = [];
        setLastSummary('');
    };

    const speechSupported = typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

    return (
        <div className="card card-enhanced">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div style={{
                        background: isListening
                            ? 'linear-gradient(135deg, #f9a8d4, #f472b6)'
                            : 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
                        padding: '0.5rem', borderRadius: '0.75rem'
                    }}>
                        {isListening ? <Mic size={20} color="#473f52" /> : <MicOff size={20} color="#473f52" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Conversation Recorder</h3>
                        <p className="text-xs text-dim">
                            {isListening
                                ? `Listening • ${currentSpeaker === 'Visitor' && visitorInfo?.name ? visitorInfo.name : currentSpeaker}`
                                : 'Tap to start recording'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={toggleListening}
                    className="px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg text-white hover:scale-105"
                    style={{
                        background: isListening
                            ? 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)'
                            : 'linear-gradient(135deg, #c4b5fd 0%, #f9a8d4 100%)',
                        color: '#3b2f4a',
                        boxShadow: isListening ? '0 6px 20px rgba(248,113,113,0.4)' : '0 6px 20px rgba(167,139,250,0.4)'
                    }}
                >
                    <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-white animate-pulse' : ''}`}
                        style={{ background: isListening ? '#fff' : '#f472b6' }} />
                    <span className="tracking-wide uppercase font-extrabold">
                        {isListening ? 'Stop' : 'Start'}
                    </span>
                </button>
            </div>

            {/* Voice ID panel */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(167,139,250,0.3)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Fingerprint size={14} style={{ color: '#7c6bc4' }} />
                    <span className="text-xs font-bold" style={{ color: '#5b4b7a' }}>Voice ID</span>
                    <span className="text-[10px] text-dim ml-auto">
                        {ownerProfile ? `Owner: ${ownerProfile.name}` : 'Owner not enrolled'} • {familyProfiles.length} known
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={enrollOwner}
                        disabled={enrolling !== null}
                        className="text-[11px] px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg,#c4b5fd,#a5b4fc)', color: '#3b2f4a', border: '1px solid rgba(167,139,250,0.4)' }}
                    >
                        <Fingerprint size={12} /> {ownerProfile ? 'Re-enroll My Voice' : 'Enroll My Voice'}
                    </button>
                    <button
                        onClick={() => setEnrolling(enrolling === 'family' ? null : 'family')}
                        disabled={enrolling === 'owner'}
                        className="text-[11px] px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.7)', color: '#5b4b7a', border: '1px solid rgba(167,139,250,0.4)' }}
                    >
                        <UserPlus size={12} /> Add Family Voice
                    </button>
                </div>

                <AnimatePresence>
                    {enrolling === 'family' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 mt-2 items-center">
                            <input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="Name"
                                className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '11px', flex: 1 }} />
                            <input value={familyRelation} onChange={e => setFamilyRelation(e.target.value)} placeholder="Relation"
                                className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '11px', flex: 1 }} />
                            <button onClick={enrollFamily}
                                className="text-[11px] px-3 py-1.5 rounded-lg font-bold"
                                style={{ background: 'linear-gradient(135deg,#a7f3d0,#6ee7b7)', color: '#2f4a3f', border: '1px solid rgba(110,231,183,0.5)' }}>
                                Record
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {voiceMsg && <p className="text-[10px] mt-2" style={{ color: '#7c6bc4' }}>{voiceMsg}</p>}
                {profiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {profiles.map(p => (
                            <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: p.isOwner ? 'rgba(196,181,253,0.5)' : 'rgba(167,243,208,0.5)', color: '#4b3f63', border: '1px solid rgba(167,139,250,0.3)' }}>
                                {p.isOwner ? '★ ' : ''}{p.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Active speaker switch */}
            <AnimatePresence>
                {isListening && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(167,139,250,0.25)' }}>
                            <div className="flex items-center justify-between text-xs font-medium text-dim">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                                    Recording Active • voice-matched
                                </span>
                            </div>
                            <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(255,255,255,0.6)' }}>
                                <button onClick={() => updateSpeaker('You', true)}
                                    className="flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    style={{ background: currentSpeaker === 'You' ? 'linear-gradient(135deg,#c4b5fd,#a5b4fc)' : 'transparent', color: currentSpeaker === 'You' ? '#3b2f4a' : '#8d86a0' }}>
                                    <Users size={14} /> Me
                                </button>
                                <button onClick={() => updateSpeaker('Visitor', true)}
                                    className="flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    style={{ background: currentSpeaker === 'Visitor' ? 'linear-gradient(135deg,#a7f3d0,#6ee7b7)' : 'transparent', color: currentSpeaker === 'Visitor' ? '#2f4a3f' : '#8d86a0' }}>
                                    <Users size={14} /> {visitorInfo?.name || 'Visitor'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Repeated-question reassurance */}
            <AnimatePresence>
                {repeatedNotice && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-3 p-2.5 rounded-lg flex items-start gap-2"
                        style={{ background: 'rgba(253,243,192,0.6)', border: '1px solid rgba(240,200,120,0.5)' }}>
                        <HelpCircle size={14} style={{ color: '#a9812a', marginTop: 1 }} />
                        <p className="text-[11px]" style={{ color: '#7a5c1e' }}>{repeatedNotice}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Conversation log */}
            {conversations.length > 0 && (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                    {conversations.slice(-5).map((entry, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="text-xs p-2 rounded border"
                            style={{
                                background: (entry.speaker === 'You' || entry.speaker === patientName) ? 'rgba(196,181,253,0.18)' : 'rgba(167,243,208,0.18)',
                                borderColor: (entry.speaker === 'You' || entry.speaker === patientName) ? 'rgba(167,139,250,0.35)' : 'rgba(110,231,183,0.4)'
                            }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={10} />
                                <span className="font-bold">{entry.speaker}</span>
                                <span className="text-dim">{entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-dim">"{entry.text}"</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {lastSummary && (
                <div className="p-2 rounded mb-3" style={{ background: 'rgba(221,208,247,0.35)', border: '1px solid rgba(167,139,250,0.35)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={12} style={{ color: '#7c6bc4' }} />
                        <span className="text-xs font-bold" style={{ color: '#7c6bc4' }}>AI Summary</span>
                    </div>
                    <p className="text-xs text-dim">{lastSummary}</p>
                </div>
            )}

            {/* Actions */}
            {conversations.length > 0 && (
                <div className="flex gap-2">
                    <button onClick={() => analyzeConversation(conversations)} disabled={isProcessing}
                        className="flex-1 text-xs py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#c4b5fd,#a5b4fc)', color: '#3b2f4a', border: '1px solid rgba(167,139,250,0.4)' }}>
                        {isProcessing ? 'Analyzing...' : <><MessageSquare size={14} /> Analyze Conversation</>}
                    </button>
                    <button onClick={clearConversation}
                        className="text-xs py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2"
                        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(167,139,250,0.25)', color: '#8d86a0' }}>
                        <Trash2 size={14} /> Clear
                    </button>
                </div>
            )}

            {!speechSupported && (
                <p className="text-xs mt-2" style={{ color: '#c26d6d' }}>
                    ⚠️ Speech recognition not supported in this browser. Use Chrome for best results.
                </p>
            )}
        </div>
    );
}
