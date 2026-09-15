/**
 * Mnemosync OCR & Longitudinal Alzheimer's Clinical Report Analyzer Hub
 * Port: 5000
 *
 * Capabilities:
 *   - Real PDF & Word Doc (.docx/.doc) & TXT document ingestion
 *   - OCR Text Extraction (pdf-parse & mammoth)
 *   - Longitudinal Alzheimer's Disease Progression & Comparative Velocity Engine
 *   - Interactive Web Dashboard on http://localhost:5000
 *   - Socket.IO & REST APIs for seamless clinical telemetry
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for direct file buffer extraction
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBOSp25QjJRHC4MRGJOHzNx6ItTEIQ7zZY';

// Track connected clients
const clients = { react: new Set(), dashboard: new Set() };
const recentAnalyses = [];

io.on('connection', (socket) => {
    const clientType = socket.handshake.query.clientType || 'unknown';
    if (clients[clientType]) clients[clientType].add(socket.id);
    console.log(`[HUB:5000] ✅ Client connected: ${clientType} (${socket.id})`);

    socket.on('disconnect', () => {
        if (clients[clientType]) clients[clientType].delete(socket.id);
    });
});

const { parseClinicalReport } = require('./clinicalAnalyzer');
const { recordScan, getPatientAnalytics } = require('./patientHistoryStore');
const { renderPatientHistoryPage } = require('./patientHistoryPage');

// ── Document Text Extractor (PDF, DOCX, TXT) ──────────────────────────────────
async function extractTextFromBuffer(buffer, mimetype, originalname) {
    const ext = (originalname.split('.').pop() || '').toLowerCase();
    
    if (mimetype === 'application/pdf' || ext === 'pdf') {
        try {
            if (typeof pdfParse === 'function') {
                const data = await pdfParse(buffer);
                return data.text || '';
            } else if (pdfParse.PDFParse) {
                const parser = new pdfParse.PDFParse(new Uint8Array(buffer));
                const res = await parser.getText();
                return res.text || res || '';
            } else {
                const PDFParser = require('pdf-parse').PDFParse || require('pdf-parse');
                const parser = new PDFParser(new Uint8Array(buffer));
                const res = await parser.getText();
                return res.text || res || '';
            }
        } catch (pdfErr) {
            console.error('[PDF Parser Error]', pdfErr);
            return buffer.toString('utf-8');
        }
    } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword' ||
        ext === 'docx' || ext === 'doc'
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else {
        // Plain text fallback
        return buffer.toString('utf-8');
    }
}

// ── Clinical Progression Analysis (Dynamic Real Extraction) ──────────────────
async function analyzeReportWithGemini(reportText) {
    const dynamicAnalysis = parseClinicalReport(reportText);
    if (!dynamicAnalysis) {
        return { error: "Failed to parse report content." };
    }
    return dynamicAnalysis;
}

// ── REST API Endpoints ───────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Mnemosync OCR & Longitudinal Progression Hub',
        port: 5000,
        activeClients: io.engine.clientsCount
    });
});

// Dedicated Patient History & 270° Speedometer Page
app.get('/patient-history', (req, res) => {
    const patientName = req.query.name || 'Rajesh K. Verma';
    const analytics = getPatientAnalytics(patientName);
    res.send(renderPatientHistoryPage(analytics));
});

app.get('/patient/:name', (req, res) => {
    const patientName = req.params.name || 'Rajesh K. Verma';
    const analytics = getPatientAnalytics(patientName);
    res.send(renderPatientHistoryPage(analytics));
});

app.get('/api/patient/:name', (req, res) => {
    const patientName = req.params.name;
    res.json(getPatientAnalytics(patientName));
});

// Download sample and template PDFs generated from Vasundhara Hospital template
app.get('/api/download/sample-pdf', (_req, res) => {
    const filePath = path.join(__dirname, '..', 'sample_reports', 'Vasundhara_Hospital_Alzheimer_Report_Sample.pdf');
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'Vasundhara_Hospital_Alzheimer_Report_Sample.pdf');
    } else {
        res.status(404).json({ error: 'Sample PDF not found' });
    }
});

app.get('/api/download/template-pdf', (_req, res) => {
    const filePath = path.join(__dirname, '..', 'sample_reports', 'Vasundhara_Hospital_Alzheimer_Report_Template.pdf');
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'Vasundhara_Hospital_Alzheimer_Report_Template.pdf');
    } else {
        res.status(404).json({ error: 'Template PDF not found' });
    }
});

// Direct file upload endpoint (PDF, Word, TXT)
app.post('/api/ocr/upload', upload.single('reportFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`[OCR Engine] Ingesting file: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
        const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
        
        console.log(`[OCR Engine] Extracted ${extractedText.length} characters of clinical text`);
        const analysis = await analyzeReportWithGemini(extractedText);
        
        // Record into longitudinal database
        if (analysis.patient_summary?.name) {
            recordScan(analysis.patient_summary.name, analysis);
        }

        recentAnalyses.unshift({
            filename: req.file.originalname,
            time: new Date().toLocaleTimeString(),
            analysis
        });
        if (recentAnalyses.length > 10) recentAnalyses.pop();

        io.emit('clinical_analysis_completed', analysis);
        res.json({ success: true, extractedText, extractedLength: extractedText.length, analysis });
    } catch (err) {
        console.error('[OCR Engine] Upload processing error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Direct text analysis endpoint
app.post('/api/ocr/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Missing clinical report text' });
        }
        console.log(`[OCR Engine] Analyzing clinical report text (${text.length} chars)`);
        const analysis = await analyzeReportWithGemini(text);
        
        // Record into longitudinal database
        if (analysis.patient_summary?.name) {
            recordScan(analysis.patient_summary.name, analysis);
        }

        recentAnalyses.unshift({
            filename: 'Direct Text Input',
            time: new Date().toLocaleTimeString(),
            analysis
        });

        io.emit('clinical_analysis_completed', analysis);
        res.json({ success: true, analysis });
    } catch (err) {
        console.error('[OCR Engine] Analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── Interactive Web Dashboard UI ─────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mnemosync OCR — Longitudinal Alzheimer's Progression Hub</title>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            padding: 24px 32px;
            min-height: 100vh;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 24px;
        }
        .title {
            font-size: 26px;
            font-weight: 800;
            background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 13px;
            margin-top: 4px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
        }
        .badge-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }
        
        .grid {
            display: grid;
            grid-template-columns: 420px 1fr;
            gap: 24px;
        }
        @media (max-width: 1050px) { .grid { grid-template-columns: 1fr; } }

        .card {
            background: rgba(18, 24, 38, 0.85);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            padding: 22px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            backdrop-filter: blur(12px);
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .card-title {
            font-size: 17px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #f8fafc;
        }
        
        /* Drag & Drop Upload Zone */
        .dropzone {
            border: 2px dashed rgba(129, 140, 248, 0.4);
            border-radius: 12px;
            padding: 28px 16px;
            text-align: center;
            background: rgba(99, 102, 241, 0.04);
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 16px;
        }
        .dropzone:hover, .dropzone.dragover {
            border-color: #818cf8;
            background: rgba(99, 102, 241, 0.1);
            transform: scale(1.01);
        }
        .dropzone-icon {
            font-size: 36px;
            margin-bottom: 8px;
        }

        .btn-group {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .btn-preset {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.15);
            color: #cbd5e1;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-preset:hover {
            background: rgba(129, 140, 248, 0.2);
            border-color: #818cf8;
            color: white;
        }

        textarea {
            width: 100%;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            color: #f1f5f9;
            padding: 12px;
            font-size: 13px;
            line-height: 1.5;
            font-family: monospace;
            resize: vertical;
            outline: none;
            margin-bottom: 14px;
        }
        textarea:focus { border-color: #818cf8; box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2); }

        .btn-primary {
            width: 100%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        }
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        /* Results Display */
        .results-panel {
            display: none;
        }
        .severity-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 18px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .severity-High { background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%); border-color: rgba(239,68,68,0.4); }
        .severity-Moderate { background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%); border-color: rgba(245,158,11,0.4); }
        .severity-Mild { background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.1) 100%); border-color: rgba(34,197,94,0.4); }
        .severity-Critical { background: linear-gradient(135deg, rgba(225,29,72,0.3) 0%, rgba(159,18,57,0.2) 100%); border-color: rgba(225,29,72,0.5); }

        .timeline-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
        }
        .timeline-table th {
            text-align: left;
            padding: 10px 12px;
            background: rgba(255,255,255,0.04);
            color: #94a3b8;
            font-weight: 600;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .timeline-table td {
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: #e2e8f0;
        }

        .score-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
        }
        .score-high { background: rgba(34,197,94,0.2); color: #4ade80; }
        .score-mid { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .score-low { background: rgba(239,68,68,0.2); color: #f87171; }

        .metric-box {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 14px;
            margin-top: 12px;
        }
        .plan-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.4;
        }
        .plan-dot { color: #818cf8; font-weight: bold; }

        .speed-gauge {
            width: 100%;
            height: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 999px;
            overflow: hidden;
            margin-top: 8px;
        }
        .speed-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
            border-radius: 999px;
            transition: width 0.8s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">📄 Mnemosync OCR & Disease Progression Engine</h1>
            <p class="subtitle">Multi-Modal Alzheimer's Diagnostic Report Ingestion & Longitudinal Velocity Comparison</p>
        </div>
        <div style="display: flex; gap: 10px;">
            <span class="badge" style="background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);">
                <span class="badge-pulse"></span>
                OCR & Analytics Core Active
            </span>
        </div>
    </div>

    <div class="grid">
        <!-- Ingestion Column -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">📥 Document Ingestion</h2>
                <span style="font-size: 11px; color: #818cf8; font-weight: 600;">PDF • DOCX • TXT</span>
            </div>

            <!-- PDF Template Download Banner -->
            <div style="background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15)); border: 1px solid rgba(129,140,248,0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 12px; font-weight: 700; color: #c084fc;">🏥 Vasundhara Hospital Format</div>
                    <div style="font-size: 11px; color: #94a3b8;">Real clinical template matching specified structure</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <a href="/api/download/sample-pdf" download="Vasundhara_Hospital_Alzheimer_Report_Sample.pdf" style="text-decoration: none; background: #6366f1; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        📥 Sample PDF
                    </a>
                    <a href="/api/download/template-pdf" download="Vasundhara_Hospital_Alzheimer_Report_Template.pdf" style="text-decoration: none; background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        📄 Blank PDF
                    </a>
                </div>
            </div>

            <!-- Upload Area -->
            <div id="dropzone" class="dropzone" onclick="document.getElementById('fileInput').click()">
                <div class="dropzone-icon">📁</div>
                <strong style="font-size: 14px; color: #f1f5f9;">Drop real PDF or Word Doc here</strong>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">or click to browse from device (supports live PDF OCR)</p>
                <input id="fileInput" type="file" accept=".pdf,.docx,.doc,.txt" style="display: none;" onchange="handleFileSelect(event)" />
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 600; color: #94a3b8;">Or load clinical demo presets:</span>
            </div>
            <div class="btn-group">
                <button class="btn-preset" style="border-color: #a855f7; color: #d8b4fe;" onclick="loadSample(4)">⭐ Vasundhara Hospital Format</button>
                <button class="btn-preset" onclick="loadSample(1)">3-Visit Longitudinal</button>
                <button class="btn-preset" onclick="loadSample(2)">Rapid Early-Onset</button>
                <button class="btn-preset" onclick="loadSample(3)">Mild MCI</button>
            </div>

            <label style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; display: block;">Report Extracted Text / Edit:</label>
            <textarea id="reportText" rows="11" placeholder="Paste or view Alzheimer's diagnosis report text here..."></textarea>

            <button id="analyzeBtn" class="btn-primary" onclick="triggerAnalysis()">
                ⚡ Analyze Progression Trajectory
            </button>
        </div>

        <!-- Analysis & Results Column -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">📊 Longitudinal Progression Analysis</h2>
                <span id="statusBadge" style="font-size: 12px; color: #94a3b8;">Awaiting Document</span>
            </div>

            <div id="emptyState" style="text-align: center; padding: 60px 20px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 12px;">🧠</div>
                <h3 style="color: #94a3b8; font-size: 16px;">No Report Analyzed Yet</h3>
                <p style="font-size: 13px; margin-top: 6px; max-width: 360px; margin-left: auto; margin-right: auto;">
                    Upload a real Alzheimer's diagnostic PDF or choose a demo preset on the left to compute disease velocity and staging comparisons.
                </p>
            </div>

            <div id="loadingState" style="display: none; text-align: center; padding: 60px 20px;">
                <div style="font-size: 40px; animation: pulse 1s infinite;">⚡</div>
                <h3 style="color: #c084fc; font-size: 16px; margin-top: 12px;">Extracting Medical Data & Biomarkers...</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Computing longitudinal MMSE decline rate & staging deltas</p>
            </div>

            <div id="resultsPanel" class="results-panel">
                <!-- Severity & Velocity Banner -->
                <div id="severityBanner" class="severity-banner">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;">Current Diagnosis Staging</span>
                        <h2 id="currentStageText" style="font-size: 20px; font-weight: 800; margin-top: 2px;">Moderate Alzheimer's</h2>
                        <span id="patientInfoText" style="font-size: 12px; opacity: 0.85;">Patient: Eleanor Vance, Age 72</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; text-transform: uppercase; opacity: 0.8;">Progression Velocity</span>
                        <h3 id="velocityRateText" style="font-size: 18px; font-weight: 800; color: #f43f5e; margin-top: 2px;">Accelerated Decline</h3>
                        <span id="annualDropText" style="font-size: 12px; opacity: 0.85;">-3.6 MMSE pts/year</span>
                    </div>
                </div>

                <!-- Velocity Gauge -->
                <div style="margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                        <span>Progression Speedometer:</span>
                        <span id="velocitySummarySpan" style="font-weight: 600; color: #f1f5f9;">Faster than standard average</span>
                    </div>
                    <div class="speed-gauge">
                        <div id="speedFill" class="speed-fill" style="width: 75%;"></div>
                    </div>
                </div>

                <!-- Longitudinal Timeline Comparison Table -->
                <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 6px;">
                    📅 Hospital Visit History & Diagnostic Deltas
                </h3>
                <div style="overflow-x: auto; margin-bottom: 16px;">
                    <table class="timeline-table">
                        <thead>
                            <tr>
                                <th>Visit Date</th>
                                <th>Staging</th>
                                <th>MMSE</th>
                                <th>MoCA</th>
                                <th>CDR</th>
                                <th>Imaging & Biomarkers</th>
                            </tr>
                        </thead>
                        <tbody id="timelineTbody"></tbody>
                    </table>
                </div>

                <!-- Clinical Comparison & Everyday Impact -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="metric-box">
                        <h4 style="font-size: 13px; font-weight: 700; color: #818cf8; margin-bottom: 6px;">🔍 Cognitive Decline Overview</h4>
                        <p id="declineOverview" style="font-size: 12px; color: #cbd5e1; line-height: 1.5;"></p>
                    </div>
                    <div class="metric-box">
                        <h4 style="font-size: 13px; font-weight: 700; color: #ec4899; margin-bottom: 6px;">🏡 Everyday Living Impact</h4>
                        <p id="functionalImpact" style="font-size: 12px; color: #cbd5e1; line-height: 1.5;"></p>
                    </div>
                </div>

                <!-- Caregiver Protocol -->
                <div class="metric-box" style="margin-top: 14px; background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.25);">
                    <h4 style="font-size: 13px; font-weight: 700; color: #c084fc; margin-bottom: 8px;">🛡️ Caregiver Action Plan & Safety Guidance</h4>
                    <div id="caregiverList"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const sampleReports = {
            1: \`CLINICAL NEUROLOGY COMPREHENSIVE REPORT
Patient Name: Eleanor Vance
Age: 72 | Gender: Female
Medical Record Number: AD-2026-9941

VISIT 1 (2024-03-10) - Baseline Neurological Evaluation:
Presenting Complaint: 6-month history of gradual episodic memory loss, repetitive questioning noted by daughter.
Cognitive Screening: MMSE: 26/30 (lost orientation to date, delayed recall 1/3). MoCA: 24/30. CDR: 0.5.
Neurological Exam: Cranial nerves intact, gait normal, no motor deficits.
Neuroimaging: MRI Brain shows mild bilateral hippocampal volume loss, Fazekas grade 1 white matter changes.
Clinical Impression: Mild Cognitive Impairment (MCI), amnestic single-domain.

VISIT 2 (2025-02-15) - 11-Month Hospital Follow-Up:
Subjective: Increased difficulty managing medications and balancing checkbook. Disoriented when driving in unfamiliar towns.
Cognitive Scores: MMSE: 22/30 (loss of calculation and 3-word recall). MoCA: 19/30. CDR: 0.5.
Neuroimaging & Biomarkers: MRI confirms accelerated left medial temporal lobe atrophy. Plasma p-tau217 elevated.
Clinical Impression: Early Mild Alzheimer's Dementia. Started Donepezil 5mg daily.

VISIT 3 (2026-08-20) - Department of Neurodegenerative Medicine:
Current Status: Dependent in IADLs. Forgets grandchildren's names periodically, afternoon wandering episodes reported.
Cognitive Scores: MMSE: 17/30. MoCA: 14/30. CDR: 1.0 (Moderate Impairment).
Diagnostic Imaging: FDG-PET Brain demonstrates prominent bilateral temporoparietal hypometabolism and posterior cingulate hypometabolism.
Final Impression: Moderate Stage Alzheimer's Disease. Progression rate accelerated (-3.6 MMSE drop/year). Recommended round-the-clock caregiver supervision and wearable assistive memory cues.\`,

            2: \`EARLY-ONSET ALZHEIMER'S HOSPITAL ASSESSMENT
Patient: Marcus Bennett, Age: 58
Hospital: Center for Memory & Brain Health

Visit 1 (2025-01-12):
Executive dysfunction at work (software engineering manager). MMSE: 27/30, MoCA: 23/30, CDR: 0.5.
Amyloid PET Scan: Positive cortical amyloid burden. APOE genotype: e4/e4 carrier.

Visit 2 (2026-07-30):
Rapid cognitive deterioration over 18 months. Word-finding pauses, severe dyscalculia, visual spatial agnosia.
MMSE: 18/30 (-9 points in 18 months), CDR: 1.5.
MRI: Severe bilateral parietal atrophy and hippocampal volume loss.
Impression: Rapidly progressing Early-Onset Alzheimer's Disease. High velocity trajectory.\`,

            3: \`GERIATRIC COGNITIVE ASSESSMENT FOLLOW-UP
Patient: Dorothy Miller, Age: 79
Location: Geriatric Memory Center

Visit 1 (2024-06-15): Mild subjective forgetfulness. MMSE: 28/30, MoCA: 26/30, CDR: 0.5. MRI: Age-appropriate brain volume.
Visit 2 (2026-08-10): Re-evaluation after 26 months. Memory complaints stable. MMSE: 27/30, MoCA: 25/30, CDR: 0.5.
Impression: Stable Amnestic Mild Cognitive Impairment (MCI) with slow / benign progression rate (<0.5 MMSE drop/year).\`,

            4: \`Vasundhara Hospital, Ghaziabad
Alzheimer's Disease Medical Report

Patient Details:
Name: Rajesh K. Verma
Age/Gender: 72 years / Male
Report Date: 14 / 09 / 2026

Consulting Physician:
Dr. A. K. Banerjee
Specialization: Neurology
Hospital: Vasundhara Hospital, Ghaziabad

Medical History:
- Memory decline since 14 months.
- Frequently forgets objects, names, dates, or directions.
- Behavioral changes and difficulty in decision making.
- Sleep disturbances and mood changes observed.

Physical & Cognitive Examination:
- Blood Pressure: 132/84 mmHg
- Pulse: 74 per minute
- Cognitive Test (MMSE Score): 19 / 30
• Orientation: 5 / 10
• Memory: 2 / 6
• Attention: 3 / 5
• Language: 9 / 9

Lab & Imaging Reports:
- MRI Brain: Hippocampal atrophy / cortical sulci widening
- Blood Tests: Thyroid profile, Vitamin B12, Blood sugar - Normal
- EEG: Mild slowing of wave activity in bilateral temporal lobes

Diagnosis:
Alzheimer's Disease (Moderate stage).

Treatment Plan:
1. Medications: Donepezil 10mg / Memantine 10mg (as per condition).
2. Lifestyle & Family Support: Regular cognitive exercises, balanced diet, light physical exercise, family support.
3. Follow-up: Every 3-6 months with neurologist for monitoring.

Conclusion:
Patient has been diagnosed with Alzheimer's Disease. It is a progressive condition, but with proper treatment and care, progression can be slowed, and quality of life can be improved.

___________________________
Doctor's Signature: Dr. A. K. Banerjee (MD, DM Neuro)
Date: 14 / 09 / 2026\`
        };

        function loadSample(num) {
            document.getElementById('reportText').value = sampleReports[num];
        }

        // Set default sample on load to Vasundhara Hospital report
        loadSample(4);

        // Drag & Drop Handlers
        const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                uploadRealFile(e.dataTransfer.files[0]);
            }
        });

        function handleFileSelect(event) {
            if (event.target.files.length > 0) {
                uploadRealFile(event.target.files[0]);
            }
        }

        async function uploadRealFile(file) {
            showLoading(true);
            const formData = new FormData();
            formData.append('reportFile', file);

            try {
                const res = await fetch('/api/ocr/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.extractedText) {
                    document.getElementById('reportText').value = data.extractedText;
                }
                if (data.analysis) {
                    renderAnalysis(data.analysis);
                } else {
                    alert('Analysis error: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('File upload failed: ' + err.message);
            } finally {
                showLoading(false);
            }
        }

        async function triggerAnalysis() {
            const text = document.getElementById('reportText').value;
            if (!text.trim()) {
                alert('Please enter or upload an Alzheimer report first.');
                return;
            }

            showLoading(true);
            try {
                const res = await fetch('/api/ocr/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                if (data.analysis) {
                    renderAnalysis(data.analysis);
                } else {
                    alert('Error: ' + (data.error || 'Failed to analyze'));
                }
            } catch (err) {
                alert('Network error: ' + err.message);
            } finally {
                showLoading(false);
            }
        }

        function showLoading(isLoading) {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('loadingState').style.display = isLoading ? 'block' : 'none';
            document.getElementById('resultsPanel').style.display = isLoading ? 'none' : 'block';
            document.getElementById('statusBadge').textContent = isLoading ? 'Processing...' : 'Analysis Complete';
        }

        function renderAnalysis(data) {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('resultsPanel').style.display = 'block';

            // Severity Banner
            const banner = document.getElementById('severityBanner');
            banner.className = 'severity-banner severity-' + (data.patient_summary?.severity_rating || 'Moderate');

            const patientName = data.patient_summary?.name || 'Rajesh K. Verma';
            const ageStr = data.patient_summary?.age ? ('Age ' + data.patient_summary.age) : '';
            const genderStr = data.patient_summary?.gender || '';
            const hospStr = data.patient_summary?.hospital || '';
            const timeStr = data.patient_summary?.timeframe || '';

            document.getElementById('patientInfoText').innerHTML = \`
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
                    <span style="opacity: 0.85;">Patient:</span>
                    <a href="/patient-history?name=\${encodeURIComponent(patientName)}" target="_blank"
                       style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(14,165,233,0.25), rgba(168,85,247,0.25)); border: 1px solid rgba(56,189,248,0.5); color: #38bdf8; font-weight: 800; text-decoration: none; padding: 3px 10px; border-radius: 8px; font-size: 13px; transition: all 0.2s;"
                       onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(56,189,248,0.3)';"
                       onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                        <span>👤 \${patientName}</span>
                        <span style="font-size: 10px; background: #0284c7; color: white; padding: 1px 7px; border-radius: 9999px; font-weight: 700;">
                            📊 Trajectory & 270° Speedometer ↗
                        </span>
                    </a>
                    <span style="opacity: 0.85; font-size: 12px;">• \${ageStr} \${genderStr ? '• ' + genderStr : ''} \${hospStr ? '• ' + hospStr : ''} \${timeStr ? '• ' + timeStr : ''}</span>
                </div>
            \`;

            document.getElementById('velocityRateText').textContent = data.progression_velocity?.rate || 'Standard Progression';
            document.getElementById('annualDropText').textContent = data.progression_velocity?.annual_drop_estimate || '';
            document.getElementById('velocitySummarySpan').textContent = data.progression_velocity?.summary || '';

            const pct = Math.min(100, Math.max(15, data.progression_velocity?.velocity_percentage || 65));
            document.getElementById('speedFill').style.width = pct + '%';

            // Timeline Table
            const tbody = document.getElementById('timelineTbody');
            tbody.innerHTML = '';
            if (data.visit_timeline && data.visit_timeline.length > 0) {
                data.visit_timeline.forEach(visit => {
                    const tr = document.createElement('tr');
                    
                    const mmseClass = (visit.mmse >= 24) ? 'score-high' : (visit.mmse >= 19) ? 'score-mid' : 'score-low';
                    const mocaClass = (visit.moca >= 22) ? 'score-high' : (visit.moca >= 17) ? 'score-mid' : 'score-low';

                    tr.innerHTML = \`
                        <td style="font-weight: 700; color: #818cf8;">\${visit.visit_date || 'Visit'}</td>
                        <td>\${visit.stage || 'Clinical Stage'}</td>
                        <td><span class="score-pill \${mmseClass}">\${visit.mmse != null ? visit.mmse + '/30' : '-'}</span></td>
                        <td><span class="score-pill \${mocaClass}">\${visit.moca != null ? visit.moca + '/30' : '-'}</span></td>
                        <td style="font-weight: 600;">\${visit.cdr != null ? 'CDR ' + visit.cdr : '-'}</td>
                        <td style="font-size: 12px; color: #94a3b8;">\${visit.imaging_biomarkers || visit.clinical_impression || '-'}</td>
                    \`;
                    tbody.appendChild(tr);
                });
            }

            // Comparison Metrics
            document.getElementById('declineOverview').textContent = data.comparative_analysis?.cognitive_decline_overview || 'No comparative notes.';
            document.getElementById('functionalImpact').textContent = data.comparative_analysis?.functional_impact || 'No functional notes.';

            // Caregiver Action Plan
            const planDiv = document.getElementById('caregiverList');
            planDiv.innerHTML = '';
            if (data.caregiver_action_plan) {
                data.caregiver_action_plan.forEach(item => {
                    const p = document.createElement('div');
                    p.className = 'plan-item';
                    p.innerHTML = \`<span class="plan-dot">✓</span><span>\${item}</span>\`;
                    planDiv.appendChild(p);
                });
            }
        }

        // Auto-run analysis on initial load
        setTimeout(() => triggerAnalysis(), 500);
    </script>
</body>
</html>
    `);
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n📄 Mnemosync OCR & Longitudinal Progression Hub running on http://localhost:${PORT}`);
    console.log(`   Web Dashboard: http://localhost:${PORT}/`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
});
