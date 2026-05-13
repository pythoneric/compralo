# Local dev — start, stop, restart

Quick reference for running the Compralo stack on this machine.

URLs once running:
- Web: http://localhost:3000/en and http://localhost:3000/mx
- API: http://localhost:4000/v1 (health at `/v1/health`)
- SQLite DB file: [packages/db/prisma/dev.db](../packages/db/prisma/dev.db)

> The PATH export is needed because `pnpm` lives in `~/.local/bin` (installed without sudo).
> Add it to your shell rc once and you can skip it.
> ```bash
> echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
> ```

---

## Start

### Both servers (recommended)

From the repo root, in two terminals:

```bash
# Terminal 1 — API (NestJS, port 4000)
export PATH="$HOME/.local/bin:$PATH"
cd apps/api && pnpm dev

# Terminal 2 — Web (Next.js, port 3000)
export PATH="$HOME/.local/bin:$PATH"
cd apps/web && pnpm dev
```

### Background (single terminal)

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /home/qwerty/Repos/compralo

nohup pnpm --filter @compralo/api dev > /tmp/compralo-api.log 2>&1 &
nohup pnpm --filter @compralo/web dev > /tmp/compralo-web.log 2>&1 &
disown
```

Logs:
- API → `/tmp/compralo-api.log`
- Web → `/tmp/compralo-web.log`

---

## Stop

```bash
pkill -f "nest start"          # stops API
pkill -f "next dev --port 3000" # stops Web
```

Verify nothing's left:

```bash
ps -ef | grep -E "(nest start|next-server|next dev)" | grep -v grep
```

If `pkill` refuses, find the PID and kill it directly:

```bash
ps -ef | grep -E "(nest|next)" | grep -v grep
kill <PID>
```

If a process refuses to die, `kill -9 <PID>`.

---

## Restart

Stop, then start. Or one-liner restart:

```bash
pkill -f "nest start"; pkill -f "next dev --port 3000"
sleep 1
export PATH="$HOME/.local/bin:$PATH"
cd /home/qwerty/Repos/compralo
nohup pnpm --filter @compralo/api dev > /tmp/compralo-api.log 2>&1 &
nohup pnpm --filter @compralo/web dev > /tmp/compralo-web.log 2>&1 &
disown
```

The API hot-reloads (`nest start --watch`) and the web hot-reloads (Next dev). You usually do **not** need to restart for source-code changes — just for `.env`, `schema.prisma`, or package.json changes.

---

## Status / health

```bash
# Is the API up?
curl -s http://localhost:4000/v1/health
# → {"status":"ok","db":"up","ts":"..."}

# Is the web up?
curl -sI http://localhost:3000/en | head -1
# → HTTP/1.1 200 OK

# Running processes
ps -ef | grep -E "(nest start|next-server)" | grep -v grep
```

Tail the logs while you work:

```bash
tail -f /tmp/compralo-api.log
tail -f /tmp/compralo-web.log
```

---

## Database

### Re-seed (keeps schema, refreshes demo data)

```bash
export PATH="$HOME/.local/bin:$PATH"
cd packages/db
DATABASE_URL="file:./dev.db" pnpm exec tsx prisma/seed.ts
```

### Reset (drop everything, re-migrate, re-seed)

```bash
export PATH="$HOME/.local/bin:$PATH"
cd packages/db
DATABASE_URL="file:./dev.db" pnpm exec prisma migrate reset --force
```

The migration runs `seed.ts` automatically afterward.

### After schema changes

```bash
export PATH="$HOME/.local/bin:$PATH"
cd packages/db
DATABASE_URL="file:./dev.db" pnpm exec prisma migrate dev --name <change_name>

# Then rebuild the db package so the API (which loads compiled JS) picks up the new client:
cd ../..
pnpm --filter @compralo/db build

# Restart the API (see Restart section).
```

---

## First-time setup (only if cloning fresh)

```bash
# 1. Install pnpm (no sudo)
npm install -g pnpm@9.12.0 --prefix=$HOME/.local
export PATH="$HOME/.local/bin:$PATH"

# 2. Install workspace deps
cd /home/qwerty/Repos/compralo
pnpm install

# 3. Env files (one per package)
cp .env.example .env
# apps/api/.env, apps/web/.env.local, packages/db/.env should already be in the repo;
# if missing, copy the patterns from the existing files.

# 4. Build the db package (compiles TS → dist/ so the API can require it)
pnpm --filter @compralo/db build

# 5. Generate Prisma client + migrate + seed
cd packages/db
DATABASE_URL="file:./dev.db" pnpm exec prisma generate
DATABASE_URL="file:./dev.db" pnpm exec prisma migrate dev --name init
DATABASE_URL="file:./dev.db" pnpm exec tsx prisma/seed.ts
cd ../..

# 6. Start servers (see Start section)
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| API health says `"db":"down"` | `DATABASE_URL` points at the wrong SQLite file | The data lives at `packages/db/prisma/dev.db` (Prisma resolves `file:` relative to `schema.prisma`'s dir). Confirm `apps/api/.env` has the absolute path to that file. |
| API errors `Cannot read properties of undefined (reading 'list')` | Decorator metadata missing — usually means the API was started with `tsx` instead of `nest start` | Make sure `apps/api/package.json` `dev` script is `nest start --watch`. |
| API errors `Cannot use import statement outside a module` referencing `packages/db/src/index.ts` | `@compralo/db` not built — API tried to require the TS source | `pnpm --filter @compralo/db build`, then restart API. |
| Web shows "No listings yet" on `/en` and `/mx` | API isn't reachable from the web app | Check API is up (`curl localhost:4000/v1/health`). Check `apps/web/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000`. |
| Port already in use | A previous server didn't shut down | `lsof -i :4000` and `lsof -i :3000` to find the PID, then `kill <PID>`. |
| Prisma CLI complains `Environment variable not found: DATABASE_URL` | `.env` isn't next to `schema.prisma` and not passed inline | Run the prisma command with `DATABASE_URL="file:./dev.db"` prefixed (as shown in the DB section). |

---

## What's in dev mode vs. production

The local stack is intentionally simpler than the target architecture:

- **Database**: SQLite locally; Postgres + PostGIS in prod (see [docker-compose.yml](../docker-compose.yml)).
- **Search**: Postgres `contains` against title/description; OpenSearch with per-locale analyzers in prod.
- **Payments**: stub providers that mint fake redirect URLs; real Stripe + Mercado Pago SDKs in prod.
- **Auth**: local password (Argon2); Auth0/Clerk in prod.
- **Object storage**: stubbed presign endpoint; S3 + CloudFront + imgproxy in prod.

See the [README](../README.md) "What's stubbed" section for the full list.
