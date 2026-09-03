from html import unescape
import re
import unittest

from tests.site_contracts import read_text


DIRECTORY_ENTRIES = {
    "webhosting.html": (
        "View website services",
        "Web",
        "Websites",
        "Fast launch sites, DNS, HTTPS, redirects, and website care plans.",
        "View website services →",
        "epic-service-websites",
    ),
    "app-building.html": (
        "View business app and dashboard services",
        "Apps",
        "Business Apps & Dashboards",
        "Lead trackers, client dashboards, quote systems, and simple CRM tools built around your workflow.",
        "View business app services →",
        "epic-service-business-apps",
    ),
    "infrastructure.html": (
        "View network and Wi-Fi services",
        "Wi-Fi",
        "Network & Wi-Fi",
        "Office network cleanup, access point planning, device inventory, and handoff notes.",
        "View network services →",
        "epic-service-network-wifi",
    ),
    "firewalls.html": (
        "View firewall and security services",
        "Most requested",
        "Firewalls & Security",
        "Ubiquiti setup, guest Wi-Fi, VLAN basics, VPN, DNS filtering, and firewall documentation.",
        "View firewall services →",
        "epic-service-firewalls-security",
    ),
    "automation.html": (
        "View automation services",
        "Automation",
        "Automation",
        "Small scripts, checklists, and repeatable setup processes that save time.",
        "View automation services →",
        "epic-service-automation",
    ),
    "ecommerce.html": (
        "View e-commerce services",
        "E-Commerce",
        "E-Commerce",
        "Shopify and WooCommerce stores with secure payments, product catalogs, shipping setup, and launch support.",
        "View e-commerce services →",
        "epic-service-ecommerce",
    ),
    "virtualization.html": (
        "View virtualization lab services",
        "Labs",
        "Virtualization Labs",
        "VM test labs and isolated environments for learning, demos, and safe testing.",
        "View virtualization services →",
        "epic-service-virtualization",
    ),
    "software.html": (
        "View form and internal tool services",
        "Simple tools",
        "Forms & Internal Tools",
        "Lightweight forms, calculators, dashboards, and static tools without overbuilding.",
        "View internal tool services →",
        "epic-service-internal-tools",
    ),
}

INTRO_COPY = (
    "Service menu",
    "Pick the problem you want fixed",
    "EPIC TECH focuses on the services small businesses usually need first: secure Wi-Fi, "
    "firewalls, websites, Cloudflare, e-commerce, light automation, custom dashboards, and "
    "clean documentation.",
)


def normalized_text(markup: str) -> str:
    return " ".join(unescape(re.sub(r"<[^>]+>", " ", markup)).split())


def css_declarations(css: str, selector: str) -> str:
    match = re.search(rf"{re.escape(selector)}\s*\{{([^}}]+)\}}", css, re.DOTALL)
    if match is None:
        raise AssertionError(f"missing CSS rule for {selector}")
    return re.sub(r"\s+", " ", match.group(1)).strip()


class ServiceDirectoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = read_text("services/index.html")
        cls.css = read_text("assets/css/styles.css")

    def test_directory_preserves_exact_intro_and_service_copy_map(self) -> None:
        hero_copy = re.search(
            r'<div class="service-index-hero__copy">(.*?)</div>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(hero_copy)
        self.assertEqual(normalized_text(hero_copy.group(1)), " ".join(INTRO_COPY))

        for href, entry_copy in DIRECTORY_ENTRIES.items():
            with self.subTest(href=href):
                aria_label, eyebrow, heading, description, cta, _ = entry_copy
                entry = re.search(
                    rf'<a[^>]+class="service-directory__link"[^>]+href="{re.escape(href)}"[^>]*>(.*?)</a>',
                    self.html,
                    re.DOTALL,
                )
                self.assertIsNotNone(entry)
                opening_tag = self.html[entry.start() : self.html.find(">", entry.start()) + 1]
                self.assertIn(f'aria-label="{aria_label}"', opening_tag)
                self.assertEqual(
                    normalized_text(entry.group(1)),
                    " ".join((eyebrow, heading, description, cta)),
                )
        self.assertIn('href="../pricing.html#care-plans"', self.html)

    def test_service_entries_use_visual_directory_contract(self) -> None:
        self.assertIn('class="service-directory"', self.html)
        self.assertEqual(self.html.count("service-directory__link"), 8)
        self.assertNotIn('class="grid-3"', self.html)
        self.assertNotIn('class="grid-2"', self.html)

    def test_service_images_are_lazy_and_decorative(self) -> None:
        self.assertEqual(self.html.count('loading="lazy"'), 8)
        self.assertEqual(self.html.count('alt=""'), 9)
        for href, (*_, basename) in DIRECTORY_ENTRIES.items():
            with self.subTest(href=href):
                entry = re.search(
                    rf'<a[^>]+class="service-directory__link"[^>]+href="{re.escape(href)}"[^>]*>(.*?)</a>',
                    self.html,
                    re.DOTALL,
                )
                self.assertIsNotNone(entry)
                for width in (640, 1200, 1920):
                    self.assertIn(f"{basename}-{width}.avif?v=20260903 {width}w", entry.group(1))
                    self.assertIn(f"{basename}-{width}.webp?v=20260903 {width}w", entry.group(1))
                self.assertIn('loading="lazy"', entry.group(1))
                self.assertIn('alt=""', entry.group(1))

    def test_intro_uses_one_responsive_high_priority_hero_picture(self) -> None:
        hero = re.search(
            r'<div class="container service-index-hero">(.*?)</div>\s*</section>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(hero)
        markup = hero.group(1)
        self.assertEqual(markup.count("<picture"), 1)
        self.assertIn('class="service-index-hero__visual"', markup)
        self.assertNotIn('data-media-source=', markup)
        for width in (640, 1200, 1920):
            self.assertIn(f"epic-hero-connected-workshop-{width}.avif?v=20260903 {width}w", markup)
            self.assertIn(f"epic-hero-connected-workshop-{width}.webp?v=20260903 {width}w", markup)
        self.assertIn('type="image/avif"', markup)
        self.assertIn('type="image/webp"', markup)
        self.assertRegex(
            markup,
            r'<img[^>]+src="\.\./assets/images/service-visuals/epic-hero-connected-workshop-1920\.webp\?v=20260903"[^>]+width="1920"[^>]+height="1200"[^>]+alt=""[^>]+fetchpriority="high"[^>]+decoding="async"[^>]*>',
        )
        self.assertNotIn('loading="lazy"', markup)
        self.assertEqual(self.html.count('fetchpriority="high"'), 1)

    def test_css_uses_two_column_hero_and_larger_alternating_service_media(self) -> None:
        hero_rule = css_declarations(self.css, ".service-index-hero")
        self.assertIn("display: grid", hero_rule)
        self.assertRegex(hero_rule, r"grid-template-columns:[^;]*1\.1[0-9]*fr")
        self.assertIn("align-items: center", hero_rule)

        directory_rule = css_declarations(self.css, ".service-directory__link")
        self.assertRegex(directory_rule, r"grid-template-columns:[^;]*1\.1[0-9]*fr")
        even_directory_rule = css_declarations(
            self.css, ".service-directory__link:nth-child(even)"
        )
        self.assertRegex(
            even_directory_rule,
            r"grid-template-columns:\s*minmax\(280px,\s*\.88fr\)\s+minmax\(0,\s*1\.12fr\)",
        )
        self.assertIn(
            "order: 2",
            css_declarations(
                self.css, ".service-directory__link:nth-child(even) > picture"
            ),
        )
        self.assertIn(
            "order: 1",
            css_declarations(
                self.css, ".service-directory__link:nth-child(even) > div"
            ),
        )

    def test_css_restores_copy_first_hero_and_picture_first_entries_at_920px(self) -> None:
        responsive = re.search(
            r"@media \(max-width: 920px\) \{(.*?)\n\}", self.css, re.DOTALL
        )
        self.assertIsNotNone(responsive)
        rules = responsive.group(1)
        self.assertRegex(
            rules,
            r"\.service-index-hero[^{]*\{[^}]*grid-template-columns:\s*1fr",
        )
        self.assertRegex(
            rules,
            r"\.service-directory__link:nth-child\(even\)\s*>\s*picture[^{]*\{[^}]*order:\s*initial",
        )
        self.assertRegex(
            rules,
            r"\.service-directory__link:nth-child\(even\)\s*>\s*div[^{]*\{[^}]*order:\s*initial",
        )
        self.assertRegex(
            rules,
            r"\.service-directory__link:nth-child\(even\)[^{]*\{[^}]*grid-template-columns:\s*1fr",
        )


if __name__ == "__main__":
    unittest.main()
