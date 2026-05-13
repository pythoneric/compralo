# Compralo

Bilingual (EN / es-MX) marketplace for new and used items — including vehicles.

Launch markets: **US** (`/en/...`) and **Mexico** (`/mx/...`).
Stack: Next.js 15 (App Router) + NestJS 10 + Postgres 16 (PostGIS) + Redis + MinIO + OpenSearch, in a pnpm monorepo.

---

## Repository layout

```
compralo/
├── apps/
│   ├── web/                 Next.js 15 + next-intl, market-prefix routing
│   └── api/                 NestJS 10 modular monolith
├── packages/
│   ├── db/                  Prisma schema + client (single source of truth)
│   └── types/               Shared TypeScript types
├── docker-compose.yml       Postgres, Redis, MinIO, OpenSearch
└── .env.example
```

## MVP module map

| Plan section | Where it lives |
|---|---|
| Listings (shared + vehicle variant) | [apps/api/src/modules/listings](apps/api/src/modules/listings), [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma) |
| Category model + taxonomy | [apps/api/src/modules/categories](apps/api/src/modules/categories) |
| VIN decoding | [apps/api/src/modules/vehicles](apps/api/src/modules/vehicles) (NHTSA vPIC) |
| Search + facets | [apps/api/src/modules/search](apps/api/src/modules/search) (Postgres ILIKE for v0, OpenSearch swap-in) |
| In-app messaging | [apps/api/src/modules/messages](apps/api/src/modules/messages) |
| Offers + orders | [apps/api/src/modules/offers](apps/api/src/modules/offers), [apps/api/src/modules/orders](apps/api/src/modules/orders) |
| Payments (Stripe + MP behind one interface) | [apps/api/src/modules/payments](apps/api/src/modules/payments) |
| Moderation pipeline | [apps/api/src/modules/moderation](apps/api/src/modules/moderation) |
| Reviews | [apps/api/src/modules/reviews](apps/api/src/modules/reviews) |
| Auth (local v1, Auth0 swap path) | [apps/api/src/modules/auth](apps/api/src/modules/auth) |
| Image uploads (S3/MinIO presign) | [apps/api/src/modules/uploads](apps/api/src/modules/uploads) |
| i18n routing + Spanish dialect | [apps/web/src/i18n](apps/web/src/i18n), [apps/web/messages](apps/web/messages) |
| Landing / search / listing detail / sell / dashboard | [apps/web/src/app/[market]](apps/web/src/app/[market]) |

## Prerequisites

- Node.js ≥ 20.11
- pnpm 9
- Docker + Docker Compose

## Quickstart

```bash
# 1. Install
cp .env.example .env
pnpm install

# 2. Local services
pnpm docker:up

# 3. Database
pnpm db:generate
pnpm db:migrate          # creates tables
pnpm db:seed             # categories, demo seller, demo Civic listing

# 4. Run both apps
pnpm dev
```

Open:
- Web (EN): http://localhost:3000/en
- Web (MX): http://localhost:3000/mx
- API health: http://localhost:4000/v1/health
- Demo listing: http://localhost:3000/mx/l/<id-from-seed-output>

## Architectural rules to preserve

These come from the implementation plan in [as-an-expert-in-peppy-metcalfe.md](~/.claude/plans/as-an-expert-in-peppy-metcalfe.md):

1. **Money is `BigInt` cents + ISO 4217 currency** everywhere. Never floats.
2. **Path segments carry the market**, not the language (`/en/`, `/mx/`). Lets us add `es-CO` without ambiguity.
3. **User-generated content is stored in `localeOrigin`** and rendered with on-demand translation. Never auto-translate prices, VINs, or addresses.
4. **Payments go through `PaymentProvider`** ([apps/api/src/modules/payments/providers/provider.interface.ts](apps/api/src/modules/payments/providers/provider.interface.ts)). Stripe and Mercado Pago both implement it; the unified `Payment` ledger is the source of truth.
5. **Vehicles are a first-class table** ([VehicleListing](packages/db/prisma/schema.prisma)), not JSONB attrs. Search by year/mileage/make has to be index-friendly.
6. **Moderation is pre-publish**, blocking by default; swap to async (BullMQ) when latency starts to bite.

## What's stubbed (intentional, called out so it doesn't get missed)

- **Auth**: local password auth — switch to Auth0/Clerk before launch.
- **Search**: Postgres `ILIKE` — swap to OpenSearch (`listings_en`, `listings_es` per the plan) once result quality matters.
- **Payments**: both providers return a fake redirect URL. Plug in real SDKs + webhook secrets.
- **VIN**: NHTSA vPIC is wired live (free, no key). Repuve (MX) needs a contract — see [vin.service.ts](apps/api/src/modules/vehicles/vin.service.ts).
- **Uploads**: presign endpoint returns a MinIO PUT URL string. Swap to `@aws-sdk/s3-request-presigner` for real signed URLs.
- **Messaging**: Postgres-backed for MVP — move realtime to Stream Chat at scale, keep the canonical thread record in our DB.
- **Image moderation**: Rekognition not wired (env var present). Denylist-only for now.

## Scripts (root)

| Command | What it does |
|---|---|
| `pnpm dev` | runs `web` and `api` in parallel |
| `pnpm build` | builds every package |
| `pnpm typecheck` | tsc across the workspace |
| `pnpm db:migrate` | Prisma migrate dev |
| `pnpm db:seed` | seed categories, makes/models, demo listing |
| `pnpm db:reset` | drop + re-migrate + re-seed |
| `pnpm docker:up` / `pnpm docker:down` | local infra |
