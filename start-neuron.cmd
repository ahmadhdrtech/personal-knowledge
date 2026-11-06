@echo off
rem Double-click to start Neuron. The first run installs packages (needs internet).
cd /d "%~dp0"
where bun >nul 2>nul || (echo Bun is not installed. Install it from https://bun.sh then run this again. && pause && exit /b 1)
where node >nul 2>nul || (echo Node.js is also needed: Next.js and the SQLite driver run on Node. Get the LTS from https://nodejs.org && pause && exit /b 1)
echo Checking packages (the first run takes a minute)...
call bun install || (echo bun install failed. See README.md, section Troubleshooting. && pause && exit /b 1)
if not exist .env.local copy .env.example .env.local >nul
echo Neuron is starting at http://localhost:3000 . Keep this window open; close it to stop.
start "" cmd /c "timeout /t 6 >nul && start http://localhost:3000"
call bun run dev
