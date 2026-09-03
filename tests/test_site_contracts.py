from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tests.site_contracts import (
    EXCLUDED_PARTS,
    ROOT,
    canonical_href,
    element_ids,
    hrefs,
    html_files,
    json_ld_graph,
    local_target,
    node_by_id,
)


CURRENT_PUBLIC_PAGES = {
    "about.html",
    "contact.html",
    "founder.html",
    "index.html",
    "pricing.html",
    "privacy.html",
    "reviews.html",
    "services/app-building.html",
    "services/automation.html",
    "services/ecommerce.html",
    "services/firewalls.html",
    "services/index.html",
    "services/infrastructure.html",
    "services/software.html",
    "services/virtualization.html",
    "services/webhosting.html",
}


class SiteContractHelperTests(unittest.TestCase):
    def test_public_html_discovery_includes_current_pages_and_excludes_tooling(self) -> None:
        discovered = html_files()
        relative = {path.relative_to(ROOT).as_posix() for path in discovered}

        self.assertTrue(CURRENT_PUBLIC_PAGES.issubset(relative))
        self.assertIn("privacy.html", relative)
        self.assertNotIn("node_modules/tslib/tslib.html", relative)
        self.assertTrue(
            all(not EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts) for path in discovered)
        )

    def test_html_inspection_helpers_return_real_page_contracts(self) -> None:
        self.assertEqual(canonical_href("index.html"), "https://epictech.club/")
        self.assertIn("services/infrastructure.html", hrefs("index.html"))
        self.assertIn("main", element_ids("index.html"))

    def test_local_target_resolves_relative_root_and_fragment_links(self) -> None:
        self.assertEqual(
            local_target(ROOT / "services/index.html", "../contact.html#main"),
            ((ROOT / "contact.html").resolve(), "main"),
        )
        self.assertEqual(
            local_target(ROOT / "services/index.html", "/"),
            ((ROOT / "index.html").resolve(), ""),
        )
        self.assertEqual(
            local_target(ROOT / "index.html", "#main"),
            ((ROOT / "index.html").resolve(), "main"),
        )
        self.assertIsNone(local_target(ROOT / "index.html", "https://example.com/path"))
        self.assertIsNone(local_target(ROOT / "index.html", "mailto:info@example.com"))

    def test_json_ld_helpers_flatten_supported_blocks_and_find_nodes(self) -> None:
        fixture = """<!doctype html>
<script type="application/ld+json">
{"@graph":[{"@id":"#org","@type":"Organization"},{"@id":"#site","@type":"WebSite"}]}
</script>
<script type="application/ld+json">[{"@id":"#service","@type":"Service"}]</script>
<script type="application/ld+json">{"@id":"#page","@type":"WebPage"}</script>
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.html"
            path.write_text(fixture, encoding="utf-8")

            graph = json_ld_graph(path)

            self.assertEqual(
                [node["@id"] for node in graph],
                ["#org", "#site", "#service", "#page"],
            )
            self.assertEqual(node_by_id(path, "#service")["@type"], "Service")
            with self.assertRaisesRegex(AssertionError, "missing JSON-LD node #missing"):
                node_by_id(path, "#missing")


if __name__ == "__main__":
    unittest.main()
