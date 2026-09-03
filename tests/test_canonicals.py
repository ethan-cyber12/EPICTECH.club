from __future__ import annotations

import unittest
from urllib.parse import urlsplit

from tests.site_contracts import ROOT, canonical_href, hrefs, html_files, read_text


PROTECTED_SOURCE_EXCEPTIONS = {"contact.html", "reviews.html"}


class CanonicalTests(unittest.TestCase):
    def test_non_protected_internal_links_do_not_reference_index_html(self) -> None:
        failures = []
        for page in html_files():
            relative_page = page.relative_to(ROOT).as_posix()
            if relative_page in PROTECTED_SOURCE_EXCEPTIONS:
                continue
            for href in hrefs(page):
                parsed = urlsplit(href)
                if not parsed.scheme and not parsed.netloc and (
                    parsed.path == "index.html" or parsed.path.endswith("/index.html")
                ):
                    failures.append(f"{relative_page} -> {href}")

        self.assertEqual(failures, [])

    def test_root_and_service_hub_canonicals_are_preferred_urls(self) -> None:
        self.assertEqual(canonical_href("index.html"), "https://epictech.club/")
        self.assertEqual(
            canonical_href("services/index.html"),
            "https://epictech.club/services/",
        )

if __name__ == "__main__":
    unittest.main()
