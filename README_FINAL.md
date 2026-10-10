# PARADOX v1.0 — Final Demo Edition

**The Mission That Never Happened** — Team 404Error

A local educational space-mission game built with React/Vite and Python FastAPI. Includes eight mission catalogs, basic and advanced simulation, NASA DONKI solar flare events, branching solar storm scenarios, grounded AI Co-Pilot hints, mission scoring, and PDF/JSON debrief reports.

## Windows quick start

1. Install **Python 3.11+** and **Node.js 22+** (with npm).
2. Extract the ZIP. Keep the `backend` and `frontend` folders together.
3. Double-click `START_BACKEND.bat` and wait until the backend starts. First run installs Python dependencies.
4. Double-click `START_FRONTEND.bat` in a second window. First run installs npm dependencies.
5. Open **http://localhost:5173** in your browser. Leave both windows running.
6. To run tests, double-click `RUN_TESTS.bat` after setup.

Manual commands:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

## Features and routes

- `/` — Home and backend connection status
- `/missions` — Mission selection
- `/mission/:id` — Basic mission dashboard
- `/advanced` — Advanced multi-stage scenario
- `/solar-storm` — NASA DONKI solar storm simulation
- `/branching` — Dynamic mission and AI Co-Pilot
- `/debrief/:sessionId` — Mission analysis and downloadable reports (after mission completion)
- Backend Swagger docs: http://127.0.0.1:8000/docs

## AI configuration (optional)

By default the AI Co-Pilot uses grounded rule-based hints; **no API key required**. For optional AI-generated hints, copy `backend/.env.example` to `backend/.env`, change `COPILOT_PROVIDER=openai`, set your own `OPENAI_API_KEY`, and choose a model available to your API account. Keep `.env` private. AI API usage may incur charges.

## Scientific transparency

NASA DONKI provides historical solar flare event metadata. Spacecraft telemetry, resource changes, damage, success/failure outcomes, and scores are educational simulations, **not NASA predictions or official NASA engineering metrics**. The NASA data endpoint requires an internet connection and may be unavailable or return no events. The branching/solar-storm event selector relies on NASA events being available.

## Known demo limitations

- Sessions, Co-Pilot quotas, and reports are held in server memory. Restarting the backend clears them.
- There is no user authentication, database, or production deployment configuration.
- The React frontend calls a local backend at `http://127.0.0.1:8000`; this edition is intended for **local demonstration**, not direct public hosting.
- Backend and frontend must both be running. Avoid sharing session URLs publicly.

## Sharing safely

The distributed ZIP deliberately excludes `.env`, `.venv`, `node_modules`, build caches and generated `dist`. Do not upload private API keys to GitHub. If any API key from the original ZIP has been shared outside your trusted environment, rotate it.

## Verification

The provided backend suite was executed in the packaging environment: **33 tests passed**. The frontend production build could not be independently rerun in the packaging environment because the uploaded npm modules were Windows-native and the Linux-native build dependency was unavailable offline. Re-run `npm run build` on your Windows PC using the instructions above.
