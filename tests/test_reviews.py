import pytest


class TestCreateReview:
    def test_review_persisted(self, api, seeded, signed_up_user):
        r = api.post(
            "/reviews",
            json={
                "listingId": seeded["civic"]["id"],
                "authorId": signed_up_user.user_id,
                "subjectId": seeded["demo_seller_id"],
                "rating": 5,
                "body": "Great seller, smooth transaction.",
            },
        )
        assert r.ok, r.text
        body = r.json()
        assert body["rating"] == 5

    @pytest.mark.parametrize("rating", [0, 6, -1, 10])
    def test_rating_must_be_1_through_5(self, api, seeded, signed_up_user, rating):
        r = api.post(
            "/reviews",
            json={
                "listingId": seeded["civic"]["id"],
                "authorId": signed_up_user.user_id,
                "subjectId": seeded["demo_seller_id"],
                "rating": rating,
            },
        )
        assert r.status_code == 400, f"expected 400 for rating={rating}"


class TestSubjectAverage:
    def test_user_average_updates_after_review(self, api, seeded, signed_up_user):
        # Snapshot the seller's rating before…
        before = api.get(f"/users/{seeded['demo_seller_id']}").json()
        # …leave a review…
        api.post(
            "/reviews",
            json={
                "listingId": seeded["iphone"]["id"],
                "authorId": signed_up_user.user_id,
                "subjectId": seeded["demo_seller_id"],
                "rating": 4,
            },
        )
        # …and confirm aggregates moved.
        after = api.get(f"/users/{seeded['demo_seller_id']}").json()
        assert after["ratingCount"] > before["ratingCount"], "ratingCount did not increment"
        assert after["ratingAvg"] > 0, "ratingAvg should be > 0 after a review"


class TestListReviews:
    def test_list_by_user_returns_array(self, api, seeded):
        r = api.get(f"/reviews/user/{seeded['demo_seller_id']}")
        assert r.ok, r.text
        assert isinstance(r.json(), list)
