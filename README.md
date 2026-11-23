# AI Communication Coach

A full-stack application that helps you practice speaking and improve your
communication skills. Record yourself through the microphone, get an
instant AI-powered breakdown of your **grammar**, **vocabulary**, **filler
words**, and **speaking speed (WPM)**, receive a weighted **communication
score**, and track your progress over time on a personal dashboard.

```
ai-communication-coach/
├── backend/      FastAPI + SQLAlchemy + SQLite + faster-whisper + spaCy/NLTK
└── frontend/     React + React Router + Axios + Chart.js (Vite)
```

---

## 1. Features

- **Authentication** — register, login, logout, JWT-protected routes.
- **Recording** — in-browser microphone recording via the MediaRecorder API,
  with a live reactive waveform meter.
- **Speech-to-text** — local transcription using `faster-whisper` (tiny model,
  CPU/int8 by default — no API keys, no cloud calls).
- **Analysis pipeline**:
  - Grammar checking (`language_tool_python`)
  - Vocabulary richness & advanced-word usage (`spaCy`)
  - Filler word detection (`um`, `uh`, `like`, `you know`, ...)
  - Speaking speed in words-per-minute
  - Sentiment analysis (`NLTK` VADER)
- **Scoring** — a single weighted **Communication Score** (0–100):

  | Component   | Weight |
  |-------------|--------|
  | Grammar     | 30%    |
  | Vocabulary  | 25%    |
  | WPM         | 20%    |
  | Fillers     | 15%    |
  | Sentiment   | 10%    |

- **Reports** — save any analyzed session as a report (SQLite).
- **Dashboard** — average score, best score, average WPM/fillers, and a
  score-trend line chart (Chart.js), computed server-side with
  Pandas/NumPy.
- **History** — browse, open, and delete every saved report.

---

## 2. Tech stack

| Layer      | Technology                                                            |
|------------|------------------------------------------------------------------------|
| Frontend   | React 18, React Router 6, Axios, Chart.js / react-chartjs-2, Vite      |
| Backend    | FastAPI, SQLAlchemy, SQLite, Passlib (bcrypt), python-jose (JWT)       |
| AI / NLP   | faster-whisper, spaCy, NLTK (VADER), language_tool_python              |
| Data       | Pandas, NumPy                                                          |

---

## 3. Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Java 8+** — required by `language_tool_python` (it runs a local
  LanguageTool server in the background on first use).
- **ffmpeg** — required by faster-whisper's audio decoding (via PyAV) for
  reading the WebM/Opus audio produced by the browser's MediaRecorder.
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: install from https://ffmpeg.org/download.html and add it to PATH

> The very first transcription/grammar-check request will be slower than
> normal because faster-whisper, spaCy, and LanguageTool all download or
> load their models/binaries lazily on first use.

---

## 4. Backend setup

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Download the NLP models/corpora used by the analysis pipeline
python -m spacy download en_core_web_sm
python -m nltk.downloader vader_lexicon punkt punkt_tab

# 4. Configure environment variables
cp .env.example .env            # a working .env is already included by default

# 5. Run the API (creates the SQLite DB + tables automatically on startup)
python run.py
```

The API will be available at **http://localhost:8000**, with interactive
docs at **http://localhost:8000/docs**.

> No manual database setup is required — `init_db()` runs automatically on
> application startup and creates `data/app.db` plus the `users` and
> `reports` tables if they don't already exist.

---

## 5. Frontend setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env            # a working .env is already included by default

# 3. Run the dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

For a production build:

```bash
npm run build
npm run preview   # serve the built bundle locally to verify it
```

---

## 6. Running both together (VS Code)

Open two integrated terminals in VS Code (``Terminal → Split Terminal``):

**Terminal 1 — backend**
```bash
cd backend
source venv/bin/activate    # Windows: venv\Scripts\activate
python run.py
```

**Terminal 2 — frontend**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser, register a new
account, allow microphone access, and start recording.

---

## 7. Project structure

```
backend/
  app/
    main.py                FastAPI app, CORS, startup, router registration
    config.py               Environment-driven settings
    database.py             SQLAlchemy engine/session, init_db()
    models.py                User & Report ORM models
    schemas.py                Pydantic request/response models
    auth.py                    JWT + bcrypt password hashing, get_current_user
    routers/
      auth_routes.py           /api/auth/register, /login, /me
      speech_routes.py         /api/speech/transcribe
      report_routes.py         /api/reports (CRUD) + /api/reports/stats/dashboard
    services/
      transcription.py         faster-whisper wrapper
      analysis.py               grammar / vocabulary / fillers / sentiment / WPM
      scoring.py                  weighted score computation
  data/                          SQLite database file lives here
  uploads/                       temporary audio files (deleted after processing)
  requirements.txt
  .env.example / .env
  run.py

frontend/
  src/
    api/
      axios.js                Axios instance + auth/401 interceptors
      endpoints.js              One function per backend endpoint
    context/
      AuthContext.jsx           Auth state, login/register/logout, session restore
    hooks/
      useAudioRecorder.js       MediaRecorder + Web Audio level metering
    components/
      Navbar, ProtectedRoute, Recorder, ScoreRing, MetricBar,
      ReportRow, StatCard, TranscriptViewer, AlertBanner, LoadingSpinner
    pages/
      Login, Register, Dashboard, RecordSession, History, ReportDetail, NotFound
    styles/
      theme.css (tokens) / layout.css / components.css / pages.css
  package.json
  vite.config.js
  .env.example / .env
```

---

## 8. API reference

All endpoints are prefixed with `/api`. Protected endpoints require an
`Authorization: Bearer <token>` header (handled automatically by the
frontend's Axios instance).

| Method | Endpoint                       | Auth | Description                              |
|--------|---------------------------------|------|-------------------------------------------|
| POST   | `/api/auth/register`            | No   | Create an account, returns a JWT          |
| POST   | `/api/auth/login`                | No   | Log in, returns a JWT                      |
| GET    | `/api/auth/me`                   | Yes  | Current user profile                       |
| POST   | `/api/speech/transcribe`         | Yes  | Upload audio → transcript + full analysis  |
| POST   | `/api/reports`                    | Yes  | Persist an analysis result as a report     |
| GET    | `/api/reports`                     | Yes  | List the current user's reports            |
| GET    | `/api/reports/{id}`                 | Yes  | Fetch a single report                       |
| DELETE | `/api/reports/{id}`                  | Yes  | Delete a report                              |
| GET    | `/api/reports/stats/dashboard`        | Yes  | Aggregate stats + score trend for charts     |

---

## 9. How scoring works

Each saved session is broken into five 0–100 sub-scores, then combined into
the overall **Communication Score**:

- **Grammar (30%)** — deducts points per grammar error relative to word count.
- **Vocabulary (25%)** — blends lexical diversity (type-token ratio) with the
  proportion of longer/advanced words used.
- **WPM (20%)** — scores highest within the 120–160 WPM "ideal" conversational
  range, falling off the further outside that range you speak.
- **Fillers (15%)** — deducts points per filler word relative to word count.
- **Sentiment (10%)** — maps VADER's compound sentiment score onto 0–100.

```
overall_score = grammar*0.30 + vocabulary*0.25 + wpm*0.20 + fillers*0.15 + sentiment*0.10
```

See `backend/app/services/scoring.py` for the exact formulas.

---

## 10. Troubleshooting

- **"Could not transcribe audio"** — make sure `ffmpeg` is installed and on
  your PATH; faster-whisper relies on it (via PyAV) to decode the browser's
  WebM/Opus recording.
- **LanguageTool is slow to respond on the first request** — `language_tool_python`
  downloads and starts a local Java-based LanguageTool server the first time
  it's used in a process. Subsequent requests are fast. Make sure Java 8+ is
  installed.
- **spaCy model not found** — run `python -m spacy download en_core_web_sm`
  inside your backend virtual environment (the app also attempts to
  auto-download it on first use if missing).
- **CORS errors in the browser console** — confirm `FRONTEND_ORIGINS` in
  `backend/.env` includes the exact origin your frontend is running on
  (default: `http://localhost:5173`).
- **Microphone permission denied** — most browsers require HTTPS or
  `localhost` to grant microphone access; `http://localhost:5173` works
  out of the box in development.

---

## 11. Security notes

- Passwords are hashed with bcrypt (`passlib`) — plaintext passwords are
  never stored.
- Authentication uses signed JWTs (`python-jose`); change `SECRET_KEY` in
  `backend/.env` before deploying anywhere beyond local development.
- All report/speech endpoints are scoped to `get_current_user`, so users can
  only ever read, list, or delete their own data.
