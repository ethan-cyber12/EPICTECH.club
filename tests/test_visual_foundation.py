import re
import unittest

from tests.site_contracts import read_text


class VisualFoundationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.css = read_text("assets/css/styles.css")

    def test_approved_palette_is_exact(self) -> None:
        for declaration in (
            "--brand:#0b5cff",
            "--brand-dark:#083b9a",
            "--accent:#00b67a",
            "--ink:#101820",
            "--bg:#ffffff",
            "--soft:#f4f7fb",
        ):
            self.assertIn(declaration, self.css.lower().replace(" ", ""))

    def test_visual_page_interfaces_exist(self) -> None:
        for selector in (
            ".visual-hero",
            ".trust-rail",
            ".editorial-thesis",
            ".service-chapter__layout",
            ".service-chapter__visual",
            ".service-destinations",
            ".service-destination",
            ".pdf-preview",
            ".founder-bridge",
            ".founder-layout",
            ".breadcrumb",
            ".service-hero",
            ".service-flow",
            ".service-directory",
            ".process-timeline",
            ".proof-triptych",
        ):
            self.assertIn(selector, self.css)

    def test_keyboard_and_reduced_motion_rules_exist(self) -> None:
        self.assertRegex(self.css, r":focus-visible\s*\{")
        self.assertRegex(self.css, r"@media\s*\(prefers-reduced-motion:\s*reduce\)")
        self.assertIn("transition-duration:0.01ms", self.css.replace(" ", ""))

    def test_mobile_and_tablet_breakpoints_exist(self) -> None:
        self.assertRegex(self.css, r"@media\s*\(max-width:\s*920px\)")
        self.assertRegex(self.css, r"@media\s*\(max-width:\s*560px\)")

    def test_stylesheet_has_no_remote_dependency(self) -> None:
        self.assertNotRegex(self.css, r"@import\s+url")
        self.assertNotRegex(self.css, r"https?://")


if __name__ == "__main__":
    unittest.main()
