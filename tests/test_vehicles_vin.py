"""VIN decoding goes through to NHTSA vPIC (free, no key). Marked `external`."""
import pytest


@pytest.mark.external
class TestDecodeVin:
    def test_civic_vin_returns_make_model_year(self, api):
        r = api.post("/vehicles/decode-vin", json={"vin": "2HGFC2F69KH123456"})
        assert r.ok, r.text
        body = r.json()
        assert (body.get("make") or "").upper() == "HONDA"
        assert body.get("model") == "Civic"
        assert body.get("year") == 2019

    def test_f150_vin_returns_truck(self, api):
        r = api.post("/vehicles/decode-vin", json={"vin": "1FTFW1E50MFA12345"})
        assert r.ok, r.text
        body = r.json()
        assert (body.get("make") or "").upper() == "FORD"
        assert "F-150" in (body.get("model") or "")


class TestVinValidation:
    def test_short_vin_rejected_by_validator(self, api):
        r = api.post("/vehicles/decode-vin", json={"vin": "SHORT"})
        assert r.status_code == 400, "VIN length validator should reject <11 chars"

    def test_missing_vin_rejected(self, api):
        r = api.post("/vehicles/decode-vin", json={})
        assert r.status_code == 400
