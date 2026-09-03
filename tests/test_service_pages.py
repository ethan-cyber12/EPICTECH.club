from __future__ import annotations

from html import unescape
import json
import re
import unittest

from tests.site_contracts import (
    ROOT,
    canonical_href,
    element_ids,
    hrefs,
    json_ld_graph,
    local_target,
    main_inner,
    node_by_id,
    read_text,
    sha256_text,
)


WEBSITE = "https://epictech.club/#website"
BUSINESS = "https://epictech.club/#business"
AREA_SERVED = {"@type": "AdministrativeArea", "name": "Central Florida"}

SERVICE_PAGES = {
    "app-building.html": {
        "canonical": "https://epictech.club/services/app-building.html",
        "title": "Business Apps & Dashboards in Orlando | EPIC TECH LLC",
        "title_term": "Business Apps & Dashboards",
        "name": "Business Apps & Dashboards",
        "h1": "Business Apps & Internal Dashboards",
        "prices": ("$150", "$1,000+", "$149 /mo"),
        "contact_links": 7,
        "proof": "/case-studies/secure-web-and-sdlc.html",
        "proof_name": "Secure Website & Application Practices",
        "related": (
            ("automation.html", "Automation"),
            ("software.html", "Forms & Internal Tools"),
        ),
        "pdfs": (),
    },
    "automation.html": {
        "canonical": "https://epictech.club/services/automation.html",
        "title": "Automation Services | EPIC TECH LLC",
        "title_term": "Automation",
        "name": "Automation",
        "h1": "Small automation that saves time and reduces mistakes",
        "prices": ("$249", "$399", "$99 /mo"),
        "contact_links": 6,
        "proof": "/case-studies/cloud-security-automation.html",
        "proof_name": "Cloud Security & Automation",
        "related": (
            ("app-building.html", "Business Apps & Dashboards"),
            ("software.html", "Forms & Internal Tools"),
        ),
        "pdfs": (
            "../assets/projects/epic-cloud-security-automation-public-sample.pdf",
        ),
    },
    "ecommerce.html": {
        "canonical": "https://epictech.club/services/ecommerce.html",
        "title": "E-Commerce Solutions | EPIC TECH LLC",
        "title_term": "E-Commerce",
        "name": "E-Commerce",
        "h1": "Professional online stores built to generate sales",
        "prices": ("$249", "$1,999", "$299", "$199/mo"),
        "contact_links": 7,
        "proof": "/case-studies/secure-web-and-sdlc.html",
        "proof_name": "Secure Website & Application Practices",
        "related": (
            ("webhosting.html", "Websites"),
            ("app-building.html", "Business Apps & Dashboards"),
        ),
        "pdfs": (),
    },
    "firewalls.html": {
        "canonical": "https://epictech.club/services/firewalls.html",
        "title": "Firewall & Network Security | EPIC TECH LLC",
        "title_term": "Security",
        "name": "Firewalls & Security",
        "h1": "Firewall and network security for small businesses",
        "prices": ("$249", "$1,499", "$149 /mo"),
        "contact_links": 6,
        "proof": "/case-studies/cybersecurity-compliance.html",
        "proof_name": "Cybersecurity & Compliance Assessment",
        "related": (
            ("infrastructure.html", "Network & Wi-Fi"),
            ("webhosting.html", "Websites"),
        ),
        "pdfs": (
            "../assets/projects/epic-zero-trust-access-control-public-sample.pdf",
            "../assets/projects/epic-vulnerability-remediation-public-sample.pdf",
            "../assets/projects/epic-cybersecurity-compliance-public-sample.pdf",
        ),
    },
    "infrastructure.html": {
        "canonical": "https://epictech.club/services/infrastructure.html",
        "title": "Infrastructure & Business Wi-Fi | EPIC TECH LLC",
        "title_term": "Wi-Fi",
        "name": "Network & Wi-Fi",
        "h1": "Clean Wi-Fi and network setups that make sense",
        "prices": ("$249", "$499", "$1,999"),
        "contact_links": 6,
        "proof": "/case-studies/network-infrastructure.html",
        "proof_name": "Business Network Infrastructure Design",
        "related": (
            ("firewalls.html", "Firewalls & Security"),
            ("virtualization.html", "Virtualization Labs"),
        ),
        "pdfs": (
            "../assets/projects/epic-network-infrastructure-public-sample.pdf",
        ),
    },
    "software.html": {
        "canonical": "https://epictech.club/services/software.html",
        "title": "Forms & Internal Tools | EPIC TECH LLC",
        "title_term": "Forms & Internal Tools",
        "name": "Forms & Internal Tools",
        "h1": "Lightweight tools for real business problems",
        "prices": ("$249", "$599", "$99 /mo"),
        "contact_links": 6,
        "proof": "/case-studies/secure-web-and-sdlc.html",
        "proof_name": "Secure Website & Application Practices",
        "related": (
            ("app-building.html", "Business Apps & Dashboards"),
            ("automation.html", "Automation"),
        ),
        "pdfs": (),
    },
    "virtualization.html": {
        "canonical": "https://epictech.club/services/virtualization.html",
        "title": "Virtualization Labs | EPIC TECH LLC",
        "title_term": "Virtualization Labs",
        "name": "Virtualization Labs",
        "h1": "Safe test labs for learning, demos, and small internal systems",
        "prices": ("$249", "$699", "$99 /mo"),
        "contact_links": 6,
        "proof": "/case-studies/cloud-security-automation.html",
        "proof_name": "Cloud Security & Automation",
        "related": (
            ("infrastructure.html", "Network & Wi-Fi"),
            ("firewalls.html", "Firewalls & Security"),
        ),
        "pdfs": (),
    },
    "webhosting.html": {
        "canonical": "https://epictech.club/services/webhosting.html",
        "title": "Websites & Hosting | EPIC TECH LLC",
        "title_term": "Websites",
        "name": "Websites",
        "h1": "Business websites and online stores that are fast, secure, and built to grow",
        "prices": ("$349", "$999", "$99 /mo"),
        "contact_links": 6,
        "proof": "/case-studies/secure-web-and-sdlc.html",
        "proof_name": "Secure Website & Application Practices",
        "related": (
            ("ecommerce.html", "E-Commerce"),
            ("firewalls.html", "Firewalls & Security"),
        ),
        "pdfs": (
            "../assets/projects/epic-secure-web-and-sdlc-public-sample.pdf",
        ),
    },
}


def visible_text(markup: str) -> str:
    return " ".join(unescape(re.sub(r"<[^>]+>", " ", markup)).split())


def element_text(markup: str, tag: str, attributes: str = "") -> str:
    match = re.search(
        rf"<{tag}{attributes}[^>]*>(.*?)</{tag}>",
        markup,
        re.IGNORECASE | re.DOTALL,
    )
    if match is None:
        raise AssertionError(f"missing {tag}{attributes}")
    return visible_text(match.group(1))


def section_by_id(markup: str, section_id: str) -> str:
    pattern = rf'<section\b(?=[^>]*\bid="{re.escape(section_id)}")[^>]*>(.*?)</section>'
    match = re.search(pattern, markup, re.IGNORECASE | re.DOTALL)
    if match is None:
        raise AssertionError(f"missing section #{section_id}")
    return match.group(1)


class ServicePageDiscoverabilityTests(unittest.TestCase):
    def test_hub_has_visible_breadcrumb_and_webpage_graph_without_aggregate_service(self) -> None:
        path = ROOT / "services/index.html"
        source = read_text(path)
        nodes = json_ld_graph(path)
        page_id = "https://epictech.club/services/#webpage"
        breadcrumb_id = "https://epictech.club/services/#breadcrumb"

        self.assertEqual(source.count('type="application/ld+json"'), 1)
        self.assertEqual({node["@id"] for node in nodes}, {page_id, breadcrumb_id})
        self.assertNotIn("Service", {node["@type"] for node in nodes})

        page = node_by_id(path, page_id)
        self.assertEqual(page["@type"], "WebPage")
        self.assertEqual(page["url"], "https://epictech.club/services/")
        self.assertEqual(page["name"], "Pick the problem you want fixed")
        self.assertEqual(page["isPartOf"], {"@id": WEBSITE})
        self.assertEqual(page["about"], {"@id": BUSINESS})
        self.assertEqual(page["breadcrumb"], {"@id": breadcrumb_id})

        breadcrumb = node_by_id(path, breadcrumb_id)
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
                    "name": "Services",
                    "item": "https://epictech.club/services/",
                },
            ],
        )

        visible_breadcrumb = re.search(
            r'<nav class="breadcrumb" aria-label="Breadcrumb">(.*?)</nav>',
            source,
            re.DOTALL,
        )
        self.assertIsNotNone(visible_breadcrumb)
        self.assertEqual(visible_text(visible_breadcrumb.group(1)), "Home Services")
        self.assertIn('href="/"', visible_breadcrumb.group(1))
        self.assertIn('aria-current="page">Services', visible_breadcrumb.group(1))

    def test_detail_graphs_match_canonical_h1_and_visible_breadcrumb(self) -> None:
        for filename, expected in SERVICE_PAGES.items():
            path = ROOT / "services" / filename
            source = read_text(path)
            canonical = expected["canonical"]
            page_id = f"{canonical}#webpage"
            breadcrumb_id = f"{canonical}#breadcrumb"
            service_id = f"{canonical}#service"

            with self.subTest(filename=filename):
                self.assertEqual(source.count('type="application/ld+json"'), 1)
                self.assertEqual(canonical_href(path), canonical)
                self.assertEqual(
                    {node["@id"] for node in json_ld_graph(path)},
                    {page_id, breadcrumb_id, service_id},
                )

                title = element_text(source, "title")
                h1 = element_text(main_inner(path), "h1")
                breadcrumb_name = element_text(
                    source,
                    "li",
                    r'(?=[^>]*\baria-current="page")',
                )
                self.assertEqual(title, expected["title"])
                self.assertIn(expected["title_term"], title)
                self.assertEqual(h1, expected["h1"])
                self.assertEqual(breadcrumb_name, expected["name"])

                page = node_by_id(path, page_id)
                self.assertEqual(page["@type"], "WebPage")
                self.assertEqual(page["url"], canonical)
                self.assertEqual(page["name"], h1)
                self.assertEqual(page["isPartOf"], {"@id": WEBSITE})
                self.assertEqual(page["about"], {"@id": service_id})
                self.assertEqual(page["mainEntity"], {"@id": service_id})
                self.assertEqual(page["breadcrumb"], {"@id": breadcrumb_id})

                service = node_by_id(path, service_id)
                self.assertEqual(service["@type"], "Service")
                self.assertEqual(service["name"], breadcrumb_name)
                self.assertEqual(service["serviceType"], breadcrumb_name)
                self.assertEqual(service["url"], canonical)
                self.assertEqual(service["provider"], {"@id": BUSINESS})
                self.assertEqual(service["areaServed"], AREA_SERVED)
                self.assertEqual(service["mainEntityOfPage"], {"@id": page_id})
                self.assertNotIn("offers", service)
                self.assertNotIn("Offer", json.dumps(json_ld_graph(path)))

                breadcrumb = node_by_id(path, breadcrumb_id)
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
                            "name": "Services",
                            "item": "https://epictech.club/services/",
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": breadcrumb_name,
                            "item": canonical,
                        },
                    ],
                )

    def test_each_service_has_one_mapped_html_proof_and_two_related_services(self) -> None:
        for filename, expected in SERVICE_PAGES.items():
            source = read_text(ROOT / "services" / filename)
            with self.subTest(filename=filename):
                proof_links = re.findall(
                    r'href="(/case-studies/[^"#]+\.html)"', source
                )
                self.assertEqual(proof_links, [expected["proof"]])
                proof = section_by_id(source, "proof")
                self.assertIn(f'href="{expected["proof"]}"', proof)
                self.assertIn(
                    f'Read the HTML case study: {expected["proof_name"]}',
                    visible_text(proof),
                )

                related = section_by_id(source, "related-services")
                related_links = re.findall(
                    r'<a class="service-destination" href="([^"]+)">(.*?)</a>',
                    related,
                    re.DOTALL,
                )
                self.assertEqual(
                    tuple((href, visible_text(label)) for href, label in related_links),
                    expected["related"],
                )

    def test_existing_prices_contact_destinations_and_pdf_downloads_are_preserved(self) -> None:
        for filename, expected in SERVICE_PAGES.items():
            source = read_text(ROOT / "services" / filename)
            prices = tuple(
                visible_text(markup)
                for markup in re.findall(
                    r'<p class="price">(.*?)</p>', source, re.DOTALL
                )
            )
            pdfs = tuple(re.findall(r'href="([^"]+\.pdf)"', source))
            with self.subTest(filename=filename):
                self.assertEqual(prices, expected["prices"])
                self.assertEqual(
                    source.count('href="../contact.html"'),
                    expected["contact_links"],
                )
                self.assertEqual(pdfs, expected["pdfs"])

    def test_new_links_and_same_page_fragments_resolve_locally(self) -> None:
        paths = [ROOT / "services/index.html"] + [
            ROOT / "services" / filename for filename in SERVICE_PAGES
        ]
        for path in paths:
            ids = element_ids(path)
            for href in hrefs(path):
                target = local_target(path, href)
                if target is None:
                    continue
                destination, fragment = target
                with self.subTest(path=path.name, href=href):
                    self.assertTrue(destination.exists(), href)
                    if fragment:
                        if destination == path.resolve():
                            self.assertIn(fragment, ids, href)
                        else:
                            self.assertIn(fragment, element_ids(destination), href)

    def test_contact_reviews_and_behavior_script_hashes_are_unchanged(self) -> None:
        baseline = json.loads(
            read_text("tests/fixtures/contact_reviews_regression.json")
        )
        for page, expected_hash in baseline["main_inner_sha256"].items():
            with self.subTest(page=page):
                self.assertEqual(sha256_text(main_inner(page)), expected_hash)
        for script, expected_hash in baseline["script_sha256"].items():
            with self.subTest(script=script):
                self.assertEqual(sha256_text(read_text(script)), expected_hash)


if __name__ == "__main__":
    unittest.main()
