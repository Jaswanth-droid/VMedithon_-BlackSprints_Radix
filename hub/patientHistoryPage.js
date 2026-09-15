/**
 * Patient Longitudinal Progression & Risk Speedometer Web Page
 * Displays multi-year cognitive decline graph chart and 270-degree analog speedometer visualizer.
 */

function renderPatientHistoryPage(analytics) {
    const p = analytics.patient;
    const speed = analytics.speedometer;
    const chart = analytics.chartData;
    const scans = analytics.scans || [];
    const prog = analytics.prognosis;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${p.name} — Longitudinal Alzheimer's Progression & Risk Analysis</title>
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
        .stat-val { font-size: 24px; font-weight: 800; color: #f8fafc; margin-top: 4px; }
        .stat-sub { font-size: 12px; color: #cbd5e1; margin-top: 2px; }

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
            font-size: 42px;
            font-weight: 900;
            line-height: 1;
            font-feature-settings: 'tnum';
        }
        .speed-unit {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
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
            line-height: 1.4;
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
                    ${p.totalScans} Serial Scans Recorded
                </span>
                <span class="badge" style="background: rgba(168,85,247,0.2); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.4);">
                    ${p.age} yrs • ${p.gender}
                </span>
            </div>
            <p class="subtitle">Longitudinal Neurodegenerative Trajectory & Predictive Health Record • ${p.primaryHospital}</p>
        </div>
        <div>
            <a href="/" class="back-btn">
                ⬅ Back to Diagnostic Scanner
            </a>
        </div>
    </div>

    <!-- Hero Stats Row -->
    <div class="grid-hero">
        <div class="hero-stat">
            <div class="stat-label">Current Cognitive Staging</div>
            <div class="stat-val" style="font-size: 19px; color: #c084fc;">${p.currentStage}</div>
            <div class="stat-sub">Physician: ${p.primaryPhysician}</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">Latest MMSE / MoCA Score</div>
            <div class="stat-val" style="color: #38bdf8;">
                ${p.currentMmse} / 30 <span style="font-size: 15px; color: #94a3b8; font-weight: 500;">(MoCA: ${p.currentMoca})</span>
            </div>
            <div class="stat-sub">Clinical Dementia Rating: CDR ${p.currentCdr}</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">Overall Time Elapsed</div>
            <div class="stat-val" style="color: #fbbf24;">${p.trackingDurationMonths} Months</div>
            <div class="stat-sub">Cumulative MMSE Loss: -${speed.totalMmseDrop} pts</div>
        </div>

        <div class="hero-stat">
            <div class="stat-label">Longitudinal Velocity</div>
            <div class="stat-val" style="color: ${speed.riskColor};">${speed.annualMmseDecline} pts/yr</div>
            <div class="stat-sub">${speed.riskTier}</div>
        </div>
    </div>

    <!-- Speedometer + Trajectory Graph Row -->
    <div class="main-grid">
        <!-- 270-Degree Analog Speedometer Visualizer -->
        <div class="card" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="card-header" style="width: 100%;">
                <h2 class="card-title">⚡ 270° Progression Speedometer</h2>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Velocity & Risk Metric</span>
            </div>

            <div class="speedometer-container">
                <svg class="speedometer-svg" viewBox="0 0 290 250">
                    <defs>
                        <!-- 270 deg Gradient (Green -> Yellow -> Orange -> Red) -->
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

                    <!-- Background Arc (270 degrees from 135deg to 405deg) Radius=105, Center=(145,145) -->
                    <!-- Circumference of 270 deg with R=105 is ~494.8 -->
                    <path class="speed-arc-bg" d="M 70.75 219.25 A 105 105 0 1 1 219.25 219.25" stroke-dasharray="495" stroke-dashoffset="0" />
                    
                    <!-- Colored Active Arc -->
                    <path class="speed-arc-colored" stroke="url(#speedGrad)" filter="url(#glow)"
                          d="M 70.75 219.25 A 105 105 0 1 1 219.25 219.25"
                          stroke-dasharray="495"
                          stroke-dashoffset="${495 - (495 * (speed.riskScore / 100))}" />

                    <!-- Dial Ticks -->
                    <!-- 0 Score (135 deg) -->
                    <line x1="63" y1="227" x2="71" y2="219" stroke="#10b981" stroke-width="2.5" />
                    <text x="50" y="240" fill="#10b981" font-size="11" font-weight="700">0</text>

                    <!-- 25 Score (202.5 deg) -->
                    <line x1="33" y1="145" x2="45" y2="145" stroke="#3b82f6" stroke-width="2" />
                    <text x="18" y="149" fill="#94a3b8" font-size="10" font-weight="600">25</text>

                    <!-- 50 Score (270 deg - Top) -->
                    <line x1="145" y1="33" x2="145" y2="45" stroke="#f59e0b" stroke-width="2.5" />
                    <text x="139" y="25" fill="#f59e0b" font-size="11" font-weight="700">50</text>

                    <!-- 75 Score (337.5 deg) -->
                    <line x1="257" y1="145" x2="245" y2="145" stroke="#f97316" stroke-width="2" />
                    <text x="262" y="149" fill="#94a3b8" font-size="10" font-weight="600">75</text>

                    <!-- 100 Score (405 deg) -->
                    <line x1="227" y1="227" x2="219" y2="219" stroke="#ef4444" stroke-width="2.5" />
                    <text x="232" y="240" fill="#ef4444" font-size="11" font-weight="700">100</text>

                    <!-- Speedometer Needle -->
                    <g id="needleGroup" class="needle-pivot" style="transform: rotate(${speed.needleAngle}deg);">
                        <!-- Needle body -->
                        <polygon points="142,145 145,55 148,145" fill="${speed.riskColor}" filter="url(#glow)" />
                        <!-- Center Hub -->
                        <circle cx="145" cy="145" r="9" fill="#1e1b4b" stroke="${speed.riskColor}" stroke-width="3" />
                        <circle cx="145" cy="145" r="3.5" fill="#f8fafc" />
                    </g>
                </svg>

                <div class="speed-readout">
                    <div class="speed-num" style="color: ${speed.riskColor};">${speed.riskScore}</div>
                    <div class="speed-unit">Risk Index / 100</div>
                </div>
            </div>

            <div class="risk-badge" style="background: ${speed.riskColor}22; color: ${speed.riskColor}; border: 1px solid ${speed.riskColor}66;">
                ${speed.riskTier}
            </div>

            <p style="font-size: 12.5px; color: #cbd5e1; margin-top: 12px; line-height: 1.45; max-width: 340px;">
                ${speed.riskDescription}
            </p>
        </div>

        <!-- Interactive Longitudinal Trajectory Graph Chart -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">📈 Longitudinal Cognitive Trajectory & 12-Mo Projection</h2>
                <div style="display: flex; gap: 8px;">
                    <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 700;">MMSE</span>
                    <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(192,132,252,0.15); color: #c084fc; font-weight: 700;">MoCA</span>
                    <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(244,63,94,0.15); color: #f43f5e; font-weight: 700;">Projected</span>
                </div>
            </div>

            <div style="position: relative; height: 260px; width: 100%;">
                <canvas id="trajectoryChart"></canvas>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                <div style="background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">12-Month Projected MMSE</div>
                    <div style="font-size: 18px; font-weight: 800; color: #f43f5e; margin-top: 2px;">
                        ${prog.predictedMmse12Mo} / 30
                    </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">12-Month Projected MoCA</div>
                    <div style="font-size: 18px; font-weight: 800; color: #fbbf24; margin-top: 2px;">
                        ${prog.predictedMoca12Mo} / 30
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Complete Serial Scan Log Table -->
    <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
            <h2 class="card-title">📋 Historical Hospital Scans & Diagnostic Matrix</h2>
            <span style="font-size: 12px; color: #94a3b8;">${scans.length} Authenticated Hospital Reports</span>
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Scan Date & ID</th>
                        <th>Hospital & Physician</th>
                        <th>Clinical Staging</th>
                        <th>MMSE</th>
                        <th>MoCA</th>
                        <th>CDR</th>
                        <th>Neuroimaging & Biomarkers</th>
                        <th>Treatment Adjustment</th>
                    </tr>
                </thead>
                <tbody>
                    ${scans.map(s => {
                        const mmseClass = (s.mmse >= 24) ? 'score-high' : (s.mmse >= 19) ? 'score-mid' : 'score-low';
                        const mocaClass = (s.moca >= 22) ? 'score-high' : (s.moca >= 17) ? 'score-mid' : 'score-low';
                        return `
                        <tr>
                            <td>
                                <strong style="color: #818cf8;">${s.date}</strong>
                                <div style="font-size: 10px; color: #64748b; font-family: monospace;">${s.scanId}</div>
                            </td>
                            <td>
                                <div style="font-weight: 600; color: #f1f5f9;">${s.hospital}</div>
                                <div style="font-size: 11px; color: #94a3b8;">${s.physician}</div>
                            </td>
                            <td style="font-weight: 600; color: #c084fc;">${s.stage}</td>
                            <td><span class="score-pill ${mmseClass}">${s.mmse}/30</span></td>
                            <td><span class="score-pill ${mocaClass}">${s.moca}/30</span></td>
                            <td style="font-weight: 700;">CDR ${s.cdr}</td>
                            <td style="font-size: 12px; max-width: 260px; line-height: 1.35; color: #cbd5e1;">${s.mriFindings}</td>
                            <td style="font-size: 12px; max-width: 220px; line-height: 1.35; color: #94a3b8;">${s.treatment}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Prognosis & Caregiver Action Plan -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">🛡️ Long-Term Caregiver Roadmap & Safety Recommendations</h2>
            <span style="font-size: 12px; color: #4ade80; font-weight: 700;">Active Clinical Protocol</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
            ${prog.keyRecommendations.map(rec => `
                <div class="plan-item" style="background: rgba(0,0,0,0.25); padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                    <span class="plan-dot" style="color: #4ade80;">✓</span>
                    <span>${rec}</span>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Chart.js Trajectory Visualization
        const ctx = document.getElementById('trajectoryChart').getContext('2d');
        
        const labels = ${JSON.stringify(chart.labels)};
        const mmseData = ${JSON.stringify(chart.mmse)};
        const mocaData = ${JSON.stringify(chart.moca)};
        
        // Add Future Projection Point
        const allLabels = [...labels, "${chart.futureDate}"];
        
        // Historical MMSE line (null on future)
        const historicalMmse = [...mmseData, null];
        // Projected MMSE line (connects from last historical point to future point)
        const projectedMmse = mmseData.map((val, idx) => (idx === mmseData.length - 1 ? val : null));
        projectedMmse.push(${chart.projectedMmse});

        // Historical MoCA
        const historicalMoca = [...mocaData, null];
        const projectedMoca = mocaData.map((val, idx) => (idx === mocaData.length - 1 ? val : null));
        projectedMoca.push(${chart.projectedMoca});

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'MMSE Score (/30)',
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
                        label: 'MoCA Score (/30)',
                        data: historicalMoca,
                        borderColor: '#c084fc',
                        backgroundColor: 'transparent',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#c084fc',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.25
                    },
                    {
                        label: '12-Mo Projected MMSE',
                        data: projectedMmse,
                        borderColor: '#f43f5e',
                        borderDash: [6, 6],
                        borderWidth: 2.5,
                        pointBackgroundColor: '#f43f5e',
                        pointRadius: 6,
                        pointStyle: 'triangle',
                        tension: 0.2
                    },
                    {
                        label: '12-Mo Projected MoCA',
                        data: projectedMoca,
                        borderColor: '#fbbf24',
                        borderDash: [6, 6],
                        borderWidth: 2,
                        pointBackgroundColor: '#fbbf24',
                        pointRadius: 5,
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
                        title: { display: true, text: 'Cognitive Score (/30)', color: '#64748b', font: { size: 11 } }
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
