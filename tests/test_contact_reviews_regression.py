import json
import unittest

from tests.site_contracts import ROOT, main_inner, read_text, sha256_text


class ContactReviewsRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        fixture_path = ROOT / "tests/fixtures/contact_reviews_regression.json"
        cls.baselines = json.loads(fixture_path.read_text(encoding="utf-8"))

    def test_page_specific_main_markup_is_unchanged(self) -> None:
        for page, expected_hash in self.baselines["main_inner_sha256"].items():
            with self.subTest(page=page):
                self.assertEqual(sha256_text(main_inner(page)), expected_hash)

    def test_behavior_scripts_are_unchanged(self) -> None:
        for script, expected_hash in self.baselines["script_sha256"].items():
            with self.subTest(script=script):
                self.assertEqual(sha256_text(read_text(script)), expected_hash)

    def test_sensitive_endpoints_and_integrations_remain_present(self) -> None:
        contact = read_text("contact.html")
        reviews = read_text("reviews.html")
        self.assertIn('data-endpoint="https://intake.epictech.club/lead-intake"', contact)
        self.assertIn('href="https://wa.me/message/GO4FEQZBZN3VG1"', contact)
        self.assertIn('data-endpoint="https://intake.epictech.club/review-intake"', reviews)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', contact)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', reviews)
        self.assertIn('src="assets/js/qualification.js"', contact)
        self.assertIn('src="assets/js/reviews.js"', reviews)

    def test_shared_shell_accessibility_contract(self) -> None:
        for page in ("contact.html", "reviews.html"):
            html = read_text(page)
            with self.subTest(page=page):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertIn('aria-controls="nav-links"', html)
                self.assertIn('id="nav-links" aria-label="Primary navigation"', html)
                self.assertIn('aria-label="EPIC TECH home"', html)
                self.assertIn('width="787" height="904"', html)


if __name__ == "__main__":
    unittest.main()
