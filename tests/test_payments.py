"""The MVP payment providers are stubs that return fake redirect URLs.
These tests assert the contract holds — once real Stripe/MP SDKs land,
the same tests should keep passing modulo network mocking.
"""
import pytest

from conftest import make_listing_payload  # type: ignore[import-not-found]


@pytest.fixture()
def order_id(api, seeded, signed_up_user):
    """Make a tiny published listing, then mint an order on it via a SQL-free side door.

    NestJS' `OrdersService.createFromListing` is internal — there's no public
    POST endpoint in the MVP. We seed an order indirectly by hitting Prisma
    via the API process: create a listing, accept an offer (offer flow does
    not auto-create an order in v1). So instead we fetch an order id from the
    listing seller's prior orders — none exist on a clean DB. Therefore we
    *skip* tests that require a real order id, and assert the 404 behavior
    of the order endpoint instead.

    When `POST /v1/orders` ships, replace this fixture with a real creator.
    """
    return None


class TestCheckoutSession:
    @pytest.mark.parametrize("provider", ["stripe", "mercadopago"])
    def test_returns_404_for_unknown_order(self, api, provider):
        r = api.post(
            "/checkout/sessions",
            json={
                "orderId": "does-not-exist",
                "provider": provider,
                "returnUrl": "https://compralo.test/return",
            },
        )
        assert r.status_code == 404, f"{provider} should 404 on missing order"

    def test_validation_rejects_missing_fields(self, api):
        r = api.post("/checkout/sessions", json={"provider": "stripe"})
        assert r.status_code == 400


class TestWebhook:
    def test_unknown_provider_ref_is_acknowledged_silently(self, api):
        """The webhook is designed to be idempotent — unknown providerRefs are no-ops."""
        r = api.post(
            "/webhooks/payments/stripe",
            json={"id": "pi_does_not_exist", "data": {"object": {"amount": 1000, "currency": "usd"}}},
        )
        assert r.ok, r.text
        body = r.json()
        assert body.get("ok") is True


class TestOrdersFetch:
    def test_unknown_order_returns_404(self, api):
        r = api.get("/orders/does-not-exist")
        assert r.status_code == 404
