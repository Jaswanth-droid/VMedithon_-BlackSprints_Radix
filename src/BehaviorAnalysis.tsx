import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Moon, 
    Sun, 
    AlertTriangle, 
    Heart, 
    Shield, 
    Clock, 
    Smile, 
    Frown, 
    Meh, 
    Sparkles, 
    Plus, 
    Volume2, 
    Compass, 
    Music, 
    Check, 
    Info, 
    ArrowUpRight,
    Flame
} from 'lucide-react';
import { 
    BehaviorIncident, 
    BehaviorType, 
    IncidentSeverity, 
    MentalHealthMetrics, 
    INITIAL_MENTAL_METRICS, 
    MOCK_DAILY_MOOD_CURVE 
} from './behaviorMentalHealth';
import { getBehaviorIncidents, addBehaviorIncident, generateId } from './memoryDatabase';

interface BehaviorAnalysisProps {
    primaryModel?: any;
    backupModel?: any;
    patientName?: string;
    onNavigateToCaregiver?: () => void;
}

export default function BehaviorAnalysis({
    primaryModel,
    backupModel,
    patientName = "Patient",
    onNavigateToCaregiver
}: BehaviorAnalysisProps) {
    const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [metrics, setMetrics] = useState<MentalHealthMetrics>(INITIAL_MENTAL_METRICS);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiBehaviorReport, setAiBehaviorReport] = useState<string | null>(null);

    // Form inputs
    const [newType, setNewType] = useState<BehaviorType>('agitation');
    const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('Moderate');
    const [newTrigger, setNewTrigger] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newActionTaken, setNewActionTaken] = useState('');

    useEffect(() => {
        loadIncidents();
    }, []);

    const loadIncidents = async () => {
        const data = await getBehaviorIncidents();
        setIncidents(data);
    };

    const filteredIncidents = filterType === 'all'
        ? incidents
        : incidents.filter(i => i.type === filterType);

    const handleSaveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        const newInc: BehaviorIncident = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            timeLabel: 'Just now',
            type: newType,
            severity: newSeverity,
            trigger: newTrigger || 'Spontaneous onset',
            description: newDescription || 'Observed behavioral shift logged by caregiver.',
            caregiverActionTaken: newActionTaken || 'Reassurance and orientation provided.',
            resolved: true
        };

        await addBehaviorIncident(newInc);
        setIsAddModalOpen(false);
        setNewTrigger('');
        setNewDescription('');
        setNewActionTaken('');
        await loadIncidents();
    };

    const handleGenerateAIReport = async () => {
        setIsGeneratingAI(true);
        const model = primaryModel || backupModel;

        const prompt = `You are a clinical neuro-psychiatrist specializing in behavioral and psychological symptoms of dementia (BPSD).
Analyze the following patient's behavioral and mental health data:
- Patient: ${patientName}
- Emotional Stability Score: ${metrics.emotionalStabilityScore}%
- Current Mood: ${metrics.currentMood}
- Sundowning Index: ${metrics.sundowningIndex}% (High evening restlessness)
- Wandering Risk: ${metrics.wanderingRiskScore}%
- Sleep Quality: ${metrics.sleepQualityIndex}% (Avg awakenings: ${metrics.nightAwakeningsAvg}/night)
- Recent Incidents:
${incidents.map(inc => `* [${inc.timeLabel}] ${inc.type.toUpperCase()} (${inc.severity}): ${inc.description}`).join('\n')}

Provide an expert Behavioral & Mental Health Clinical Report with:
1. **Neuropsychiatric State Assessment**: Analysis of mood patterns, circadian disruptions, and sundowning triggers.
2. **Environmental & Psychological Triggers**: Root causes for agitation, confusion, or exit-seeking.
3. **Caregiver De-escalation & Calming Action Plan**: 3 immediate actionable strategies for family/caregivers.
4. **Caregiver Safety Directives**: Safety precautions to prevent nocturnal wandering or severe agitation.`;

        try {
            if (model) {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                setAiBehaviorReport(response.text());
            } else {
                setTimeout(() => {
                    setAiBehaviorReport(`### Behavioral & Neuropsychiatric Audit: ${patientName}
**Generated:** ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

#### 1. Neuropsychiatric State Assessment
The patient demonstrates a **moderate emotional stability baseline (68%)** with distinct circadian vulnerability during late afternoon/dusk hours (**Sundowning Index 64%**). Lucidity is consistently highest between 08:00 and 13:00, with agitation spikes correlating with environmental overstimulation or unfamiliar faces.

#### 2. Primary Triggers Identified
- **Twilight Lighting Shifts**: Sudden drop in natural daylight triggers temporal disorientation and workplace delusion.
- **Unfamiliar Person Encounters**: Secondary visitors without prior visual HUD prompts cause momentary acute anxiety.
- **Nighttime Sensory Deprivation**: Awakening in dark corridors causes directional confusion towards external doors.

#### 3. Caregiver De-escalation & Calming Protocol
1. **Pre-emptive Twilight Transition**: Activate 2700K warm circadian illumination at 16:45 prior to dusk onset.
2. **Audio Nostalgia Cueing**: Deploy familiar 1970s acoustic music and recorded family voice clips via Mnemosync voice assistant.
3. **Perimeter Reassurance**: Utilize the living room HUD to display the daily calendar and comforting family photos.`);
                    setIsGeneratingAI(false);
                }, 1100);
                return;
            }
        } catch (error: any) {
            console.error('Error generating behavior report:', error);
            setAiBehaviorReport(`Error: ${error.message || 'Unable to generate analysis'}`);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const getSeverityBadge = (sev: IncidentSeverity) => {
        switch (sev) {
            case 'Critical': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            case 'Severe': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Moderate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        }
    };

    const getTypeIcon = (type: BehaviorType) => {
        switch (type) {
            case 'sundowning': return <Moon size={15} className="text-purple-400" />;
            case 'wandering_risk': return <Compass size={15} className="text-rose-400" />;
            case 'agitation': return <Flame size={15} className="text-amber-400" />;
            case 'anxiety': return <AlertTriangle size={15} className="text-yellow-400" />;
            case 'calm_lucid': return <Smile size={15} className="text-emerald-400" />;
            default: return <Activity size={15} className="text-indigo-400" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-2 text-white">
            {/* Top Overview Banner */}
            <div className="card card-enhanced gradient-border p-5" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '0.85rem', borderRadius: '1.25rem', boxShadow: '0 0 25px rgba(236, 72, 153, 0.4)' }}>
                            <Heart size={32} color="white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">Behavior Analysis & Mental Health</h2>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                    NPI-Q Neuropsychiatric Tracking
                                </span>
                            </div>
                            <p className="text-xs text-dim mt-0.5">
                                Real-time monitoring of agitation, sundowning circadian patterns, anxiety, and wandering prevention
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-glass border border-border text-xs font-semibold hover:border-pink-400 transition-all cursor-pointer"
                        >
                            <Plus size={15} />
                            Log Observation
                        </button>
                        <button
                            onClick={handleGenerateAIReport}
                            disabled={isGeneratingAI}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer text-white shadow-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #db2777, #7c3aed)', boxShadow: '0 0 20px rgba(219, 39, 119, 0.35)' }}
                        >
                            <Sparkles size={15} className={isGeneratingAI ? 'animate-spin' : ''} />
                            {isGeneratingAI ? 'Synthesizing...' : 'AI Neuropsychiatric Audit'}
                        </button>
                    </div>
                </div>

                {/* 4 Mental Health Quick Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    {/* Emotional Stability */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-dim font-medium">Emotional Stability</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                                {metrics.emotionalStabilityScore}%
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="text-base font-bold text-emerald-200">{metrics.currentMood}</p>
                            <p className="text-[11px] text-dim mt-0.5">Current mood state</p>
                        </div>
                    </div>

                    {/* Sundowning Index */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-dim font-medium">Sundowning Index</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                                {metrics.sundowningIndex}%
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="text-base font-bold text-purple-200">Dusk Vulnerability</p>
                            <p className="text-[11px] text-dim mt-0.5">Peak time: 17:00 – 19:30</p>
                        </div>
                    </div>

                    {/* Wandering Risk */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-dim font-medium">Wandering Risk Score</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                                {metrics.wanderingRiskScore}%
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="text-base font-bold text-amber-200">Perimeter Guard ON</p>
                            <p className="text-[11px] text-dim mt-0.5">Nocturnal monitoring active</p>
                        </div>
                    </div>

                    {/* Sleep Architecture */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-dim font-medium">Sleep Quality Score</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold">
                                {metrics.sleepQualityIndex}%
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="text-base font-bold text-cyan-200">{metrics.nightAwakeningsAvg} Awakenings/night</p>
                            <p className="text-[11px] text-dim mt-0.5">Smart nightlight enabled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Clinical & Behavioral Alerts */}
            {metrics.activeAlerts.length > 0 && (
                <div className="space-y-2">
                    {metrics.activeAlerts.map(alt => (
                        <div
                            key={alt.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                                alt.level === 'warning'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} className={alt.level === 'warning' ? 'text-amber-400' : 'text-indigo-400'} />
                                <div>
                                    <div className="text-xs font-bold">{alt.title}</div>
                                    <div className="text-[11px] text-dim">{alt.message}</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono text-dim">{alt.timestamp}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Generated Behavioral Audit (if open) */}
            <AnimatePresence>
                {aiBehaviorReport && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="card card-enhanced border border-pink-500/40 p-5 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(45, 10, 35, 0.9), rgba(15, 23, 42, 0.95))' }}
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-pink-400" />
                                <h3 className="font-bold text-sm text-pink-200">AI Neuropsychiatric & Behavioral Assessment</h3>
                            </div>
                            <button
                                onClick={() => setAiBehaviorReport(null)}
                                className="text-xs text-dim hover:text-white px-2 py-1 rounded bg-glass"
                            >
                                Dismiss
                            </button>
                        </div>
                        <div className="text-xs leading-relaxed text-gray-200 space-y-2 whitespace-pre-wrap font-mono">
                            {aiBehaviorReport}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Middle Section: Daily Circadian Curve & De-escalation Toolkit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Daily Circadian Agitation & Lucidity Heatmap */}
                <div className="lg:col-span-2 card p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Sun size={16} className="text-amber-400" />
                                24-Hour Diurnal Mood & Agitation Curve
                            </h3>
                            <p className="text-[11px] text-dim">Hourly lucidity vs sundowning agitation risk profile</p>
                        </div>
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30">
                            Sundowning Window: 17:30
                        </span>
                    </div>

                    {/* Bar chart for circadian day curve */}
                    <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-xl border border-border">
                        {MOCK_DAILY_MOOD_CURVE.map((slot, i) => (
                            <div key={i} className="flex flex-col items-center justify-end h-32 gap-1.5">
                                <span className="text-[10px] font-bold text-gray-300">{slot.moodScore}%</span>
                                
                                <div className="w-full bg-gray-800 rounded-t-lg h-24 flex items-end justify-center p-1 relative overflow-hidden">
                                    <div
                                        className={`w-full rounded-t transition-all duration-500 ${
                                            slot.sundowningPeak 
                                                ? 'bg-gradient-to-t from-purple-600 to-pink-500' 
                                                : 'bg-gradient-to-t from-indigo-600 to-emerald-400'
                                        }`}
                                        style={{ height: `${slot.moodScore}%` }}
                                    />
                                    {slot.sundowningPeak && (
                                        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-pink-300 font-bold">
                                            Peak
                                        </div>
                                    )}
                                </div>
                                
                                <span className="text-[9px] font-medium text-dim text-center">{slot.timeSlot}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-dim mt-3 pt-2 border-t border-border">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> High Lucidity (Morning)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-pink-500" /> Sundowning Risk (Dusk)
                            </span>
                        </div>
                        <span className="text-[11px] text-purple-300">Optimal cognitive window: 09:00 - 12:30</span>
                    </div>
                </div>

                {/* Caregiver De-Escalation Toolkit */}
                <div className="card p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                            <Shield size={16} className="text-emerald-400" />
                            Caregiver Calming & De-Escalation Toolkit
                        </h3>
                        <p className="text-[11px] text-dim mb-3">Instant sensory & cognitive protocols for moments of agitation</p>
                    </div>

                    <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Music size={16} className="text-purple-400" />
                                <div>
                                    <div className="text-xs font-semibold">1970s Acoustic Memories</div>
                                    <div className="text-[10px] text-dim">Calms sundowning restlessness</div>
                                </div>
                            </div>
                            <button
                                onClick={() => alert('Playing familiar acoustic calming melody through Mnemosync Audio...')}
                                className="px-2.5 py-1 rounded bg-purple-500/30 text-purple-200 text-xs hover:bg-purple-500/50 cursor-pointer"
                            >
                                Play
                            </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Volume2 size={16} className="text-indigo-400" />
                                <div>
                                    <div className="text-xs font-semibold">Family Voice Reminder</div>
                                    <div className="text-[10px] text-dim">"You are safe at home, Dad"</div>
                                </div>
                            </div>
                            <button
                                onClick={() => alert('Broadcasting reassuring family message through assistant...')}
                                className="px-2.5 py-1 rounded bg-indigo-500/30 text-indigo-200 text-xs hover:bg-indigo-500/50 cursor-pointer"
                            >
                                Trigger
                            </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Sun size={16} className="text-emerald-400" />
                                <div>
                                    <div className="text-xs font-semibold">Warm Circadian Lighting</div>
                                    <div className="text-[10px] text-dim">Mitigate dusk shadows</div>
                                </div>
                            </div>
                            <button
                                onClick={() => alert('Warm Ambient Lighting command sent.')}
                                className="px-2.5 py-1 rounded bg-emerald-500/30 text-emerald-200 text-xs hover:bg-emerald-500/50 cursor-pointer"
                            >
                                Max Lux
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-dim">Caregiver alert sync: ON</span>
                        {onNavigateToCaregiver && (
                            <button
                                onClick={onNavigateToCaregiver}
                                className="text-xs text-pink-400 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                                Caregiver Reports <ArrowUpRight size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Behavior Incidents Log */}
            <div className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Clock size={16} className="text-indigo-400" />
                            Behavioral Incidents & Mental Health Timeline
                        </h3>
                        <p className="text-[11px] text-dim">Chronological log of agitation, confusion, exit-seeking, and lucid windows</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-border text-xs">
                        {['all', 'agitation', 'sundowning', 'wandering_risk', 'anxiety', 'calm_lucid'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterType(tab)}
                                className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                                    filterType === tab
                                        ? 'bg-primary text-white font-semibold'
                                        : 'text-dim hover:text-white'
                                }`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredIncidents.length === 0 ? (
                        <p className="text-xs text-dim text-center py-6">No incidents found in this category.</p>
                    ) : (
                        filteredIncidents.map((inc) => (
                            <div
                                key={inc.id}
                                className="p-3.5 rounded-xl bg-glass border border-border hover:border-primary/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                            >
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-1 p-2 rounded-lg bg-black/40 border border-border">
                                        {getTypeIcon(inc.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-white capitalize">{inc.type.replace('_', ' ')}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(inc.severity)}`}>
                                                {inc.severity} Severity
                                            </span>
                                            <span className="text-[11px] text-dim font-mono">{inc.timeLabel}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                            {inc.description}
                                        </p>
                                        <div className="text-[11px] text-dim mt-1.5 flex flex-wrap items-center gap-3">
                                            <span><strong>Trigger:</strong> {inc.trigger}</span>
                                            <span><strong>Caregiver Action:</strong> {inc.caregiverActionTaken}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <Check size={11} /> Resolved
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal: Log New Observation */}
            <AnimatePresence>
                {isAddModalOpen && (
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
                                <h3 className="text-lg font-bold text-white mb-2">Log Behavioral Observation</h3>
                                <p className="text-xs text-dim mb-4">Record new mood swing, agitation episode, or lucid moment for {patientName}</p>

                                <form onSubmit={handleSaveIncident} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-dim block mb-1">Behavior Category</label>
                                            <select
                                                value={newType}
                                                onChange={(e) => setNewType(e.target.value as BehaviorType)}
                                                className="input-field"
                                            >
                                                <option value="agitation">Agitation / Restlessness</option>
                                                <option value="sundowning">Sundowning / Dusk Confusion</option>
                                                <option value="wandering_risk">Wandering / Exit Seeking</option>
                                                <option value="anxiety">Anxiety / Fear</option>
                                                <option value="confusion">Disorientation / Confusion</option>
                                                <option value="calm_lucid">Calm / Lucid Memory Window</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-dim block mb-1">Severity</label>
                                            <select
                                                value={newSeverity}
                                                onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                                                className="input-field"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Moderate">Moderate</option>
                                                <option value="Severe">Severe</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Observed Trigger</label>
                                        <input
                                            type="text"
                                            value={newTrigger}
                                            onChange={(e) => setNewTrigger(e.target.value)}
                                            placeholder="e.g. Dusk shadows, loud television, unfamiliar guest"
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Behavior Description</label>
                                        <textarea
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            placeholder="Describe patient verbal and physical cues, statements, or signs of distress..."
                                            className="input-field h-16 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-dim block mb-1">Caregiver De-Escalation Action Taken</label>
                                        <input
                                            type="text"
                                            value={newActionTaken}
                                            onChange={(e) => setNewActionTaken(e.target.value)}
                                            placeholder="e.g. Played soothing music, showed family photo album"
                                            className="input-field"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="flex-1 py-2.5 rounded-xl bg-glass border border-border text-xs font-semibold cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-semibold cursor-pointer"
                                        >
                                            Save Observation
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
