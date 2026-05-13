import pytest


@pytest.mark.smoke
class TestHealth:
    def test_returns_ok_and_db_up(self, api):
        r = api.get("/health")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "ok"
        assert body["db"] == "up", "DB connectivity failed — check DATABASE_URL"
        assert "ts" in body

    def test_responds_quickly(self, api):
        import time

        start = time.perf_counter()
        api.get("/health")
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert elapsed_ms < 500, f"health took {elapsed_ms:.0f}ms (>500ms)"
