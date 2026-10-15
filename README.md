# LeadFlow

A single-screen lead management tool (a lightweight CRM). A sales rep can track leads, log every discussion, set follow-up reminders, and see at a glance who needs attention today. Built as a coding assessment for **PravarAI** with a Next.js frontend, a FastAPI backend, and MongoDB Atlas, wrapped in a "Liquid Glass" UI.

## Live demo

| | URL |
|---|---|
| Frontend (Vercel) | https://lead-flow-bay.vercel.app |
| Backend API (Render) | https://leadflow-api-dk3l.onrender.com |
| API docs (Swagger) | https://leadflow-api-dk3l.onrender.com/docs |
| Repository | https://github.com/AkleshC148/LeadFlow |

**Demo login:** `demo@leadflow.dev` / `Demo@1234`

> **Cold start notice:** the backend runs on Render's free tier, which sleeps after about 15 minutes of inactivity. The first request after a idle period can take 30 to 60 seconds. The UI shows a "Waking up the server..." message while this happens. Open the site once and give it a minute before testing.

## Screenshots

![Screenshot 1](docs/screenshots/screenshot-1.png)
![Screenshot 2](docs/screenshots/screenshot-2.png)


## Features

**Lead list**
- Shows name (and company), a colour-coded status badge, the last discussion note, and time since the last discussion ("2 hours ago").
- Filter by status: All, New, Contacted, Qualified, Proposal Sent, Won, Lost.
- Search leads by name (debounced 300 ms). Search and status filter combine.
- **Today's follow-ups are pinned** in their own section at the top, using the user's local calendar day. A lead never appears twice.
- **Overdue follow-ups are highlighted in red** with an "Overdue" pill (not applied to Won or Lost leads).
- Loading skeletons, empty state, and an error state with retry.

**Lead timeline dialog** (a dialog, not a new page)
- Full discussion history, newest first.
- Form to add a note with an optional follow-up date and time.
- Saving a note with a follow-up updates the lead's follow-up field and the list behind the dialog immediately, without a refetch.
- Status can be changed from the dialog (optimistic update with rollback and an error toast on failure).

**Add new lead**
- Name is required. Company and phone are optional. Status defaults to New.

**Auth**
- Signup and login with JWT. Passwords hashed with bcrypt.
- Every lead and discussion is scoped to its owner. Another user's lead returns 404.
- Expired or invalid tokens clear the session and redirect to login.

**Extras**
- Liquid Glass design: animated mesh gradient, floating blurred orbs, translucent glass surfaces, a fallback for browsers without `backdrop-filter`, and `prefers-reduced-motion` support.
- Seed script with demo data, MongoDB indexes created on startup, consistent error format, and Dockerfiles for both apps.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Radix UI (Dialog, Select, Toast), lucide-react, Framer Motion, date-fns |
| Backend | Python 3.11, FastAPI, Pydantic v2, pydantic-settings, Motor (async MongoDB driver), bcrypt, PyJWT, Uvicorn |
| Database | MongoDB Atlas |
| Hosting | Vercel (frontend), Render (backend) |

## Project structure

```
LeadFlow/
├── backend/
│   ├── app/
│   │   ├── main.py          # app, CORS, lifespan (indexes), global error handlers, /api/health
│   │   ├── config.py        # settings loaded from environment variables
│   │   ├── db.py            # Motor client and index creation
│   │   ├── security.py      # bcrypt hashing, JWT create/decode, get_current_user
│   │   ├── schemas.py       # Pydantic models, UTC "Z" datetime and id serialisation
│   │   └── routers/
│   │       ├── auth.py      # signup, login, me
│   │       └── leads.py     # leads and discussions
│   ├── seed.py              # idempotent demo data
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # layout, globals.css, page.tsx, login/, signup/
│   │   ├── components/      # LeadList, LeadRow, StatusBadge, FilterBar, SearchInput,
│   │   │                    # AddLeadDialog, LeadTimelineDialog, Header, AuthGuard,
│   │   │                    # LiquidBackground, ui/Toast
│   │   ├── hooks/           # useLeads, useDebounce
│   │   └── lib/             # types.ts, api.ts, auth.ts, time.ts
│   ├── Dockerfile
│   ├── next.config.ts
│   └── .env.example
├── docs/
│   └── API_CONTRACT.md      # single source of truth shared by frontend and backend
└── README.md
```

## Architecture notes

- **Contract first.** `docs/API_CONTRACT.md` defines every route, field name, enum, and status code. The frontend and backend were built against it independently, which kept them compatible.
- **Denormalised lead fields.** `last_note`, `last_discussion_at`, and `follow_up_at` are stored on the lead and updated whenever a discussion is added. The list needs no joins.
- **`POST /discussions` returns the updated lead.** The frontend replaces the lead in state with the response, so the last note, time-ago, and pinning update instantly without a second request.
- **Dates.** The backend stores timezone-aware UTC and returns ISO-8601 strings ending in `Z`. The frontend converts to the user's local time for display and for deciding what is "today".
- **Uniform errors.** Every error, including validation errors, returns `{"detail": "<readable message>"}` with no stack traces.
- **Ownership scoping.** Every query filters by `owner_id`. Invalid ObjectIds return 404, never 500.

## Data model

| Collection | Fields |
|---|---|
| `users` | `_id`, `name`, `email` (unique, lowercase), `password_hash`, `created_at` |
| `leads` | `_id`, `owner_id`, `name`, `company`, `phone`, `status`, `follow_up_at`, `last_note`, `last_discussion_at`, `created_at`, `updated_at` |
| `discussions` | `_id`, `lead_id`, `owner_id`, `note`, `follow_up_at`, `created_at` |

Indexes (created on startup): `users.email` unique, `leads (owner_id, status)`, `leads (owner_id, name)`, `discussions (lead_id, created_at desc)`.

Status values: `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`.

## API reference

All routes are prefixed `/api`. Send `Authorization: Bearer <token>` on every route except health, signup, and login.

| Method | Route | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/api/health` | Health check | 200 | |
| POST | `/api/auth/signup` | Create account, returns token and user | 201 | 409 email exists, 422 |
| POST | `/api/auth/login` | Log in, returns token and user | 200 | 401, 422 |
| GET | `/api/auth/me` | Current user | 200 | 401 |
| GET | `/api/leads?status=&q=` | List leads, optional status filter and name search, sorted by `updated_at` desc | 200 | 401, 422 |
| POST | `/api/leads` | Create a lead | 201 | 401, 422 |
| GET | `/api/leads/{id}` | Get one lead | 200 | 401, 404 |
| PATCH | `/api/leads/{id}` | Update status, name, company, phone, or clear `follow_up_at` | 200 | 401, 404, 422 |
| GET | `/api/leads/{id}/discussions` | Discussions, newest first | 200 | 401, 404 |
| POST | `/api/leads/{id}/discussions` | Add a note, optional `follow_up_at`. Returns `{discussion, lead}` | 201 | 401, 404, 422 |

Interactive docs are at `/docs` on the backend.

## Local setup

### Prerequisites

- Node.js and npm
- Python 3.11 or newer
- A MongoDB Atlas account (the free M0 tier is enough)
- Git

### 1. Clone

```bash
git clone https://github.com/AkleshC148/LeadFlow.git
cd LeadFlow
```

### 2. Set up MongoDB Atlas

1. Create a project and a free **M0** cluster.
2. **Security → Database Access:** create a database user with a password (letters and numbers avoid URL-encoding problems) and the role *Read and write to any database*.
3. **Security → Network Access:** add `0.0.0.0/0` (or your own IP).
4. **Database → Connect → Drivers → Python:** copy the connection string and replace `<db_password>` with your password (remove the angle brackets).

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# Windows cmd
.venv\Scripts\activate.bat
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

# create your env file from the template
copy .env.example .env     # Windows
cp .env.example .env       # macOS / Linux
```

Open `backend/.env` and fill in your values (see the table below). Generate a JWT secret with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Seed demo data, then start the server:

```bash
python seed.py
python -m uvicorn app.main:app --reload --port 8000
```

Check `http://localhost:8000/api/health` returns `{"status":"ok"}`, and open `http://localhost:8000/docs`.

### 4. Frontend

In a second terminal:

```bash
cd frontend
npm install

copy .env.example .env.local     # Windows
cp .env.example .env.local       # macOS / Linux

npm run dev
```

Open `http://localhost:3000` and log in with `demo@leadflow.dev` / `Demo@1234`.

## Environment variables

### Backend (`backend/.env`, or the Render dashboard)

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Database name (created automatically on first write) | `leadflow` |
| `JWT_SECRET` | Secret used to sign tokens. Use a long random value and a different one in production | output of `secrets.token_hex(32)` |
| `JWT_ALGORITHM` | Signing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token lifetime in minutes | `1440` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins, no trailing slash | `http://localhost:3000,https://lead-flow-bay.vercel.app` |

Render-only setting: `PYTHON_VERSION=3.11.9` (not read by the app, it tells Render which Python to build with).

### Frontend (`frontend/.env.local`, or the Vercel dashboard)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend, no trailing slash. Baked in at build time, so redeploy after changing it | `http://localhost:8000` |

## Seed data

`python seed.py` is idempotent. It clears the demo user's data and recreates it:

- Demo user `demo@leadflow.dev` / `Demo@1234`
- 7 leads across all 6 statuses, each with 2 to 4 discussions at varied past times
- 2 leads with a follow-up **due today**, 2 **overdue** (not Won or Lost), 1 in the future, and 2 with none

Dates are relative to when the script runs, so re-run it before demoing to keep "today" and "overdue" accurate.

## Deployment

### Backend on Render

| Setting | Value |
|---|---|
| Service type | Web Service |
| Root Directory | `backend` |
| Language | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |
| Environment | the six backend variables plus `PYTHON_VERSION=3.11.9` |

### Frontend on Vercel

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework | Next.js (auto-detected) |
| Environment | `NEXT_PUBLIC_API_URL` set to the Render URL |

### Order of operations

1. Deploy the backend on Render and note its URL.
2. Deploy the frontend on Vercel with `NEXT_PUBLIC_API_URL` set to that URL.
3. Go back to Render and set `CORS_ORIGINS` to the Vercel URL (origin only, no path or trailing slash). Render redeploys automatically.

### Docker

`backend/Dockerfile` and `frontend/Dockerfile` (multi-stage, Next.js standalone output) are included. A `docker-compose.yml` is not included yet. See next steps.

## Manual test checklist

1. Log in as the demo user. Seven leads load with status badges, last notes, and time-ago.
2. "Today's follow-ups" shows two leads at the top, and they are not repeated below.
3. Two leads are red with an "Overdue" pill. Won and Lost leads are never red.
4. Each status filter works, and search works alone and combined with a filter.
5. Add a lead with only a name. It appears immediately with status New.
6. Open a lead and add a note with a follow-up for today. The lead moves to the pinned section immediately and its last note updates.
7. Change the status in the dialog, refresh, and confirm it persisted.
8. Sign up with an already used email and confirm a readable error appears.
9. Remove the token from local storage and reload. You are redirected to login.

## AI usage disclosure

This project was built with AI assistance, as the assessment encouraged.

- **Tool:** Google Antigravity, with two separate agents (one for `backend/`, one for `frontend/`), working from a shared API contract in `docs/API_CONTRACT.md`. Prompts and the contract were drafted with help from Claude (Anthropic).
- **AI-generated:** the initial FastAPI backend, the Next.js frontend and its styling, the seed script, and the Dockerfiles.
- **Done by me:** _fill this in honestly, for example: MongoDB Atlas setup, environment configuration, integration testing, debugging, deployment to Render and Vercel, git and repository setup, and any code you reviewed or changed by hand._

## Known limitations and next steps

- Render's free tier cold starts cause a slow first request.
- The JWT is stored in `localStorage`, which is simple but exposed to XSS. An httpOnly cookie would be safer.
- No automated tests yet. Next steps would be pytest and httpx tests for the auth and lead flows, plus frontend component tests.
- No `docker-compose.yml` yet.
- No pagination on the lead list.
- No lead deletion, and no password reset or email verification.
- Follow-up reminders are visual only. There are no push or email notifications.
