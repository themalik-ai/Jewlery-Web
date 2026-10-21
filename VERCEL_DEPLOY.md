# Fixing and Deploying SCARLET on Vercel

The `404 NOT_FOUND` screen from Vercel is a deployment/routing error, not the React application's own 404 page.

This repository now includes the files Vercel needs:

- `vercel.json` — Vite build/output settings, API routing and SPA fallback.
- `api/index.mjs` — Vercel Function entrypoint for the Express API.
- `server/app.mjs` — exported Express app (no listener inside the function).
- `server/index.mjs` — local/Docker listener used by `npm run dev` and `npm start`.

## Files that must be pushed

Do **not** omit configuration files from GitHub. Commit these root files:

```text
vercel.json
vite.config.ts
postcss.config.js
tailwind.config.js
tsconfig.json
tsconfig.app.json
tsconfig.node.json
package.json
package-lock.json
index.html
api/
server/
src/
public/
```

It is correct to omit `.env`, `node_modules/`, `dist/`, `.vercel/` and database files. Secrets belong in Vercel Environment Variables, not GitHub.

## Git commands

From the project root:

```bash
git add vercel.json api server src public \
  package.json package-lock.json index.html \
  vite.config.ts postcss.config.js tailwind.config.js \
  tsconfig.json tsconfig.app.json tsconfig.node.json \
  .gitignore .vercelignore .env.example

git commit -m "Fix Vercel Vite and Express deployment"
git push origin main
```

Check with:

```bash
git ls-files vercel.json api/index.mjs server/app.mjs vite.config.ts
```

All four paths must print.

## Vercel project settings

Open **Vercel → Project → Settings → Build and Deployment**:

| Setting | Required value |
|---|---|
| Root Directory | `.` (repository root) |
| Framework Preset | Vite (or auto-detected) |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 20.x |

If the project was previously configured with another root/output directory, correct it. The committed `vercel.json` also supplies these values.

## Environment variables

Under **Settings → Environment Variables**, add:

```text
JWT_SECRET=<a long random secret, at least 32 characters>
ADMIN_EMAIL=<your verified administrator email>
ADMIN_PASSWORD=<a unique strong password>
```

Optional:

```text
VITE_WHATSAPP_NUMBER=<international digits only>
```

Add the variables to Production (and Preview if desired), then redeploy. Never prefix private server secrets with `VITE_`; Vite variables are public in the browser bundle.

If `JWT_SECRET` or `ADMIN_PASSWORD` is absent in production, the public store remains available but the admin login is intentionally disabled with HTTP 503.

## Redeploy

1. Push the corrected files to the Git branch connected to Vercel.
2. Open **Vercel → Deployments**.
3. Select the latest deployment and confirm the build finishes successfully.
4. If Vercel reused an old broken build, select **Redeploy**, disable **Use existing Build Cache**, and redeploy.
5. Open the deployment-specific URL first.
6. Under **Settings → Domains**, confirm `jewlery-web.vercel.app` is assigned to the latest Production deployment.

Expected checks:

```text
https://jewlery-web.vercel.app/            → storefront
https://jewlery-web.vercel.app/builder     → React builder (SPA fallback)
https://jewlery-web.vercel.app/api/health  → JSON with "ok": true
```

## Important database limitation

The included backend uses SQLite. Vercel Functions can write only to `/tmp`, which is ephemeral and may reset on a cold start or differ between function instances. The Vercel setup is therefore suitable for displaying and testing the demo, but **not for durable live orders, inventory or admin changes**.

Before accepting real orders, use one of these production architectures:

1. **Recommended:** migrate the schema to Supabase/PostgreSQL and use Supabase Storage for uploads.
2. Host the existing Express/SQLite server on Railway, Render, Fly.io or a VPS with a persistent disk, and point the Vercel frontend at that API.
3. Deploy the supplied Docker image to a platform with persistent storage instead of Vercel Functions.

Do not claim persistence or live payment processing while using ephemeral Vercel SQLite.

## If the root still shows `404 NOT_FOUND`

Verify, in order:

1. `vercel.json` exists at the exact repository root (not inside `src/`).
2. Vercel's Root Directory points to the directory containing `package.json` and `vercel.json`.
3. The latest deployment log shows `npm run build` and a generated `dist/index.html`.
4. Output Directory is `dist`, not `public`, `build` or `/`.
5. The domain is attached to the latest production deployment.
6. Redeploy once without the build cache.

A missing `.env` file in GitHub is **not** the cause of the root 404 and is the correct security practice.
