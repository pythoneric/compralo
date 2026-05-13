import pytest


class TestCreateOffer:
    def test_offer_created_in_pending_state(self, api, seeded, signed_up_user):
        r = api.post(
            "/offers",
            json={
                "listingId": seeded["civic"]["id"],
                "buyerId": signed_up_user.user_id,
                "amountCents": 27_000_00,
                "currency": "MXN",
            },
        )
        assert r.ok, r.text
        body = r.json()
        assert body["status"] == "pending"
        assert body["amountCents"] == 27_000_00
        assert body["listingId"] == seeded["civic"]["id"]

    def test_offer_on_unknown_listing_404s(self, api, signed_up_user):
        r = api.post(
            "/offers",
            json={
                "listingId": "does-not-exist",
                "buyerId": signed_up_user.user_id,
                "amountCents": 1_000_00,
                "currency": "MXN",
            },
        )
        assert r.status_code == 404

    @pytest.mark.parametrize("amount", [-1, 0])
    def test_offer_validation_rejects_non_positive_amount(self, api, seeded, signed_up_user, amount):
        r = api.post(
            "/offers",
            json={
                "listingId": seeded["civic"]["id"],
                "buyerId": signed_up_user.user_id,
                "amountCents": amount,
                "currency": "MXN",
            },
        )
        assert r.status_code == 400


class TestRespondToOffer:
    @pytest.fixture()
    def existing_offer(self, api, seeded, signed_up_user):
        r = api.post(
            "/offers",
            json={
                "listingId": seeded["civic"]["id"],
                "buyerId": signed_up_user.user_id,
                "amountCents": 27_000_00,
                "currency": "MXN",
            },
        )
        assert r.ok
        return r.json()

    def test_accept_transitions_to_accepted(self, api, existing_offer):
        r = api.patch(f"/offers/{existing_offer['id']}", json={"decision": "accepted"})
        assert r.ok, r.text
        assert r.json()["status"] == "accepted"

    def test_reject_transitions_to_rejected(self, api, existing_offer):
        r = api.patch(f"/offers/{existing_offer['id']}", json={"decision": "rejected"})
        assert r.ok, r.text
        assert r.json()["status"] == "rejected"

    def test_counter_updates_amount(self, api, existing_offer):
        r = api.patch(
            f"/offers/{existing_offer['id']}",
            json={"decision": "countered", "counterAmountCents": 28_000_00},
        )
        assert r.ok, r.text
        body = r.json()
        assert body["status"] == "countered"
        assert body["amountCents"] == 28_000_00
