class TestPresign:
    def test_presign_returns_upload_url_and_key(self, api):
        r = api.post(
            "/uploads/presign",
            json={"filename": "qa.jpg", "contentType": "image/jpeg"},
        )
        assert r.ok, r.text
        body = r.json()
        for k in ("uploadUrl", "publicUrl", "key"):
            assert body.get(k), f"presign response missing `{k}`"
        assert body["uploadUrl"].startswith("http")
        assert "qa.jpg" in body["key"]

    def test_presign_requires_filename(self, api):
        r = api.post("/uploads/presign", json={"contentType": "image/jpeg"})
        assert r.status_code == 400
