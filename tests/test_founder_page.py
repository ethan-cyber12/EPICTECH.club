import re
import unittest

from tests.site_contracts import read_text


class FounderPageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.html = read_text("founder.html")

    def test_founder_page_has_approved_identity_and_one_h1(self) -> None:
        self.assertEqual(len(re.findall(r"<h1\b", self.html, re.IGNORECASE)), 1)
        self.assertIn("Technology should make work easier to understand and easier to do.", self.html)
        self.assertIn("A veteran founder focused on building clear, practical solutions.", self.html)
        self.assertIn('rel="canonical" href="https://epictech.club/founder.html"', self.html)

    def test_approved_facts_and_principles_are_visible(self) -> None:
        for text in (
            "former United States Marine",
            "communications and transmission systems",
            "B.S. in Information Technology",
            "B.S. in Cybersecurity",
            "valedictorian",
            "Advanced Achievement Award recipient",
            "Start with the problem",
            "Choose what fits",
            "Build security in",
            "Document the handoff",
        ):
            self.assertIn(text, self.html)

    def test_founder_portrait_is_responsive_and_informative(self) -> None:
        self.assertEqual(self.html.count('data-media-source="founder-photo"'), 1)
        self.assertNotIn('data-media-source="generated"', self.html)
        self.assertIn("ethan-platt-graduation-close-640.avif", self.html)
        self.assertIn("ethan-platt-graduation-close-1200.webp", self.html)
        self.assertIn('width="1200" height="1500"', self.html)
        self.assertIn('alt="Ethan Platt at his graduation ceremony"', self.html)

    def test_sensitive_details_are_absent(self) -> None:
        for forbidden in (
            "GPA",
            "security clearance",
            "student identifier",
            "home address",
            "personal telephone",
            "private email",
        ):
            self.assertNotIn(forbidden, self.html)

    def test_security_and_navigation_remain_self_hosted(self) -> None:
        self.assertIn("default-src 'self'", self.html)
        self.assertIn("script-src 'self'", self.html)
        self.assertNotIn("unsafe-inline", self.html)
        self.assertNotIn("unsafe-eval", self.html)
        self.assertIn('src="assets/js/main.js"', self.html)
        self.assertIn('href="contact.html"', self.html)


if __name__ == "__main__":
    unittest.main()
