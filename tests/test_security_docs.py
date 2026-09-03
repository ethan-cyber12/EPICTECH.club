from __future__ import annotations

import json
import re
import unittest

from tests.site_contracts import ROOT, main_inner, read_text, sha256_text


STANDARD_EXPRESSION = (
    '(http.host eq "epictech.club" and not (http.request.uri.path in '
    '{"/contact.html" "/reviews.html"}) and not ends_with(http.request.uri.path, ".pdf"))'
)
PROTECTED_EXPRESSION = (
    '(http.host eq "epictech.club" and http.request.uri.path in '
    '{"/contact.html" "/reviews.html"})'
)
PDF_EXPRESSION = (
    '(http.host eq "epictech.club" and starts_with(http.request.uri.path, '
    '"/assets/projects/") and ends_with(http.request.uri.path, ".pdf"))'
)

STANDARD_CSP = (
    "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; "
    "style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; "
    "frame-src 'none'; form-action 'self' mailto:; frame-ancestors 'none'; "
    "upgrade-insecure-requests"
)
PROTECTED_CSP = (
    "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' "
    "https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; "
    "font-src 'self'; connect-src 'self' https://intake.epictech.club; frame-src "
    "https://challenges.cloudflare.com; form-action 'self'; frame-ancestors 'none'; "
    "upgrade-insecure-requests"
)
CURRENT_PROTECTED_META_CSP = (
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; "
    "style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' "
    "https://intake.epictech.club; frame-src https://challenges.cloudflare.com; "
    "form-action 'self'; base-uri 'self'; frame-ancestors 'none'; "
    "upgrade-insecure-requests"
)

BASE_HEADERS = (
    "X-Frame-Options: DENY",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()",
    "X-Content-Type-Options: nosniff",
    "Strict-Transport-Security: max-age=15552000",
)


def meta_csp(path: str) -> str:
    match = re.search(
        r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)">',
        read_text(path),
    )
    if match is None:
        raise AssertionError(f"{path} has no meta CSP")
    return match.group(1)


class SecurityDocumentationTests(unittest.TestCase):
    def test_runbook_defines_the_three_exact_path_expressions(self) -> None:
        runbook = read_text("docs/security-headers.md")
        for expression in (STANDARD_EXPRESSION, PROTECTED_EXPRESSION, PDF_EXPRESSION):
            with self.subTest(expression=expression):
                self.assertEqual(runbook.count(expression), 1)

    def test_runbook_defines_the_two_exact_csp_values(self) -> None:
        runbook = read_text("docs/security-headers.md")
        self.assertEqual(runbook.count(STANDARD_CSP), 1)
        self.assertEqual(runbook.count(PROTECTED_CSP), 1)
        self.assertNotIn("unsafe-inline", STANDARD_CSP + PROTECTED_CSP)
        self.assertNotIn("unsafe-eval", STANDARD_CSP + PROTECTED_CSP)
        self.assertIn("Do not add `unsafe-inline` or `unsafe-eval`.", runbook)

    def test_runbook_uses_set_static_with_exact_base_headers(self) -> None:
        runbook = read_text("docs/security-headers.md")
        self.assertIn("Use **Set static**, not **Add static**", runbook)
        self.assertIn(
            "Later response-header rules can overwrite earlier rules; verify rule order with Cloudflare Trace.",
            runbook,
        )
        for header in BASE_HEADERS:
            with self.subTest(header=header):
                self.assertIn(header, runbook)
        self.assertNotIn("max-age=63072000", runbook)
        self.assertNotRegex(
            runbook,
            r"Strict-Transport-Security:\s*max-age=15552000\s*;\s*(?:includeSubDomains|preload)",
        )

    def test_pdf_rule_is_a_response_header_not_a_document_edit(self) -> None:
        runbook = read_text("docs/security-headers.md")
        self.assertIn(PDF_EXPRESSION, runbook)
        self.assertIn("X-Robots-Tag: noindex, follow", runbook)
        self.assertIn(
            "PDF `noindex, follow` is a response-header policy, not a PDF content edit.",
            runbook,
        )

    def test_stage_order_is_inventory_report_only_enforce_then_deduplicate(self) -> None:
        runbook = read_text("docs/security-headers.md")
        for heading in (
            "## Stage 0 — inventory and baseline",
            "## Stage 1 — report only",
            "## Stage 2 — enforce",
            "## Stage 3 — deduplicate",
        ):
            self.assertIn(heading, runbook)
        inventory = runbook.index("## Stage 0 — inventory and baseline")
        report_only = runbook.index("## Stage 1 — report only")
        enforce = runbook.index("## Stage 2 — enforce")
        deduplicate = runbook.index("## Stage 3 — deduplicate")
        self.assertLess(inventory, report_only)
        self.assertLess(report_only, enforce)
        self.assertLess(enforce, deduplicate)
        self.assertIn("Content-Security-Policy-Report-Only", runbook[report_only:enforce])
        self.assertIn("Content-Security-Policy", runbook[enforce:deduplicate])
        self.assertIn(
            "If any critical flow fails, disable only the new enforcing CSP rules",
            runbook[enforce:deduplicate],
        )
        self.assertIn(
            "Remove the meta CSP from non-protected HTML only after the enforcing response header is live.",
            runbook[deduplicate:],
        )
        self.assertIn("Leave the meta CSP in `contact.html` and `reviews.html`.", runbook)
        self.assertIn("Remove report-only rules only after clean enforcement.", runbook)

    def test_pre_activation_inventory_requires_overlap_and_order_evidence(self) -> None:
        runbook = read_text("docs/security-headers.md")
        for required_inventory in (
            "Transform Rules",
            "Managed Transforms",
            "response headers",
            "HSTS",
            "redirects and redirect order",
            "WAF and custom rules",
            "Bot Fight Mode or Bot Management",
            "AI Crawl Control",
            "verified-bot settings",
            "DNS and proxy status",
            "every subdomain's HTTPS capability",
            "baseline response headers",
            "Cloudflare Trace",
            "evaluation-order evidence",
        ):
            with self.subTest(required_inventory=required_inventory):
                self.assertIn(required_inventory, runbook)
        self.assertIn("Stop if an existing rule overlaps", runbook)
        self.assertIn("Create all proposed rules disabled", runbook)

    def test_runbook_preserves_current_dependencies_and_security_boundaries(self) -> None:
        runbook = read_text("docs/security-headers.md")
        for safeguard in (
            "Do not self-host or hash the dynamic Turnstile script.",
            "Do not add Cloudflare Web Analytics, external fonts, trackers, review widgets, or CDNs.",
            "Do not whitelist bots by User-Agent alone",
            "verified-bot classifications or provider-published networks",
            "Do not expand HSTS to `includeSubDomains` or `preload`",
            "`epictech.club`, `intake.epictech.club`, and every other subdomain",
            "owner separately approves the lockout risk",
            "https://challenges.cloudflare.com",
            "https://intake.epictech.club",
            "`lead_intake` on Contact and `review_intake` on Reviews",
            "returned `action` does not exactly match the requested endpoint",
        ):
            with self.subTest(safeguard=safeguard):
                self.assertIn(safeguard, runbook)

    def test_runbook_requires_owner_gates_and_does_not_authorize_live_changes(self) -> None:
        runbook = read_text("docs/security-headers.md")
        self.assertIn(
            "Status: local documentation only; no Cloudflare rule has been created or activated.",
            runbook,
        )
        self.assertIn("Owner authorization is required before every live stage.", runbook)
        self.assertIn("Do not activate any rule from this document during local preparation.", runbook)
        self.assertIn(
            "Critical-flow testing may begin only after the owner authorizes live testing.",
            runbook,
        )

    def test_protected_meta_csp_and_source_hashes_match_the_runbook(self) -> None:
        runbook = read_text("docs/security-headers.md")
        self.assertEqual(meta_csp("contact.html"), CURRENT_PROTECTED_META_CSP)
        self.assertEqual(meta_csp("reviews.html"), CURRENT_PROTECTED_META_CSP)
        self.assertIn("object-src 'none'", PROTECTED_CSP)
        for protected_origin in (
            "https://challenges.cloudflare.com",
            "https://intake.epictech.club",
        ):
            self.assertIn(protected_origin, CURRENT_PROTECTED_META_CSP)
            self.assertIn(protected_origin, PROTECTED_CSP)

        baselines = json.loads(
            (ROOT / "tests/fixtures/contact_reviews_regression.json").read_text(encoding="utf-8")
        )
        for page, expected_hash in baselines["main_inner_sha256"].items():
            with self.subTest(page=page):
                self.assertEqual(sha256_text(main_inner(page)), expected_hash)
                self.assertIn(f"`{page}` main: `{expected_hash}`", runbook)
        for script, expected_hash in baselines["script_sha256"].items():
            with self.subTest(script=script):
                self.assertEqual(sha256_text(read_text(script)), expected_hash)
                self.assertIn(f"`{script}`: `{expected_hash}`", runbook)


if __name__ == "__main__":
    unittest.main()
