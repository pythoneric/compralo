"""End-to-end coverage of the listing lifecycle: list, detail, create, update, publish."""
import pytest


@pytest.mark.smoke
class TestListListings:
    def test_returns_items_envelope(self, api):
        r = api.get("/listings")
        assert r.ok, r.text
        body = r.json()
        assert "items" in body
        assert isinstance(body["items"], list)

    def test_market_filter_isolates_results(self, api):
        mx = api.get("/listings", params={"market": "MX"}).json()["items"]
        us = api.get("/listings", params={"market": "US"}).json()["items"]
        assert all(l["market"] == "MX" for l in mx), "MX filter leaking other markets"
        assert all(l["market"] == "US" for l in us), "US filter leaking other markets"
        # Sanity: seeded data has at least one in each market.
        assert mx, "no MX listings seeded"
        assert us, "no US listings seeded"

    def test_limit_caps_results(self, api):
        r = api.get("/listings", params={"limit": 1})
        assert len(r.json()["items"]) <= 1

    def test_only_active_listings_returned(self, api):
        for l in api.get("/listings").json()["items"]:
            assert l["status"] == "active", f"non-active listing leaked: {l['id']}"


@pytest.mark.smoke
class TestListingDetail:
    def test_returns_full_listing(self, api, seeded):
        r = api.get(f"/listings/{seeded['civic']['id']}")
        assert r.ok, r.text
        body = r.json()
        assert body["id"] == seeded["civic"]["id"]
        assert body["title"] == seeded["civic"]["title"]
        assert body["category"]["isVehicle"] is True

    def test_vehicle_payload_present_on_vehicle_listing(self, api, seeded):
        body = api.get(f"/listings/{seeded['civic']['id']}").json()
        assert body["vehicle"], "vehicle listing missing nested vehicle data"
        v = body["vehicle"]
        for key in ("make", "model", "year", "vin", "mileage", "transmission", "titleStatus"):
            assert v.get(key), f"vehicle.{key} missing"
        assert v["make"] == "Honda"
        assert v["model"] == "Civic"

    def test_non_vehicle_listing_has_no_vehicle(self, api, seeded):
        body = api.get(f"/listings/{seeded['iphone']['id']}").json()
        assert body["vehicle"] in (None, {}), "non-vehicle listing leaked vehicle payload"

    def test_translations_parsed_to_object(self, api, seeded):
        body = api.get(f"/listings/{seeded['civic']['id']}").json()
        assert isinstance(body["translations"], dict), "translations should be parsed JSON, not a string"
        assert "title" in body["translations"]
        assert "en" in body["translations"]["title"]

    def test_bigint_price_serialized_as_number(self, api, seeded):
        body = api.get(f"/listings/{seeded['civic']['id']}").json()
        assert isinstance(body["priceCents"], int), "priceCents must be int (BigInt → number)"
        assert body["priceCents"] > 0

    def test_unknown_id_returns_404(self, api):
        r = api.get("/listings/does-not-exist-cuid")
        assert r.status_code == 404

    def test_images_sorted(self, api, seeded):
        body = api.get(f"/listings/{seeded['civic']['id']}").json()
        sort_orders = [img["sortOrder"] for img in body["images"]]
        assert sort_orders == sorted(sort_orders), "images returned out of sortOrder"


class TestCreateListing:
    def test_create_item_listing(self, api, listing_payload):
        r = api.post("/listings", json=listing_payload())
        assert r.ok, r.text
        body = r.json()
        assert body["id"]
        assert body["status"] == "draft", "new listing should land in draft"
        assert body["priceCents"] == 100000

    def test_create_vehicle_listing_persists_vehicle(self, api, listing_payload):
        r = api.post("/listings", json=listing_payload(vehicle=True))
        assert r.ok, r.text
        body = r.json()
        assert body["vehicle"], "vehicle data not persisted on create"
        assert body["vehicle"]["make"] == "Toyota"
        assert body["vehicle"]["year"] == 2020

    @pytest.mark.parametrize(
        "field,value",
        [
            ("title", "x"),              # too short
            ("description", "short"),     # too short
            ("priceCents", -100),         # negative
            ("priceCents", 0),            # zero
            ("currency", "BADLONG"),      # wrong length
            ("market", "FR"),             # unsupported market
            ("localeOrigin", "fr"),       # unsupported locale
        ],
    )
    def test_validation_rejects_bad_input(self, api, listing_payload, field, value):
        payload = listing_payload()
        payload[field] = value
        r = api.post("/listings", json=payload)
        assert r.status_code == 400, f"expected 400 for bad {field}={value!r}, got {r.status_code}: {r.text}"

    def test_validation_rejects_short_vin(self, api, listing_payload):
        payload = listing_payload(vehicle=True)
        payload["vehicle"]["vin"] = "TOOSHORT"
        r = api.post("/listings", json=payload)
        assert r.status_code == 400


class TestUpdateListing:
    def test_patch_updates_title_and_price(self, api, listing_payload):
        created = api.post("/listings", json=listing_payload()).json()
        r = api.patch(f"/listings/{created['id']}", json={"title": "Updated Title", "priceCents": 999900})
        assert r.ok, r.text
        body = r.json()
        assert body["title"] == "Updated Title"
        assert body["priceCents"] == 999900

    def test_patch_unknown_listing_returns_404(self, api):
        r = api.patch("/listings/does-not-exist", json={"title": "Whatever"})
        assert r.status_code == 404


class TestPublishListing:
    def test_clean_listing_goes_active(self, api, listing_payload):
        created = api.post("/listings", json=listing_payload()).json()
        r = api.post(f"/listings/{created['id']}/publish")
        assert r.ok, r.text
        assert r.json()["status"] == "active"

    def test_publish_unknown_listing_returns_404(self, api):
        r = api.post("/listings/does-not-exist/publish")
        assert r.status_code == 404
