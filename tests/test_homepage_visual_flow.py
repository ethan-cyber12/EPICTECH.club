import re
import unittest

from tests.site_contracts import read_text


HOME_SERVICE_LINKS = {
    "services/infrastructure.html": "Network & Wi-Fi",
    "services/firewalls.html": "Firewalls & Cybersecurity",
    "services/webhosting.html": "Websites",
    "services/ecommerce.html": "E-Commerce",
    "services/app-building.html": "Business Apps & Dashboards",
    "services/automation.html": "Automation",
    "services/software.html": "Forms & Internal Tools",
    "services/virtualization.html": "Virtualization Labs",
}

GENERATED_HOME_BASENAMES = {
    "epic-hero-connected-workshop",
    "epic-service-firewalls-security",
    "epic-service-websites",
    "epic-service-automation",
    "epic-service-virtualization",
}

UNUSED_HOME_BASENAMES = {
    "epic-service-network-wifi",
    "epic-service-business-apps",
    "epic-service-ecommerce",
    "epic-service-internal-tools",
}


class HomepageVisualFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = read_text("index.html")

    def test_approved_hero_and_trust_copy_exist(self) -> None:
        self.assertIn("Veteran owned. Family operated. Central Florida based.", self.html)
        self.assertIn("Small business IT: secure networks, websites, and custom tools", self.html)
        self.assertIn('class="visual-hero"', self.html)
        self.assertIn('fetchpriority="high"', self.html)
        for commitment in (
            "Security built in from the start",
            "Written scope and pricing before work begins",
            "Documentation included with every project",
            "Direct, accountable support",
        ):
            self.assertIn(commitment, self.html)

    def test_exactly_four_grouped_chapters_expose_eight_links(self) -> None:
        self.assertEqual(len(re.findall(r'<article class="service-chapter"', self.html)), 4)
        self.assertEqual(len(re.findall(r'class="service-destination"', self.html)), 8)
        for heading in (
            "Networks &amp; Security",
            "Websites &amp; E-Commerce",
            "Apps, Automation &amp; Internal Tools",
            "Virtualization Labs",
        ):
            self.assertIn(heading, self.html)
        for href, label in HOME_SERVICE_LINKS.items():
            with self.subTest(href=href):
                pattern = rf'<a[^>]+class="service-destination"[^>]+href="{re.escape(href)}"[^>]*>'
                reverse = rf'<a[^>]+href="{re.escape(href)}"[^>]+class="service-destination"[^>]*>'
                self.assertRegex(self.html, f"(?:{pattern}|{reverse})")
                self.assertIn(label, self.html)

    def test_homepage_uses_only_five_service_visual_placements(self) -> None:
        self.assertEqual(self.html.count('class="visual-hero__visual"'), 1)
        self.assertEqual(self.html.count('class="service-chapter__visual"'), 4)
        self.assertNotIn("epic-detail-", self.html)
        for basename in GENERATED_HOME_BASENAMES:
            self.assertIn(basename, self.html)
        for basename in UNUSED_HOME_BASENAMES:
            self.assertNotIn(basename, self.html)

    def test_websites_and_ecommerce_use_a_responsive_browser_visual(self) -> None:
        chapter = re.search(r'<article class="service-chapter" id="websites-commerce">(.*?)</article>', self.html, re.DOTALL)
        self.assertIsNotNone(chapter)
        markup = chapter.group(1)
        self.assertIn('class="service-chapter__visual"', markup)
        self.assertNotIn('data-media-source=', markup)
        self.assertIn("epic-service-websites-640.avif", markup)
        self.assertIn("epic-service-websites-1200.webp", markup)
        self.assertIn("epic-service-websites-1920.webp", markup)
        self.assertIn("<img", markup)

    def test_founder_proof_process_and_close_use_real_evidence(self) -> None:
        self.assertIn('class="founder-bridge"', self.html)
        self.assertIn('href="founder.html"', self.html)
        self.assertIn("Technology should leave people better equipped.", self.html)
        self.assertIn('data-media-source="founder-photo"', self.html)
        self.assertIn("ethan-platt-graduation-close-1200.jpg", self.html)
        self.assertEqual(self.html.count('data-media-source="pdf-preview"'), 3)
        self.assertIn('class="proof-triptych"', self.html)
        self.assertIn('class="process-timeline"', self.html)
        for stem in (
            "epic-cloud-security-automation",
            "epic-disa-stig-hardening",
            "epic-network-infrastructure",
        ):
            self.assertIn(f"{stem}-first-page-800.webp", self.html)
            self.assertIn(f"{stem}-public-sample.pdf", self.html)

    def test_repeated_service_card_grid_is_removed(self) -> None:
        self.assertNotIn("service-cards", self.html)
        self.assertNotIn("service-chapter__link", self.html)


if __name__ == "__main__":
    unittest.main()
