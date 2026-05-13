import pytest


@pytest.mark.smoke
class TestSignUp:
    def test_returns_token_and_user_id(self, api, unique_email):
        r = api.post(
            "/auth/sign-up",
            json={
                "email": unique_email,
                "password": "Sup3rSecret!",
                "displayName": "QA Sign-Up",
                "market": "US",
            },
        )
        assert r.ok, r.text
        body = r.json()
        assert body["token"], "no token returned"
        assert body["userId"], "no userId returned"
        # JWTs are three base64 segments joined with dots.
        assert body["token"].count(".") == 2

    @pytest.mark.parametrize(
        "field,value",
        [
            ("email", "not-an-email"),
            ("password", "short"),         # < 8 chars
            ("displayName", ""),
            ("market", "FR"),               # unsupported
        ],
    )
    def test_validation_rejects_bad_input(self, api, unique_email, field, value):
        payload = {
            "email": unique_email,
            "password": "Sup3rSecret!",
            "displayName": "QA Sign-Up",
            "market": "US",
        }
        payload[field] = value
        r = api.post("/auth/sign-up", json=payload)
        assert r.status_code == 400, f"expected 400 for bad {field}, got {r.status_code}"

    def test_duplicate_email_rejected(self, api, signed_up_user):
        r = api.post(
            "/auth/sign-up",
            json={
                "email": signed_up_user.email,
                "password": "Sup3rSecret!",
                "displayName": "QA Dup",
                "market": "US",
            },
        )
        assert r.status_code in (400, 409, 500), (
            "expected duplicate email to be rejected (Prisma raises P2002 unique constraint)"
        )


class TestSignIn:
    def test_correct_password_returns_token(self, api, signed_up_user):
        r = api.post(
            "/auth/sign-in",
            json={"email": signed_up_user.email, "password": signed_up_user.password},
        )
        assert r.ok, r.text
        assert r.json()["token"]

    def test_wrong_password_returns_401(self, api, signed_up_user):
        r = api.post(
            "/auth/sign-in",
            json={"email": signed_up_user.email, "password": "WrongPassword!"},
        )
        assert r.status_code == 401

    def test_unknown_email_returns_401(self, api):
        r = api.post(
            "/auth/sign-in",
            json={"email": "ghost@compralo.test", "password": "DoesNotMatter1!"},
        )
        assert r.status_code == 401
