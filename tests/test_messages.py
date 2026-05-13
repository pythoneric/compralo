class TestOpenThread:
    def test_open_returns_thread_with_listing(self, api, seeded, signed_up_user):
        r = api.post(
            "/threads",
            json={"listingId": seeded["civic"]["id"], "buyerId": signed_up_user.user_id},
        )
        assert r.ok, r.text
        body = r.json()
        assert body["id"]
        assert body["listingId"] == seeded["civic"]["id"]

    def test_open_is_idempotent_for_same_pair(self, api, seeded, signed_up_user):
        first = api.post(
            "/threads",
            json={"listingId": seeded["civic"]["id"], "buyerId": signed_up_user.user_id},
        ).json()
        second = api.post(
            "/threads",
            json={"listingId": seeded["civic"]["id"], "buyerId": signed_up_user.user_id},
        ).json()
        assert first["id"] == second["id"], "second open should return existing thread"

    def test_open_on_unknown_listing_404s(self, api, signed_up_user):
        r = api.post(
            "/threads",
            json={"listingId": "does-not-exist", "buyerId": signed_up_user.user_id},
        )
        assert r.status_code == 404


class TestSendMessage:
    def test_message_round_trip(self, api, seeded, signed_up_user):
        thread = api.post(
            "/threads",
            json={"listingId": seeded["civic"]["id"], "buyerId": signed_up_user.user_id},
        ).json()
        r = api.post(
            f"/threads/{thread['id']}/messages",
            json={"senderId": signed_up_user.user_id, "body": "Hola, ¿sigue disponible?"},
        )
        assert r.ok, r.text
        msg = r.json()
        assert msg["body"] == "Hola, ¿sigue disponible?"
        assert msg["threadId"] == thread["id"]

        # And we can read it back via GET /threads/:id
        fetched = api.get(f"/threads/{thread['id']}").json()
        bodies = [m["body"] for m in fetched["messages"]]
        assert "Hola, ¿sigue disponible?" in bodies

    def test_empty_body_rejected(self, api, seeded, signed_up_user):
        thread = api.post(
            "/threads",
            json={"listingId": seeded["civic"]["id"], "buyerId": signed_up_user.user_id},
        ).json()
        r = api.post(
            f"/threads/{thread['id']}/messages",
            json={"senderId": signed_up_user.user_id, "body": ""},
        )
        assert r.status_code == 400
