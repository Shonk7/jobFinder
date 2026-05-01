# Deployment Setup

This repo is now set up for Render.

Use GitHub Actions for CI only and let Render deploy from GitHub after CI passes. That is the lowest-friction setup for this codebase.

## Cost Reality

Render does have a free path, but it is not a forever-production plan.

- Free web services exist.
- Free Key Value exists.
- Free Postgres exists, but Render documents a 30-day limit on the free database tier.
- Free services can cold start and have tighter resource limits.

That makes Render free good for demos, testing, and portfolio use. If you want stable long-term hosting, expect to move at least the database to a paid tier.

## What Changed in This Repo

- Deployment is defined in [render.yaml](render.yaml).
- The old Vercel and Railway deploy workflows were removed.
- CI remains in [.github/workflows/ci.yml](.github/workflows/ci.yml).
- Resume uploads no longer depend on persistent local disk, which keeps the backend compatible with Render's free web service tier.

## Recommended Deployment Model

1. Keep GitHub Actions for lint, typecheck, and tests.
2. Connect the repo to Render using the Blueprint in [render.yaml](render.yaml).
3. Let Render auto-deploy only when GitHub checks pass.

The blueprint uses `autoDeployTrigger: checksPass`, so Render waits for CI success before deploying.

## Services Created by Render

The blueprint provisions:

- `jobapp-frontend` as a free Node web service
- `jobapp-backend` as a free Node web service
- `jobapp-redis` as a free Render Key Value instance
- `jobapp-postgres` as a free Render Postgres instance

## One-Time Render Setup

1. Push this repo to GitHub.
2. In Render, click New + and choose Blueprint.
3. Connect this GitHub repo.
4. Render will detect [render.yaml](render.yaml).
5. During creation, choose the same region for all services.
6. When prompted for env vars with `sync: false`, provide:

```env
FRONTEND_URL=https://your-frontend-service.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api/v1
```

7. Finish the Blueprint creation.

## Important Notes About URLs

Render cannot automatically interpolate a public frontend URL into the backend or a public backend URL into the frontend inside `render.yaml`.

That is why these two values are entered manually:

- `FRONTEND_URL` on the backend
- `NEXT_PUBLIC_API_URL` on the frontend

If your final Render service URLs differ from what you entered initially, update those env vars in the Render dashboard and redeploy both services.

## Backend Runtime Settings

The backend service in [render.yaml](render.yaml) is configured with:

- build: `npm ci && npm run generate && npm run build`
- pre-deploy: `npx prisma db push`
- start: `npm start`
- health check: `/api/v1/health`

This repo currently has a Prisma schema but no committed migrations directory, so `prisma db push` is the practical deployment path.

## Frontend Runtime Settings

The frontend service in [render.yaml](render.yaml) is configured with:

- build: `npm ci && npm run build`
- start: `npm start`

## Free-Tier Caveats

- Free Postgres is time-limited on Render.
- Free Key Value does not persist data to disk.
- Free web services can sleep and cold start.
- The app is suitable for demo use on free Render, not serious production traffic.

## If You Want GitHub to Trigger Deploys Directly

You can do that with Render deploy hooks, but it is not necessary here.

The simpler approach is:

- GitHub Actions runs CI
- Render watches the repo
- Render deploys only after checks pass

That gives you GitHub-controlled quality gates without extra deployment secrets in Actions.
