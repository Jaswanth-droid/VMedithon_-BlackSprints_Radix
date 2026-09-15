import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, 
    User, 
    FileText, 
    Printer, 
    Download, 
    Phone, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Sparkles, 
    Plus, 
    Activity, 
    Heart, 
    Brain, 
    Share2, 
    Pill,
    Check,
    Stethoscope
} from 'lucide-react';
import { CaregiverNote, getCaregiverNotes, addCaregiverNote, generateId } from './memoryDatabase';
import { ProgressionRecord } from './diseaseAnalytics';
import { BehaviorIncident } from './behaviorMentalHealth';

interface CaregiverPortalProps {
    primaryModel?: any;
    backupModel?: any;
    patientName?: string;
    progressionHistory: ProgressionRecord[];
    behaviorIncidents: BehaviorIncident[];
    onClose?: () => void;
}

export default function CaregiverPortal({
    primaryModel,
    backupModel,
    patientName = "Patient",
    progressionHistory,
    behaviorIncidents,
    onClose
}: CaregiverPortalProps) {
    const [notes, setNotes] = useState<CaregiverNote[]>([]);
    const [activeReportTab, setActiveReportTab] = useState<'digest' | 'clinical' | 'medication' | 'journal'>('digest');
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
    const [customDigest, setCustomDigest] = useState<string | null>(null);

    // Form inputs
    const [noteAuthor, setNoteAuthor] = useState('Maya Sharma');
    const [noteRole, setNoteRole] = useState('Primary Caregiver / Daughter');
    const [noteCategory, setNoteCategory] = useState<CaregiverNote['category']>('observation');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteBody, setNoteBody] = useState('');

    // Medication checklist state
    const [meds, setMeds] = useState([
        { id: 1, name: 'Donepezil (Aricept) 10mg', time: '08:00 AM (Breakfast)', taken: true, purpose: 'Cholinesterase inhibitor for cognitive stability' },
        { id: 2, name: 'Memantine (Namenda) 10mg', time: '08:00 AM (Breakfast)', taken: true, purpose: 'NMDA receptor antagonist for moderate dementia' },
        { id: 3, name: 'Vitamin D3 + Omega 3 Complex', time: '12:30 PM (Lunch)', taken: true, purpose: 'Neuro-protective cellular support' },
        { id: 4, name: 'Melatonin 3mg (Circadian Sync)', time: '09:00 PM (Bedtime)', taken: false, purpose: 'Sundowning and sleep architecture regulation' },
    ]);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        const data = await getCaregiverNotes();
        setNotes(data);
    };

    const latestProgression = progressionHistory.length > 0
        ? progressionHistory[progressionHistory.length - 1]
        : null;

    const handleToggleMed = (id: number) => {
        setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        const newNote: CaregiverNote = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            author: noteAuthor,
            role: noteRole,
            category: noteCategory,
            title: noteTitle || 'Clinical Observation',
            note: noteBody || 'Caregiver update recorded.'
        };

        await addCaregiverNote(newNote);
        setIsAddNoteModalOpen(false);
        setNoteTitle('');
        setNoteBody('');
        await loadNotes();
    };

    const handleGenerateAICaregiverDigest = async () => {
        setIsGeneratingDigest(true);
        const model = primaryModel || backupModel;

        const prompt = `You are the AI Caregiver Coordination Engine for Mnemosync.
Synthesize a comprehensive Weekly Caregiver & Clinical Briefing for the family and medical team of:
Patient: ${patientName}
Current Stage: CDR ${latestProgression?.cdrScore} (${latestProgression?.cdrStage}), FAST ${latestProgression?.fastStage}
Overall Severity: ${latestProgression?.severityIndex}%
Recent Memory Score: ${latestProgression?.memoryRetention}%
Facial Recognition Score: ${latestProgression?.facialRecognitionScore}%
Recent Behavioral Logs: ${behaviorIncidents.slice(0, 4).map(b => `${b.timeLabel}: ${b.type} (${b.severity}) - ${b.description}`).join('\n')}

Generate a concise, caring, and actionable summary containing:
1. Executive Caregiver Summary (Key changes this week)
2. Safe Daily Schedule Directives (Optimal lucidity times & sunset precautions)
3. Immediate Safety Recommendations
4. Talking Points for Next Neurologist Consultation`;

        try {
            if (model) {
                const res = await model.generateContent(prompt);
                const text = (await res.response).text();
                setCustomDigest(text);
            } else {
                setTimeout(() => {
                    setCustomDigest(`### Comprehensive Caregiver Weekly Digest: ${patientName}
**Reporting Period:** September 8 – September 15, 2026

#### 1. Executive Caregiver Summary
The patient maintained stable cognitive lucidity throughout morning hours, supported by real-time Mnemosync facial HUD overlays during family visits. The longitudinal progression index stands at **57% severity (CDR 1.2)**, reflecting a gradual trajectory. Recent short-term recall challenges are effectively compensated when visual prompt cards and voice verification are active.

#### 2. Circadian & Daily Schedule Directives
- **09:00 AM – 12:30 PM (Peak Cognitive Band)**: Schedule all medical appointments, physical exercises, and photo album reminiscence therapy in this window.
- **05:00 PM – 07:30 PM (Sundowning Vulnerability)**: Keep indoor lighting warm (2700K) and turn on soothing acoustic music 15 minutes before sunset.
- **10:00 PM – 06:00 AM (Nocturnal Guard)**: Perimeter smart sensor active; nightlights in hallway to prevent exit-seeking confusion.

#### 3. Immediate Safety Precautions
- Facial recognition accuracy was 70% during yesterday's delivery encounter. Remind all secondary visitors to speak their name softly upon entering.
- 3 out of 4 daily medications verified on schedule. Evening Melatonin timing is critical for unbroken 6.5h sleep cycle.

#### 4. Neurologist Talking Points for Dr. Jenkins
- Discuss maintaining current Donepezil 10mg + Memantine 10mg titration.
- Review daytime vs nocturnal sleep architecture.
- Confirm continued utility of wearable/desktop biometric memory cues.`);
                    setIsGeneratingDigest(false);
                }, 1200);
                return;
            }
        } catch (err: any) {
            setCustomDigest(`Digest error: ${err.message}`);
        } finally {
            setIsGeneratingDigest(false);
        }
    };

    const handlePrintSummary = () => {
        window.print();
    };

    const handleDownloadReport = () => {
        const reportData = {
            patient: patientName,
            exportDate: new Date().toISOString(),
            clinicalStaging: latestProgression,
            recentIncidents: behaviorIncidents,
            caregiverNotes: notes,
            medicationSchedule: meds
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mnemosync_Caregiver_Clinical_Report_${patientName}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-2 text-white">
            {/* Header / Caregiver Banner */}
            <div className="card card-enhanced gradient-border p-5" style={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(15, 23, 42, 0.95))' }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', padding: '0.85rem', borderRadius: '1.25rem', boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}>
                            <Shield size={32} color="white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">Caregiver Portal & Clinical Medical Reports</h2>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Encrypted Caregiver Access
                                </span>
                            </div>
                            <p className="text-xs text-dim mt-0.5">
                                Consolidated progression analytics, behavioral reports, medication logs, and doctor summaries for family & medical teams
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadReport}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-glass border border-border text-xs font-semibold hover:border-emerald-400 transition-all cursor-pointer"
                        >
                            <Download size={14} /> Export JSON
                        </button>
                        <button
                            onClick={handlePrintSummary}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-glass border border-border text-xs font-semibold hover:border-emerald-400 transition-all cursor-pointer"
                        >
                            <Printer size={14} /> Print Report
                        </button>
                        <button
                            onClick={handleGenerateAICaregiverDigest}
                            disabled={isGeneratingDigest}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer text-white shadow-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #059669, #0284c7)', boxShadow: '0 0 20px rgba(5, 150, 105, 0.35)' }}
                        >
                            <Sparkles size={14} className={isGeneratingDigest ? 'animate-spin' : ''} />
                            {isGeneratingDigest ? 'Generating...' : 'Generate Caregiver Digest'}
                        </button>
                    </div>
                </div>

                {/* Patient Vitals & Clinical Snapshot */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <div className="p-3 rounded-xl bg-black/40 border border-border">
                        <span className="text-[11px] text-dim block">Assigned Patient</span>
                        <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                            <User size={16} className="text-emerald-400" /> {patientName} (Age 72)
                        </div>
                        <span className="text-[10px] text-emerald-300">Monitored 24/7 via Mnemosync</span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-border">
                        <span className="text-[11px] text-dim block">Current Staging</span>
                        <div className="text-base font-bold text-amber-300 mt-1 flex items-center gap-1.5">
                            <Brain size={16} /> CDR {latestProgression?.cdrScore || 1.2} ({latestProgression?.cdrStage || 'Mild Dementia'})
                        </div>
                        <span className="text-[10px] text-dim">FAST Stage: {latestProgression?.fastStage || 4.8}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-border">
                        <span className="text-[11px] text-dim block">Behavioral Security</span>
                        <div className="text-base font-bold text-cyan-300 mt-1 flex items-center gap-1.5">
                            <Shield size={16} /> Perimeter Protected
                        </div>
                        <span className="text-[10px] text-dim">Wandering Risk: 42% (Normal)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-border">
                        <span className="text-[11px] text-dim block">Caregiver SOS Dispatch</span>
                        <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                            <Phone size={16} /> Active Care Team
                        </div>
                        <span className="text-[10px] text-dim">Maya (Daughter) + Dr. Jenkins</span>
                    </div>
                </div>
            </div>

            {/* AI Caregiver Digest Card */}
            <AnimatePresence>
                {customDigest && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="card card-enhanced border border-emerald-500/40 p-5 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(6, 40, 30, 0.9), rgba(15, 23, 42, 0.95))' }}
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-emerald-400" />
                                <h3 className="font-bold text-sm text-emerald-200">AI Caregiver Weekly Synthesis & Directives</h3>
                            </div>
                            <button
                                onClick={() => setCustomDigest(null)}
                                className="text-xs text-dim hover:text-white px-2 py-1 rounded bg-glass"
                            >
                                Dismiss
                            </button>
                        </div>
                        <div className="text-xs leading-relaxed text-gray-200 space-y-2 whitespace-pre-wrap font-mono">
                            {customDigest}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Tabs for Caregiver Modules */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-border text-xs">
                <button
                    onClick={() => setActiveReportTab('digest')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeReportTab === 'digest' ? 'bg-emerald-600 text-white font-bold' : 'text-dim hover:text-white'
                    }`}
                >
                    <FileText size={15} /> Caregiver Reports Digest
                </button>
                <button
                    onClick={() => setActiveReportTab('clinical')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeReportTab === 'clinical' ? 'bg-emerald-600 text-white font-bold' : 'text-dim hover:text-white'
                    }`}
                >
                    <Stethoscope size={15} /> Neurologist Clinical Summary
                </button>
                <button
                    onClick={() => setActiveReportTab('medication')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeReportTab === 'medication' ? 'bg-emerald-600 text-white font-bold' : 'text-dim hover:text-white'
                    }`}
                >
                    <Pill size={15} /> Medication & Adherence
                </button>
                <button
                    onClick={() => setActiveReportTab('journal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeReportTab === 'journal' ? 'bg-emerald-600 text-white font-bold' : 'text-dim hover:text-white'
                    }`}
                >
                    <Calendar size={15} /> Doctor & Caregiver Journal ({notes.length})
                </button>
            </div>

            {/* Tab 1: Caregiver Digest & Key Action Directives */}
            {activeReportTab === 'digest' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 card p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div>
                                <h3 className="text-sm font-bold">Weekly Progression & Behavior Executive Summary</h3>
                                <p className="text-[11px] text-dim">Accessible summary tailored for family caregivers and care assistants</p>
                            </div>
                            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                Status: Well Managed
                            </span>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed text-gray-300">
                            <div className="p-3 rounded-xl bg-glass border border-border">
                                <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                                    <Brain size={14} className="text-indigo-400" /> Disease Progression Status
                                </h4>
                                <p>
                                    Patient is currently at <strong>CDR 1.2 (Mild Dementia)</strong> with a global severity of <strong>57%</strong>. Over the past 6 months, progression velocity has averaged <strong>+2.1% severity/month</strong>. Facial recognition remains well supported by the visual HUD (70% recognition rate).
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-glass border border-border">
                                <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                                    <Heart size={14} className="text-pink-400" /> Mental Health & Sundowning Patterns
                                </h4>
                                <p>
                                    Emotional stability is rated at <strong>68%</strong>. Dusk-triggered restlessness (sundowning) occurs between 17:30 and 19:00. The acoustic music calming protocol and familiar voice reminders successfully shortened agitation episodes from 45 mins to 12 mins.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-glass border border-border">
                                <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                                    <Shield size={14} className="text-cyan-400" /> Safety & Perimeter Directives
                                </h4>
                                <p>
                                    Nocturnal wandering risk is moderate (42%). One exit-seeking incident logged 2 days ago at 03:15 AM due to hallway darkness. Hallway nightlights have since resolved orientation lag.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Care Team Contacts & Direct SOS */}
                    <div className="card p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold mb-1">Care Circle & Emergency Contacts</h3>
                            <p className="text-[11px] text-dim mb-4">Direct contact links for emergency response & clinical queries</p>

                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-glass border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                                            MS
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold">Maya Sharma</div>
                                            <div className="text-[10px] text-dim">Primary Caregiver (Daughter)</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => alert('Calling Maya Sharma: +1 (555) 382-9912')}
                                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 cursor-pointer"
                                    >
                                        <Phone size={14} />
                                    </button>
                                </div>

                                <div className="p-3 rounded-xl bg-glass border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                                            SJ
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold">Dr. Sarah Jenkins</div>
                                            <div className="text-[10px] text-dim">Consulting Neurologist</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => alert('Calling Clinic: +1 (555) 749-1100')}
                                        className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 cursor-pointer"
                                    >
                                        <Phone size={14} />
                                    </button>
                                </div>

                                <div className="p-3 rounded-xl bg-glass border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                                            911
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-rose-300">Emergency Dispatch</div>
                                            <div className="text-[10px] text-dim">24/7 Memory Care Unit</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => alert('Emergency dispatch protocol confirmed.')}
                                        className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                                    >
                                        <Phone size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border">
                            <span className="text-[10px] text-dim block text-center">
                                All clinical telemetry synced with Mnemosync Core DB
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Neurologist Clinical Summary */}
            {activeReportTab === 'clinical' && (
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Stethoscope size={16} className="text-indigo-400" />
                                Neurological Consultation & Formal Clinical Audit
                            </h3>
                            <p className="text-[11px] text-dim">Structured medical report ready for physician review</p>
                        </div>
                        <button
                            onClick={handlePrintSummary}
                            className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                        >
                            <Printer size={13} /> Print Consultation Sheet
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-black/40 border border-border space-y-2">
                            <h4 className="font-bold text-indigo-300 border-b border-border pb-1">Cognitive & Staging Audit</h4>
                            <p><strong className="text-white">Primary Diagnosis:</strong> Early-Stage Alzheimer's Disease (G30.0)</p>
                            <p><strong className="text-white">Clinical Dementia Rating (CDR):</strong> {latestProgression?.cdrScore} - {latestProgression?.cdrStage}</p>
                            <p><strong className="text-white">FAST Stage:</strong> {latestProgression?.fastStage} ({latestProgression?.fastDescription})</p>
                            <p><strong className="text-white">Estimated MMSE:</strong> {latestProgression?.mmseEstimated} / 30</p>
                            <p><strong className="text-white">Memory Retention Rate:</strong> {latestProgression?.memoryRetention}%</p>
                            <p><strong className="text-white">Facial Recognition Index:</strong> {latestProgression?.facialRecognitionScore}%</p>
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-border space-y-2">
                            <h4 className="font-bold text-emerald-300 border-b border-border pb-1">Neuropsychiatric & Behavioral Metrics</h4>
                            <p><strong className="text-white">NPI-Q Agitation Score:</strong> Moderate (Controlled with audio cueing)</p>
                            <p><strong className="text-white">Circadian Sundowning:</strong> Active (Peak 17:30–19:30)</p>
                            <p><strong className="text-white">Wandering / Exit Tendency:</strong> Low-Moderate (Perimeter alert active)</p>
                            <p><strong className="text-white">Sleep Quality Index:</strong> 71% (Avg 2.3 awakenings / night)</p>
                            <p><strong className="text-white">Current Regimen:</strong> Donepezil 10mg PO QAM + Memantine 10mg PO QAM</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-glass border border-border text-xs leading-relaxed text-gray-300">
                        <h4 className="font-bold text-amber-300 mb-1">Physician Clinical Impression:</h4>
                        <p>
                            Patient is experiencing a standard mild progressive neurodegenerative course. Daily routine adherence and digital facial memory cueing have demonstrably prolonged independent engagement in home activities. Recommend maintaining current pharmacotherapy and repeating formal cognitive battery in 90 days.
                        </p>
                    </div>
                </div>
            )}

            {/* Tab 3: Medication & Adherence Tracker */}
            {activeReportTab === 'medication' && (
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Pill size={16} className="text-amber-400" />
                                Medication Schedule & Caregiver Adherence Tracker
                            </h3>
                            <p className="text-[11px] text-dim">Daily prescriptions, timing verification, and clinical purposes</p>
                        </div>
                        <span className="text-xs text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                            Today's Adherence: {Math.round((meds.filter(m => m.taken).length / meds.length) * 100)}%
                        </span>
                    </div>

                    <div className="space-y-3">
                        {meds.map((med) => (
                            <div
                                key={med.id}
                                onClick={() => handleToggleMed(med.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                    med.taken
                                        ? 'bg-emerald-950/20 border-emerald-500/30'
                                        : 'bg-glass border-border hover:border-amber-400/40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                                        med.taken
                                            ? 'bg-emerald-500 border-emerald-400 text-black'
                                            : 'border-border text-transparent'
                                    }`}>
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                            {med.name}
                                            <span className="text-[10px] text-dim font-mono bg-black/40 px-2 py-0.5 rounded">
                                                {med.time}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-dim mt-0.5">{med.purpose}</div>
                                    </div>
                                </div>

                                <div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                        med.taken
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    }`}>
                                        {med.taken ? 'Administered' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 4: Doctor & Caregiver Journal */}
            {activeReportTab === 'journal' && (
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-400" />
                                Caregiver Journal & Multidisciplinary Clinical Log
                            </h3>
                            <p className="text-[11px] text-dim">Shared notes recorded by family members, nurses, and visiting specialists</p>
                        </div>
                        <button
                            onClick={() => setIsAddNoteModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-glass border border-border text-xs font-semibold hover:border-primary transition-all cursor-pointer"
                        >
                            <Plus size={14} /> Add Journal Entry
                        </button>
                    </div>

                    <div className="space-y-3">
                        {notes.map((n) => (
                            <div key={n.id} className="p-4 rounded-xl bg-glass border border-border hover:border-primary/40 transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{n.title}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 capitalize">
                                            {n.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-dim">
                                        {new Date(n.timestamp).toLocaleDateString()} {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">{n.note}</p>
                                <div className="text-[11px] text-dim mt-2 pt-2 border-t border-border flex items-center gap-2">
                                    <User size={12} className="text-accent" />
                                    <span><strong>{n.author}</strong> ({n.role})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal: Add Caregiver Journal Note */}
            <AnimatePresence>
                {isAddNoteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="modal-card max-w-lg"
                        >
                            <div className="modal-content">
                                <h3 className="text-lg font-bold text-white mb-2">New Caregiver Journal Entry</h3>
                                <p className="text-xs text-dim mb-4">Log observations, doctor advice, or medication notes for {patientName}</p>

                                <form onSubmit={handleSaveNote} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-dim block mb-1">Author Name</label>
                                            <input
                                                type="text"
                                                value={noteAuthor}
                                                onChange={(e) => setNoteAuthor(e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-dim block mb-1">Role</label>
                                            <input
                                                type="text"
                                                value={noteRole}
                                                onChange={(e) => setNoteRole(e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Category</label>
                                        <select
                                            value={noteCategory}
                                            onChange={(e) => setNoteCategory(e.target.value as CaregiverNote['category'])}
                                            className="input-field"
                                        >
                                            <option value="observation">General Daily Observation</option>
                                            <option value="doctor_visit">Neurologist / Doctor Consultation</option>
                                            <option value="medication">Medication & Vitals Update</option>
                                            <option value="safety_alert">Safety Alert / Incident Follow-up</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Entry Title</label>
                                        <input
                                            type="text"
                                            value={noteTitle}
                                            onChange={(e) => setNoteTitle(e.target.value)}
                                            placeholder="e.g. Afternoon Walk & Lucidity Notes"
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Detailed Note</label>
                                        <textarea
                                            value={noteBody}
                                            onChange={(e) => setNoteBody(e.target.value)}
                                            placeholder="Write your observation, patient mood, physical response, or doctor recommendations..."
                                            className="input-field h-20 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddNoteModalOpen(false)}
                                            className="flex-1 py-2.5 rounded-xl bg-glass border border-border text-xs font-semibold cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-semibold cursor-pointer"
                                        >
                                            Save Journal Note
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
