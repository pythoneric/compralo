# QA test suite (pytest)

Black-box tests over the running stack — API at `http://localhost:4000/v1` and web at `http://localhost:3000`.

## Run

```bash
# 1. Make sure both servers are up (see ../docs/local-dev.md)
curl -sf http://localhost:4000/v1/health && echo "API up"

# 2. One-time: create a venv with deps
python3 -m venv .venv
.venv/bin/pip install -r tests/requirements.txt

# 3. Run the full suite
.venv/bin/pytest tests/

# Variants:
.venv/bin/pytest tests/ -m smoke         # smoke only
.venv/bin/pytest tests/ -m "not external" # skip NHTSA (offline runs)
.venv/bin/pytest tests/test_listings.py   # one file
.venv/bin/pytest tests/ -k vehicle -v     # by keyword
```

## Override URLs

```bash
API_URL=https://staging-api.compralo.com/v1 WEB_URL=https://staging.compralo.com pytest tests/
```

## Markers

| Marker | Meaning |
|---|---|
| `external` | Hits a live third-party (NHTSA vPIC). Skip with `-m "not external"`. |
| `web` | Exercises the Next.js server (SSR HTML, locale routing). Slower than pure-API tests. |
| `smoke` | Minimal critical-path coverage. Run first in CI. |

## Coverage by feature area

| File | Endpoints / behaviors covered |
|---|---|
| `test_health.py` | `GET /v1/health` shape and DB connectivity |
| `test_categories.py` | `GET /v1/categories` taxonomy + bilingual labels |
| `test_listings.py` | List, detail, create (item + vehicle variant), update, publish (moderation) |
| `test_vehicles_vin.py` | `POST /v1/vehicles/decode-vin` against NHTSA — live |
| `test_search.py` | `q`, market filter, category filter, empty-result |
| `test_auth.py` | Sign-up, sign-in, duplicate email, wrong password |
| `test_users.py` | `GET /v1/users/:id`, 404 |
| `test_offers.py` | Create offer, accept/reject/counter |
| `test_messages.py` | Open thread (idempotent), send message, fetch |
| `test_reviews.py` | Create review, list by subject, rating average recomputed |
| `test_uploads.py` | Presign returns URL + key |
| `test_payments.py` | Checkout session stubs for both providers |
| `test_moderation.py` | Denylist blocks publish; clean listing publishes |
| `test_i18n_web.py` | `/` → market redirect, `/en` + `/mx` render, locale-specific currency/distance |

Each file is independent — failures don't cascade.
