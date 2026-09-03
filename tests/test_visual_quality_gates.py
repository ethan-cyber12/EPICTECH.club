from __future__ import annotations

import re
import unittest

from tests.site_contracts import ROOT, html_files, local_target, read_text


PAGES = tuple(path.relative_to(ROOT).as_posix() for path in html_files())

SERVICE_BASES = (
    "epic-service-network-wifi",
    "epic-service-firewalls-security",
    "epic-service-websites",
    "epic-service-business-apps",
    "epic-service-automation",
    "epic-service-ecommerce",
    "epic-service-virtualization",
    "epic-service-internal-tools",
    "epic-detail-network-wifi",
    "epic-detail-firewalls-security",
    "epic-detail-websites",
    "epic-detail-business-apps",
    "epic-detail-automation",
    "epic-detail-ecommerce",
    "epic-detail-virtualization",
    "epic-detail-internal-tools",
)

CASE_PREVIEWS = (
    "epic-cloud-security-automation-first-page-800.webp",
    "epic-disa-stig-hardening-first-page-800.webp",
    "epic-network-infrastructure-first-page-800.webp",
)


class VisualQualityGateTests(unittest.TestCase):
    def test_landmarks_heading_and_navigation_contract(self) -> None:
        for page in PAGES:
            html = read_text(page)
            with self.subTest(page=page):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertEqual(len(re.findall(r"<h1\b", html, re.IGNORECASE)), 1)
                self.assertIn('aria-label="Primary navigation"', html)
                self.assertIn('aria-controls="nav-links"', html)

    def test_every_img_has_alt_width_and_height(self) -> None:
        for page in PAGES:
            for tag in re.findall(r"<img\b[^>]*>", read_text(page), re.IGNORECASE):
                with self.subTest(page=page, tag=tag):
                    self.assertRegex(tag, r'\balt="[^"]*"')
                    self.assertRegex(tag, r'\bwidth="\d+"')
                    self.assertRegex(tag, r'\bheight="\d+"')

    def test_same_page_fragments_resolve(self) -> None:
        for page in PAGES:
            html = read_text(page)
            ids = set(re.findall(r'\bid="([^"]+)"', html))
            fragments = set(re.findall(r'href="#([^"]+)"', html))
            with self.subTest(page=page):
                self.assertTrue(fragments.issubset(ids), sorted(fragments - ids))

    def test_local_html_destinations_exist(self) -> None:
        for page in PAGES:
            page_path = ROOT / page
            html = read_text(page)
            for href in re.findall(r'href="([^"]+)"', html):
                resolved = local_target(page_path, href)
                if resolved is None:
                    continue
                target, _fragment = resolved
                with self.subTest(page=page, href=href):
                    self.assertTrue(target.exists(), f"missing destination: {href}")

    def test_only_approved_remote_script_origin_exists(self) -> None:
        for page in PAGES:
            remote_scripts = re.findall(r'<script[^>]+src="(https?://[^"]+)"', read_text(page))
            with self.subTest(page=page):
                if page in ("contact.html", "reviews.html"):
                    self.assertEqual(remote_scripts, ["https://challenges.cloudflare.com/turnstile/v0/api.js"])
                else:
                    self.assertEqual(remote_scripts, [])

    def test_homepage_media_hierarchy_and_loading_contract(self) -> None:
        home = read_text("index.html")
        self.assertEqual(home.count('<picture'), 6)
        self.assertEqual(home.count('data-media-source="founder-photo"'), 1)
        self.assertEqual(home.count('data-media-source="pdf-preview"'), 3)
        self.assertEqual(home.count('data-media-source="code-native"'), 0)
        self.assertEqual(home.count('fetchpriority="high"'), 1)
        self.assertEqual(len(re.findall(r'<article class="service-chapter"', home)), 4)
        self.assertEqual(len(re.findall(r'class="service-destination"', home)), 8)

    def test_preview_builder_is_local_only(self) -> None:
        builder = read_text("scripts/build-case-study-previews.mjs")
        self.assertNotRegex(builder, r"https?://")
        for forbidden in ("fetch(", "xmlhttprequest", "google", "lens", "upload"):
            self.assertNotIn(forbidden, builder.lower())

    def test_required_visual_assets_exist_and_meet_byte_budgets(self) -> None:
        hero = ROOT / "assets/images/service-visuals/epic-hero-connected-workshop-1920.avif"
        self.assertTrue(hero.exists())
        self.assertLessEqual(hero.stat().st_size, 250 * 1024)
        for base in SERVICE_BASES:
            for width, budget_kib in ((640, 90), (1200, 140), (1920, 160)):
                for extension in ("avif", "webp"):
                    path = ROOT / f"assets/images/service-visuals/{base}-{width}.{extension}"
                    with self.subTest(path=str(path)):
                        self.assertTrue(path.exists())
                        self.assertLessEqual(path.stat().st_size, budget_kib * 1024)
        for path in (
            ROOT / "assets/images/founder/ethan-platt-graduation-close-640.avif",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-640.webp",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.avif",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.webp",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.jpg",
        ):
            with self.subTest(path=str(path)):
                self.assertTrue(path.exists())
        for name in CASE_PREVIEWS:
            path = ROOT / "assets/images/case-studies" / name
            with self.subTest(path=str(path)):
                self.assertTrue(path.exists())
                self.assertLessEqual(path.stat().st_size, 120 * 1024)


if __name__ == "__main__":
    unittest.main()
