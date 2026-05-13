"""Shared fixtures for the Compralo pytest suite.

The suite is black-box: it talks to the running API at ``API_URL`` and the
running web app at ``WEB_URL`` (defaults match the local-dev runbook). It
deliberately makes no Prisma / SQLite assumptions so the same tests will
run against the production Postgres stack.
"""
from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass
from typing import Any, Iterator

import pytest
import requests


API_URL = os.environ.get("API_URL", "http://localhost:4000/v1").rstrip("/")
WEB_URL = os.environ.get("WEB_URL", "http://localhost:3000").rstrip("/")


# ---------------------------------------------------------------------------
# Service availability — fail fast with a clear message if servers aren't up.
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def _require_services() -> None:
    deadline = time.time() + 5
    api_ok = web_ok = False
    while time.time() < deadline and not (api_ok and web_ok):
        if not api_ok:
            try:
                api_ok = requests.get(f"{API_URL}/health", timeout=1).ok
            except requests.RequestException:
                pass
        if not web_ok:
            try:
                web_ok = requests.get(f"{WEB_URL}/en", timeout=2, allow_redirects=False).ok
            except requests.RequestException:
                pass
        if not (api_ok and web_ok):
            time.sleep(0.25)
    if not api_ok:
        pytest.exit(f"API not reachable at {API_URL} — start it (see docs/local-dev.md)", returncode=2)
    if not web_ok:
        pytest.exit(f"Web not reachable at {WEB_URL} — start it (see docs/local-dev.md)", returncode=2)


# ---------------------------------------------------------------------------
# HTTP clients
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def api_url() -> str:
    return API_URL


@pytest.fixture(scope="session")
def web_url() -> str:
    return WEB_URL


@pytest.fixture()
def api(api_url: str) -> Iterator[requests.Session]:
    """A fresh requests.Session whose ``.get`` / ``.post`` etc. resolve against the API base."""
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    # Patch the verbs so callers can write ``api.get("/listings")``.
    base = api_url

    def _wrap(verb: str):
        original = getattr(session, verb)

        def call(path: str, **kw: Any) -> requests.Response:
            url = path if path.startswith("http") else f"{base}{path}"
            kw.setdefault("timeout", 8)
            return original(url, **kw)

        return call

    for verb in ("get", "post", "patch", "put", "delete"):
        setattr(session, verb, _wrap(verb))

    yield session
    session.close()


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


@pytest.fixture()
def unique_email() -> str:
    return f"{_unique('qa')}@compralo.test"


@dataclass
class SignedUpUser:
    user_id: str
    token: str
    email: str
    password: str


@pytest.fixture()
def signed_up_user(api: requests.Session, unique_email: str) -> SignedUpUser:
    payload = {
        "email": unique_email,
        "password": "Sup3rSecret!",
        "displayName": "QA Test User",
        "market": "US",
    }
    r = api.post("/auth/sign-up", json=payload)
    assert r.ok, f"sign-up failed: {r.status_code} {r.text}"
    body = r.json()
    return SignedUpUser(
        user_id=body["userId"],
        token=body["token"],
        email=payload["email"],
        password=payload["password"],
    )


# ---------------------------------------------------------------------------
# Seeded references — query once per session.
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def seeded(api_url: str) -> dict[str, Any]:
    """Look up the seeded Civic / F-150 / iPhone listings so tests can reuse them."""
    out: dict[str, Any] = {"mx": [], "us": []}
    for market in ("MX", "US"):
        r = requests.get(f"{api_url}/listings", params={"market": market, "limit": 20}, timeout=5)
        r.raise_for_status()
        items = r.json()["items"]
        out[market.lower()] = items
    # Convenience aliases for the well-known fixtures.
    civic = next((l for l in out["mx"] if "Civic" in l["title"]), None)
    f150 = next((l for l in out["us"] if "F-150" in l["title"]), None)
    iphone = next((l for l in out["mx"] if "iPhone" in l["title"]), None)
    assert civic, "seeded Civic listing missing — run `pnpm db:seed`"
    assert f150, "seeded F-150 listing missing — run `pnpm db:seed`"
    assert iphone, "seeded iPhone listing missing — run `pnpm db:seed`"
    out["civic"] = civic
    out["f150"] = f150
    out["iphone"] = iphone
    out["demo_seller_id"] = civic["seller"]["id"]
    return out


# ---------------------------------------------------------------------------
# Listing builder — pure dict factory; the test decides what to POST.
# ---------------------------------------------------------------------------


def make_listing_payload(seller_id: str, *, vehicle: bool = False, **overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "sellerId": seller_id,
        "categoryId": "cat.vehicles.cars.sedan" if vehicle else "cat.electronics",
        "title": _unique("QA Test Listing"),
        "description": "Generated by the QA pytest suite. Long enough to clear validation.",
        "priceCents": 1000_00,
        "currency": "USD",
        "condition": "used_good",
        "saleType": "fixed",
        "locationLabel": "Austin, TX",
        "locationLat": 30.2672,
        "locationLng": -97.7431,
        "market": "US",
        "localeOrigin": "en",
        "images": [
            {"url": "https://placehold.co/1024x768?text=qa1", "altEn": "qa 1"},
            {"url": "https://placehold.co/1024x768?text=qa2", "altEn": "qa 2"},
        ],
    }
    if vehicle:
        base["vehicle"] = {
            "make": "Toyota",
            "model": "Corolla",
            "year": 2020,
            "trim": "LE",
            "vin": "JTDEPRAE0LJ123456",
            "mileage": 45000,
            "mileageUnit": "mi",
            "transmission": "cvt",
            "fuelType": "gas",
            "bodyStyle": "sedan",
            "drivetrain": "fwd",
            "titleStatus": "clean",
            "accidentHistory": "none",
            "previousOwners": 1,
        }
    base.update(overrides)
    return base


@pytest.fixture()
def listing_payload(seeded: dict[str, Any]):
    """Returns a builder that fills sellerId from the seeded demo seller by default."""

    def _build(*, vehicle: bool = False, seller_id: str | None = None, **overrides: Any) -> dict[str, Any]:
        return make_listing_payload(seller_id or seeded["demo_seller_id"], vehicle=vehicle, **overrides)

    return _build
