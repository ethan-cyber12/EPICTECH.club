from __future__ import annotations

import html
import json
import re
import unittest

from tests.site_contracts import ROOT, json_ld_graph, main_inner, node_by_id, read_text


WEBSITE = "https://epictech.club/#website"
BUSINESS = "https://epictech.club/#business"
PERSON = "https://epictech.club/#ethan-platt"

PAGE_CONTRACTS = {
    "index.html": {
        "id": "https://epictech.club/#webpage",
        "type": "WebPage",
        "url": "https://epictech.club/",
        "name": "Small Business IT, Networks & Websites | EPIC TECH, Orlando",
    },
    "about.html": {
        "id": "https://epictech.club/about.html#webpage",
        "type": "AboutPage",
        "url": "https://epictech.club/about.html",
        "name": "Technology built for small businesses. Security-first, documented, and priced to fit",
    },
    "founder.html": {
        "id": "https://epictech.club/founder.html#webpage",
        "type": "ProfilePage",
        "url": "https://epictech.club/founder.html",
        "name": "Technology should make work easier to understand and easier to do.",
    },
    "pricing.html": {
        "id": "https://epictech.club/pricing.html#webpage",
        "type": "WebPage",
        "url": "https://epictech.club/pricing.html",
        "name": "Simple packages. No guessing",
    },
}

BREADCRUMBS = {
    "about.html": ("About", "https://epictech.club/about.html"),
    "founder.html": ("Founder", "https://epictech.club/founder.html"),
    "pricing.html": ("Pricing", "https://epictech.club/pricing.html"),
}


def types_in(nodes: list[dict]) -> set[str]:
    types: set[str] = set()
    for node in nodes:
        node_types = node.get("@type", [])
        if isinstance(node_types, str):
            node_types = [node_types]
        types.update(node_types)
    return types


def walk_json(value):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def visible_text(markup: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", markup)
    return " ".join(html.unescape(without_tags).split())


def h1_text(main_markup: str) -> str:
    match = re.search(r"<h1(?:\s[^>]*)?>(.*?)</h1>", main_markup, re.IGNORECASE | re.DOTALL)
    if match is None:
        raise AssertionError("main element has no h1")
    return visible_text(match.group(1))


def title_text(source: str) -> str:
    match = re.search(r"<title>(.*?)</title>", source, re.IGNORECASE | re.DOTALL)
    if match is None:
        raise AssertionError("document has no title")
    return visible_text(match.group(1))


class StructuredDataTests(unittest.TestCase):
    def test_home_defines_the_stable_site_business_person_and_page_entities(self) -> None:
        path = ROOT / "index.html"
        nodes = json_ld_graph(path)

        self.assertEqual(
            {node["@id"] for node in nodes},
            {
                WEBSITE,
                BUSINESS,
                PERSON,
                "https://epictech.club/#webpage",
            },
        )
        self.assertEqual(types_in(nodes), {"WebSite", "Organization", "Person", "WebPage"})

        website = node_by_id(path, WEBSITE)
        self.assertEqual(website["url"], "https://epictech.club/")
        self.assertEqual(website["name"], "EPIC TECH LLC")
        self.assertEqual(website["publisher"], {"@id": BUSINESS})

        business = node_by_id(path, BUSINESS)
        self.assertEqual(business["name"], "EPIC TECH LLC")
        self.assertEqual(business["url"], "https://epictech.club/")
        self.assertEqual(business["founder"], {"@id": PERSON})
        self.assertEqual(
            business["areaServed"],
            {"@type": "AdministrativeArea", "name": "Central Florida"},
        )
        self.assertEqual(
            business["logo"],
            {
                "@type": "ImageObject",
                "url": "https://epictech.club/assets/images/logo/epic-tech-logo-final.webp",
                "width": 787,
                "height": 904,
            },
        )

        person = node_by_id(path, PERSON)
        self.assertEqual(person["name"], "Ethan Platt")
        self.assertEqual(person["jobTitle"], "Founder")
        self.assertEqual(person["worksFor"], {"@id": BUSINESS})
        self.assertEqual(person["url"], "https://epictech.club/founder.html")

        page = node_by_id(path, "https://epictech.club/#webpage")
        self.assertEqual(page["about"], {"@id": BUSINESS})

    def test_core_pages_have_stable_types_self_urls_names_and_site_references(self) -> None:
        for filename, expected in PAGE_CONTRACTS.items():
            with self.subTest(filename=filename):
                page = node_by_id(ROOT / filename, expected["id"])
                self.assertEqual(page["@type"], expected["type"])
                self.assertEqual(page["url"], expected["url"])
                self.assertEqual(page["name"], expected["name"])
                self.assertEqual(page["isPartOf"], {"@id": WEBSITE})
                if filename == "index.html":
                    self.assertEqual(page["name"], title_text(read_text(filename)))
                else:
                    self.assertEqual(page["name"], h1_text(main_inner(filename)))

    def test_secondary_pages_have_ordered_self_referencing_breadcrumbs(self) -> None:
        for filename, (label, url) in BREADCRUMBS.items():
            with self.subTest(filename=filename):
                breadcrumb_id = f"{url}#breadcrumb"
                page_id = PAGE_CONTRACTS[filename]["id"]
                page = node_by_id(ROOT / filename, page_id)
                breadcrumb = node_by_id(ROOT / filename, breadcrumb_id)

                self.assertEqual(page["breadcrumb"], {"@id": breadcrumb_id})
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
                            "name": label,
                            "item": url,
                        },
                    ],
                )

    def test_about_pricing_and_founder_pages_reference_their_visible_entities(self) -> None:
        about = node_by_id(ROOT / "about.html", PAGE_CONTRACTS["about.html"]["id"])
        self.assertEqual(about["about"], {"@id": BUSINESS})
        self.assertEqual(about["mainEntity"], {"@id": BUSINESS})

        pricing = node_by_id(ROOT / "pricing.html", PAGE_CONTRACTS["pricing.html"]["id"])
        self.assertEqual(pricing["about"], {"@id": BUSINESS})

        founder = node_by_id(ROOT / "founder.html", PAGE_CONTRACTS["founder.html"]["id"])
        self.assertEqual(founder["mainEntity"], {"@id": PERSON})

    def test_founder_person_description_and_two_degree_credentials_are_exact(self) -> None:
        person = node_by_id(ROOT / "founder.html", PERSON)
        self.assertEqual(person["@type"], "Person")
        self.assertEqual(person["name"], "Ethan Platt")
        self.assertEqual(person["jobTitle"], "Founder")
        self.assertEqual(person["worksFor"], {"@id": BUSINESS})
        self.assertEqual(person["url"], "https://epictech.club/founder.html")
        self.assertEqual(
            person["description"],
            "A veteran founder focused on building clear, practical solutions.",
        )

        credentials = person["hasCredential"]
        self.assertEqual(len(credentials), 2)
        self.assertEqual(
            credentials,
            [
                {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": "degree",
                    "name": "Bachelor of Science in Information Technology",
                },
                {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": "degree",
                    "name": "Bachelor of Science in Cybersecurity",
                },
            ],
        )

        source = visible_text(main_inner("founder.html"))
        for visible_fact in (
            "A veteran founder focused on building clear, practical solutions.",
            "B.S. in Information Technology",
            "B.S. in Cybersecurity",
            "valedictorian",
            "Advanced Achievement Award recipient",
        ):
            self.assertIn(visible_fact, source)

    def test_visible_content_mutations_cannot_be_satisfied_by_unchanged_json_ld(self) -> None:
        page = node_by_id(ROOT / "founder.html", PAGE_CONTRACTS["founder.html"]["id"])
        person = node_by_id(ROOT / "founder.html", PERSON)
        main_markup = main_inner("founder.html")

        mutated_h1 = main_markup.replace(
            page["name"],
            "Changed visible founder heading",
            1,
        )
        self.assertNotEqual(mutated_h1, main_markup)
        with self.assertRaises(AssertionError):
            self.assertEqual(page["name"], h1_text(mutated_h1))

        mutated_description = main_markup.replace(
            person["description"],
            "Changed visible founder statement.",
            1,
        )
        self.assertNotEqual(mutated_description, main_markup)
        with self.assertRaises(AssertionError):
            self.assertIn(person["description"], visible_text(mutated_description))

    def test_graphs_have_unique_ids_and_exclude_deprecated_or_private_data(self) -> None:
        forbidden_types = {"ProfessionalService", "LocalBusiness", "PostalAddress"}
        forbidden_fields = {
            "address",
            "addressCountry",
            "addressLocality",
            "addressRegion",
            "alumniOf",
            "award",
            "birthDate",
            "email",
            "honorificPrefix",
            "memberOf",
            "postalCode",
            "sameAs",
            "streetAddress",
            "telephone",
        }
        forbidden_claims = (
            "academic scholar",
            "clearance",
            "gpa",
            "honorably discharged",
            "sergeant",
            "student identifier",
        )

        for filename in PAGE_CONTRACTS:
            with self.subTest(filename=filename):
                nodes = json_ld_graph(ROOT / filename)
                ids = [node.get("@id") for node in nodes if node.get("@id")]
                self.assertEqual(len(ids), len(set(ids)))
                self.assertTrue(types_in(nodes).isdisjoint(forbidden_types))

                for value in walk_json(nodes):
                    if isinstance(value, dict):
                        self.assertTrue(forbidden_fields.isdisjoint(value))
                    if isinstance(value, str):
                        lowered = value.lower()
                        self.assertTrue(all(claim not in lowered for claim in forbidden_claims))

                serialized = json.dumps(nodes).lower()
                self.assertNotIn("@gmail.com", serialized)


if __name__ == "__main__":
    unittest.main()
