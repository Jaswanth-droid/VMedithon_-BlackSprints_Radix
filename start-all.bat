@echo off
echo.
echo  ███╗   ███╗███╗   ██╗███████╗███╗   ███╗ ██████╗ ███████╗██╗   ██╗███╗   ██╗ ██████╗
echo  ████╗ ████║████╗  ██║██╔════╝████╗ ████║██╔═══██╗██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
echo  ██╔████╔██║██╔██╗ ██║█████╗  ██╔████╔██║██║   ██║███████╗ ╚████╔╝ ██╔██╗ ██║██║
echo  ██║╚██╔╝██║██║╚██╗██║██╔══╝  ██║╚██╔╝██║██║   ██║╚════██║  ╚██╔╝  ██║╚██╗██║██║
echo  ██║ ╚═╝ ██║██║ ╚████║███████╗██║ ╚═╝ ██║╚██████╔╝███████║   ██║   ██║ ╚████║╚██████╗
echo  ╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝
echo.
echo  Starting all Mnemosync services on branch: rak
echo  ─────────────────────────────────────────────────────────────────────
echo  [1] Socket Hub      → http://localhost:3001
echo  [2] CBAE (Python)   → NLP Cognitive Analysis
echo  [3] SWAB (Python)   → TTS Wearable Bridge
echo  [4] React Dev App   → http://localhost:5174
echo  ─────────────────────────────────────────────────────────────────────
echo.

REM ── 1. Socket Hub ──────────────────────────────────────────────────────────
start "Mnemosync Hub" cmd /k "cd /d %~dp0hub && node server.js"

REM ── 2. CBAE Python service ─────────────────────────────────────────────────
start "CBAE — Cognitive Analysis" cmd /k "cd /d %~dp0 && python modules\cbae\main.py"

REM ── 3. SWAB Python service ─────────────────────────────────────────────────
start "SWAB — Wearable Bridge" cmd /k "cd /d %~dp0 && python modules\swab\main.py"

REM ── 4. React Vite dev server ────────────────────────────────────────────────
start "Mnemosync App" cmd /k "cd /d %~dp0 && npm run dev"

echo  All services started! Check the four terminal windows.
echo  Press any key to exit this launcher...
pause >nul
