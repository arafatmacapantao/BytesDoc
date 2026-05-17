BytesDoc is a document management system for BYTES student council. it's purpose is to centralize, organize, and secure administrative and event‑related documents with role‑based access and read‑only archiving.

## Repo layout

- `frontend/` — Next.js 15 + React + TypeScript + Tailwind. The user-facing app.
- `backend/` — Node + Express + TypeScript + Supabase. The API.

## Running the system

You'll need two terminals — one for the backend, one for the frontend. Both run on your own machine.

**Prereqs:** Node.js 20+ and npm. Check with `node -v`.

### 1. Clone the repo

```
git clone https://github.com/0-0april/BytesDoc.git
cd BytesDoc
```

### 2. Start the backend (terminal 1)

```
cd backend
npm install
```

Copy the env template and fill in the Supabase keys (ask the project owner for them — never commit `.env`):

```
cp .env.example .env
```

Start the dev server:

```
npm run dev
```

API runs at `http://localhost:4000`. Quick check:

```
curl http://localhost:4000/api/health
```

Should return `{"ok":true,"service":"bytesdoc-backend"}`.

More detail (DB schema, endpoint list, role rules) is in `backend/README.md`.

### 3. Start the frontend (terminal 2)

```
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:3000`.

### Heads-up

- The frontend is still using mock data (`frontend/lib/mockData.ts`) and doesn't yet call the backend. Login uses the hardcoded users in that file. Once the wiring task is done, login goes through the real API. For now, both can run independently.
- Both servers reload on save — no need to restart on code changes.
- If port 3000 or 4000 is already in use: backend → `PORT=4001 npm run dev`, frontend → `npx next dev -p 3001`. Make sure `CORS_ORIGIN` in the backend `.env` matches whatever port the frontend is actually on.
