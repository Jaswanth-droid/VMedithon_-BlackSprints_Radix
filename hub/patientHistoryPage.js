/**
 * Patient Health Progression & Disease Worsening Speedometer
 * Explains patient condition in clear, simple, plain-English terms for families and caregivers.
 */

function renderPatientHistoryPage(analytics) {
    const p = analytics.patient;
    const speed = analytics.speedometer;
    const chart = analytics.chartData;
    const scans = analytics.scans || [];
    const prog = analytics.prognosis;

    // Plain English helper mappings
    let simpleStage = "Moderate Memory Loss";
    let simpleStageExplanation = "Needs daily help with complex tasks, managing bills, and remembering recent events.";
    if (p.currentStage?.toLowerCase().includes('mild cognitive') || (p.currentMmse >= 24)) {
        simpleStage = "Early Mild Memory Decline";
        simpleStageExplanation = "Mostly independent, but frequently forgets recent names, appointments, or keys.";
    } else if (p.currentStage?.toLowerCase().includes('mild alzheimer') || (p.currentMmse >= 20)) {
        simpleStage = "Mild Memory & Thinking Decline";
        simpleStageExplanation = "Struggles with financial tasks, new directions, and remembering recent conversations.";
    } else if (p.currentStage?.toLowerCase().includes('moderate') || (p.currentMmse >= 13)) {
        simpleStage = "Moderate Memory Loss (Needs Daily Help)";
        simpleStageExplanation = "Needs daily guidance for medicine, remembering dates, and safe navigation.";
    } else {
        simpleStage = "Advanced Memory Loss (Needs Full Support)";
        simpleStageExplanation = "Requires continuous supervision for personal care, meals, and safety.";
    }

    let simpleSpeedTier = "Getting Worse Faster Than Normal";
    let simpleSpeedBadgeColor = "#f59e0b"; // Amber
    if (speed.riskScore >= 75) {
        simpleSpeedTier = "Rapid Worsening (High Alert)";
        simpleSpeedBadgeColor = "#ef4444";
    } else if (speed.riskScore >= 50) {
        simpleSpeedTier = "Worsening Faster Than Normal";
        simpleSpeedBadgeColor = "#f59e0b";
    } else if (speed.riskScore >= 30) {
        simpleSpeedTier = "Expected / Gradual Worsening";
        simpleSpeedBadgeColor = "#3b82f6";
    } else {
        simpleSpeedTier = "Slow / Relatively Stable";
        simpleSpeedBadgeColor = "#10b981";
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${p.name} — Simple Health & Memory Progression Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.15);
            color: #cbd5e1;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
        }
        .back-btn:hover {
            background: rgba(129, 140, 248, 0.2);
            border-color: #818cf8;
            color: white;
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
        .grid-hero {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .hero-stat {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 16px 20px;
            position: relative;
            overflow: hidden;
        }
        .hero-stat::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #6366f1, #a855f7);
        }
        .stat-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; }
        .stat-val { font-size: 22px; font-weight: 800; color: #f8fafc; margin-top: 4px; }
        .stat-sub { font-size: 12px; color: #cbd5e1; margin-top: 3px; line-height: 1.35; }

        .main-grid {
            display: grid;
            grid-template-columns: 420px 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
            .main-grid { grid-template-columns: 1fr; }
        }

        .card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(12px);
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .card-title {
            font-size: 16px;
            font-weight: 700;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* 270-Degree Speedometer Styles */
        .speedometer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px 0;
            position: relative;
        }
        .speedometer-svg {
            width: 290px;
            height: 250px;
            overflow: visible;
        }
        .speed-arc-bg {
            fill: none;
            stroke: rgba(255,255,255,0.1);
            stroke-width: 18;
            stroke-linecap: round;
        }
        .speed-arc-colored {
            fill: none;
            stroke-width: 18;
            stroke-linecap: round;
            transition: stroke-dashoffset 1.5s ease-out;
        }
        .needle-pivot {
            transition: transform 1.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: 145px 145px;
        }
        .speed-readout {
            position: absolute;
            top: 130px;
            text-align: center;
        }
        .speed-num {
            font-size: 40px;
            font-weight: 900;
            line-height: 1;
        }
        .speed-unit {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
            margin-top: 4px;
        }

        .risk-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 800;
            margin-top: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Table */
        .table-responsive {
            overflow-x: auto;
            margin-top: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th {
            text-align: left;
            padding: 10px 14px;
            background: rgba(255,255,255,0.04);
            color: #94a3b8;
            font-weight: 600;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: #cbd5e1;
            vertical-align: top;
        }
        tr:hover td { background: rgba(255,255,255,0.02); }
        .score-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
        }
        .score-high { background: rgba(34,197,94,0.2); color: #4ade80; }
        .score-mid { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .score-low { background: rgba(239,68,68,0.2); color: #f87171; }

        .plan-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.45;
        }
        .plan-dot { color: #818cf8; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <h1 class="title">👤 ${p.name}</h1>
                <span class="badge" style="background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.4);">
                    ${p.totalScans} Medical Reports On File
                </span>
                <span class="badge" style="background: rgba(168,85,247,0.2); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.4);">
                    ${p.age ? p.age + ' years old' : 'Senior'} ${p.gender ? '• ' + p.gender : ''}
                </span>
            </div>
            <p class="subtitle">Long-Term Memory & Health Progression Summary • ${p.primaryHospital}</p>
        </div>
        <div>
            <a href="/" class="back-btn">
                ⬅ Back to Report Scanner
            </a>
        </div>
    </div>

    <!-- Hero Stats Row (Explained in Simple Terms) -->
    <div class="grid-hero">
        <div class="hero-stat">
            <div class="stat-label">How Serious Is The Memory Loss?</div>
            <div class="stat-val" style="font-size: 17px; color: #c084fc;">${simpleStage}</div>
            <div class="stat-sub">${simpleStageExplanation}</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">Current Memory Test Score</div>
            <div class="stat-val" style="color: #38bdf8;">
                ${p.currentMmse} / 30
            </div>
            <div class="stat-sub">${p.currentMmse >= 24 ? 'Mild memory slips' : p.currentMmse >= 18 ? 'Noticeable memory gaps in daily life' : 'Severe memory difficulty'}</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">Time Tracked In Medical History</div>
            <div class="stat-val" style="color: #fbbf24;">${p.trackingDurationMonths} Months</div>
            <div class="stat-sub">Lost ~${speed.totalMmseDrop} memory points since symptoms began</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">How Fast Is It Getting Worse?</div>
            <div class="stat-val" style="font-size: 18px; color: ${simpleSpeedBadgeColor};">${simpleSpeedTier}</div>
            <div class="stat-sub">Dropping ~${speed.annualMmseDecline} memory points each year</div>
        </div>
    </div>

    <!-- Speedometer + Trajectory Graph Row -->
    <div class="main-grid">
        <!-- 270-Degree Speedometer Visualizer -->
        <div class="card" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="card-header" style="width: 100%;">
                <h2 class="card-title">⚡ How Fast Is The Disease Advancing?</h2>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Progression Meter</span>
            </div>

            <div class="speedometer-container">
                <svg class="speedometer-svg" viewBox="0 0 290 250">
                    <defs>
                        <!-- 270 deg Gradient (Green -> Blue -> Orange -> Red) -->
                        <linearGradient id="speedGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#10b981" />
                            <stop offset="35%" stop-color="#3b82f6" />
                            <stop offset="65%" stop-color="#f59e0b" />
                            <stop offset="100%" stop-color="#ef4444" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <!-- Background Arc -->
                    <path class="speed-arc-bg" d="M 70.75 219.25 A 105 105 0 1 1 219.25 219.25" stroke-dasharray="495" stroke-dashoffset="0" />
                    
                    <!-- Colored Active Arc -->
                    <path class="speed-arc-colored" stroke="url(#speedGrad)" filter="url(#glow)"
                          d="M 70.75 219.25 A 105 105 0 1 1 219.25 219.25"
                          stroke-dasharray="495"
                          stroke-dashoffset="${495 - (495 * (speed.riskScore / 100))}" />

                    <!-- Dial Labels (Simple Terms) -->
                    <!-- Slow -->
                    <text x="32" y="240" fill="#10b981" font-size="10" font-weight="700">SLOW</text>

                    <!-- Moderate -->
                    <text x="126" y="25" fill="#f59e0b" font-size="10" font-weight="700">MODERATE</text>

                    <!-- Fast -->
                    <text x="230" y="240" fill="#ef4444" font-size="10" font-weight="700">FAST</text>

                    <!-- Speedometer Needle -->
                    <g id="needleGroup" class="needle-pivot" style="transform: rotate(${speed.needleAngle}deg);">
                        <polygon points="142,145 145,55 148,145" fill="${simpleSpeedBadgeColor}" filter="url(#glow)" />
                        <circle cx="145" cy="145" r="9" fill="#1e1b4b" stroke="${simpleSpeedBadgeColor}" stroke-width="3" />
                        <circle cx="145" cy="145" r="3.5" fill="#f8fafc" />
                    </g>
                </svg>

                <div class="speed-readout">
                    <div class="speed-num" style="color: ${simpleSpeedBadgeColor};">${speed.riskScore}</div>
                    <div class="speed-unit">Care Need Index / 100</div>
                </div>
            </div>

            <div class="risk-badge" style="background: ${simpleSpeedBadgeColor}22; color: ${simpleSpeedBadgeColor}; border: 1px solid ${simpleSpeedBadgeColor}66;">
                ${simpleSpeedTier}
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; margin-top: 14px; text-align: left;">
                <strong style="color: #f1f5f9; font-size: 12px; display: block; margin-bottom: 4px;">💡 What this means for the family:</strong>
                <p style="font-size: 12px; color: #cbd5e1; line-height: 1.45;">
                    The patient is losing about <strong>${speed.annualMmseDecline} memory points per year</strong>. At this pace, they will need close supervision for daily medications, financial safety, and recognizing familiar routes.
                </p>
            </div>
        </div>

        <!-- Interactive Memory Ability Graph Chart -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">📈 Memory Ability Over Time & Future Forecast</h2>
                <div style="display: flex; gap: 8px;">
                    <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 700;">Past Memory Score</span>
                    <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(244,63,94,0.15); color: #f43f5e; font-weight: 700;">1-Year Prediction</span>
                </div>
            </div>

            <div style="position: relative; height: 260px; width: 100%;">
                <canvas id="trajectoryChart"></canvas>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                <div style="background: rgba(0,0,0,0.3); padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Expected Memory Score in 1 Year</div>
                    <div style="font-size: 18px; font-weight: 800; color: #f43f5e; margin-top: 2px;">
                        ~${prog.predictedMmse12Mo} / 30
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">Will likely need more hands-on daily support</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Current Level of Independence</div>
                    <div style="font-size: 18px; font-weight: 800; color: #fbbf24; margin-top: 2px;">
                        Partially Independent
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">Needs help with complex tasks & medicines</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Complete Serial Scan Log Table (In Simple Terms) -->
    <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
            <h2 class="card-title">📋 Medical Visits & Brain Test History</h2>
            <span style="font-size: 12px; color: #94a3b8;">${scans.length} Recorded Medical Check-Ups</span>
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Date of Visit</th>
                        <th>Hospital & Doctor</th>
                        <th>Condition at Visit</th>
                        <th>Memory Test Score</th>
                        <th>Brain Scan / MRI Findings (Explained)</th>
                        <th>Medications & Care Prescribed</th>
                    </tr>
                </thead>
                <tbody>
                    ${scans.map(s => {
                        const mmseClass = (s.mmse >= 24) ? 'score-high' : (s.mmse >= 19) ? 'score-mid' : 'score-low';
                        
                        // Plain english explanation of imaging
                        let plainImaging = s.mriFindings;
                        if (s.mriFindings?.toLowerCase().includes('hippocampal atrophy') || s.mriFindings?.toLowerCase().includes('volume reduction')) {
                            plainImaging = "Brain scan shows shrinkage in the memory center of the brain (Hippocampus).";
                        } else if (s.mriFindings?.toLowerCase().includes('age-appropriate') || s.mriFindings?.toLowerCase().includes('normal')) {
                            plainImaging = "Brain scan was normal for age with early mild memory signs.";
                        }

                        return `
                        <tr>
                            <td>
                                <strong style="color: #818cf8;">${s.date}</strong>
                            </td>
                            <td>
                                <div style="font-weight: 600; color: #f1f5f9;">${s.hospital}</div>
                                <div style="font-size: 11px; color: #94a3b8;">${s.physician}</div>
                            </td>
                            <td style="font-weight: 600; color: #c084fc;">${s.stage}</td>
                            <td><span class="score-pill ${mmseClass}">${s.mmse} / 30</span></td>
                            <td style="font-size: 12px; max-width: 280px; line-height: 1.4; color: #cbd5e1;">${plainImaging}</td>
                            <td style="font-size: 12px; max-width: 220px; line-height: 1.4; color: #94a3b8;">${s.treatment}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Practical Caregiver Action Plan (Simple Terms) -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">🛡️ Simple Home Care & Safety Plan for Family</h2>
            <span style="font-size: 12px; color: #4ade80; font-weight: 700;">Recommended Steps</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
            <div class="plan-item" style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="plan-dot" style="color: #4ade80; font-size: 16px;">✓</span>
                <div>
                    <strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Strict Medicine Routine:</strong>
                    <span style="color: #cbd5e1; font-size: 12.5px;">Always supervise medicines (like Donepezil/Memantine) so doses are never missed or accidentally doubled.</span>
                </div>
            </div>

            <div class="plan-item" style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="plan-dot" style="color: #4ade80; font-size: 16px;">✓</span>
                <div>
                    <strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Visual Memory Reminders:</strong>
                    <span style="color: #cbd5e1; font-size: 12.5px;">Place a large digital clock with day/date visible, and label important rooms (bathroom, bedroom, kitchen).</span>
                </div>
            </div>

            <div class="plan-item" style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="plan-dot" style="color: #4ade80; font-size: 16px;">✓</span>
                <div>
                    <strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Wandering & Home Safety:</strong>
                    <span style="color: #cbd5e1; font-size: 12.5px;">Keep an emergency contact card or GPS tracker on the patient when going outside, and remove tripping hazards.</span>
                </div>
            </div>

            <div class="plan-item" style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="plan-dot" style="color: #4ade80; font-size: 16px;">✓</span>
                <div>
                    <strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Regular Doctor Visits:</strong>
                    <span style="color: #cbd5e1; font-size: 12.5px;">Schedule a follow-up memory check every 3 to 6 months to see if medicine adjustments are needed.</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Chart.js Trajectory Visualization
        const ctx = document.getElementById('trajectoryChart').getContext('2d');
        
        const labels = ${JSON.stringify(chart.labels)};
        const mmseData = ${JSON.stringify(chart.mmse)};
        
        // Add Future Projection Point
        const allLabels = [...labels, "${chart.futureDate}"];
        
        // Historical MMSE line
        const historicalMmse = [...mmseData, null];
        const projectedMmse = mmseData.map((val, idx) => (idx === mmseData.length - 1 ? val : null));
        projectedMmse.push(${chart.projectedMmse});

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'Memory Test Score (/30)',
                        data: historicalMmse,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        borderWidth: 3,
                        pointBackgroundColor: '#38bdf8',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.25,
                        fill: true
                    },
                    {
                        label: 'Next Year Expected Score',
                        data: projectedMmse,
                        borderColor: '#f43f5e',
                        borderDash: [6, 6],
                        borderWidth: 2.5,
                        pointBackgroundColor: '#f43f5e',
                        pointRadius: 6,
                        pointStyle: 'triangle',
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 11, weight: '600' }, boxWidth: 12 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 30,
                        grid: { color: 'rgba(255, 255, 255, 0.06)' },
                        ticks: { color: '#94a3b8', font: { size: 11 } },
                        title: { display: true, text: 'Memory & Thinking Score (Out of 30)', color: '#64748b', font: { size: 11 } }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { color: '#94a3b8', font: { size: 11 } }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

module.exports = { renderPatientHistoryPage };
