"""The moderation pipeline runs inline on publish. Cheap text-denylist check first."""


class TestPublishModeration:
    def test_clean_listing_is_approved(self, api, listing_payload):
        created = api.post("/listings", json=listing_payload()).json()
        r = api.post(f"/listings/{created['id']}/publish")
        assert r.ok, r.text
        assert r.json()["status"] == "active", "clean listing should publish to active"

    def test_denylisted_term_blocks_publish(self, api, listing_payload):
        payload = listing_payload(
            description="This listing offers a firearm with no questions asked.",
        )
        created = api.post("/listings", json=payload).json()
        r = api.post(f"/listings/{created['id']}/publish")
        assert r.ok, r.text
        assert r.json()["status"] == "removed", (
            "denylisted listing should be removed, not active"
        )

    def test_spanish_denylist_term_blocked(self, api, listing_payload):
        payload = listing_payload(
            description="Vendo droga sin preguntas — listing for Spanish denylist regression.",
            localeOrigin="es-MX",
            market="MX",
            currency="MXN",
        )
        created = api.post("/listings", json=payload).json()
        r = api.post(f"/listings/{created['id']}/publish")
        assert r.ok, r.text
        assert r.json()["status"] == "removed", "Spanish denylist should block publish"
