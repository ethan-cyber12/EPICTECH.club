# EPIC TECH Discoverability and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make EPIC TECH's canonical URLs, entity identity, service proof, crawler policy, privacy disclosure, and HTTP security controls internally consistent and verifiable without changing Contact or Reviews page-specific content, structure, or behavior.

**Architecture:** Keep the site static and dependency-free at runtime. Add a small Python standard-library contract suite, server-readable service and case-study HTML, inline JSON-LD that references one stable entity graph, and deployment runbooks for Cloudflare redirects and response headers. Treat Cloudflare changes as gated deployment work: test CSP in report-only mode, enforce it while the existing meta policy remains, and remove meta CSP only after the live header is verified.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, JSON-LD/Schema.org, XML sitemap, robots.txt, Python 3 unittest, pypdf 6.10.0 for PDF metadata, GitHub Actions, GitHub Pages, Cloudflare Redirect Rules/Transform Rules.

**Spec:** docs/superpowers/specs/2026-09-01-epictech-founder-led-redesign-design.md

## Global Constraints

- Execute this plan in the isolated feature branch created for the approved founder-led redesign.
- Run this plan after the shared shell, homepage, and founder page from the approved redesign exist. The required founder page path is founder.html; if it is absent, stop and complete that approved task before Task 3.
- Preserve the EPIC TECH palette: #0B5CFF, #083B9A, #00B67A, #101820, #FFFFFF, and #F4F7FB.
- Keep “Veteran owned. Family operated.” in the homepage hero.
- Make only minor wording changes needed for clarity, trust, accessibility, privacy accuracy, and search metadata.
- Do not change Contact or Reviews page-specific copy, sections, fields, validation, Turnstile use, endpoints, review submission, review retrieval, or API behavior.
- Contact and Reviews may receive only the shared header/footer, palette variables, type/spacing normalization, focus states, responsive navigation, and global accessibility improvements that do not alter behavior.
- Preserve all existing destinations, assessment flow, WhatsApp integration, forms, reviews workflow, and pricing behavior.
- Do not add third-party fonts, trackers, widgets, CDNs, runtime frameworks, unsafe-inline, or unsafe-eval.
- Do not publish a street address, military dates or unit details, clearances, GPA, student identifiers, personal phone numbers, private email addresses, or other unnecessary PII.
- Do not add LocalBusiness unless the owner separately supplies and approves an accurate publishable business address and confirms eligibility. This plan uses Organization.
- Structured data must describe visible content.
- Robots rules document crawler preference; they are not access control.
- Do not merge, deploy, or activate Cloudflare rules without the owner's explicit direction.
- Use 2026-09-01 as lastmod only for pages materially changed by this implementation; retain the prior meaningful date for untouched pages.

## File and Interface Map

- tests/site_testlib.py: dependency-free helpers for HTML, link, canonical, and JSON-LD inspection.
- tests/test_protected_pages.py: regression contract for Contact and Reviews page-specific markup and scripts.
- tests/test_canonicals.py: canonical URL and internal-link consolidation contract.
- tests/test_structured_data.py: stable entity IDs, types, visible-content, and service graph contract.
- tests/test_service_pages.py: visible breadcrumb, fragment, related-proof, and service-page semantic contract.
- tests/test_case_studies.py: HTML companion, PDF link, section, and PDF metadata contract.
- tests/test_privacy.py: accurate disclosure contract without touching protected pages.
- tests/test_sitemap_and_robots.py: sitemap equality and selected crawler-policy contract.
- tests/test_security_docs.py: exact Cloudflare rule and header-policy documentation contract.
- .github/workflows/site-contracts.yml: runs the contract suite on pull requests.
- docs/cloudflare-redirects.md: exact duplicate-URL redirect configuration and live checks.
- docs/crawler-policy.md: records the owner-approved search and training crawler choice.
- docs/security-headers.md: authoritative CSP/header rollout and rollback runbook.
- case-studies/index.html and eight case-studies/*.html companions: server-readable public proof.
- tools/update_pdf_metadata.py: deterministic metadata updater for the eight public PDFs.
- sitemap.xml and robots.txt: discovery surfaces.

---

### Task 1: Add the Test Harness and Freeze Protected Page Contracts

**Files:**
- Create: tests/site_testlib.py
- Create: tests/test_protected_pages.py
- Create: .github/workflows/site-contracts.yml

**Interfaces:**
- Produces: site_testlib.ROOT, html_files(), read_text(), main_inner(), canonical_href(), json_ld_graph(), local_target(), and element_ids().
- Produces: a protected-page contract that later tasks must keep green.
- Consumes: the current Contact and Reviews main-region hashes and current endpoint/field interfaces.

- [ ] **Step 1: Confirm the protected regions still match the approved baseline**

Run:

    python3 - <<'PY'
    import hashlib
    import re
    from pathlib import Path
    for name in ("contact.html", "reviews.html"):
        source = Path(name).read_text(encoding="utf-8")
        match = re.search(r"<main[^>]*>(.*?)</main>", source, re.DOTALL | re.IGNORECASE)
        assert match, name
        print(name, hashlib.sha256(match.group(1).encode()).hexdigest())
    PY

Expected:

    contact.html f594a5bfd1ccc853d21564d3c577a42f83a02f4ca63126163410008dca35c518
    reviews.html 2ff71c5f06d16cb86217ca0540e5ca15638c4c9ea06a830dc85f9ef7c2c15c05

If the shared-shell work has legitimately changed only the opening main tag, these hashes remain unchanged. If either inner-main hash differs, inspect the diff and restore the approved page-specific markup before continuing.

- [ ] **Step 2: Write the shared test helper**

Create tests/site_testlib.py with:

    import json
    import re
    from pathlib import Path
    from urllib.parse import unquote, urlparse

    ROOT = Path(__file__).resolve().parents[1]
    EXCLUDED_PARTS = {".git", ".venv", "tests", "docs"}

    def read_text(path):
        path = Path(path)
        if not path.is_absolute():
            path = ROOT / path
        return path.read_text(encoding="utf-8")

    def html_files():
        return sorted(
            path for path in ROOT.rglob("*.html")
            if not EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts)
        )

    def main_inner(path):
        match = re.search(
            r"<main[^>]*>(.*?)</main>",
            read_text(path),
            re.DOTALL | re.IGNORECASE,
        )
        if not match:
            raise AssertionError(f"{path}: missing main element")
        return match.group(1)

    def canonical_href(path):
        match = re.search(
            r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']',
            read_text(path),
            re.IGNORECASE,
        )
        if not match:
            raise AssertionError(f"{path}: missing canonical")
        return match.group(1)

    def hrefs(path):
        return re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\']', read_text(path), re.IGNORECASE)

    def element_ids(path):
        return set(re.findall(r'\bid=["\']([^"\']+)["\']', read_text(path), re.IGNORECASE))

    def local_target(source_path, href):
        parsed = urlparse(href)
        if parsed.scheme or parsed.netloc or href.startswith(("mailto:", "tel:", "javascript:")):
            return None
        raw_path = unquote(parsed.path)
        if not raw_path:
            target = Path(source_path)
        elif raw_path.startswith("/"):
            target = ROOT / raw_path.lstrip("/")
        else:
            target = Path(source_path).parent / raw_path
        if raw_path.endswith("/"):
            target = target / "index.html"
        elif target == ROOT:
            target = ROOT / "index.html"
        return target.resolve(), parsed.fragment

    def json_ld_graph(path):
        blocks = re.findall(
            r'<script\s+[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            read_text(path),
            re.DOTALL | re.IGNORECASE,
        )
        nodes = []
        for block in blocks:
            payload = json.loads(block)
            if isinstance(payload, dict) and isinstance(payload.get("@graph"), list):
                nodes.extend(payload["@graph"])
            elif isinstance(payload, list):
                nodes.extend(payload)
            else:
                nodes.append(payload)
        return nodes

    def node_by_id(path, node_id):
        for node in json_ld_graph(path):
            if node.get("@id") == node_id:
                return node
        raise AssertionError(f"{path}: missing JSON-LD node {node_id}")

- [ ] **Step 3: Write the protected-page tests**

Create tests/test_protected_pages.py with:

    import hashlib
    import unittest

    from site_testlib import ROOT, main_inner, read_text

    class ProtectedPageTests(unittest.TestCase):
        def test_contact_main_content_and_structure_are_unchanged(self):
            digest = hashlib.sha256(main_inner(ROOT / "contact.html").encode()).hexdigest()
            self.assertEqual(
                digest,
                "f594a5bfd1ccc853d21564d3c577a42f83a02f4ca63126163410008dca35c518",
            )

        def test_reviews_main_content_and_structure_are_unchanged(self):
            digest = hashlib.sha256(main_inner(ROOT / "reviews.html").encode()).hexdigest()
            self.assertEqual(
                digest,
                "2ff71c5f06d16cb86217ca0540e5ca15638c4c9ea06a830dc85f9ef7c2c15c05",
            )

        def test_contact_form_contract_is_unchanged(self):
            source = read_text("contact.html")
            for token in (
                'data-intake-form',
                'data-endpoint="https://intake.epictech.club/lead-intake"',
                'name="name"',
                'name="business"',
                'name="email"',
                'name="phone"',
                'name="service"',
                'name="message"',
                'name="_hp"',
                'class="cf-turnstile"',
                'src="https://challenges.cloudflare.com/turnstile/v0/api.js"',
                'src="assets/js/qualification.js"',
            ):
                self.assertIn(token, source)

        def test_review_form_and_retrieval_contract_are_unchanged(self):
            source = read_text("reviews.html")
            script = read_text("assets/js/reviews.js")
            for token in (
                'data-review-form',
                'data-endpoint="https://intake.epictech.club/review-intake"',
                'name="name"',
                'name="email"',
                'name="rating"',
                'name="text"',
                'name="_hp"',
                'class="cf-turnstile"',
                'src="https://challenges.cloudflare.com/turnstile/v0/api.js"',
                'src="assets/js/reviews.js"',
            ):
                self.assertIn(token, source)
            for token in (
                "https://intake.epictech.club",
                "ENDPOINT_BASE + '/reviews'",
                "ENDPOINT_BASE + '/review-intake'",
            ):
                self.assertIn(token, script)

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 4: Run the protected contract**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_protected_pages.py -v

Expected: four tests pass. A hash failure is a stop condition, not a reason to update the expected digest.

- [ ] **Step 5: Add continuous test execution**

Create .github/workflows/site-contracts.yml with:

    name: Site contracts

    on:
      pull_request:
      push:
        branches: [main]

    permissions:
      contents: read

    jobs:
      contracts:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-python@v5
            with:
              python-version: "3.13"
          - run: python -m unittest discover -s tests -v

- [ ] **Step 6: Commit the safety net**

Run:

    git add tests/site_testlib.py tests/test_protected_pages.py .github/workflows/site-contracts.yml
    git commit -m "test: protect site discovery and form contracts"

---

### Task 2: Consolidate Canonicals, Internal Links, and Exact Redirects

**Files:**
- Create: tests/test_canonicals.py
- Create: docs/cloudflare-redirects.md
- Modify: every HTML file containing a local href to index.html or services/index.html
- Preserve: canonical link elements already using https://epictech.club/ and https://epictech.club/services/

**Interfaces:**
- Consumes: html_files(), hrefs(), canonical_href(), and local_target() from tests/site_testlib.py.
- Produces: one internal URL vocabulary: / for home and /services/ for the service hub.
- Produces: exact Cloudflare 301 configuration for the two duplicate public URLs.

- [ ] **Step 1: Write the failing canonical test**

Create tests/test_canonicals.py with:

    import re
    import unittest
    from urllib.parse import urlparse

    from site_testlib import ROOT, canonical_href, hrefs, html_files, read_text

    class CanonicalTests(unittest.TestCase):
        def test_internal_links_do_not_reference_index_html(self):
            failures = []
            for page in html_files():
                for href in hrefs(page):
                    parsed = urlparse(href)
                    if not parsed.scheme and parsed.path.endswith("/index.html"):
                        failures.append(f"{page.relative_to(ROOT)} -> {href}")
                    if not parsed.scheme and parsed.path == "index.html":
                        failures.append(f"{page.relative_to(ROOT)} -> {href}")
            self.assertEqual(failures, [])

        def test_root_and_service_hub_canonicals_are_preferred_urls(self):
            self.assertEqual(canonical_href(ROOT / "index.html"), "https://epictech.club/")
            self.assertEqual(
                canonical_href(ROOT / "services/index.html"),
                "https://epictech.club/services/",
            )

        def test_redirect_runbook_contains_exact_permanent_redirects(self):
            runbook = read_text("docs/cloudflare-redirects.md")
            for source, target in (
                ("https://epictech.club/index.html", "https://epictech.club/"),
                (
                    "https://epictech.club/services/index.html",
                    "https://epictech.club/services/",
                ),
            ):
                self.assertIn(source, runbook)
                self.assertIn(target, runbook)
            self.assertGreaterEqual(len(re.findall(r"\b301\b", runbook)), 2)

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 2: Run the test and confirm the known failure**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_canonicals.py -v

Expected: test_internal_links_do_not_reference_index_html fails and the redirect-runbook test errors because the document does not exist.

- [ ] **Step 3: Replace only local duplicate links**

Use apply_patch and make these exact replacements:

- Root-level HTML: href="index.html" becomes href="/".
- Root-level HTML: href="services/index.html" becomes href="/services/".
- Service HTML: href="../index.html" becomes href="/".
- Service HTML: href="index.html" becomes href="/services/".
- Newly created founder and case-study pages use root-relative / and /services/ from the start.
- Do not change form action="contact.html", form action="reviews.html", contact.html links, reviews.html links, or PDF links.

Confirm the replacement set:

    rg -n 'href="([^"]*/)?index\.html"' --glob '*.html'

Expected: no output.

- [ ] **Step 4: Write the exact Cloudflare redirect runbook**

Create docs/cloudflare-redirects.md with these records and instructions:

    # Cloudflare canonical redirects

    Configure two Single Redirect rules for hostname epictech.club. Keep query
    strings, disable subpath matching, and do not include subdomains.

    1. Expression:
       (http.host eq "epictech.club" and http.request.uri.path eq "/index.html")
       Target: https://epictech.club/
       Status: 301
       Preserve query string: yes

    2. Expression:
       (http.host eq "epictech.club" and http.request.uri.path eq "/services/index.html")
       Target: https://epictech.club/services/
       Status: 301
       Preserve query string: yes

    Activate only after the branch is deployed with internal links pointing to
    / and /services/. Roll back by disabling these two rules.

    Verification:
      curl -sS -o /dev/null -D - https://epictech.club/index.html
      curl -sS -o /dev/null -D - https://epictech.club/services/index.html
      curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' https://epictech.club/index.html
      curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' https://epictech.club/services/index.html

    The first two commands must show one 301 and the exact Location target.
    The last two commands must show one final 200 at the preferred URL.

- [ ] **Step 5: Run canonical and protected-page tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_canonicals.py tests/test_protected_pages.py -v

Expected: all tests pass.

- [ ] **Step 6: Commit canonical consolidation**

Run:

    git add -- '*.html' tests/test_canonicals.py docs/cloudflare-redirects.md
    git commit -m "fix: consolidate canonical site URLs"

---

### Task 3: Replace Deprecated Business Markup with the Stable Core Entity Graph

**Files:**
- Create: tests/test_structured_data.py
- Modify: index.html
- Modify: about.html
- Modify: founder.html
- Modify: pricing.html
- Do not modify: contact.html
- Do not modify: reviews.html

**Interfaces:**
- Produces stable IDs https://epictech.club/#website, https://epictech.club/#business, and https://epictech.club/#ethan-platt.
- Produces page IDs ending #webpage and breadcrumb IDs ending #breadcrumb.
- Founder Person.hasCredential contains exactly the two approved degree credentials.
- Does not produce LocalBusiness, PostalAddress, ProfessionalService, empty sameAs, or unverified claims.

- [ ] **Step 1: Verify the founder-page prerequisite**

Run:

    test -f founder.html
    rg -n 'Technology should make work easier to understand and easier to do' founder.html
    rg -n 'B\.S\. in Information Technology|B\.S\. in Cybersecurity' founder.html

Expected: all commands succeed. If founder.html is absent, stop; creating or redesigning it belongs to the approved founder-page implementation, not this plan.

- [ ] **Step 2: Write the failing entity graph tests**

Create tests/test_structured_data.py with:

    import unittest

    from site_testlib import ROOT, json_ld_graph, node_by_id, read_text

    WEBSITE = "https://epictech.club/#website"
    BUSINESS = "https://epictech.club/#business"
    PERSON = "https://epictech.club/#ethan-platt"

    class StructuredDataTests(unittest.TestCase):
        def test_home_defines_non_deprecated_site_and_business_entities(self):
            nodes = json_ld_graph(ROOT / "index.html")
            types = {
                item
                for node in nodes
                for item in (
                    node.get("@type")
                    if isinstance(node.get("@type"), list)
                    else [node.get("@type")]
                )
            }
            self.assertIn("WebSite", types)
            self.assertIn("Organization", types)
            self.assertNotIn("ProfessionalService", types)
            self.assertNotIn("LocalBusiness", types)
            business = node_by_id(ROOT / "index.html", BUSINESS)
            self.assertEqual(business["name"], "EPIC TECH LLC")
            self.assertEqual(business["founder"], {"@id": PERSON})
            self.assertNotIn("address", business)
            self.assertNotEqual(business.get("sameAs"), [])

        def test_core_pages_reference_stable_ids(self):
            expected = {
                "index.html": ("WebPage", "https://epictech.club/#webpage"),
                "about.html": ("AboutPage", "https://epictech.club/about.html#webpage"),
                "founder.html": ("ProfilePage", "https://epictech.club/founder.html#webpage"),
                "pricing.html": ("WebPage", "https://epictech.club/pricing.html#webpage"),
            }
            for path, (page_type, page_id) in expected.items():
                with self.subTest(path=path):
                    page = node_by_id(ROOT / path, page_id)
                    self.assertEqual(page["@type"], page_type)
                    self.assertEqual(page["isPartOf"], {"@id": WEBSITE})

        def test_core_secondary_pages_have_breadcrumb_graphs(self):
            for path in ("about.html", "founder.html", "pricing.html"):
                with self.subTest(path=path):
                    breadcrumb = node_by_id(
                        ROOT / path,
                        f"https://epictech.club/{path}#breadcrumb",
                    )
                    self.assertEqual(breadcrumb["@type"], "BreadcrumbList")
                    self.assertEqual(breadcrumb["itemListElement"][0]["item"], "https://epictech.club/")

        def test_founder_credentials_are_exact_and_visible(self):
            person = node_by_id(ROOT / "founder.html", PERSON)
            credentials = person["hasCredential"]
            names = {credential["name"] for credential in credentials}
            self.assertEqual(
                names,
                {
                    "Bachelor of Science in Information Technology",
                    "Bachelor of Science in Cybersecurity",
                },
            )
            source = read_text("founder.html")
            self.assertIn("B.S. in Information Technology", source)
            self.assertIn("B.S. in Cybersecurity", source)
            for forbidden in ("GPA", "clearance", "student identifier"):
                self.assertNotIn(forbidden, source)

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 3: Run the tests and verify they fail for the deprecated graph**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_structured_data.py -v

Expected: failures identify ProfessionalService, missing WebSite/WebPage graph nodes, and missing founder credentials.

- [ ] **Step 4: Replace the homepage JSON-LD with the exact graph contract**

Use one application/ld+json block containing:

    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://epictech.club/#website",
          "url": "https://epictech.club/",
          "name": "EPIC TECH LLC",
          "publisher": {"@id": "https://epictech.club/#business"}
        },
        {
          "@type": "Organization",
          "@id": "https://epictech.club/#business",
          "name": "EPIC TECH LLC",
          "url": "https://epictech.club/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://epictech.club/assets/images/logo/epic-tech-logo-final.webp",
            "width": 787,
            "height": 904
          },
          "founder": {"@id": "https://epictech.club/#ethan-platt"},
          "areaServed": {
            "@type": "AdministrativeArea",
            "name": "Central Florida"
          },
          "knowsAbout": [
            "Small business networks",
            "Business Wi-Fi",
            "Firewalls and cybersecurity",
            "Business websites",
            "Business applications",
            "Automation",
            "Ecommerce",
            "Infrastructure",
            "Virtualization"
          ]
        },
        {
          "@type": "Person",
          "@id": "https://epictech.club/#ethan-platt",
          "name": "Ethan Platt",
          "jobTitle": "Founder",
          "worksFor": {"@id": "https://epictech.club/#business"},
          "url": "https://epictech.club/founder.html"
        },
        {
          "@type": "WebPage",
          "@id": "https://epictech.club/#webpage",
          "url": "https://epictech.club/",
          "name": "Small Business IT, Networks & Websites | EPIC TECH, Orlando",
          "isPartOf": {"@id": "https://epictech.club/#website"},
          "about": {"@id": "https://epictech.club/#business"}
        }
      ]
    }

Do not add sameAs until at least one verified public profile URL is approved. Omitting it satisfies the non-empty contract.

- [ ] **Step 5: Add the AboutPage graph**

In about.html, use one graph with:

- AboutPage ID https://epictech.club/about.html#webpage
- URL https://epictech.club/about.html
- isPartOf #website
- about and mainEntity pointing to #business
- breadcrumb ID https://epictech.club/about.html#breadcrumb
- breadcrumb items Home at position 1 and About at position 2

Use the visible page title for the AboutPage name. Do not duplicate the full Organization node.

- [ ] **Step 6: Add the ProfilePage and Person graph**

In founder.html, use one graph with:

- ProfilePage ID https://epictech.club/founder.html#webpage
- mainEntity pointing to #ethan-platt
- Person name Ethan Platt, jobTitle Founder, worksFor #business, and URL founder.html
- Person description: A veteran founder focused on building clear, practical solutions.
- Two embedded EducationalOccupationalCredential values:
  - credentialCategory: degree
  - name: Bachelor of Science in Information Technology
  - credentialCategory: degree
  - name: Bachelor of Science in Cybersecurity
- BreadcrumbList ID https://epictech.club/founder.html#breadcrumb with Home and Founder

Do not add educational institutions, award dates, military dates, units, or profiles not visible and verified.

- [ ] **Step 7: Add the Pricing WebPage graph**

In pricing.html, add a WebPage node with ID
https://epictech.club/pricing.html#webpage, URL
https://epictech.club/pricing.html, isPartOf #website, about #business, and
breadcrumb #breadcrumb. Add a BreadcrumbList node with Home and Pricing. Use
the visible title for WebPage.name. Do not add offers or prices that are not
already visible on the page.

- [ ] **Step 8: Run graph and protected-page tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_structured_data.py tests/test_protected_pages.py -v

Expected: all tests pass.

- [ ] **Step 9: Commit the core entity graph**

Run:

    git add index.html about.html founder.html pricing.html tests/test_structured_data.py
    git commit -m "feat: establish the EPIC TECH entity graph"

---

### Task 4: Add Service Semantics, Visible Breadcrumbs, Related Proof, and Valid Fragments

**Files:**
- Create: tests/test_service_pages.py
- Modify: services/index.html
- Modify: services/app-building.html
- Modify: services/automation.html
- Modify: services/ecommerce.html
- Modify: services/firewalls.html
- Modify: services/infrastructure.html
- Modify: services/software.html
- Modify: services/virtualization.html
- Modify: services/webhosting.html
- Modify: assets/css/styles.css only for breadcrumb/related-link styling already approved by the visual plan
- Do not modify: contact.html
- Do not modify: reviews.html

**Interfaces:**
- Every individual service page produces WebPage #webpage, BreadcrumbList #breadcrumb, and Service #service.
- Every Service.provider references https://epictech.club/#business.
- Every service page has a visible nav.breadcrumbs and one related public proof link.
- Existing service copy, pricing behavior, and destinations remain intact.

- [ ] **Step 1: Write the failing service-page contract**

Create tests/test_service_pages.py with:

    import unittest

    from site_testlib import ROOT, element_ids, hrefs, local_target, node_by_id, read_text

    SERVICES = {
        "app-building.html": ("Business Apps & Internal Dashboards", "secure-web-and-sdlc"),
        "automation.html": ("Business Automation", "cloud-security-automation"),
        "ecommerce.html": ("Ecommerce Solutions", "secure-web-and-sdlc"),
        "firewalls.html": ("Firewall & Network Security", "cybersecurity-compliance"),
        "infrastructure.html": ("Infrastructure & Business Wi-Fi", "network-infrastructure"),
        "software.html": ("Forms & Internal Tools", "secure-web-and-sdlc"),
        "virtualization.html": ("Virtualization Labs", "cloud-security-automation"),
        "webhosting.html": ("Websites & Hosting", "secure-web-and-sdlc"),
    }

    class ServicePageTests(unittest.TestCase):
        def test_service_pages_have_visible_breadcrumbs_and_graphs(self):
            for filename, (service_type, proof_slug) in SERVICES.items():
                path = ROOT / "services" / filename
                canonical = f"https://epictech.club/services/{filename}"
                with self.subTest(filename=filename):
                    source = read_text(path)
                    self.assertIn('<nav class="breadcrumbs" aria-label="Breadcrumb">', source)
                    self.assertIn(f"/case-studies/{proof_slug}.html", source)
                    service = node_by_id(path, canonical + "#service")
                    self.assertEqual(service["@type"], "Service")
                    self.assertEqual(service["serviceType"], service_type)
                    self.assertEqual(
                        service["provider"],
                        {"@id": "https://epictech.club/#business"},
                    )
                    self.assertEqual(
                        service["areaServed"],
                        {"@type": "AdministrativeArea", "name": "Central Florida"},
                    )
                    node_by_id(path, canonical + "#webpage")
                    node_by_id(path, canonical + "#breadcrumb")

        def test_service_hub_has_page_and_breadcrumb_graphs(self):
            path = ROOT / "services" / "index.html"
            node_by_id(path, "https://epictech.club/services/#webpage")
            node_by_id(path, "https://epictech.club/services/#breadcrumb")

        def test_every_local_fragment_resolves(self):
            failures = []
            for filename in ("index.html", *SERVICES):
                page = ROOT / "services" / filename
                for href in hrefs(page):
                    resolved = local_target(page, href)
                    if not resolved:
                        continue
                    if href.startswith("/case-studies/"):
                        continue
                    target, fragment = resolved
                    if not target.exists():
                        failures.append(f"{filename}: missing {href}")
                    elif fragment and fragment not in element_ids(target):
                        failures.append(f"{filename}: missing fragment {href}")
            self.assertEqual(failures, [])

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 2: Run the tests and verify the expected failures**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_service_pages.py -v

Expected: graph/breadcrumb/proof failures on all services and a missing services/software.html#proof fragment.

- [ ] **Step 3: Add visible breadcrumbs without changing navigation behavior**

Immediately inside main, before each service hero, add:

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/services/">Services</a></li>
        <li aria-current="page">VISIBLE SERVICE NAME</li>
      </ol>
    </nav>

Use the exact serviceType label from SERVICES for VISIBLE SERVICE NAME. On services/index.html use Home followed by Services with aria-current="page". The breadcrumb links are ordinary anchors and require no JavaScript.

- [ ] **Step 4: Add the exact service graph shape to every individual page**

For services/firewalls.html, the shape is:

    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://epictech.club/services/firewalls.html#webpage",
          "url": "https://epictech.club/services/firewalls.html",
          "name": "Firewall & Network Security | EPIC TECH LLC",
          "isPartOf": {"@id": "https://epictech.club/#website"},
          "about": {"@id": "https://epictech.club/services/firewalls.html#service"},
          "breadcrumb": {"@id": "https://epictech.club/services/firewalls.html#breadcrumb"}
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://epictech.club/services/firewalls.html#breadcrumb",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://epictech.club/"},
            {"@type": "ListItem", "position": 2, "name": "Services", "item": "https://epictech.club/services/"},
            {"@type": "ListItem", "position": 3, "name": "Firewall & Network Security", "item": "https://epictech.club/services/firewalls.html"}
          ]
        },
        {
          "@type": "Service",
          "@id": "https://epictech.club/services/firewalls.html#service",
          "name": "Firewall & Network Security",
          "serviceType": "Firewall & Network Security",
          "url": "https://epictech.club/services/firewalls.html",
          "provider": {"@id": "https://epictech.club/#business"},
          "areaServed": {"@type": "AdministrativeArea", "name": "Central Florida"},
          "mainEntityOfPage": {"@id": "https://epictech.club/services/firewalls.html#webpage"}
        }
      ]
    }

Repeat this exact shape with each file's canonical URL and serviceType from SERVICES. Use each visible title for WebPage.name. Add Offer only when a price is already visible on that page; never put hidden or estimated prices in JSON-LD.

- [ ] **Step 5: Add the service-hub page graph**

In services/index.html, add WebPage ID
https://epictech.club/services/#webpage and BreadcrumbList ID
https://epictech.club/services/#breadcrumb. The page isPartOf #website and
about #business. The breadcrumb contains Home and Services. Do not create one
combined Service node for the hub; the eight individual pages own their
Service nodes.

- [ ] **Step 6: Add the compact factual section structure**

Preserve the existing paragraphs and package/pricing blocks, moving them only where necessary under these visible headings:

- Who this is for
- What is included
- How the work starts
- Coverage and boundaries
- Related proof
- Related services

Do not add an FAQ unless two to four questions can be answered entirely from existing visible claims. Do not add location variants, new guarantees, client counts, rankings, or word-count filler.

Add Related proof links with this exact mapping:

- app-building.html → /case-studies/secure-web-and-sdlc.html
- automation.html → /case-studies/cloud-security-automation.html
- ecommerce.html → /case-studies/secure-web-and-sdlc.html
- firewalls.html → /case-studies/cybersecurity-compliance.html
- infrastructure.html → /case-studies/network-infrastructure.html
- software.html → /case-studies/secure-web-and-sdlc.html
- virtualization.html → /case-studies/cloud-security-automation.html
- webhosting.html → /case-studies/secure-web-and-sdlc.html

For software.html, either change the old side-navigation href="#proof" to the new Related proof section ID or set id="proof" on that section. The final fragment must resolve.

- [ ] **Step 7: Add related-service links**

Use these exact pairs, preserving existing destinations:

- app-building → automation and software
- automation → app-building and software
- ecommerce → webhosting and app-building
- firewalls → infrastructure and webhosting
- infrastructure → firewalls and virtualization
- software → app-building and automation
- virtualization → infrastructure and firewalls
- webhosting → ecommerce and firewalls

Every destination must be a descriptive ordinary anchor, not a JavaScript click handler.

- [ ] **Step 8: Run service, graph, canonical, and protected-page tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_service_pages.py tests/test_structured_data.py tests/test_canonicals.py tests/test_protected_pages.py -v

Expected: all tests pass.

- [ ] **Step 9: Commit service discoverability**

Run:

    git add services assets/css/styles.css tests/test_service_pages.py
    git commit -m "feat: add semantic service discovery paths"

---

### Task 5: Publish Server-Readable Case Studies and Improve PDF Metadata

**Files:**
- Create: requirements-dev.txt
- Modify: .github/workflows/site-contracts.yml
- Create: tools/update_pdf_metadata.py
- Create: tests/test_case_studies.py
- Create: case-studies/index.html
- Create: case-studies/cloud-security-automation.html
- Create: case-studies/cybersecurity-compliance.html
- Create: case-studies/disa-stig-hardening.html
- Create: case-studies/managed-it-patch-management.html
- Create: case-studies/network-infrastructure.html
- Create: case-studies/secure-web-and-sdlc.html
- Create: case-studies/vulnerability-remediation.html
- Create: case-studies/zero-trust-access-control.html
- Modify: all eight assets/projects/*.pdf files through tools/update_pdf_metadata.py

**Interfaces:**
- Every case study has a self-canonical HTML URL, one H1, visible Home / Case Studies breadcrumb, seven fixed content sections, and its original PDF download.
- PDF metadata Title matches the HTML H1; Author is EPIC TECH LLC.
- HTML companions are the indexable versions. Task 8 applies X-Robots-Tag: noindex, follow to /assets/projects/*.pdf.

- [ ] **Step 1: Add the pinned development dependency**

Create requirements-dev.txt:

    pypdf==6.10.0

Replace the workflow's existing bare unittest step with these two steps so
the dependency is installed before discovery:

    - run: python -m pip install --requirement requirements-dev.txt
    - run: python -m unittest discover -s tests -v

- [ ] **Step 2: Write the failing case-study tests**

Create tests/test_case_studies.py with:

    import html
    import unittest
    from pypdf import PdfReader

    from site_testlib import ROOT, canonical_href, node_by_id, read_text

    CASES = {
        "cloud-security-automation": (
            "Cloud Security & Automation",
            "epic-cloud-security-automation-public-sample.pdf",
        ),
        "cybersecurity-compliance": (
            "Cybersecurity & Compliance Assessment",
            "epic-cybersecurity-compliance-public-sample.pdf",
        ),
        "disa-stig-hardening": (
            "DISA STIG-Aligned System Hardening",
            "epic-disa-stig-hardening-public-sample.pdf",
        ),
        "managed-it-patch-management": (
            "Managed IT & Patch Management",
            "epic-managed-it-patch-management-public-sample.pdf",
        ),
        "network-infrastructure": (
            "Business Network Infrastructure Design",
            "epic-network-infrastructure-public-sample.pdf",
        ),
        "secure-web-and-sdlc": (
            "Secure Website & Application Practices",
            "epic-secure-web-and-sdlc-public-sample.pdf",
        ),
        "vulnerability-remediation": (
            "Vulnerability Assessment & Remediation",
            "epic-vulnerability-remediation-public-sample.pdf",
        ),
        "zero-trust-access-control": (
            "Zero Trust Access Control",
            "epic-zero-trust-access-control-public-sample.pdf",
        ),
    }

    SECTIONS = (
        "Overview",
        "Business challenge",
        "Example solution",
        "Technologies and methods demonstrated",
        "Business outcomes",
        "What this shows a client",
        "Details intentionally not published",
    )

    class CaseStudyTests(unittest.TestCase):
        def test_case_study_index_links_every_companion(self):
            source = read_text("case-studies/index.html")
            for slug in CASES:
                self.assertIn(f'href="/case-studies/{slug}.html"', source)
            node_by_id(
                ROOT / "case-studies" / "index.html",
                "https://epictech.club/case-studies/#webpage",
            )
            node_by_id(
                ROOT / "case-studies" / "index.html",
                "https://epictech.club/case-studies/#breadcrumb",
            )

        def test_each_case_study_is_server_readable_and_links_its_pdf(self):
            for slug, (title, pdf_name) in CASES.items():
                path = ROOT / "case-studies" / f"{slug}.html"
                with self.subTest(slug=slug):
                    source = read_text(path)
                    self.assertIn(f"<h1>{html.escape(title)}</h1>", source)
                    self.assertEqual(
                        canonical_href(path),
                        f"https://epictech.club/case-studies/{slug}.html",
                    )
                    self.assertIn('<nav class="breadcrumbs" aria-label="Breadcrumb">', source)
                    self.assertIn(f'href="/assets/projects/{pdf_name}"', source)
                    for heading in SECTIONS:
                        self.assertIn(f"<h2>{heading}</h2>", source)
                    node_by_id(
                        path,
                        f"https://epictech.club/case-studies/{slug}.html#webpage",
                    )
                    node_by_id(
                        path,
                        f"https://epictech.club/case-studies/{slug}.html#breadcrumb",
                    )

        def test_service_proof_links_resolve_after_companions_exist(self):
            for path in (ROOT / "services").glob("*.html"):
                source = read_text(path)
                for slug in CASES:
                    href = f"/case-studies/{slug}.html"
                    if href in source:
                        self.assertTrue((ROOT / "case-studies" / f"{slug}.html").exists())

        def test_pdf_metadata_matches_public_case_study(self):
            for title, pdf_name in CASES.values():
                with self.subTest(pdf=pdf_name):
                    metadata = PdfReader(ROOT / "assets" / "projects" / pdf_name).metadata
                    self.assertEqual(metadata.title, title)
                    self.assertEqual(metadata.author, "EPIC TECH LLC")
                    self.assertEqual(metadata.subject, f"EPIC TECH LLC public case study: {title}")

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 3: Run tests and verify missing companions and anonymous metadata**

Run:

    python3 -m venv .venv
    .venv/bin/python -m pip install --requirement requirements-dev.txt
    PYTHONPATH=tests .venv/bin/python -m unittest tests/test_case_studies.py -v

Expected: tests fail because case-studies pages do not exist and PDF metadata is anonymous/unspecified.

- [ ] **Step 4: Create the case-study index**

Use the shared site shell. Set:

- title: Case Studies | EPIC TECH LLC
- canonical: https://epictech.club/case-studies/
- H1: Public case studies
- introductory text: Public examples of EPIC TECH planning, infrastructure, security, and operational work. Sensitive implementation details, credentials, exact commands, IP addresses, and client or school identifiers are intentionally omitted.

List all eight titles from CASES as ordinary links. Add one sentence to each list item using its PDF Overview paragraph, without adding claims beyond the PDF.

Add a WebPage node with ID https://epictech.club/case-studies/#webpage and a
BreadcrumbList node with ID
https://epictech.club/case-studies/#breadcrumb. The breadcrumb contains Home
and Case Studies; the WebPage isPartOf #website and about #business.

- [ ] **Step 5: Create the eight HTML companions**

For each page:

- Use the exact title from CASES for title and H1.
- Use a self-canonical URL under /case-studies/.
- Add a visible breadcrumb with Home, Case Studies, and the current title.
- Add WebPage and BreadcrumbList nodes whose IDs are the self-canonical URL
  plus #webpage and #breadcrumb. The WebPage isPartOf #website and about
  #business; the BreadcrumbList contains Home, Case Studies, and the current
  title.
- Transcribe the public PDF under the seven SECTIONS headings.
- Convert each extracted (cid:127) bullet into a semantic ul/li item.
- Preserve the exact Business Challenge, Example Solution, Business Outcomes, What This Shows a Client, and Details intentionally not published wording.
- Remove repeated PDF headers, footers, page numbers, and extraction artifacts.
- End with a descriptive download link to the mapped PDF and a related-service link using this mapping:
  - cloud-security-automation → /services/automation.html
  - cybersecurity-compliance → /services/firewalls.html
  - disa-stig-hardening → /services/firewalls.html
  - managed-it-patch-management → /services/infrastructure.html
  - network-infrastructure → /services/infrastructure.html
  - secure-web-and-sdlc → /services/webhosting.html
  - vulnerability-remediation → /services/firewalls.html
  - zero-trust-access-control → /services/firewalls.html

Do not publish the omitted details or reconstruct runnable procedures.

- [ ] **Step 6: Add deterministic PDF metadata tooling**

Create tools/update_pdf_metadata.py:

    from pathlib import Path
    from pypdf import PdfReader, PdfWriter

    ROOT = Path(__file__).resolve().parents[1]
    PDF_DIR = ROOT / "assets" / "projects"
    TITLES = {
        "epic-cloud-security-automation-public-sample.pdf": "Cloud Security & Automation",
        "epic-cybersecurity-compliance-public-sample.pdf": "Cybersecurity & Compliance Assessment",
        "epic-disa-stig-hardening-public-sample.pdf": "DISA STIG-Aligned System Hardening",
        "epic-managed-it-patch-management-public-sample.pdf": "Managed IT & Patch Management",
        "epic-network-infrastructure-public-sample.pdf": "Business Network Infrastructure Design",
        "epic-secure-web-and-sdlc-public-sample.pdf": "Secure Website & Application Practices",
        "epic-vulnerability-remediation-public-sample.pdf": "Vulnerability Assessment & Remediation",
        "epic-zero-trust-access-control-public-sample.pdf": "Zero Trust Access Control",
    }

    def update(path, title):
        reader = PdfReader(path)
        writer = PdfWriter()
        writer.clone_document_from_reader(reader)
        writer.add_metadata(
            {
                "/Title": title,
                "/Author": "EPIC TECH LLC",
                "/Subject": f"EPIC TECH LLC public case study: {title}",
                "/Keywords": "EPIC TECH LLC, public case study, Central Florida, small business IT",
                "/Creator": "EPIC TECH LLC",
            }
        )
        temporary = path.with_suffix(".metadata.pdf")
        with temporary.open("wb") as stream:
            writer.write(stream)
        temporary.replace(path)

    if __name__ == "__main__":
        for filename, title in TITLES.items():
            update(PDF_DIR / filename, title)

Run:

    .venv/bin/python tools/update_pdf_metadata.py

Expected: eight PDFs are rewritten with the specified metadata and unchanged page counts.

- [ ] **Step 7: Run case-study and protected-page tests**

Run:

    PYTHONPATH=tests .venv/bin/python -m unittest tests/test_case_studies.py tests/test_protected_pages.py -v

Expected: all tests pass.

- [ ] **Step 8: Commit server-readable proof**

Run:

    git add requirements-dev.txt .github/workflows/site-contracts.yml tools/update_pdf_metadata.py tests/test_case_studies.py case-studies assets/projects
    git commit -m "feat: publish accessible HTML case studies"

---

### Task 6: Correct the Privacy Page Against Existing Data Flows

**Files:**
- Create: tests/test_privacy.py
- Modify: privacy.html
- Do not modify: contact.html
- Do not modify: reviews.html
- Do not modify: assets/js/main.js
- Do not modify: assets/js/reviews.js

**Interfaces:**
- Privacy copy names lead-intake, review-intake, approved review publication, Turnstile, data categories, purposes, processors, retention/deletion, and info@epictech.club.
- Privacy copy does not claim that forms only open an email client or that intake has no server-side processing.

- [ ] **Step 1: Write the failing privacy test**

Create tests/test_privacy.py:

    import unittest

    from site_testlib import ROOT, node_by_id, read_text

    class PrivacyTests(unittest.TestCase):
        def test_privacy_describes_current_data_flows(self):
            source = read_text("privacy.html")
            for phrase in (
                "contact form",
                "review form",
                "intake.epictech.club",
                "Cloudflare Turnstile",
                "name, email address",
                "rating and review text",
                "approved reviews",
                "retention",
                "deletion",
                "info@epictech.club",
            ):
                self.assertIn(phrase, source)

        def test_privacy_removes_inaccurate_claims(self):
            source = read_text("privacy.html")
            self.assertNotIn("Contact requests open your email client", source)
            self.assertNotIn("does not use a database", source)
            self.assertNotIn("no server-side form storage", source)

        def test_privacy_has_page_and_breadcrumb_graphs(self):
            node_by_id(
                ROOT / "privacy.html",
                "https://epictech.club/privacy.html#webpage",
            )
            node_by_id(
                ROOT / "privacy.html",
                "https://epictech.club/privacy.html#breadcrumb",
            )

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 2: Run the test and verify the stale notice fails**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_privacy.py -v

Expected: both tests fail.

- [ ] **Step 3: Replace only the Privacy page body copy**

Keep its self-canonical and shared shell. Use these headings and copy:

    <h1>Privacy</h1>

    <h2>Information you choose to send</h2>
    <p>The contact form sends the information you enter to
    intake.epictech.club so EPIC TECH can review your request and reply. That
    information can include your name, email address, optional business name
    and phone number, the service you select, and your message.</p>

    <p>The review form sends your name, email address, rating and review text
    to intake.epictech.club for verification and moderation. Your email
    address is not displayed publicly. If a review is approved, its name,
    rating and review text may be published on the Reviews page.</p>

    <h2>How information is used</h2>
    <p>EPIC TECH uses submissions to respond to requests, assess whether a
    service is a fit, prevent abuse, verify reviews, publish approved reviews,
    and maintain necessary business records. The site does not use third-party
    analytics or advertising trackers.</p>

    <h2>Cloudflare processing</h2>
    <p>The website uses Cloudflare for site delivery, the intake service, and
    Cloudflare Turnstile. Turnstile processes technical information needed to
    distinguish people from automated abuse. Cloudflare acts under its own
    privacy terms when it provides those services.</p>

    <h2>Retention and deletion</h2>
    <p>Submission data is kept only as long as reasonably necessary to respond,
    operate the intake and review process, prevent abuse, maintain appropriate
    business records, and meet legal obligations. To ask about access,
    correction or deletion of information you submitted, email
    <a href="mailto:info@epictech.club">info@epictech.club</a>.</p>

    <h2>Other destinations</h2>
    <p>Links to WhatsApp or Google take you to services with their own privacy
    practices. Information you provide on those services is handled by the
    service you choose to use.</p>

The owner must review the retention sentence for operational accuracy before publication. If the actual intake system has a fixed deletion schedule, replace “only as long as reasonably necessary” with that exact approved duration and rerun the tests.

- [ ] **Step 4: Add Privacy WebPage and breadcrumb nodes**

Add WebPage ID https://epictech.club/privacy.html#webpage, URL
https://epictech.club/privacy.html, isPartOf #website, about #business, and
breadcrumb #breadcrumb. Add BreadcrumbList ID
https://epictech.club/privacy.html#breadcrumb with Home and Privacy. Do not
describe the Privacy page as a service or add data-handling claims that are
not visible in the corrected notice.

- [ ] **Step 5: Run privacy and protected-page tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_privacy.py tests/test_protected_pages.py -v

Expected: all tests pass and Contact/Reviews hashes remain unchanged.

- [ ] **Step 6: Commit the trust correction**

Run:

    git add privacy.html tests/test_privacy.py
    git commit -m "fix: align privacy notice with intake flows"

---

### Task 7: Rebuild the Sitemap and Gate the Robots Policy on Owner Choice

**Files:**
- Create: tests/test_sitemap_and_robots.py
- Create: docs/crawler-policy.md
- Modify: sitemap.xml
- Modify: robots.txt only after the owner chooses Option A or Option B

**Interfaces:**
- Sitemap locations equal the set of self-canonical HTML pages.
- Sitemap contains no changefreq, priority, index.html duplicate, or PDF URL.
- Search/answer crawlers are allowed in both policy options.
- Training/grounding crawler access is an explicit owner decision recorded in docs/crawler-policy.md.

- [ ] **Step 1: Write the sitemap and crawler-policy contract**

Create tests/test_sitemap_and_robots.py:

    import unittest
    import xml.etree.ElementTree as ET

    from site_testlib import ROOT, canonical_href, html_files, read_text

    SEARCH_AGENTS = (
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

    class SitemapAndRobotsTests(unittest.TestCase):
        def test_sitemap_exactly_matches_html_canonicals(self):
            expected = {canonical_href(path) for path in html_files()}
            tree = ET.parse(ROOT / "sitemap.xml")
            namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            actual = {node.text for node in tree.findall("s:url/s:loc", namespace)}
            self.assertEqual(actual, expected)
            xml = read_text("sitemap.xml")
            self.assertNotIn("<changefreq>", xml)
            self.assertNotIn("<priority>", xml)
            self.assertNotIn("/index.html", xml)
            self.assertNotIn(".pdf</loc>", xml)

        def test_robots_matches_recorded_owner_choice(self):
            robots = read_text("robots.txt")
            policy = read_text("docs/crawler-policy.md")
            self.assertIn("Sitemap: https://epictech.club/sitemap.xml", robots)
            for agent in SEARCH_AGENTS:
                self.assertIn(f"User-agent: {agent}", robots)
            allow = "Training-crawler policy: allow" in policy
            block = "Training-crawler policy: block" in policy
            self.assertNotEqual(allow, block)
            for agent in TRAINING_AGENTS:
                if block:
                    self.assertIn(f"User-agent: {agent}\nDisallow: /", robots)
                else:
                    self.assertNotIn(f"User-agent: {agent}\nDisallow: /", robots)

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 2: Run tests and confirm the expected sitemap/policy failures**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_sitemap_and_robots.py -v

Expected: sitemap equality fails because founder and case studies are absent, changefreq/priority fail, and crawler-policy documentation is absent.

- [ ] **Step 3: Rebuild sitemap.xml from the canonical set**

Write one url entry for every self-canonical HTML page. Include:

- /
- /services/
- /founder.html
- existing About, Pricing, Contact, Reviews, Privacy, and service pages
- /case-studies/
- all eight /case-studies/*.html companion pages

Use lastmod 2026-09-01 for the home, about, founder, service, case-study, and privacy pages changed by this work. Preserve the existing meaningful lastmod for Contact and Reviews because their page-specific content is unchanged. Remove every changefreq and priority element. Do not add PDF URLs.

- [ ] **Step 4: Stop for the owner’s training-crawler policy choice**

Present these mutually exclusive options and do not edit robots.txt until one is selected:

- Option A — allow: permit search/answer retrieval and model-training/grounding crawlers. This maximizes permitted machine access.
- Option B — block: allow search/answer retrieval, but disallow GPTBot, ClaudeBot, and Google-Extended. This does not block OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, or Bingbot.

Record the approved decision in docs/crawler-policy.md as exactly one of:

    Training-crawler policy: allow

or:

    Training-crawler policy: block

Also record:

    Decision date: 2026-09-01
    Search and answer retrieval: allow
    Enforcement note: robots.txt is a preference for compliant crawlers, not access control.
    Cloudflare note: verify AI Crawl Control, WAF, and verified-bot handling separately.

- [ ] **Step 5: Apply the selected robots file exactly**

For Option A:

    User-agent: OAI-SearchBot
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

For Option B, prepend these groups to the Option A content:

    User-agent: GPTBot
    Disallow: /

    User-agent: ClaudeBot
    Disallow: /

    User-agent: Google-Extended
    Disallow: /

- [ ] **Step 6: Run sitemap, robots, canonical, and protected tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_sitemap_and_robots.py tests/test_canonicals.py tests/test_protected_pages.py -v

Expected: all tests pass.

- [ ] **Step 7: Commit the selected discovery policy**

Run:

    git add sitemap.xml robots.txt docs/crawler-policy.md tests/test_sitemap_and_robots.py
    git commit -m "feat: publish canonical sitemap and crawler policy"

---

### Task 8: Document and Roll Out Cloudflare Redirect and Security Headers Safely

**Files:**
- Create: tests/test_security_docs.py
- Replace: docs/security-headers.md
- Modify after live enforcement is verified: all HTML files containing meta http-equiv="Content-Security-Policy" except contact.html and reviews.html
- Do not modify: Contact or Reviews main content, fields, scripts, or endpoints

**Interfaces:**
- Standard-page CSP permits only self-hosted runtime assets and has frame-src 'none'.
- Contact/Reviews CSP adds only challenges.cloudflare.com for script/frame and intake.epictech.club for connect.
- Both policies include object-src 'none', base-uri 'self', frame-ancestors 'none', and no unsafe-inline/unsafe-eval.
- PDF responses receive X-Robots-Tag: noindex, follow.
- HSTS remains max-age=15552000 until every subdomain is separately confirmed permanently HTTPS-only.

- [ ] **Step 1: Write the failing security-document contract**

Create tests/test_security_docs.py:

    import unittest

    from site_testlib import read_text

    STANDARD_CSP = (
        "default-src 'self'; base-uri 'self'; object-src 'none'; "
        "script-src 'self'; style-src 'self'; img-src 'self' data:; "
        "font-src 'self'; connect-src 'self'; frame-src 'none'; "
        "form-action 'self' mailto:; frame-ancestors 'none'; "
        "upgrade-insecure-requests"
    )
    FORM_CSP = (
        "default-src 'self'; base-uri 'self'; object-src 'none'; "
        "script-src 'self' https://challenges.cloudflare.com; "
        "style-src 'self'; img-src 'self' data:; font-src 'self'; "
        "connect-src 'self' https://intake.epictech.club; "
        "frame-src https://challenges.cloudflare.com; form-action 'self'; "
        "frame-ancestors 'none'; upgrade-insecure-requests"
    )

    class SecurityDocumentationTests(unittest.TestCase):
        def test_runbook_contains_exact_csp_policies(self):
            runbook = read_text("docs/security-headers.md")
            self.assertIn(STANDARD_CSP, runbook)
            self.assertIn(FORM_CSP, runbook)
            self.assertNotIn("unsafe-inline", STANDARD_CSP + FORM_CSP)
            self.assertNotIn("unsafe-eval", STANDARD_CSP + FORM_CSP)

        def test_runbook_contains_required_headers_and_pdf_rule(self):
            runbook = read_text("docs/security-headers.md")
            for line in (
                "X-Frame-Options: DENY",
                "Referrer-Policy: strict-origin-when-cross-origin",
                "Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()",
                "X-Content-Type-Options: nosniff",
                "Strict-Transport-Security: max-age=15552000",
                "X-Robots-Tag: noindex, follow",
                'starts_with(http.request.uri.path, "/assets/projects/")',
                'ends_with(http.request.uri.path, ".pdf")',
            ):
                self.assertIn(line, runbook)

        def test_runbook_requires_report_only_before_enforcement(self):
            runbook = read_text("docs/security-headers.md")
            report = runbook.index("Content-Security-Policy-Report-Only")
            enforce = runbook.index("Content-Security-Policy:")
            remove_meta = runbook.index("Remove the meta CSP")
            self.assertLess(report, enforce)
            self.assertLess(enforce, remove_meta)

    if __name__ == "__main__":
        unittest.main()

- [ ] **Step 2: Run tests and verify the old runbook fails**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_security_docs.py -v

Expected: failures for exact CSP variants, report-only order, PDF noindex, and conservative HSTS.

- [ ] **Step 3: Replace docs/security-headers.md with an exact three-stage runbook**

The document must include these exact Cloudflare expressions:

Standard HTML:

    (http.host eq "epictech.club" and not (http.request.uri.path in {"/contact.html" "/reviews.html"}) and not ends_with(http.request.uri.path, ".pdf"))

Contact and Reviews:

    (http.host eq "epictech.club" and http.request.uri.path in {"/contact.html" "/reviews.html"})

Public PDFs:

    (http.host eq "epictech.club" and starts_with(http.request.uri.path, "/assets/projects/") and ends_with(http.request.uri.path, ".pdf"))

The exact standard CSP is:

    default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; form-action 'self' mailto:; frame-ancestors 'none'; upgrade-insecure-requests

The exact Contact/Reviews CSP is:

    default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://intake.epictech.club; frame-src https://challenges.cloudflare.com; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests

Every apex-page response rule sets:

    X-Frame-Options: DENY
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
    X-Content-Type-Options: nosniff
    Strict-Transport-Security: max-age=15552000

The PDF rule sets:

    X-Robots-Tag: noindex, follow

Document this exact rollout:

1. Stage 1 — report only:
   - Keep every existing meta CSP in place as enforcement.
   - Add the two path-specific policies as Content-Security-Policy-Report-Only.
   - Add X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, and the existing conservative HSTS value.
   - Add the PDF X-Robots-Tag rule.
   - Test home, founder, all services, all case studies, Privacy, Contact, and Reviews in browser consoles.
   - Exercise mobile navigation, all service destinations, contact submission, review retrieval, review submission, Turnstile, and WhatsApp.

2. Stage 2 — enforce:
   - Replace Content-Security-Policy-Report-Only with Content-Security-Policy using the same path-specific values.
   - Keep meta CSP temporarily; the intersection must not break a tested flow.
   - Verify live headers and critical flows again.
   - If any critical flow fails, disable only the new enforcing CSP rules and retain the meta policy while investigating.

3. Stage 3 — remove duplicate meta policy:
   - Use this gate sentence in the runbook: Remove the meta CSP from non-protected HTML only after the enforcing response header is live.
   - Only after live Content-Security-Policy is confirmed on both a standard page and Contact/Reviews, remove the meta CSP from non-protected HTML in one code commit.
   - Leave the matching meta CSP in contact.html and reviews.html so this security rollout does not change their source structure. The enforced response-header CSP remains authoritative and adds object-src and effective frame-ancestors protection.
   - Run the full local suite and deploy.
   - Verify headers and critical flows a third time.
   - Remove any remaining report-only rule after the enforced policy is clean.

State explicitly:

- Do not add unsafe-inline or unsafe-eval.
- Do not self-host or hash the dynamic Turnstile script.
- Do not add Cloudflare Web Analytics, external fonts, trackers, review widgets, or CDNs.
- Do not expand HSTS to includeSubDomains or preload until epictech.club, intake.epictech.club, and every other subdomain are confirmed permanently HTTPS-capable and the owner approves the irreversible risk.
- Do not whitelist bots by User-Agent alone; use Cloudflare verified-bot classifications or provider-published networks.

- [ ] **Step 4: Run the documentation tests**

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_security_docs.py -v

Expected: all tests pass.

- [ ] **Step 5: Commit the deployment runbook before changing Cloudflare**

Run:

    git add docs/security-headers.md tests/test_security_docs.py
    git commit -m "docs: define staged Cloudflare security headers"

- [ ] **Step 6: Obtain owner approval and activate Stage 1 only**

In Cloudflare Rules → Transform Rules → Modify Response Header, add the report-only and standard security-header rules exactly as documented. Add the PDF X-Robots-Tag rule. Do not activate enforcing CSP and do not remove meta CSP in this step.

Run:

    curl -sS -I https://epictech.club/
    curl -sS -I https://epictech.club/contact.html
    curl -sS -I https://epictech.club/reviews.html
    curl -sS -I https://epictech.club/assets/projects/epic-network-infrastructure-public-sample.pdf

Expected:

- Standard page has the standard Content-Security-Policy-Report-Only value.
- Contact and Reviews have the Turnstile/intake Content-Security-Policy-Report-Only value.
- All have DENY, strict-origin-when-cross-origin, Permissions-Policy, nosniff, and max-age=15552000.
- PDF has X-Robots-Tag: noindex, follow.

- [ ] **Step 7: Complete the report-only critical-flow check**

Manually verify:

- Home and every featured service link.
- Founder, About, Pricing, Privacy, case-study index, and all eight case studies.
- Mobile menu open, Escape close, focus visibility, and ordinary-link navigation.
- Contact Turnstile loads and one approved test submission reaches lead-intake.
- Reviews retrieval loads; one approved test review submission reaches review-intake without publishing automatically.
- WhatsApp opens with noopener/noreferrer intact.
- No unexpected CSP report-only violations appear in browser consoles.

Contact and Reviews main content must still pass their hash tests.

- [ ] **Step 8: Obtain a second owner approval and activate Stage 2**

Replace the report-only header names with enforcing Content-Security-Policy. Keep meta CSP in HTML. Repeat the curl and critical-flow checks from Steps 6 and 7.

If a flow fails, disable the new enforcing CSP transform rules. Do not loosen script-src, connect-src, frame-src, or form-action during rollback.

- [ ] **Step 9: Remove non-protected meta CSP only after live enforcement is proven**

Write a failing test in tests/test_security_docs.py:

First change its helper import to:

    from site_testlib import html_files, read_text

        def test_non_protected_meta_csp_is_removed_after_header_enforcement(self):
            protected = {"contact.html", "reviews.html"}
            failures = [
                str(path)
                for path in html_files()
                if path.name not in protected
                and 'http-equiv="Content-Security-Policy"' in read_text(path)
            ]
            self.assertEqual(failures, [])
            for name in protected:
                self.assertIn(
                    'http-equiv="Content-Security-Policy"',
                    read_text(name),
                )

Run:

    PYTHONPATH=tests python3 -m unittest tests/test_security_docs.py -v

Expected: the new test fails for every non-protected HTML page that still has
a meta CSP. Contact and Reviews continue to satisfy the explicit-presence
assertions.

Add this method inside SecurityDocumentationTests. Use apply_patch to remove
only the meta CSP element from each non-protected HTML head. Do not alter
contact.html, reviews.html, other metadata, or scripts.

Run:

    PYTHONPATH=tests python3 -m unittest discover -s tests -v

Expected: all tests pass, including protected Contact/Reviews contracts.

- [ ] **Step 10: Commit meta-policy retirement**

Run:

    git add -- '*.html' tests/test_security_docs.py
    git commit -m "security: rely on verified response-header CSP"

---

### Task 9: Full Release Verification and Pull-Request Gate

**Files:**
- Create: docs/release-verification.md
- Modify only if a test exposes a defect: the file responsible for that defect
- Do not update expected protected-page hashes

**Interfaces:**
- Produces a completed evidence checklist for the pull request.
- Requires all local contracts, live Cloudflare checks, structured-data checks, and critical-flow checks.

- [ ] **Step 1: Run the entire automated suite from a clean shell**

Run:

    .venv/bin/python -m pip install --requirement requirements-dev.txt
    PYTHONPATH=tests .venv/bin/python -m unittest discover -s tests -v
    git diff --check

Expected: all tests pass and git diff --check produces no output.

- [ ] **Step 2: Check JavaScript syntax**

Run:

    node --check assets/js/main.js
    node --check assets/js/qualification.js
    node --check assets/js/reviews.js

Expected: each command exits zero with no syntax error.

- [ ] **Step 3: Serve the static site and exercise local routes**

Run in one terminal:

    python3 -m http.server 8000

Run in another:

    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/founder.html
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/services/
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/case-studies/
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/privacy.html
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/contact.html
    curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/reviews.html

Expected: seven 200 responses.

- [ ] **Step 4: Validate machine-readable outputs**

Validate these URLs in Schema.org Validator:

- https://epictech.club/
- https://epictech.club/about.html
- https://epictech.club/founder.html
- https://epictech.club/services/firewalls.html
- https://epictech.club/services/app-building.html
- https://epictech.club/case-studies/network-infrastructure.html

Validate supported WebSite, Organization, BreadcrumbList, and ProfilePage representations. Record Service as valid Schema.org vocabulary without claiming a Google service rich result.

Check Google Rich Results Test only for supported types and record warnings separately from errors.

- [ ] **Step 5: Validate indexing and crawler surfaces**

Run:

    curl -sS https://epictech.club/robots.txt
    curl -sS https://epictech.club/sitemap.xml
    curl -sS -A 'OAI-SearchBot' -o /dev/null -w '%{http_code}\n' https://epictech.club/
    curl -sS -A 'Claude-SearchBot' -o /dev/null -w '%{http_code}\n' https://epictech.club/
    curl -sS -A 'PerplexityBot' -o /dev/null -w '%{http_code}\n' https://epictech.club/

Expected: public HTML, robots.txt, and sitemap.xml return 200 without a challenge. Treat User-Agent curl checks as smoke tests only. Confirm actual verified-bot access in Cloudflare AI Crawl Control/WAF logs; do not whitelist the strings alone.

- [ ] **Step 6: Validate redirects and response headers live**

Run every command in docs/cloudflare-redirects.md and docs/security-headers.md. Confirm:

- /index.html returns one 301 to /.
- /services/index.html returns one 301 to /services/.
- Standard and Turnstile CSP variants are enforced on the correct paths.
- X-Frame-Options, Referrer-Policy, Permissions-Policy, nosniff, and conservative HSTS are present.
- Every public case-study PDF receives X-Robots-Tag: noindex, follow.

- [ ] **Step 7: Validate performance and visual regressions**

Run Lighthouse/PageSpeed mobile checks on:

- /
- /services/firewalls.html
- /founder.html
- /case-studies/network-infrastructure.html
- /contact.html
- /reviews.html

Record LCP, INP, and CLS. Field targets at the 75th percentile are LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1. Do not claim field compliance from a single lab run.

At 320, 768, 1024, and 1440 CSS pixels, verify:

- no horizontal overflow;
- visible keyboard focus;
- breadcrumb wrapping;
- image dimensions prevent layout movement;
- Contact and Reviews retain their approved page-specific layout and functions;
- reduced-motion preference removes nonessential motion.

- [ ] **Step 8: Write the release evidence**

Create docs/release-verification.md with checked entries and recorded results for:

- automated test command and pass count;
- JavaScript syntax checks;
- canonical redirects;
- sitemap/canonical equality;
- selected crawler policy;
- Cloudflare verified-bot log check;
- Schema.org and Google validation;
- report-only and enforcing CSP stages;
- Contact submission;
- review retrieval and submission;
- Turnstile;
- WhatsApp;
- PDF noindex headers;
- Lighthouse/PageSpeed measurements;
- Contact/Reviews protected hashes;
- owner Privacy retention review.

Do not mark an item complete without the corresponding output or manual observation.

- [ ] **Step 9: Commit verification evidence**

Run:

    git add docs/release-verification.md
    git commit -m "docs: record discoverability release verification"

- [ ] **Step 10: Review the final branch and open the pull request**

Run:

    git status --short
    git log --oneline --decorate -12
    git diff --stat main...HEAD
    git diff --check main...HEAD

Expected: working tree is clean, commits are task-sized, and diff-check is clean.

Open a pull request that:

- links the approved design spec and this plan;
- identifies the selected training-crawler policy;
- states that Contact and Reviews page-specific content, structure, fields, APIs, and behavior are unchanged;
- lists Cloudflare rules as manual deployment gates;
- includes test, structured-data, header, critical-flow, and performance evidence;
- states that llms.txt is deferred as an optional experiment;
- requests review without merging or deploying.
