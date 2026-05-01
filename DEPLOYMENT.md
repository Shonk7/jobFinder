# Deployment Setup

This repo uses:

- **Vercel** for the frontend (Next.js) — free, no time limits
- **Render** for the backend and Redis — free web service + free Key Value, no time limits
- **Neon** for PostgreSQL — free tier, no time limits

GitHub Actions handles CI only. Vercel and Render deploy from GitHub automatically after CI passes.

## Services at a Glance

| Service | Provider | Plan |
|---------|----------|------|
| Frontend (Next.js) | Vercel | Free (Hobby) |
| Backend (Express) | Render | Free web service |
| Redis | Render | Free Key Value |
| PostgreSQL | Neon | Free |

## One-Time Setup

### 1. Neon (Postgres)

1. Create a free account at https://neon.tech
2. Create a new project and database named `jobapp`
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.neon.tech/jobapp?sslmode=require
   ```

### 2. Render (Backend + Redis)

1. Push this repo to GitHub.
2. In Render, click **New +** → **Blueprint**.
3. Connect this GitHub repo. Render detects [render.yaml](render.yaml).
4. When prompted for `sync: false` env vars, enter:
   ```
   DATABASE_URL=<your Neon connection string>
   FRONTEND_URL=https://<your-vercel-project>.vercel.app
   ```
5. Finish the Blueprint. This creates `jobapp-backend` and `jobapp-redis`.
6. Note your backend URL: `https://jobapp-backend.onrender.com`

### 3. Vercel (Frontend)

1. In Vercel, click **Add New → Project** and import this GitHub repo.
2. Set the **Root Directory** to `frontend`.
3. Add this environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://jobapp-backend.onrender.com/api/v1
   ```
4. Deploy.

## What Changed in This Repo

- [render.yaml](render.yaml) defines the Render Blueprint (backend + Redis only).
- Old Vercel and Railway deploy workflows were removed.
- CI remains in [.github/workflows/ci.yml](.github/workflows/ci.yml).
- Resume uploads switched to in-memory processing (no persistent disk needed).

## Backend Runtime

- Build: `npm ci && npm run generate && npm run build && npx prisma db push`
- Start: `npm start`
- Health check: `/api/v1/health`

`prisma db push` runs at build time so the Neon schema stays in sync on every deploy.

## Updating URLs

If your Vercel or Render URLs change, update the env vars in the respective dashboards:

- `FRONTEND_URL` on the Render backend service
- `NEXT_PUBLIC_API_URL` on the Vercel frontend project

Then trigger a redeploy of each.

## Free-Tier Caveats

- Render free web services can cold start after inactivity (≈30 s first request).
- Render free Key Value does not persist to disk (fine for session/cache use).
- Neon free tier: 0.5 GB storage, single compute — fine for demos and portfolio projects.
- Vercel Hobby is free with no expiry for personal projects.

- Render watches the repo
- Render deploys only after checks pass

That gives you GitHub-controlled quality gates without extra deployment secrets in Actions.
