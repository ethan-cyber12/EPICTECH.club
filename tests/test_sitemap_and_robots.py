from __future__ import annotations

import json
import unittest
import xml.etree.ElementTree as ET

from tests.site_contracts import (
    ROOT,
    canonical_href,
    html_files,
    main_inner,
    read_text,
    sha256_text,
)


SITEMAP_NAMESPACE = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
UPDATED = "2026-09-02"

ORDERED_CANONICALS = (
    "https://epictech.club/",
    "https://epictech.club/about.html",
    "https://epictech.club/founder.html",
    "https://epictech.club/pricing.html",
    "https://epictech.club/contact.html",
    "https://epictech.club/reviews.html",
    "https://epictech.club/privacy.html",
    "https://epictech.club/services/",
    "https://epictech.club/services/app-building.html",
    "https://epictech.club/services/automation.html",
    "https://epictech.club/services/ecommerce.html",
    "https://epictech.club/services/firewalls.html",
    "https://epictech.club/services/infrastructure.html",
    "https://epictech.club/services/software.html",
    "https://epictech.club/services/virtualization.html",
    "https://epictech.club/services/webhosting.html",
    "https://epictech.club/case-studies/",
    "https://epictech.club/case-studies/cloud-security-automation.html",
    "https://epictech.club/case-studies/cybersecurity-compliance.html",
    "https://epictech.club/case-studies/disa-stig-hardening.html",
    "https://epictech.club/case-studies/managed-it-patch-management.html",
    "https://epictech.club/case-studies/network-infrastructure.html",
    "https://epictech.club/case-studies/secure-web-and-sdlc.html",
    "https://epictech.club/case-studies/vulnerability-remediation.html",
    "https://epictech.club/case-studies/zero-trust-access-control.html",
)

SEARCH_AND_ANSWER_AGENTS = (
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
    "Googlebot",
    "bingbot",
)

TRAINING_AGENTS = ("GPTBot", "ClaudeBot", "Google-Extended")

OPTION_A_ROBOTS = """User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Googlebot
Allow: /

User-agent: bingbot
Allow: /

User-agent: *
Allow: /

Sitemap: https://epictech.club/sitemap.xml
"""


def sitemap_entries() -> list[tuple[str, str]]:
    tree = ET.parse(ROOT / "sitemap.xml")
    entries = []
    for node in tree.findall("s:url", SITEMAP_NAMESPACE):
        loc = node.findtext("s:loc", namespaces=SITEMAP_NAMESPACE)
        lastmod = node.findtext("s:lastmod", namespaces=SITEMAP_NAMESPACE)
        if loc is None or lastmod is None:
            raise AssertionError("every sitemap entry needs loc and lastmod")
        entries.append((loc, lastmod))
    return entries


class SitemapAndRobotsTests(unittest.TestCase):
    def test_sitemap_exactly_matches_all_self_canonical_html_pages(self) -> None:
        expected_from_html = [canonical_href(path) for path in html_files()]
        entries = sitemap_entries()
        locations = [location for location, _lastmod in entries]

        self.assertEqual(len(expected_from_html), 25)
        self.assertEqual(len(set(expected_from_html)), 25)
        self.assertEqual(len(locations), 25)
        self.assertEqual(len(set(locations)), 25)
        self.assertEqual(set(locations), set(expected_from_html))
        self.assertEqual(tuple(locations), ORDERED_CANONICALS)

    def test_sitemap_has_current_substantive_dates_and_no_deprecated_fields(self) -> None:
        entries = sitemap_entries()
        expected_lastmods = {location: UPDATED for location in ORDERED_CANONICALS}
        self.assertEqual(dict(entries), expected_lastmods)
        self.assertEqual(sum(lastmod == UPDATED for _loc, lastmod in entries), 25)

        source = read_text("sitemap.xml")
        self.assertNotIn("<changefreq>", source)
        self.assertNotIn("<priority>", source)
        self.assertNotIn("/index.html", source)
        self.assertNotIn(".pdf", source.lower())

    def test_robots_is_the_exact_open_option_a_policy(self) -> None:
        robots = read_text("robots.txt")
        self.assertEqual(robots, OPTION_A_ROBOTS)
        for agent in SEARCH_AND_ANSWER_AGENTS:
            self.assertIn(f"User-agent: {agent}\nAllow: /", robots)
        self.assertIn("User-agent: *\nAllow: /", robots)
        self.assertIn("Sitemap: https://epictech.club/sitemap.xml", robots)
        self.assertNotIn("Disallow:", robots)
        for agent in TRAINING_AGENTS:
            self.assertNotIn(f"User-agent: {agent}\nDisallow: /", robots)

    def test_policy_records_the_owner_choice_and_operational_caveats(self) -> None:
        policy_path = ROOT / "docs/crawler-policy.md"
        self.assertTrue(policy_path.exists(), "crawler policy decision record is missing")
        policy = policy_path.read_text(encoding="utf-8")
        for statement in (
            "Training-crawler policy: allow",
            "Decision date: 2026-09-02",
            "Search and answer retrieval: allow",
            "maximum AI crawlability",
            "preserves the existing wildcard-allow posture",
            "not a new data-access grant",
            "robots.txt is a preference for compliant crawlers, not access control",
            "User-triggered agents may handle robots.txt differently",
            "AI Crawl Control",
            "WAF",
            "verified-bot",
            "must be audited separately before live rollout",
            "September 15, 2026",
        ):
            with self.subTest(statement=statement):
                self.assertIn(statement, policy)

        self.assertNotIn("Training-crawler policy: block", policy)
        for agent in TRAINING_AGENTS:
            self.assertIn(agent, policy)
        for official_url in (
            "https://developers.openai.com/api/docs/bots",
            "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
            "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
            "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
            "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/",
        ):
            self.assertIn(official_url, policy)

    def test_contact_reviews_and_behavior_scripts_keep_their_protected_hashes(self) -> None:
        baselines = json.loads(
            (ROOT / "tests/fixtures/contact_reviews_regression.json").read_text(encoding="utf-8")
        )
        for page, expected_hash in baselines["main_inner_sha256"].items():
            with self.subTest(page=page):
                self.assertEqual(sha256_text(main_inner(page)), expected_hash)
        for script, expected_hash in baselines["script_sha256"].items():
            with self.subTest(script=script):
                self.assertEqual(sha256_text(read_text(script)), expected_hash)


if __name__ == "__main__":
    unittest.main()
