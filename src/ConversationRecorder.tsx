import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageSquare, Calendar, Users, Trash2 } from 'lucide-react';
import { addDate, generateId } from './memoryDatabase';
import { SpeakerDetector } from './speakerDetector';
import {
    parseDateFromText,
    cleanEventTitle,
    extractTasksAndDatesNLP,
    formatHumanDate
} from './nlpExtractor';

export { parseDateFromText, cleanEventTitle, extractTasksAndDatesNLP };

interface ConversationEntry {
    speaker: string;
    text: string;
    timestamp: Date;
}

// Helper: Generate Mock AI Response using NLP
const generateMockResponse = (text: string, visitorName: string, visitorRelation: string): string => {
    const extracted = extractTasksAndDatesNLP(text);
    const dateEvents = extracted.filter(e => e.type === 'date').map(e => e.formattedEvent);
    const actionEvents = extracted.filter(e => e.type === 'action').map(e => e.formattedEvent);

    const mockDate = dateEvents.length > 0 ? dateEvents.join(', ') : "None";
    const mockAction = actionEvents.length > 0 ? actionEvents.join(', ') : "None";

    return `
VISITOR: ${visitorName}, ${visitorRelation}
SUMMARY: You had a conversation with ${visitorName}. You discussed ${mockDate !== 'None' ? 'events: ' + mockDate : 'various topics'}.
DATES: ${mockDate}
ACTIONS: ${mockAction}
`;
};

interface ConversationRecorderProps {
    onDateDetected: (event: string) => void;
    onConversationUpdate: (summary: string, visitorInfo?: { name: string; relation: string }) => void;
    primaryModel: any;
    backupModel: any;
    identifiedPerson: { name: string; relation: string } | null;
    patientName?: string; // The Alzheimer's patient (Person A)
}

export default function ConversationRecorder({
    onDateDetected,
    onConversationUpdate,
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

    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<number | null>(null);
    const lastSpeechTimeRef = useRef<number>(Date.now());
    const lastIdentifiedPersonRef = useRef<string | null>(null);
    const primarySpeakerRef = useRef<string | null>(null); // User baseline
    const lastSpeakerChangeTimeRef = useRef<number>(Date.now());
    const isManualSwitchRef = useRef<boolean>(false);
    const currentSpeakerRef = useRef<'You' | 'Visitor'>(currentSpeaker);

    // Initialize speaker detector
    const speakerDetector = new SpeakerDetector();

    // Sync ref with state
    useEffect(() => {
        currentSpeakerRef.current = currentSpeaker;
    }, [currentSpeaker]);

    // Enhanced speaker switch that handles both state and ref
    const updateSpeaker = useCallback((newSpeaker: 'You' | 'Visitor', manual = false) => {
        if (currentSpeakerRef.current === newSpeaker && !manual) return;

        setCurrentSpeaker(newSpeaker);
        currentSpeakerRef.current = newSpeaker;
        lastSpeakerChangeTimeRef.current = Date.now();
        if (manual) isManualSwitchRef.current = true;
        console.log(`[Speaker] Switch to ${newSpeaker} (${manual ? 'Manual' : 'Auto'})`);
    }, []);

    // Track identified person changes for speaker switching
    useEffect(() => {
        if (!identifiedPerson || !isListening) return;

        const currentName = identifiedPerson.name;
        const now = Date.now();
        const timeSinceChange = now - lastSpeakerChangeTimeRef.current;

        // Set primary speaker (User) on first identification
        if (!primarySpeakerRef.current) {
            primarySpeakerRef.current = currentName;
            updateSpeaker('You');
            console.log(`[Speaker] Primary speaker (you) set: ${currentName}`);
            return;
        }

        // 1. Switch to Visitor if a DIFFERENT person is explicitly identified
        if (currentName !== primarySpeakerRef.current && currentSpeakerRef.current === 'You') {
            updateSpeaker('Visitor');
            setVisitorInfo({
                name: identifiedPerson.name,
                relation: identifiedPerson.relation
            });
            isManualSwitchRef.current = false;
        }
        // 2. Switch back to "You" only if User is seen AND we haven't just switched/locked to Visitor
        else if (currentName === primarySpeakerRef.current && currentSpeakerRef.current === 'Visitor') {
            if (!isManualSwitchRef.current && timeSinceChange > 15000) {
                updateSpeaker('You');
            }
        }

        lastIdentifiedPersonRef.current = currentName;
    }, [identifiedPerson, isListening, currentSpeaker]);

    // Auto-update past conversation entries when visitor name is revealed
    useEffect(() => {
        if (visitorInfo && visitorInfo.name && visitorInfo.name !== 'the visitor') {
            setConversations(prev => prev.map(entry => ({
                ...entry,
                speaker: entry.speaker === 'Visitor' ? visitorInfo.name : entry.speaker
            })));
            console.log(`[Conversation] Updated 'Visitor' labels to '${visitorInfo.name}'`);
        }
    }, [visitorInfo]);

    // Track listening state in ref for callbacks
    const isListeningRef = useRef(isListening);
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Analyze conversation with Gemini - Alzheimer's focused
    const analyzeConversation = useCallback(async (convos: ConversationEntry[]) => {
        if (!primaryModel || convos.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            const conversationText = convos
                .map(c => `${c.speaker}: "${c.text}"`)
                .join('\n');

            // Get visitor name from conversation if available
            const visitorName = visitorInfo?.name || 'the visitor';
            const visitorRelation = visitorInfo?.relation || 'someone';

            let response = '';
            let isQuotaError = false;

            // Flags
            const FORCE_MOCK_AI = false; // Set to true only if you want to bypass Gemini completely

            if (FORCE_MOCK_AI) {
                console.log('[Mock AI] Generating response locally (Forced)...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = generateMockResponse(conversationText, visitorName, visitorRelation);
            } else {
                // Hybrid Tiered Mode: Primary (G3) -> Backup (G2.5) -> Mock (Regex)
                const prompt = `You are helping an Alzheimer's patient named ${patientName} remember a conversation they just had.

The conversation was between:
- "You" = ${patientName} (the Alzheimer's patient)
- "Visitor" = ${visitorName} (${visitorRelation})

Conversation:
${conversationText}

Provide a gentle, caring summary for ${patientName} explaining:
1. WHO they were talking to (use the visitor's name and relationship if known)
2. WHAT they discussed (key topics in simple terms)
3. Any IMPORTANT events or tasks to remember (e.g., extract clean event titles like "Birthday on Jan 16", "Doctor Appointment on Friday", NOT conversational fragments like "I have a")

Respond in this exact format:
VISITOR: [visitor's name and their relationship to ${patientName}, or "Unknown visitor" if not clear]
SUMMARY: [A warm, simple 1-2 sentence summary written as if speaking directly to ${patientName}]
DATES: [Specific events and their dates formatted as "Event Name on Date" (e.g. "Birthday on Jan 16"), or "None"]
ACTIONS: [Action items/tasks without conversational pronouns (e.g. "Take blood pressure medication"), or "None"]
TRANSCRIPT:
[Speaker]: "Corrected text"
...`;

                try {
                    console.log('[Conversation] Attempting Primary Model...');
                    const result = await primaryModel.generateContent(prompt);
                    response = result.response.text();
                } catch (primaryError: any) {
                    console.warn('[Conversation] Primary Model failed, trying Backup...', primaryError.message);

                    if (backupModel) {
                        try {
                            const result = await backupModel.generateContent(prompt);
                            response = result.response.text();
                        } catch (backupError: any) {
                            console.error('[Conversation] Backup Model also failed. Using Mock AI fallback.', backupError.message);
                            response = generateMockResponse(conversationText, visitorName, visitorRelation);
                        }
                    } else {
                        console.log('[Conversation] No backup model available. Using Mock AI fallback.');
                        response = generateMockResponse(conversationText, visitorName, visitorRelation);
                    }
                }
            }

            // Parse the response (from Gemini or Mock)
            const visitorMatch = response.match(/VISITOR:\s*(.+?)(?=SUMMARY:|$)/s);
            const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=DATES:|$)/s);
            let datesMatch = response.match(/DATES:\s*(.+?)(?=ACTIONS:|$)/s);
            const actionsMatch = response.match(/ACTIONS:\s*(.+?)(?=TRANSCRIPT:|$)/s);

            // HYBRID NLP ENHANCEMENT: Extract clean structured tasks using NLP extractor
            const nlpExtracted = extractTasksAndDatesNLP(conversationText);
            console.log('[Hybrid NLP] Extracted tasks & dates:', nlpExtracted);

            let extractedVisitor = visitorInfo;
            if (visitorMatch) {
                const visitorText = visitorMatch[1].trim();
                if (!visitorText.toLowerCase().includes('unknown')) {
                    extractedVisitor = {
                        name: visitorText.split(',')[0].trim(),
                        relation: visitorText.includes(',') ? visitorText.split(',')[1].trim() : 'visitor'
                    };
                    setVisitorInfo(extractedVisitor);
                }
            }

            if (summaryMatch) {
                const summary = summaryMatch[1].trim();
                setLastSummary(summary);
                onConversationUpdate(summary, extractedVisitor || undefined);
            }

            // Process and save all NLP-extracted dates and events to IndexedDB
            const processedEvents = new Set<string>();

            // 1. Process NLP rule-based extractions
            for (const item of nlpExtracted) {
                if (!processedEvents.has(item.formattedEvent.toLowerCase())) {
                    processedEvents.add(item.formattedEvent.toLowerCase());
                    onDateDetected(item.type === 'date' ? `📅 ${item.formattedEvent}` : `✅ ${item.formattedEvent}`);

                    try {
                        await addDate({
                            id: generateId(),
                            date: item.parsedDate.toISOString(),
                            event: item.formattedEvent,
                            type: item.type === 'date' ? 'appointment' : 'reminder',
                            createdAt: item.parsedDate
                        });
                        console.log('[NLP Extractor] ✅ Event saved to DB:', item.formattedEvent);
                    } catch (dbErr) {
                        console.error('[NLP Extractor] ❌ Error saving event:', dbErr);
                    }
                }
            }

            // 2. Process Gemini DATES if any additional ones exist
            if (datesMatch) {
                const datesText = datesMatch[1].trim();
                if (datesText && !datesText.toLowerCase().includes('none')) {
                    const dateLines = datesText.split(/\n|,/).map(l => l.trim()).filter(Boolean);
                    for (const rawLine of dateLines) {
                        const cleaned = cleanEventTitle(rawLine);
                        if (cleaned && !cleaned.toLowerCase().includes('none') && !processedEvents.has(cleaned.toLowerCase())) {
                            processedEvents.add(cleaned.toLowerCase());
                            const parsed = parseDateFromText(cleaned);
                            onDateDetected(`📅 ${cleaned}`);
                            try {
                                await addDate({
                                    id: generateId(),
                                    date: parsed.toISOString(),
                                    event: cleaned,
                                    type: 'appointment',
                                    createdAt: parsed
                                });
                            } catch (e) {}
                        }
                    }
                }
            }

            // 3. Process Gemini ACTIONS
            if (actionsMatch) {
                const actionsText = actionsMatch[1].trim();
                if (actionsText && !actionsText.toLowerCase().includes('none')) {
                    const actionLines = actionsText.split(/\n|,/).map(l => l.trim()).filter(Boolean);
                    for (const rawLine of actionLines) {
                        const cleaned = cleanEventTitle(rawLine);
                        if (cleaned && !cleaned.toLowerCase().includes('none') && !processedEvents.has(cleaned.toLowerCase())) {
                            processedEvents.add(cleaned.toLowerCase());
                            const parsed = parseDateFromText(cleaned);
                            onDateDetected(`✅ ${cleaned}`);
                            try {
                                await addDate({
                                    id: generateId(),
                                    date: parsed.toISOString(),
                                    event: cleaned,
                                    type: 'reminder',
                                    createdAt: parsed
                                });
                            } catch (e) {}
                        }
                    }
                }
            }

            // Handle transcript correction
            const transcriptMatch = response.match(/TRANSCRIPT:\s*(.+)$/s);
            if (transcriptMatch) {
                const transcriptLines = transcriptMatch[1].trim().split('\n');
                setConversations(prev => {
                    const next = [...prev];
                    transcriptLines.forEach((line: string, idx: number) => {
                        if (idx < next.length) {
                            const match = line.match(/^(.+?):\s*"(.*)"$/);
                            if (match) {
                                next[idx].speaker = match[1].trim();
                                next[idx].text = match[2].trim();
                            }
                        }
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error('Conversation analysis error:', error);
        }
        setIsProcessing(false);
    }, [primaryModel, backupModel, isProcessing, onConversationUpdate, onDateDetected, patientName, visitorInfo]);

    // Handle speech result
    const handleSpeechResult = useCallback((transcript: string) => {
        if (!transcript.trim()) return;

        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTimeRef.current;

        // Use speaker detector to decide if speaker has changed
        const detectedSpeaker = speakerDetector.detectSpeaker(transcript, identifiedPerson, primarySpeakerRef.current);
        if (detectedSpeaker && detectedSpeaker !== currentSpeakerRef.current) {
            updateSpeaker(detectedSpeaker);
        }
        lastSpeechTimeRef.current = now;

        // Determining the current speaker name
        let speakerName: string = currentSpeakerRef.current;

        // If face recognition explicitly sees someone ELSE, use their name
        if (identifiedPerson && identifiedPerson.name !== primarySpeakerRef.current) {
            speakerName = identifiedPerson.name;
        }
        // If we're in Visitor mode and we know the visitor's name (from conversation or face), use it
        else if (currentSpeakerRef.current === 'Visitor') {
            // Use visitorInfo.name if available (extracted from conversation or face)
            const visitorName = visitorInfo?.name;
            if (visitorName && visitorName !== 'the visitor') {
                speakerName = visitorName;
            } else {
                speakerName = 'Visitor';
            }
        }
        // If face recognition sees the User (User), and we are in 'You' mode
        else if (currentSpeaker === 'You' && identifiedPerson?.name === primarySpeakerRef.current) {
            speakerName = 'You';
        }

        const newEntry: ConversationEntry = {
            speaker: speakerName,
            text: transcript,
            timestamp: new Date()
        };

        setConversations(prev => {
            const updated = [...prev, newEntry];
            // Analyze after every 3 entries
            if (updated.length % 3 === 0 || updated.length === 1) {
                analyzeConversation(updated);
            }
            return updated;
        });

        // Real-time Task & Event Extraction using NLP
        const extracted = extractTasksAndDatesNLP(transcript);
        extracted.forEach(item => {
            const formatted = item.type === 'date' ? `📅 ${item.formattedEvent}` : `✅ ${item.formattedEvent}`;
            onDateDetected(formatted);
        });
    }, [currentSpeaker, conversations.length, identifiedPerson, analyzeConversation, onDateDetected]);

    // Handler ref to avoid stale listeners
    const speechHandlerRef = useRef(handleSpeechResult);
    useEffect(() => {
        speechHandlerRef.current = handleSpeechResult;
    }, [handleSpeechResult]);

    // Initialize Web Speech API
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;

                if (event.results[current].isFinal) {
                    speechHandlerRef.current(transcript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                if (isListeningRef.current) {
                    console.log('Recognition ended but should be listening, restarting...');
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log('Recognition restart failed');
                    }
                }
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, []); // Run once on mount

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);

            // When stopping, save the conversation for recall
            if (conversations.length > 0) {
                const conversationText = conversations
                    .map(c => `${c.speaker}: "${c.text}"`)
                    .join(' | ');

                // Post-process all sentences using robust NLP extractor
                const fullText = conversations.map(c => c.text).join(' ');
                const nlpTasks = extractTasksAndDatesNLP(fullText);

                nlpTasks.forEach(async (taskItem) => {
                    const formatted = taskItem.type === 'date' ? `📅 ${taskItem.formattedEvent}` : `✅ ${taskItem.formattedEvent}`;
                    onDateDetected(formatted);

                    try {
                        await addDate({
                            id: generateId(),
                            date: taskItem.parsedDate.toISOString(),
                            event: taskItem.formattedEvent,
                            type: taskItem.type === 'date' ? 'appointment' : 'reminder',
                            createdAt: taskItem.parsedDate
                        });
                    } catch (err) {
                        console.error('[ConversationRecorder] Error saving task:', err);
                    }
                });

                // If we have a Gemini-generated summary, use that; otherwise create a basic one
                const summaryToSave = lastSummary || `Conversation recorded: ${conversationText.substring(0, 200)}${conversationText.length > 200 ? '...' : ''}`;

                if (!lastSummary) {
                    onConversationUpdate(summaryToSave, visitorInfo || undefined);
                }

                if (primaryModel && !lastSummary) {
                    analyzeConversation(conversations);
                }
            }
        } else {
            // New conversation starting - Clear old state
            setConversations([]);
            setLastSummary('');
            setVisitorInfo(null);

            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }, [isListening, conversations, lastSummary, visitorInfo, primaryModel, backupModel, onConversationUpdate, onDateDetected, analyzeConversation]);

    // Manual speaker switch
    const switchSpeaker = (speaker: 'You' | 'Visitor') => {
        updateSpeaker(speaker, true);
    };

    // Clear conversation
    const clearConversation = () => {
        setConversations([]);
        setLastSummary('');
    };

    return (
        <div className="card card-enhanced">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div style={{
                        background: isListening
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                        padding: '0.5rem',
                        borderRadius: '0.75rem'
                    }}>
                        {isListening ? <Mic size={20} color="white" /> : <MicOff size={20} color="white" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Conversation Recorder</h3>
                        <p className="text-xs text-dim">
                            {isListening ? `Listening • ${currentSpeaker === 'Visitor' && visitorInfo?.name ? visitorInfo.name : currentSpeaker}` : 'Tap to start recording'}
                        </p>
                    </div>
                </div>
                <div className="relative group">
                    {/* Ripple animation when recording */}
                    {isListening && (
                        <>
                            <motion.div
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                style={{ background: 'rgba(168, 85, 247, 0.4)' }}
                                className="absolute inset-0 rounded-xl -z-10"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                                style={{ background: 'rgba(168, 85, 247, 0.3)' }}
                                className="absolute inset-0 rounded-xl -z-10"
                            />
                        </>
                    )}

                    <button
                        onClick={toggleListening}
                        className="px-8 py-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 shadow-xl relative overflow-hidden text-white hover:scale-105 border border-white/20"
                        style={{
                            background: isListening
                                ? 'linear-gradient(135deg, #ef4444 0%, #be123c 100%)' // Red gradient for Stop
                                : 'linear-gradient(135deg, #4c1d95 0%, #d946ef 100%)', // Deep Violet to Fuchsia for Start
                            boxShadow: isListening
                                ? '0 0 25px rgba(239, 68, 68, 0.6), inset 0 2px 0 rgba(255,255,255,0.2)'
                                : '0 8px 25px rgba(124, 58, 237, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)'
                        }}
                    >
                        {/* Shimmer effect */}
                        {!isListening && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '200%' }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            />
                        )}

                        <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${isListening ? 'bg-white animate-pulse' : 'bg-red-500 group-hover:scale-125'}`} />
                        <span className="tracking-wide uppercase font-extrabold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                            {isListening ? 'STOP RECORDING' : 'START RECORDING'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Active indicator */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs font-medium text-dim">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Recording Active
                                </span>
                                <span className="uppercase tracking-wider text-[10px] opacity-70">Tap listener</span>
                            </div>

                            <div className="flex bg-black/40 rounded-lg p-1 gap-1 relative">
                                <button
                                    onClick={() => switchSpeaker('You')}
                                    className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentSpeaker === 'You'
                                        ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-white/20'
                                        : 'text-dim hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Users size={14} className={currentSpeaker === 'You' ? 'opacity-100' : 'opacity-50'} />
                                    Me {isManualSwitchRef.current && currentSpeaker === 'You' && <span className="text-[10px] ml-1 bg-white/20 px-1 rounded">Locked</span>}
                                </button>
                                <button
                                    onClick={() => switchSpeaker('Visitor')}
                                    className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentSpeaker === 'Visitor'
                                        ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-white/20'
                                        : 'text-dim hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Users size={14} className={currentSpeaker === 'Visitor' ? 'opacity-100' : 'opacity-50'} />
                                    {visitorInfo?.name || 'Visitor'} {isManualSwitchRef.current && currentSpeaker === 'Visitor' && <span className="text-[10px] ml-1 bg-white/20 px-1 rounded">Locked</span>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Conversation log */}
            {conversations.length > 0 && (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {conversations.slice(-5).map((entry, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-xs p-2 rounded border ${(entry.speaker === 'You' || entry.speaker === patientName)
                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                : 'bg-emerald-500/10 border-emerald-500/30'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={10} />
                                <span className="font-bold">{entry.speaker}</span>
                                <span className="text-dim">
                                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-dim">"{entry.text}"</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {lastSummary && (
                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={12} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400">AI Summary</span>
                    </div>
                    <p className="text-xs text-dim">{lastSummary}</p>
                </div>
            )}

            {/* Actions */}
            {conversations.length > 0 && (
                <div className="flex gap-2">
                    <button
                        onClick={() => analyzeConversation(conversations)}
                        disabled={isProcessing}
                        className="flex-1 text-xs py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)',
                            color: 'white'
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <MessageSquare size={14} />
                                Analyze Conservation
                            </>
                        )}
                    </button>
                    <button
                        onClick={clearConversation}
                        className="text-xs py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 text-gray-300 hover:text-white"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.color = '#fca5a5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#d1d5db';
                        }}
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                </div>
            )}

            {/* No speech API warning */}
            {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
                <p className="text-xs text-red-400 mt-2">
                    ⚠️ Speech recognition not supported in this browser. Use Chrome for best results.
                </p>
            )}
        </div>
    );
}
