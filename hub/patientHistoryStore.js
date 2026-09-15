/**
 * Patient Longitudinal Medical Record Store & Health Progression Engine
 * Stores serial scans and computes longitudinal regression, future 12-month projections,
 * and 270-degree analog speedometer risk metrics.
 */

const patientDatabase = new Map();

// Helper to normalize names
function normalizeName(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Seed initial historical patient records
const initialSeed = [
    {
        name: "Rajesh K. Verma",
        age: 72,
        gender: "Male",
        primaryHospital: "Vasundhara Hospital, Ghaziabad",
        primaryPhysician: "Dr. A. K. Banerjee (MD, DM Neurology)",
        scans: [
            {
                scanId: "SCN-2024-0518",
                date: "2024-05-18",
                hospital: "Vasundhara Hospital, Ghaziabad",
                physician: "Dr. A. K. Banerjee",
                stage: "Mild Cognitive Impairment (MCI)",
                mmse: 26,
                moca: 24,
                cdr: 0.5,
                subscores: { orientation: "9/10", memory: "4/6", attention: "4/5", language: "9/9" },
                mriFindings: "MRI Brain: Age-appropriate brain volume with minimal medial temporal volume reduction.",
                treatment: "Lifestyle cognitive stimulation, Vitamin B12 and D3 supplementation.",
                clinicalNotes: "Patient reported mild forgetfulness of names and keys. Daily IADLs fully preserved."
            },
            {
                scanId: "SCN-2025-0622",
                date: "2025-06-22",
                hospital: "Vasundhara Hospital, Ghaziabad",
                physician: "Dr. A. K. Banerjee",
                stage: "Early Mild Alzheimer's Dementia",
                mmse: 22,
                moca: 19,
                cdr: 0.5,
                subscores: { orientation: "7/10", memory: "3/6", attention: "3/5", language: "9/9" },
                mriFindings: "MRI Brain: Bilateral mild-to-moderate hippocampal atrophy (MTA Grade 1), mild sulcal widening.",
                treatment: "Initiated Donepezil 5mg once daily at bedtime.",
                clinicalNotes: "Difficulty managing utility bills and navigating unfamiliar driving routes reported by spouse."
            },
            {
                scanId: "SCN-2026-0914",
                date: "2026-09-14",
                hospital: "Vasundhara Hospital, Ghaziabad",
                physician: "Dr. A. K. Banerjee",
                stage: "Moderate Alzheimer's Disease",
                mmse: 19,
                moca: 16,
                cdr: 1.0,
                subscores: { orientation: "5/10", memory: "2/6", attention: "3/5", language: "9/9" },
                mriFindings: "MRI Brain: Moderate bilateral hippocampal atrophy (MTA Grade 2), temporal horn dilatation.",
                treatment: "Donepezil increased to 10mg OD; added Memantine 10mg BD with titration.",
                clinicalNotes: "Disorientation to date/month, short-term recall deficit, requires supervision for medications."
            }
        ]
    },
    {
        name: "Eleanor Vance",
        age: 72,
        gender: "Female",
        primaryHospital: "Memory & Cognitive Neurology Clinic",
        primaryPhysician: "Dr. Sarah Jenkins (MD)",
        scans: [
            {
                scanId: "SCN-2024-0310",
                date: "2024-03-10",
                hospital: "Memory & Cognitive Neurology Clinic",
                physician: "Dr. Sarah Jenkins",
                stage: "Mild Cognitive Impairment (MCI)",
                mmse: 26,
                moca: 24,
                cdr: 0.5,
                subscores: { orientation: "8/10", memory: "4/6", attention: "5/5", language: "9/9" },
                mriFindings: "MRI: Mild hippocampal volume reduction, Fazekas Grade 1 white matter changes.",
                treatment: "Observation, cognitive rehabilitation exercises.",
                clinicalNotes: "Baseline evaluation following 6-month history of repetitive questions."
            },
            {
                scanId: "SCN-2025-0215",
                date: "2025-02-15",
                hospital: "Memory & Cognitive Neurology Clinic",
                physician: "Dr. Sarah Jenkins",
                stage: "Mild Alzheimer's Dementia",
                mmse: 22,
                moca: 19,
                cdr: 0.5,
                subscores: { orientation: "6/10", memory: "3/6", attention: "4/5", language: "9/9" },
                mriFindings: "MRI: Accelerated left medial temporal lobe atrophy. Plasma p-tau217 elevated.",
                treatment: "Started Donepezil 5mg daily.",
                clinicalNotes: "Difficulty managing medications and checkbook."
            },
            {
                scanId: "SCN-2026-0820",
                date: "2026-08-20",
                hospital: "Department of Neurodegenerative Medicine",
                physician: "Dr. Robert Vance",
                stage: "Moderate Alzheimer's Disease",
                mmse: 17,
                moca: 14,
                cdr: 1.0,
                subscores: { orientation: "4/10", memory: "1/6", attention: "3/5", language: "9/9" },
                mriFindings: "FDG-PET: Prominent bilateral temporoparietal hypometabolism & posterior cingulate hypometabolism.",
                treatment: "Donepezil 10mg + Memantine 10mg BD.",
                clinicalNotes: "Dependent in IADLs, afternoon wandering episodes reported."
            }
        ]
    },
    {
        name: "Marcus Bennett",
        age: 58,
        gender: "Male",
        primaryHospital: "Center for Memory & Brain Health",
        primaryPhysician: "Dr. Lawrence Ross",
        scans: [
            {
                scanId: "SCN-2025-0112",
                date: "2025-01-12",
                hospital: "Center for Memory & Brain Health",
                physician: "Dr. Lawrence Ross",
                stage: "Mild Cognitive Impairment",
                mmse: 27,
                moca: 23,
                cdr: 0.5,
                subscores: { orientation: "9/10", memory: "4/6", attention: "5/5", language: "9/9" },
                mriFindings: "Amyloid PET: Positive cortical amyloid burden. APOE: e4/e4 carrier.",
                treatment: "Anti-amyloid clinical trial screening.",
                clinicalNotes: "Executive dysfunction in software engineering workplace."
            },
            {
                scanId: "SCN-2026-0730",
                date: "2026-07-30",
                hospital: "Center for Memory & Brain Health",
                physician: "Dr. Lawrence Ross",
                stage: "Rapid Early-Onset Alzheimer's",
                mmse: 18,
                moca: 14,
                cdr: 1.5,
                subscores: { orientation: "5/10", memory: "1/6", attention: "3/5", language: "9/9" },
                mriFindings: "MRI: Severe bilateral parietal atrophy and hippocampal volume loss.",
                treatment: "Combined cholinesterase inhibitor and NMDA receptor antagonist.",
                clinicalNotes: "Rapid deterioration over 18 months (-9 MMSE pts), word-finding pauses, visual spatial agnosia."
            }
        ]
    }
];

initialSeed.forEach(p => {
    patientDatabase.set(normalizeName(p.name), p);
});

/**
 * Record a newly parsed scan into the patient's record
 */
function recordScan(patientName, parsedData) {
    if (!patientName) return;
    const key = normalizeName(patientName);
    let patient = patientDatabase.get(key);

    const latestVisit = parsedData.visit_timeline ? parsedData.visit_timeline[parsedData.visit_timeline.length - 1] : null;
    const reportDate = parsedData.patient_summary?.timeframe?.replace(/Report Date:\s*/i, '') || new Date().toISOString().split('T')[0];

    const scanEntry = {
        scanId: `SCN-${Date.now().toString(36).toUpperCase()}`,
        date: reportDate,
        hospital: parsedData.patient_summary?.hospital || latestVisit?.hospital_or_doctor || "Vasundhara Hospital, Ghaziabad",
        physician: parsedData.patient_summary?.physician || "Attending Neurologist",
        stage: parsedData.patient_summary?.current_stage || latestVisit?.stage || "Moderate Alzheimer's Disease",
        mmse: latestVisit?.mmse || 19,
        moca: latestVisit?.moca || 16,
        cdr: latestVisit?.cdr || 1.0,
        subscores: latestVisit?.subscores || { orientation: "5/10", memory: "2/6", attention: "3/5", language: "9/9" },
        mriFindings: parsedData.comparative_analysis?.imaging_progression || latestVisit?.imaging_biomarkers || "Hippocampal atrophy noted.",
        treatment: (parsedData.caregiver_action_plan && parsedData.caregiver_action_plan[0]) || "Standard anti-dementia pharmacotherapy",
        clinicalNotes: parsedData.comparative_analysis?.cognitive_decline_overview || "Routine longitudinal review."
    };

    if (!patient) {
        patient = {
            name: parsedData.patient_summary?.name || patientName,
            age: parsedData.patient_summary?.age || 72,
            gender: parsedData.patient_summary?.gender || "Male",
            primaryHospital: scanEntry.hospital,
            primaryPhysician: scanEntry.physician,
            scans: []
        };
        patientDatabase.set(key, patient);
    }

    // Check if scan for same date already exists
    const existingIndex = patient.scans.findIndex(s => s.date === scanEntry.date);
    if (existingIndex >= 0) {
        patient.scans[existingIndex] = scanEntry;
    } else {
        patient.scans.push(scanEntry);
    }

    // Sort scans chronologically
    patient.scans.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Get full longitudinal analytics and 270-degree analog speedometer risk computation
 */
function getPatientAnalytics(patientName) {
    const key = normalizeName(patientName);
    let patient = patientDatabase.get(key);

    // If not found, try fuzzy match
    if (!patient) {
        for (const [k, p] of patientDatabase.entries()) {
            if (k.includes(key) || key.includes(k)) {
                patient = p;
                break;
            }
        }
    }

    if (!patient) {
        // Return baseline template with Rajesh K. Verma if unspecified
        patient = patientDatabase.get(normalizeName("Rajesh K. Verma"));
    }

    const scans = patient.scans || [];
    const firstScan = scans[0] || {};
    const latestScan = scans[scans.length - 1] || {};

    // ── Time & Progression Calculations ──────────────────────────────────────
    let totalMonths = 24;
    if (scans.length > 1) {
        const d1 = new Date(firstScan.date);
        const d2 = new Date(latestScan.date);
        totalMonths = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24 * 30.4375)));
    }

    const totalMmseDrop = (firstScan.mmse || 26) - (latestScan.mmse || 19);
    const annualMmseDecline = totalMonths > 0 ? ((totalMmseDrop / (totalMonths / 12))).toFixed(1) : "3.5";
    
    // ── 270-Degree Speedometer Risk Score (0 - 100) ───────────────────────────
    // Derived from MMSE score loss (weight 45%), Rate of annual decline (weight 35%), CDR stage (weight 20%)
    const mmseDeficitPct = ((30 - (latestScan.mmse || 19)) / 30) * 100;
    const velocityFactor = Math.min(100, (parseFloat(annualMmseDecline) / 6.0) * 100);
    const cdrFactor = ((latestScan.cdr || 1.0) / 3.0) * 100;

    const riskScore = Math.min(99, Math.max(12, Math.round(
        (mmseDeficitPct * 0.45) + (velocityFactor * 0.35) + (cdrFactor * 0.20)
    )));

    // Risk classification
    let riskTier = "Low / Stable";
    let riskColor = "#10b981"; // Emerald
    let riskDescription = "Cognitive scores remain close to normative baseline. Annual decline is minimal.";

    if (riskScore >= 75) {
        riskTier = "Critical Rapid Progression";
        riskColor = "#ef4444"; // Red
        riskDescription = "Accelerated multi-domain neurodegenerative progression. High risk of losing functional autonomy within 6–12 months.";
    } else if (riskScore >= 50) {
        riskTier = "Accelerated Decline";
        riskColor = "#f59e0b"; // Amber/Orange
        riskDescription = "Consistent longitudinal decline exceeding standard aging. Moderate risk of executive task dependency.";
    } else if (riskScore >= 30) {
        riskTier = "Moderate / Expected Rate";
        riskColor = "#3b82f6"; // Blue
        riskDescription = "Standard progression trajectory for diagnosed staging. Managed with current cholinesterase inhibitors.";
    }

    // ── 12-Month Predictive Projection (Linear Regression) ───────────────────
    const predictedMmse12Mo = Math.max(0, (latestScan.mmse || 19) - parseFloat(annualMmseDecline)).toFixed(1);
    const predictedMoca12Mo = Math.max(0, (latestScan.moca || 16) - (parseFloat(annualMmseDecline) * 1.1)).toFixed(1);

    return {
        patient: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            primaryHospital: patient.primaryHospital,
            primaryPhysician: patient.primaryPhysician,
            totalScans: scans.length,
            trackingDurationMonths: totalMonths,
            currentStage: latestScan.stage,
            currentMmse: latestScan.mmse,
            currentMoca: latestScan.moca,
            currentCdr: latestScan.cdr
        },
        speedometer: {
            riskScore: riskScore, // 0 to 100
            riskTier: riskTier,
            riskColor: riskColor,
            riskDescription: riskDescription,
            annualMmseDecline: annualMmseDecline,
            totalMmseDrop: totalMmseDrop,
            // 270-degree needle rotation calculation:
            // Arc starts at -135deg (0 score) and sweeps 270deg to +135deg (100 score)
            needleAngle: -135 + (riskScore / 100) * 270
        },
        chartData: {
            labels: scans.map(s => s.date),
            mmse: scans.map(s => s.mmse),
            moca: scans.map(s => s.moca),
            cdr: scans.map(s => s.cdr),
            // Projection point 12 months in future
            futureDate: "+12 Months (Projected)",
            projectedMmse: parseFloat(predictedMmse12Mo),
            projectedMoca: parseFloat(predictedMoca12Mo)
        },
        scans: scans,
        prognosis: {
            predictedMmse12Mo: predictedMmse12Mo,
            predictedMoca12Mo: predictedMoca12Mo,
            rateOfChange: `${annualMmseDecline} MMSE pts/yr`,
            keyRecommendations: [
                "Intensify structured visual and auditory orienting cues at home (smart display schedule).",
                "Ensure strict Donepezil 10mg / Memantine 10mg adherence with automated caregiver reminders.",
                "Schedule next follow-up neuro-imaging and cognitive battery in 4 months.",
                "Implement fall prevention and GPS safety perimeter monitoring."
            ]
        }
    };
}

module.exports = {
    recordScan,
    getPatientAnalytics,
    normalizeName
};
