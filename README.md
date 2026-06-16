# EchoLand Demo

A mobile-first cosmic journal demo inspired by the `回声大陆` concept document.

## Project Structure

- `client`: React + TypeScript + Tailwind + ECharts frontend
- `server`: Express + TypeScript API with AI analysis, auth verification, and per-user data isolation
- `supabase/init.sql`: Supabase Postgres initialization and migration script
- `render.yaml`: optional legacy Render blueprint

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill in the values you need:

- `VITE_API_URL=http://localhost:8787`
- `SUPABASE_URL=<your-supabase-project-url>`
- `VITE_SUPABASE_URL=<your-supabase-project-url>`
- `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- `DATABASE_URL=<your-supabase-postgres-url>` if you want cloud persistence
- `DEEPSEEK_API_KEY=<your-real-key>` if you want real AI analysis

4. Start the desktop development demo:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, API on `http://localhost:8787`.

## Stable Mobile Access On Your Local Network

If you want a phone-friendly mode while your computer is still on:

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

If you want the app to work without your computer being on, and be shareable with friends, deploy it publicly.

Recommended stack:

- hosting: Railway
- auth: Supabase Auth
- database: Supabase Postgres

### What This Repo Supports Now

- local file storage by default
- Postgres storage automatically when `DATABASE_URL` is provided
- Supabase Auth login for each user
- JWT verification in the Express API
- per-user filtering for entries and dashboard stats
- automatic claim of legacy single-user records on first authenticated login
- Express can serve the built frontend and API together

### Recommended Deployment Steps

1. Create a Supabase project.
2. In Supabase Authentication, enable Email + Password.
3. Run the SQL in `supabase/init.sql` inside the Supabase SQL editor.
4. Copy these values:

- Project URL -> `SUPABASE_URL` and `VITE_SUPABASE_URL`
- Anon key -> `VITE_SUPABASE_ANON_KEY`
- Postgres connection string -> `DATABASE_URL`

5. Push this repo to GitHub.
6. Create a new Railway service from the repo.
7. Set environment variables in Railway:

- `DATABASE_URL`
- `PGSSL=require`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `AI_PROVIDER=openai-compatible` if you want real AI analysis
- `AI_BASE_URL=https://api.deepseek.com`
- `AI_MODEL=deepseek-chat`
- `DEEPSEEK_API_KEY`

8. Deploy.

After deployment, you will get a public URL like:

```text
https://your-app-name.up.railway.app
```

That link can be opened any time, from any phone, and shared with your friends. Each friend can create an account and keep their own private records.

## First Login Migration

If you already had old single-user records before auth was added:

- keep `user_id` nullable in the database
- the first authenticated owner will automatically trigger the bootstrap claim flow
- old rows with `user_id is null` will be attached to that first owner

This prevents your existing cloud data from disappearing the moment login goes live.

## AI Integration

By default the backend uses a local heuristic analyzer so the demo works without any external API key.

To use DeepSeek or another OpenAI-compatible provider:

- set `AI_PROVIDER=openai-compatible`
- set `AI_BASE_URL`, `AI_MODEL`, and a valid `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

If the remote call fails, the backend still stores the raw entry and marks `needs_retry=true`.

## Database

The local demo API uses a JSON file store for zero-setup development.

For production deployment, this repo supports Supabase Postgres via `DATABASE_URL`.

To initialize or migrate the production table in Supabase, paste the contents of `supabase/init.sql` into the SQL editor and run it.

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
