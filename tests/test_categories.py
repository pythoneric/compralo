import pytest


class TestCategories:
    @pytest.fixture(scope="class")
    def categories(self, api_url):
        import requests
        return requests.get(f"{api_url}/categories", timeout=5).json()

    def test_returns_list(self, categories):
        assert isinstance(categories, list)
        assert len(categories) >= 5, "expected at least 5 seeded categories"

    def test_bilingual_labels_present(self, categories):
        for c in categories:
            assert c["nameEn"], f"category {c['id']} missing English name"
            assert c["nameEs"], f"category {c['id']} missing Spanish name"
            assert c["slugEn"] and c["slugEs"], f"category {c['id']} missing slugs"

    def test_vehicles_category_flagged(self, categories):
        vehicles = next((c for c in categories if c["id"] == "cat.vehicles"), None)
        assert vehicles, "cat.vehicles missing from taxonomy"
        assert vehicles["isVehicle"] is True

    def test_localized_slugs_differ(self, categories):
        vehicles = next(c for c in categories if c["id"] == "cat.vehicles")
        assert vehicles["slugEn"] == "vehicles"
        assert vehicles["slugEs"] == "vehiculos"

    def test_hierarchy_present(self, categories):
        ids = {c["id"] for c in categories}
        assert "cat.vehicles" in ids
        assert "cat.vehicles.cars" in ids
        assert "cat.vehicles.cars.sedan" in ids
        sedan = next(c for c in categories if c["id"] == "cat.vehicles.cars.sedan")
        assert sedan["parentId"] == "cat.vehicles.cars"
        assert sedan["isLeaf"] is True
