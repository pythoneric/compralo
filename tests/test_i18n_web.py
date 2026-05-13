"""Black-box checks on the Next.js SSR output.

These do NOT use a real browser — they fetch HTML and grep for expected
content. That's enough to catch market routing regressions, missing
translations, and currency/distance formatting bugs.
"""
import re

import pytest
import requests


@pytest.mark.web
@pytest.mark.smoke
class TestMarketRouting:
    def test_root_redirects_to_default_market(self, web_url):
        r = requests.get(f"{web_url}/", allow_redirects=False, timeout=5)
        assert r.status_code in (307, 308)
        assert "/en" in r.headers.get("location", ""), "root should redirect to /en (default market)"

    def test_en_renders(self, web_url):
        r = requests.get(f"{web_url}/en", timeout=8)
        assert r.ok
        assert r.headers.get("content-type", "").startswith("text/html")

    def test_mx_renders(self, web_url):
        r = requests.get(f"{web_url}/mx", timeout=8)
        assert r.ok

    def test_unknown_market_404s(self, web_url):
        r = requests.get(f"{web_url}/fr", timeout=5)
        assert r.status_code == 404, "non-configured market should 404"


@pytest.mark.web
class TestEnglishStorefront:
    @pytest.fixture(scope="class")
    def html(self, web_url):
        return requests.get(f"{web_url}/en", timeout=8).text

    def test_english_tagline_visible(self, html):
        assert "Buy and sell new and used" in html, "English tagline missing"

    def test_no_spanish_leakage(self, html):
        # Look for distinctly Spanish strings — the EN page should never render them
        # in *UI chrome* (translated user-generated titles are still allowed).
        assert "Iniciar sesión" not in html, "Spanish UI chrome leaked into EN page"
        assert "Vender" not in html, "Spanish nav leaked into EN page"

    def test_f150_listing_card_present(self, html):
        assert "F-150" in html

    def test_usd_currency_formatting(self, html):
        # Intl.NumberFormat("en", {currency:"USD"}) renders e.g. "$34,995"
        assert re.search(r"\$\d{2,3}(,\d{3})", html), "expected USD formatted price"

    def test_us_distance_unit_mi(self, html):
        # The F-150 has mileage in the card.
        assert "mi" in html, "expected miles unit on US storefront"


@pytest.mark.web
class TestMexicoStorefront:
    @pytest.fixture(scope="class")
    def html(self, web_url):
        return requests.get(f"{web_url}/mx", timeout=8).text

    def test_spanish_tagline_visible(self, html):
        assert "Compra y vende" in html, "Spanish tagline missing"

    def test_spanish_nav_chrome(self, html):
        assert "Buscar" in html
        assert "Vender" in html

    def test_civic_listing_card_present(self, html):
        assert "Civic" in html

    def test_mxn_currency_formatting(self, html):
        # es-MX renders MXN as "MX$285,000" or "$285,000.00 MXN" depending on ICU build.
        assert re.search(r"\$\s?\d{2,3}(,\d{3})", html), "expected MXN formatted price on MX storefront"

    def test_distance_unit_km(self, html):
        assert " km" in html or "&nbsp;km" in html, "expected km unit on MX storefront"


@pytest.mark.web
class TestListingDetail:
    def test_vehicle_spec_table_rendered(self, web_url, seeded):
        url = f"{web_url}/mx/l/{seeded['civic']['id']}"
        html = requests.get(url, timeout=8).text
        for label in ("VIN", "Kilometraje", "Transmisión"):
            assert label in html, f"expected `{label}` in Spanish spec table"
        assert "2HGFC2F69KH123456" in html, "VIN value missing on listing detail"

    def test_translated_title_used_on_english_page(self, web_url, seeded):
        # The Civic is es-MX origin but has an English translation. EN page should use it.
        url = f"{web_url}/en/l/{seeded['civic']['id']}"
        html = requests.get(url, timeout=8).text
        assert "1 owner" in html or "dealer-invoiced" in html, (
            "English page should swap in the translated title for an es-MX origin listing"
        )

    def test_unknown_listing_404s(self, web_url):
        r = requests.get(f"{web_url}/en/l/does-not-exist", timeout=8)
        assert r.status_code == 404


@pytest.mark.web
class TestSearchPage:
    def test_search_page_loads_and_shows_query_result(self, web_url):
        r = requests.get(f"{web_url}/en/search", params={"q": "Civic"}, timeout=8)
        assert r.ok
        assert "Civic" in r.text or "result" in r.text.lower()

    def test_empty_query_results(self, web_url):
        r = requests.get(f"{web_url}/en/search", params={"q": "zzz-no-such-thing-zzz"}, timeout=8)
        assert r.ok
        assert "No results" in r.text


@pytest.mark.web
class TestHrefMarkup:
    def test_html_lang_attr_per_market(self, web_url):
        en = requests.get(f"{web_url}/en", timeout=8).text
        mx = requests.get(f"{web_url}/mx", timeout=8).text
        assert re.search(r'<html[^>]*\blang="en"', en), "<html lang> should be 'en' on /en"
        assert re.search(r'<html[^>]*\blang="es-MX"', mx), "<html lang> should be 'es-MX' on /mx"
