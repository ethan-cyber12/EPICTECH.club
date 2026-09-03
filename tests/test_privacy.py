from __future__ import annotations

from html import unescape
import json
import re
import unittest

from tests.site_contracts import (
    ROOT,
    canonical_href,
    json_ld_graph,
    main_inner,
    node_by_id,
    read_text,
    sha256_text,
)


CANONICAL = "https://epictech.club/privacy.html"
PAGE_ID = f"{CANONICAL}#webpage"
BREADCRUMB_ID = f"{CANONICAL}#breadcrumb"
WEBSITE_ID = "https://epictech.club/#website"
BUSINESS_ID = "https://epictech.club/#business"
TITLE = "Privacy | EPIC TECH LLC"
DESCRIPTION = (
    "Learn how EPIC TECH LLC handles contact and review submissions, Cloudflare and "
    "Turnstile processing, retention, deletion requests, and external links."
)


def visible_text(markup: str) -> str:
    text = " ".join(unescape(re.sub(r"<[^>]+>", " ", markup)).split())
    return re.sub(r"\s+([.,;:!?])", r"\1", text)


def head_content(source: str, attribute: str, value: str) -> str:
    pattern = (
        rf'<meta\s+[^>]*{re.escape(attribute)}="{re.escape(value)}"[^>]*'
        rf'content="([^"]*)"[^>]*>'
    )
    match = re.search(pattern, source, re.IGNORECASE)
    if match is None:
        raise AssertionError(f"missing {attribute}={value}")
    return unescape(match.group(1))


class PrivacyTests(unittest.TestCase):
    def test_current_site_flows_support_every_disclosed_submission_category(self) -> None:
        contact = read_text("contact.html")
        reviews = read_text("reviews.html")
        main_script = read_text("assets/js/main.js")
        review_script = read_text("assets/js/reviews.js")

        self.assertIn(
            'data-endpoint="https://intake.epictech.club/lead-intake"',
            contact,
        )
        self.assertIn(
            'data-endpoint="https://intake.epictech.club/review-intake"',
            reviews,
        )
        for field in ("name", "email", "business", "phone", "service", "message"):
            self.assertRegex(contact, rf'\bname="{field}"')
            self.assertIn(f"data.get('{field}')", main_script)
        for field in ("name", "email", "rating", "text"):
            self.assertRegex(reviews, rf'\bname="{field}"')
            self.assertIn(f"data.get('{field}')", review_script)

        self.assertIn("Cloudflare Turnstile", main_script)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', contact)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', reviews)
        self.assertIn("fetch(ENDPOINT_BASE + '/reviews'", review_script)
        self.assertIn("once it is approved", review_script)

    def test_notice_describes_current_data_flows_and_purposes(self) -> None:
        notice = visible_text(main_inner("privacy.html"))
        expected_passages = (
            (
                "The contact form sends the information you enter to "
                "intake.epictech.club so EPIC TECH can review your request and reply. "
                "That information can include your name, email address, optional business "
                "name and phone number, the service you select, and your message."
            ),
            (
                "The review form sends your name, email address, rating and review text "
                "to intake.epictech.club for verification and moderation. Your email "
                "address is not displayed publicly. If a review is approved, its name, "
                "rating and review text may be published on the Reviews page."
            ),
            (
                "EPIC TECH uses submissions to respond to requests, assess whether a "
                "service is a fit, prevent abuse, verify reviews, publish approved reviews, "
                "and maintain necessary business records. The site does not use third-party "
                "analytics or advertising trackers."
            ),
            (
                "The website uses Cloudflare for site delivery, the intake service, and "
                "Cloudflare Turnstile. Turnstile processes technical information needed to "
                "distinguish people from automated abuse. Cloudflare acts under its own "
                "privacy terms when it provides those services."
            ),
            (
                "Submission data is kept only as long as reasonably necessary to respond, "
                "operate the intake and review process, prevent abuse, maintain appropriate "
                "business records, and meet legal obligations. To ask about access, "
                "correction or deletion of information you submitted, email "
                "info@epictech.club."
            ),
            (
                "Links to WhatsApp or Google take you to services with their own privacy "
                "practices. Information you provide on those services is handled by the "
                "service you choose to use."
            ),
        )
        for passage in expected_passages:
            with self.subTest(passage=passage[:48]):
                self.assertIn(passage, notice)

        self.assertIn(
            '<a href="mailto:info@epictech.club">info@epictech.club</a>',
            read_text("privacy.html"),
        )

    def test_notice_removes_stale_or_unverified_claims(self) -> None:
        source = read_text("privacy.html").lower()
        for stale_claim in (
            "contact requests open your email client",
            "does not use a database",
            "no server-side form storage",
            "no database",
        ):
            self.assertNotIn(stale_claim, source)
        for unverified_claim in (
            "sell your information",
            "share your information",
            "encrypted",
            "gdpr",
            "ccpa",
            "data residency",
            "stored in the united states",
        ):
            self.assertNotIn(unverified_claim, source)
        self.assertNotRegex(source, r"within\s+\d+\s+(?:days?|weeks?|months?|years?)")

    def test_metadata_is_exact_and_uses_the_existing_logo_convention(self) -> None:
        source = read_text("privacy.html")
        self.assertEqual(canonical_href("privacy.html"), CANONICAL)
        self.assertIn(f"<title>{TITLE}</title>", source)
        self.assertEqual(head_content(source, "name", "description"), DESCRIPTION)
        self.assertEqual(head_content(source, "property", "og:type"), "website")
        self.assertEqual(head_content(source, "property", "og:title"), TITLE)
        self.assertEqual(head_content(source, "property", "og:description"), DESCRIPTION)
        self.assertEqual(head_content(source, "property", "og:url"), CANONICAL)
        self.assertEqual(
            head_content(source, "property", "og:image"),
            "https://epictech.club/assets/images/logo/epic-tech-logo-final.webp",
        )
        self.assertEqual(head_content(source, "property", "og:image:alt"), "EPIC TECH LLC logo")
        self.assertEqual(head_content(source, "property", "og:site_name"), "EPIC TECH LLC")
        self.assertEqual(head_content(source, "name", "twitter:card"), "summary")
        self.assertEqual(head_content(source, "name", "twitter:title"), TITLE)
        self.assertEqual(head_content(source, "name", "twitter:description"), DESCRIPTION)
        self.assertEqual(
            head_content(source, "name", "twitter:image"),
            "https://epictech.club/assets/images/logo/epic-tech-logo-final.webp",
        )

    def test_page_has_visible_hero_breadcrumb_and_shared_shell(self) -> None:
        source = read_text("privacy.html")
        main = main_inner("privacy.html")
        breadcrumb_match = re.search(
            r'<nav class="breadcrumb" aria-label="Breadcrumb">(.*?)</nav>',
            main,
            re.DOTALL,
        )
        self.assertIsNotNone(breadcrumb_match)
        self.assertEqual(visible_text(breadcrumb_match.group(1)), "Home Privacy")
        self.assertIn('<a href="/">Home</a>', breadcrumb_match.group(1))
        self.assertIn('aria-current="page">Privacy', breadcrumb_match.group(1))
        self.assertEqual(len(re.findall(r"<h1\b", main, re.IGNORECASE)), 1)
        self.assertRegex(main, r"<h1>Privacy</h1>")
        self.assertIn(
            "This notice explains how EPIC TECH handles information submitted through "
            "this website and the outside services involved.",
            visible_text(main),
        )
        self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', source)
        self.assertIn('aria-label="Primary navigation"', source)
        self.assertIn('<footer class="site-footer">', source)
        self.assertIn('<script src="assets/js/main.js" defer></script>', source)

    def test_privacy_has_exact_webpage_and_breadcrumb_graphs(self) -> None:
        path = ROOT / "privacy.html"
        nodes = json_ld_graph(path)
        self.assertEqual({node["@id"] for node in nodes}, {PAGE_ID, BREADCRUMB_ID})

        page = node_by_id(path, PAGE_ID)
        self.assertEqual(page["@type"], "WebPage")
        self.assertEqual(page["url"], CANONICAL)
        self.assertEqual(page["name"], "Privacy")
        self.assertEqual(page["isPartOf"], {"@id": WEBSITE_ID})
        self.assertEqual(page["about"], {"@id": BUSINESS_ID})
        self.assertEqual(page["breadcrumb"], {"@id": BREADCRUMB_ID})
        self.assertNotIn("mainEntity", page)

        breadcrumb = node_by_id(path, BREADCRUMB_ID)
        self.assertEqual(breadcrumb["@type"], "BreadcrumbList")
        self.assertEqual(
            breadcrumb["itemListElement"],
            [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://epictech.club/",
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Privacy",
                    "item": CANONICAL,
                },
            ],
        )
        self.assertNotIn("Service", {node["@type"] for node in nodes})
        self.assertNotIn("PrivacyPolicy", {node["@type"] for node in nodes})

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
