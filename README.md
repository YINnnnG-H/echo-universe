# EchoLand Demo

A mobile-first knowledge journal demo inspired by the `回声大陆` requirements document.

## Project Structure

- `client`: React + TypeScript + Tailwind + ECharts frontend
- `server`: Express + TypeScript API with heuristic AI fallback and CRUD/stat endpoints
- `supabase/init.sql`: PostgreSQL initialization script for a production-grade `entries` table
- `render.yaml`: Render deployment blueprint

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Start the desktop development demo:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, API on `http://localhost:8787`.

## Stable Mobile Access On Your Local Network

If you want a more stable phone-friendly mode while your computer is on:

```bash
npm run mobile
```

This mode will:

- build the frontend
- build the backend
- let the Express server serve the frontend and API together on port `8787`

Then open the app on your phone with your computer's LAN IP:

```text
http://<your-lan-ip>:8787
```

## Permanent Public Version

If you want the app to work without your computer being on, and be shareable with friends, deploy it as a public web app.

Recommended stack:

- hosting: Render
- database: Supabase Postgres

### What This Repo Supports Now

- local file storage by default
- Postgres storage automatically when `DATABASE_URL` is provided
- Express can serve the built frontend and API together
- Render deployment blueprint is included in `render.yaml`

### Recommended Deployment Steps

1. Create a Supabase project.
2. Run `supabase/init.sql` in the Supabase SQL editor.
3. Copy the Supabase Postgres connection string into `DATABASE_URL`.
4. Push this repo to GitHub.
5. Create a new Render Web Service from the repo.
6. Render will detect `render.yaml`.
7. Set environment variables in Render:

- `DATABASE_URL`
- `PGSSL=require`
- `AI_PROVIDER=openai-compatible` if you want real AI analysis
- `AI_BASE_URL`
- `AI_MODEL`
- `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

8. Deploy.

After deployment, you will get a public URL like:

```text
https://your-app-name.onrender.com
```

That link can be opened any time, from any phone, and shared with your friends.

## AI Integration

By default the backend uses a local heuristic analyzer so the demo works without any external API key.

To use DeepSeek or another OpenAI-compatible provider:

- set `AI_PROVIDER=openai-compatible`
- set `AI_BASE_URL`, `AI_MODEL`, and a valid `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

If the remote call fails, the backend still stores the raw entry and marks `needs_retry=true`.

## Database

The local demo API uses a JSON file store for zero-setup development.

For production deployment, this repo now supports Postgres via `DATABASE_URL`.

To initialize the production table in Supabase, run:

```sql
\i supabase/init.sql
```

## Import Existing Local Data Into Supabase

If your old records were created before `DATABASE_URL` was enabled, they are still stored in the local JSON file and need one one-time import.

1. Put your Supabase connection string into local `.env` as `DATABASE_URL`.
2. Optional dry run:

```bash
npm run import:local --workspace server -- --dry-run
```

3. Run the real import:

```bash
npm run import:local --workspace server
```

4. Refresh the public site after the script finishes.

You can also point to a custom local file:

```bash
npm run import:local --workspace server -- --path "C:\path\to\entries.json"
```
