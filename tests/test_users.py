class TestUsers:
    def test_get_signed_up_user_returns_profile(self, api, signed_up_user):
        r = api.get(f"/users/{signed_up_user.user_id}")
        assert r.ok, r.text
        body = r.json()
        assert body["id"] == signed_up_user.user_id
        assert body["displayName"] == "QA Test User"
        assert "ratingAvg" in body
        assert "passwordHash" not in body, "passwordHash leaked in user profile"
        assert "email" not in body, "email leaked in user profile"

    def test_unknown_user_returns_404(self, api):
        r = api.get("/users/does-not-exist-cuid")
        assert r.status_code == 404
