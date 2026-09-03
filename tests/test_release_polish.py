from __future__ import annotations

import re
import unittest

from tests.site_contracts import html_files, read_text


CASE_STUDIES = (
    "case-studies/index.html",
    "case-studies/cloud-security-automation.html",
    "case-studies/cybersecurity-compliance.html",
    "case-studies/disa-stig-hardening.html",
    "case-studies/managed-it-patch-management.html",
    "case-studies/network-infrastructure.html",
    "case-studies/secure-web-and-sdlc.html",
    "case-studies/vulnerability-remediation.html",
    "case-studies/zero-trust-access-control.html",
)

DETAIL_CASE_STUDIES = CASE_STUDIES[1:]
SOCIAL_IMAGE = "https://epictech.club/assets/images/social/epic-tech-home-og-1200x630.jpg"


class ReleasePolishTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.css = read_text("assets/css/styles.css")
        cls.pricing = read_text("pricing.html")

    def test_interactive_boundaries_use_contrasting_approved_neutral(self) -> None:
        compact = re.sub(r"\s+", "", self.css)
        self.assertIn(
            ".fieldinput,.fieldtextarea,.fieldselect{border:1pxsolidvar(--muted)",
            compact,
        )
        self.assertRegex(
            compact,
            r"\.star-inputlabel\{[^}]*color:var\(--muted\)",
        )
        self.assertIn(".menu-btn,.btn-secondary{border-color:var(--muted)}", compact)

    def test_mobile_menu_is_anchored_below_the_header(self) -> None:
        compact = re.sub(r"\s+", "", self.css)
        mobile = compact.split("@media(max-width:920px)", 1)[1]
        self.assertRegex(mobile, r"\.nav-links\{[^}]*top:100%")
        self.assertNotRegex(mobile, r"\.nav-links\{[^}]*top:70px")

    def test_scoped_link_affordances_do_not_target_navigation_or_buttons(self) -> None:
        for selector in (
            ".case-study-body a:not(.btn)",
            ".proof-triptych article > a",
            ".inline-link",
        ):
            self.assertIn(selector, self.css)
        self.assertIn("text-decoration: underline", self.css)
        self.assertIn(
            '<a class="inline-link" href="services/app-building.html">',
            self.pricing,
        )

    def test_pricing_heading_levels_do_not_skip_from_h1_to_h3(self) -> None:
        levels = [
            int(match)
            for match in re.findall(r"<h([1-6])\b", self.pricing, re.IGNORECASE)
        ]
        self.assertTrue(levels)
        for current, following in zip(levels, levels[1:]):
            self.assertLessEqual(following - current, 1)
        self.assertIn(
            '<h2 class="visually-hidden">Core project packages</h2>',
            self.pricing,
        )
        self.assertIn(
            '<h2 class="visually-hidden">E-commerce packages</h2>',
            self.pricing,
        )

    def test_every_case_study_has_canonical_aligned_social_metadata(self) -> None:
        for path in CASE_STUDIES:
            html = read_text(path)
            expected_url = (
                "https://epictech.club/case-studies/"
                if path.endswith("/index.html")
                else f"https://epictech.club/{path}"
            )
            title = re.search(r"<title>(.*?)</title>", html, re.DOTALL)
            description = re.search(
                r'<meta name="description" content="([^"]+)">',
                html,
            )
            canonical = re.search(r'<link rel="canonical" href="([^"]+)">', html)
            with self.subTest(path=path):
                self.assertIsNotNone(title)
                self.assertIsNotNone(description)
                self.assertIsNotNone(canonical)
                self.assertEqual(canonical.group(1), expected_url)
                self.assertIn(
                    f'<meta property="og:title" content="{title.group(1)}">',
                    html,
                )
                self.assertIn(
                    f'<meta property="og:description" content="{description.group(1)}">',
                    html,
                )
                self.assertIn(
                    f'<meta property="og:url" content="{canonical.group(1)}">',
                    html,
                )
                self.assertIn(f'<meta property="og:image" content="{SOCIAL_IMAGE}">', html)
                self.assertIn('<meta property="og:image:width" content="1200">', html)
                self.assertIn('<meta property="og:image:height" content="630">', html)
                self.assertIn('<meta property="og:image:type" content="image/jpeg">', html)
                self.assertIn('<meta name="twitter:card" content="summary_large_image">', html)
                self.assertIn(
                    f'<meta name="twitter:title" content="{title.group(1)}">',
                    html,
                )
                self.assertIn(
                    f'<meta name="twitter:description" content="{description.group(1)}">',
                    html,
                )
                self.assertIn(f'<meta name="twitter:image" content="{SOCIAL_IMAGE}">', html)

    def test_detail_case_study_hero_is_lcp_prioritized(self) -> None:
        for path in DETAIL_CASE_STUDIES:
            html = read_text(path)
            hero = re.search(
                r'<picture class="case-study-hero__visual".*?</picture>',
                html,
                re.DOTALL,
            )
            with self.subTest(path=path):
                self.assertIsNotNone(hero)
                self.assertEqual(hero.group(0).count('fetchpriority="high"'), 1)

    def test_every_public_page_declares_a_resolvable_favicon(self) -> None:
        for path in html_files():
            html = read_text(path)
            favicon = re.findall(
                r'<link rel="icon" type="image/webp" href="([^"]+)">',
                html,
            )
            with self.subTest(path=path):
                self.assertEqual(len(favicon), 1)
                self.assertTrue((path.parent / favicon[0]).resolve().is_file())


if __name__ == "__main__":
    unittest.main()
