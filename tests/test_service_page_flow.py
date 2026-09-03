import re
import unittest
from html import unescape

from tests.site_contracts import read_text


SERVICE_PAGES = {
    "services/app-building.html": ("Business Apps & Internal Dashboards", "epic-service-business-apps", ("Solutions we build", "App development pricing", "What this is good for", "What can be built", "How the process works", "What we do not overbuild", "Start with a plan")),
    "services/automation.html": ("Small automation that saves time and reduces mistakes", "epic-service-automation", ("Packages", "What is included", "Featured Case Study")),
    "services/ecommerce.html": ("Professional online stores built to generate sales", "epic-service-ecommerce", ("Packages", "Ongoing Store Care", "What's Included", "Why E-Commerce Matters")),
    "services/firewalls.html": ("Firewall and network security for small businesses", "epic-service-firewalls-security", ("Packages", "What is included", "Related Security Case Studies")),
    "services/infrastructure.html": ("Clean Wi-Fi and network setups that make sense", "epic-service-network-wifi", ("Packages", "What is included", "Featured Case Study")),
    "services/software.html": ("Lightweight tools for real business problems", "epic-service-internal-tools", ("Packages", "What is included")),
    "services/virtualization.html": ("Safe test labs for learning, demos, and small internal systems", "epic-service-virtualization", ("Packages", "What is included")),
    "services/webhosting.html": ("Business websites and online stores that are fast, secure, and built to grow", "epic-service-websites", ("Packages", "Selling online", "What is included", "Featured Case Study")),
}


class ServicePageFlowTests(unittest.TestCase):
    def test_each_page_has_landmarks_breadcrumb_and_visual_hero(self) -> None:
        for path, (h1, image, headings) in SERVICE_PAGES.items():
            html = read_text(path)
            with self.subTest(path=path):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertIn('aria-label="Breadcrumb"', html)
                self.assertIn('class="service-hero"', html)
                self.assertIn(f"{image}-1200.avif", html)
                self.assertIn(h1, unescape(html))
                self.assertEqual(len(re.findall(r"<h1\b", html, re.IGNORECASE)), 1)
                for heading in headings:
                    self.assertIn(heading, html)

    def test_existing_commercial_and_proof_destinations_remain(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            with self.subTest(path=path):
                self.assertIn('href="../contact.html"', html)
        self.assertIn("epic-cloud-security-automation-public-sample.pdf", read_text("services/automation.html"))
        self.assertIn("epic-network-infrastructure-public-sample.pdf", read_text("services/infrastructure.html"))
        self.assertIn("epic-secure-web-and-sdlc-public-sample.pdf", read_text("services/webhosting.html"))
        self.assertIn("epic-zero-trust-access-control-public-sample.pdf", read_text("services/firewalls.html"))

    def test_every_same_page_fragment_resolves(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            ids = set(re.findall(r'\bid="([^"]+)"', html))
            fragments = re.findall(r'href="#([^"]+)"', html)
            with self.subTest(path=path):
                self.assertTrue(set(fragments).issubset(ids), sorted(set(fragments) - ids))

    def test_service_art_is_lcp_prioritized_decorative_and_sized(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            with self.subTest(path=path):
                hero_image = re.search(r'<picture class="service-hero__visual">(.*?)</picture>', html, re.DOTALL)
                self.assertIsNotNone(hero_image)
                markup = hero_image.group(1)
                self.assertIn('width="1200" height="750"', markup)
                self.assertIn('alt=""', markup)
                self.assertIn('loading="eager"', markup)
                self.assertIn('fetchpriority="high"', markup)
                self.assertIn('decoding="async"', markup)


if __name__ == "__main__":
    unittest.main()
