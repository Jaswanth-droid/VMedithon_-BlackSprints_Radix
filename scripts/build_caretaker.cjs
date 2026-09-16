const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, '..', 'hub', 'server.js');
const serverJs = fs.readFileSync(serverJsPath, 'utf8');

const match = serverJs.match(/app\.get\('\/', \(_req, res\) => \{\s*res\.send\(`([\s\S]*?)`\);\s*\}\);/);
if (!match) {
    console.error('Could not extract HTML from server.js');
    process.exit(1);
}

let html = match[1];

// 1. Default to Sunita Sharma Follow-up matching user screenshot
html = html.replace(/loadSample\(4\);/g, 'loadSample(7);');
html = html.replace('<title>Mnemosync OCR — Longitudinal Alzheimer\'s Progression Hub</title>', '<title>Mnemosync OCR & Disease Progression Engine — Caretaker Portal</title>');

// 2. 2x2 Preset buttons matching media_1789520006793.png
const oldBtnGroupMatch = html.match(/<div class="btn-group">[\s\S]*?<\/div>/);
if (oldBtnGroupMatch) {
    const newBtns = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <button class="btn-preset active" style="border-color: #818cf8; color: #c084fc; font-weight: 700;" onclick="loadSample(7)">⭐ Vasundhara Hospital Format</button>
                <button class="btn-preset" onclick="loadSample(1)">3-Visit Longitudinal</button>
                <button class="btn-preset" onclick="loadSample(2)">Rapid Early Onset</button>
                <button class="btn-preset" onclick="loadSample(3)">Mild MCI</button>
            </div>
            <div class="btn-group" style="margin-bottom: 12px;">
                <button class="btn-preset" style="border-color: #10b981; color: #6ee7b7; font-size: 11px; padding: 4px 8px;" onclick="loadSample(6)">🌸 Sunita (Visit 1: 21/30)</button>
                <button class="btn-preset" style="border-color: #f43f5e; color: #fda4af; font-size: 11px; padding: 4px 8px;" onclick="loadSample(7)">🚨 Sunita (Follow-Up: 15/30)</button>
                <button class="btn-preset" style="border-color: #a855f7; color: #d8b4fe; font-size: 11px; padding: 4px 8px;" onclick="loadSample(4)">⭐ Rajesh (Visit 1: 19/30)</button>
                <button class="btn-preset" style="border-color: #ef4444; color: #fca5a5; font-size: 11px; padding: 4px 8px;" onclick="loadSample(5)">🚨 Rajesh (Follow-Up: 13/30)</button>
            </div>`;
    html = html.replace(oldBtnGroupMatch[0], newBtns);
}

// 3. Top Tab Navigation in Header
const oldHeaderRightMatch = html.match(/<div style="display: flex; gap: 10px;">[\s\S]*?OCR & Analytics Core Active[\s\S]*?<\/div>/);
if (oldHeaderRightMatch) {
    const newHeaderRight = `<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                <button id="tabBtnOCR" onclick="switchTab('ocr')" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer;">
                    📄 Clinical OCR & Progression
                </button>
                <button id="tabBtnCare" onclick="switchTab('care')" style="background: transparent; border: none; color: #94a3b8; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer;">
                    🛡️ Caregiver Live Monitor & Safety
                </button>
            </div>
            <span class="badge" style="background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);">
                <span class="badge-pulse"></span>
                OCR & Analytics Core Active
            </span>
        </div>`;
    html = html.replace(oldHeaderRightMatch[0], newHeaderRight);
}

// 4. Wrap OCR in tab container and add Caregiver Live Monitor panel
html = html.replace('<div class="grid">', '<div id="tabOCR"><div class="grid">');

const caregiverPanel = `
    </div>
    
    <!-- Caregiver Live Monitoring Tab -->
    <div id="tabCare" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">💬 Live Conversation Feed (WhatsApp-Style Dual Sided)</h2>
                    <span style="font-size: 11px; color: #10b981; font-weight: 700;">🟢 Remote Sync Active</span>
                </div>
                <div style="background: #0b141a; border-radius: 12px; padding: 16px; min-height: 420px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.06);">
                    <!-- Visitor Bubble Left -->
                    <div style="background: #202c33; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; border-top-left-radius: 2px; padding: 10px 14px; max-width: 75%; margin-bottom: 12px; align-self: flex-start;">
                        <div style="font-size: 11px; font-weight: 700; color: #53bdeb; margin-bottom: 2px;">~ Dr. Banerjee (Neurologist)</div>
                        <div style="font-size: 13px; color: #e9edef;">Good morning Mrs. Sunita, how are you feeling today? Did you sleep comfortably last night?</div>
                        <div style="font-size: 10px; color: #8696a0; text-align: right; margin-top: 4px;">09:15 AM</div>
                    </div>
                    <!-- User Bubble Right -->
                    <div style="background: #005c4b; border-radius: 12px; border-top-right-radius: 2px; padding: 10px 14px; max-width: 75%; margin-bottom: 12px; align-self: flex-end; margin-left: auto;">
                        <div style="font-size: 11px; font-weight: 700; color: #6ee7b7; margin-bottom: 2px;">You (Mrs. Sunita)</div>
                        <div style="font-size: 13px; color: #e9edef;">Good morning doctor. Yes, I had some breakfast and my daughter helped me with the morning medicine.</div>
                        <div style="font-size: 10px; color: #8696a0; text-align: right; margin-top: 4px;">09:16 AM <span style="color: #53bdeb; font-weight: bold;">✓✓</span></div>
                    </div>
                    <!-- Visitor Bubble Left -->
                    <div style="background: #202c33; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; border-top-left-radius: 2px; padding: 10px 14px; max-width: 75%; margin-bottom: 12px; align-self: flex-start;">
                        <div style="font-size: 11px; font-weight: 700; color: #53bdeb; margin-bottom: 2px;">~ Rakesh (Family Member)</div>
                        <div style="font-size: 13px; color: #e9edef;">Remember we will be celebrating a birthday party on 17th September evening!</div>
                        <div style="font-size: 10px; color: #8696a0; text-align: right; margin-top: 4px;">09:18 AM</div>
                    </div>
                    <!-- User Bubble Right -->
                    <div style="background: #005c4b; border-radius: 12px; border-top-right-radius: 2px; padding: 10px 14px; max-width: 75%; margin-bottom: 12px; align-self: flex-end; margin-left: auto;">
                        <div style="font-size: 11px; font-weight: 700; color: #6ee7b7; margin-bottom: 2px;">You (Mrs. Sunita)</div>
                        <div style="font-size: 13px; color: #e9edef;">Sure, I'll be there! Thank you for letting me know.</div>
                        <div style="font-size: 10px; color: #8696a0; text-align: right; margin-top: 4px;">09:19 AM <span style="color: #53bdeb; font-weight: bold;">✓✓</span></div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div class="card">
                    <h3 class="card-title" style="margin-bottom: 12px;">💊 Real-Time Medication Adherence</h3>
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #6ee7b7; font-size: 13px;">Donepezil 10mg</strong>
                            <span style="background: #059669; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TAKEN</span>
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">08:00 AM with breakfast • Confirmed by Smart Sensor</p>
                    </div>
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #6ee7b7; font-size: 13px;">Memantine 10mg</strong>
                            <span style="background: #059669; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TAKEN</span>
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">08:00 AM with breakfast • Confirmed by Smart Sensor</p>
                    </div>
                    <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(129,140,248,0.3); padding: 10px 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #a5b4fc; font-size: 13px;">Melatonin 3mg</strong>
                            <span style="background: rgba(255,255,255,0.1); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">21:30 PM</span>
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Scheduled 30 mins before sleep • Sundowning prevention</p>
                    </div>
                </div>

                <div class="card">
                    <h3 class="card-title" style="margin-bottom: 12px;">🚨 Emergency Caregiver Support</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <a href="tel:+919876543210" style="text-align: center; background: #dc2626; color: white; padding: 10px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px;">
                            📞 Call Primary Caregiver (Ananya)
                        </a>
                        <a href="tel:112" style="text-align: center; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #f1f5f9; padding: 10px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px;">
                            🚑 Call Emergency Services (112)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

// Insert caregiver panel right after the main grid ends
const endOfGridMatch = html.lastIndexOf('</div>\n        </div>\n    </div>');
if (endOfGridMatch !== -1) {
    html = html.slice(0, endOfGridMatch + 6) + caregiverPanel + html.slice(endOfGridMatch + 6);
}

// Add switchTab function into script
const switchJs = `<script>
        function switchTab(tab) {
            const tabOCR = document.getElementById('tabOCR');
            const tabCare = document.getElementById('tabCare');
            const btnOCR = document.getElementById('tabBtnOCR');
            const btnCare = document.getElementById('tabBtnCare');
            if (tab === 'ocr') {
                tabOCR.style.display = 'block';
                tabCare.style.display = 'none';
                btnOCR.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                btnOCR.style.color = 'white';
                btnCare.style.background = 'transparent';
                btnCare.style.color = '#94a3b8';
            } else {
                tabOCR.style.display = 'none';
                tabCare.style.display = 'block';
                btnCare.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                btnCare.style.color = 'white';
                btnOCR.style.background = 'transparent';
                btnOCR.style.color = '#94a3b8';
            }
        }
`;

html = html.replace('<script>', switchJs);

// Write to VMedithon-Radix
const dest1 = path.join(__dirname, '..', 'hub', 'caretaker.html');
fs.writeFileSync(dest1, html, 'utf8');
console.log('Successfully written:', dest1);

// Write to Mnemosync
const dest2 = 'C:\\Users\\DELL\\Documents\\antigravity\\nifty-hawking\\Mnemosync\\hub\\caretaker.html';
if (fs.existsSync(path.dirname(dest2))) {
    fs.writeFileSync(dest2, html, 'utf8');
    console.log('Successfully written:', dest2);
}

// Copy caretakerServer.js to Mnemosync as well
const srvSrc = path.join(__dirname, '..', 'hub', 'caretakerServer.js');
const srvDest = 'C:\\Users\\DELL\\Documents\\antigravity\\nifty-hawking\\Mnemosync\\hub\\caretakerServer.js';
if (fs.existsSync(srvSrc) && fs.existsSync(path.dirname(srvDest))) {
    fs.copyFileSync(srvSrc, srvDest);
    console.log('Copied caretakerServer.js to Mnemosync');
}
