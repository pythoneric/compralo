# Compralo

Marketplace API. NestJS 10 + Prisma + SQLite.

## Quickstart

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate    # creates dev.db + applies migrations
pnpm dev           # http://localhost:4000/v1
```

## Routes (so far)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/v1/health` | — | Liveness + DB ping |
| POST | `/v1/auth/sign-up` | — | `{email, password, displayName, market}` → `{token, userId}` |
| POST | `/v1/auth/sign-in` | — | `{email, password}` → `{token, userId}`. Rate-limited (per-IP + per-email). |
| GET  | `/v1/listings?market=US\|MX&limit=` | — | Active listings, newest first |
| GET  | `/v1/listings/:id` | — | Listing detail |
| POST | `/v1/listings` | Bearer JWT | Create listing as the authenticated user |
| PATCH | `/v1/listings/:id` | Bearer JWT | Owner-only |
| DELETE | `/v1/listings/:id` | Bearer JWT | Owner-only |

## Security baseline (sign-in)

- argon2id password hashing
- Constant-time verify against a dummy hash when the user is missing — no timing-based user enumeration
- Generic `Invalid email or password` on 401 — no error-text user enumeration
- Per-IP (20/min) and per-email (10/15 min) sliding-window rate limit; returns 429 + `Retry-After`
- Email/password length caps on the DTO to bound argon2 CPU
- JWT secret required ≥32 chars in production; dev fallback only when `NODE_ENV !== "production"`

## What's not here yet
Vehicles, search, messages, offers, orders, payments, moderation, reviews, uploads, web UI. Adding in follow-up PRs.
