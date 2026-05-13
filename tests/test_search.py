import pytest


@pytest.mark.smoke
class TestSearch:
    def test_envelope_shape(self, api):
        r = api.get("/search")
        assert r.ok, r.text
        body = r.json()
        assert set(body.keys()) >= {"hits", "total", "facets"}
        assert isinstance(body["hits"], list)
        assert isinstance(body["total"], int)

    def test_query_finds_civic(self, api):
        body = api.get("/search", params={"q": "Civic", "market": "MX"}).json()
        assert body["total"] >= 1, "expected to find at least one Civic in MX"
        titles = " ".join(h["title"] for h in body["hits"])
        assert "Civic" in titles

    def test_market_isolation(self, api):
        mx = api.get("/search", params={"market": "MX"}).json()
        us = api.get("/search", params={"market": "US"}).json()
        assert all(h["market"] == "MX" for h in mx["hits"])
        assert all(h["market"] == "US" for h in us["hits"])

    def test_category_filter(self, api):
        body = api.get("/search", params={"categoryId": "cat.vehicles.cars.sedan"}).json()
        # Every hit must be in the sedan category.
        assert all(h["category"]["id"] == "cat.vehicles.cars.sedan" for h in body["hits"])

    def test_unmatched_query_returns_empty(self, api):
        body = api.get("/search", params={"q": "zzzzz-no-such-thing-zzzzz"}).json()
        assert body["total"] == 0
        assert body["hits"] == []

    def test_limit_cap(self, api):
        body = api.get("/search", params={"limit": 1}).json()
        assert len(body["hits"]) <= 1
