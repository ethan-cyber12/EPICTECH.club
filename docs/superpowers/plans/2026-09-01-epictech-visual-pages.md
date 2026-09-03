# EPIC TECH Visual Foundation and Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved founder-led visual system, image-led homepage, founder page, and consistent service-page flow while preserving EPIC TECH's established copy, destinations, forms, reviews workflow, and security posture.

**Architecture:** Keep the site as server-readable static HTML with one shared stylesheet and the existing vanilla JavaScript. Use a mixed evidence-led media system: original raster art where it explains a technical category, semantic HTML/CSS diagrams where structure communicates better, genuine first-page PDF previews for proof, and one approved real founder portrait. Add page-specific classes so Contact and Reviews inherit only the shared shell; protect their page-specific `<main>` markup and all behavior scripts with automated regression hashes. Consume the approved responsive media derivatives, build only the three faithful PDF previews owned by this plan, and verify structure, accessibility, responsive behavior, asset budgets, media provenance, and internal destinations with automated tests.

**Tech Stack:** HTML5, CSS custom properties and media queries, existing vanilla JavaScript, responsive AVIF/WebP/JPEG assets, the already-pinned Sharp package, local `pdftoppm`, Node test runner, Python 3 `unittest`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-01-epictech-founder-led-redesign-design.md`

## Global Constraints

- Preserve blue `#0B5CFF`, deep blue `#083B9A`, green `#00B67A`, ink `#101820`, white `#FFFFFF`, and soft background `#F4F7FB` exactly.
- Keep “Veteran owned. Family operated.” in the homepage hero; the approved hero eyebrow may append “Central Florida based.”
- Make only minor wording changes needed for clarity, trust, accessibility, privacy accuracy, and search metadata.
- Preserve existing destinations, forms, assessment flow, WhatsApp integration, reviews workflow, pricing behavior, and service-page anchors.
- Leave Contact and Reviews page-specific content, structure, form fields, API behavior, and functionality unchanged; only their shared header, footer, type scale, spacing, focus treatment, and responsive navigation may change.
- Do not edit `assets/js/main.js`, `assets/js/qualification.js`, or `assets/js/reviews.js` in this plan.
- Do not weaken any Content Security Policy or add third-party fonts, trackers, widgets, CDNs, runtime frameworks, executable inline script, `unsafe-inline`, or `unsafe-eval`.
- Use only original EPIC TECH graphics and the approved real founder photo derivatives; do not copy Apple assets, code, typefaces, device silhouettes, copy, layouts, section proportions, or animation timing.
- Do not create, publish, or use a synthetic, suit-altered, or otherwise AI-generated depiction of Ethan.
- Do not upload founder photographs, generated art, PDF previews, or unpublished site assets to Google Lens, reverse-image services, or any external review service; all media review is local.
- Do not publish military dates, unit or station details, clearances, GPA, cohort details, student identifiers, diploma images, home address, personal telephone numbers, or private email addresses.
- Keep all essential text in HTML. Service art is decorative and uses `alt=""`; the founder portrait uses concise descriptive alternative text.
- Offscreen images use `loading="lazy"` and `decoding="async"`; only a measured above-the-fold LCP image may use eager loading and `fetchpriority="high"`.
- Every raster has intrinsic `width` and `height`; the homepage/service art is 8:5, and the founder portrait crop is 4:5.
- The homepage has exactly four grouped service chapters and eight independently accessible service links.
- The homepage uses no more than four generated raster placements total: the hero, firewall/security art, automation art, and virtualization art.
- Preserve all eight prepared service thumbnails on `/services/` and the matching prepared hero artwork on each detail page.
- Code-native diagrams use semantic HTML, remain understandable in DOM order, fit at 320 CSS pixels, and require no JavaScript.
- Homepage proof uses no more than three faithful, locally rendered first-page previews from the existing public case-study PDFs.
- Respect `prefers-reduced-motion`; do not add scroll-jacking, autoplay, parallax, carousel-only access, or JavaScript-driven navigation.
- Target LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile.
- Preserve working-tree changes that are outside the files listed by a task.

## Asset Interface

This plan consumes the following finalized files from the approved image-preparation work. The 640/1200/1920 service files are respectively 640×400, 1200×750, and 1920×1200. The founder files are 640×800 and 1200×1500.

```text
assets/images/service-visuals/epic-hero-connected-workshop-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-network-wifi-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-firewalls-security-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-websites-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-business-apps-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-automation-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-ecommerce-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-virtualization-{640,1200,1920}.{avif,webp}
assets/images/service-visuals/epic-service-internal-tools-{640,1200,1920}.{avif,webp}
assets/images/founder/ethan-platt-graduation-close-{640,1200}.{avif,webp}
assets/images/founder/ethan-platt-graduation-close-1200.jpg
assets/images/case-studies/epic-cloud-security-automation-first-page-800.webp
assets/images/case-studies/epic-disa-stig-hardening-first-page-800.webp
assets/images/case-studies/epic-network-infrastructure-first-page-800.webp
```

The original-media plan owns all Workshop, founder, and social-image processing and strips EXIF/GPS/device/timestamp metadata before those files are made available. This visual-pages plan owns only `scripts/build-case-study-previews.mjs` and the three `assets/images/case-studies/*-first-page-800.webp` files, which are faithful local renders of page one from the existing public PDFs. The later discoverability-security plan owns case-study HTML companions and PDF metadata; it must not regenerate or replace these previews. Do not commit source portraits or high-resolution PNG masters to the published site.

The no-external-upload constraint in this plan supersedes any earlier original-media instruction to perform reverse-image searches. Do not repeat or extend that external review step. Existing locally stored review evidence may be retained, but all remaining visual inspection must use local files and local browser previews.

---

### Task 1: Add immutable Contact and Reviews regression contracts

**Files:**
- Create: `tests/__init__.py`
- Create: `tests/site_contracts.py`
- Create: `tests/test_contact_reviews_regression.py`
- Create: `tests/fixtures/contact_reviews_regression.json`

**Interfaces:**
- Consumes: existing `contact.html`, `reviews.html`, `assets/js/main.js`, `assets/js/qualification.js`, and `assets/js/reviews.js`.
- Produces: `read_text(relative_path: str) -> str`, `main_inner(relative_path: str) -> str`, and `sha256_text(value: str) -> str` in `tests/site_contracts.py`; immutable hashes used by Tasks 2–8.

- [ ] **Step 1: Write the regression test before its fixture exists**

Create an empty `tests/__init__.py`, then create `tests/site_contracts.py`:

```python
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def normalize_block(value: str) -> str:
    value = re.sub(r"[ \t]+$", "", value, flags=re.MULTILINE)
    return value.strip() + "\n"


def main_inner(relative_path: str) -> str:
    html = read_text(relative_path)
    match = re.search(r"<main(?:\s[^>]*)?>(.*?)</main>", html, re.IGNORECASE | re.DOTALL)
    if match is None:
        raise AssertionError(f"{relative_path} has no main element")
    return normalize_block(match.group(1))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
```

Create `tests/test_contact_reviews_regression.py`:

```python
import json
import unittest

from tests.site_contracts import ROOT, main_inner, read_text, sha256_text


class ContactReviewsRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        fixture_path = ROOT / "tests/fixtures/contact_reviews_regression.json"
        cls.baselines = json.loads(fixture_path.read_text(encoding="utf-8"))

    def test_page_specific_main_markup_is_unchanged(self) -> None:
        for page, expected_hash in self.baselines["main_inner_sha256"].items():
            with self.subTest(page=page):
                self.assertEqual(sha256_text(main_inner(page)), expected_hash)

    def test_behavior_scripts_are_unchanged(self) -> None:
        for script, expected_hash in self.baselines["script_sha256"].items():
            with self.subTest(script=script):
                self.assertEqual(sha256_text(read_text(script)), expected_hash)

    def test_sensitive_endpoints_and_integrations_remain_present(self) -> None:
        contact = read_text("contact.html")
        reviews = read_text("reviews.html")
        self.assertIn('data-endpoint="https://intake.epictech.club/lead-intake"', contact)
        self.assertIn('href="https://wa.me/message/GO4FEQZBZN3VG1"', contact)
        self.assertIn('data-endpoint="https://intake.epictech.club/review-intake"', reviews)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', contact)
        self.assertIn('src="https://challenges.cloudflare.com/turnstile/v0/api.js"', reviews)
        self.assertIn('src="assets/js/qualification.js"', contact)
        self.assertIn('src="assets/js/reviews.js"', reviews)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify the missing fixture causes failure**

Run:

```bash
python3 -m unittest tests/test_contact_reviews_regression.py -v
```

Expected: `ERROR` with `FileNotFoundError` for `tests/fixtures/contact_reviews_regression.json`.

- [ ] **Step 3: Add the exact approved baselines**

Create `tests/fixtures/contact_reviews_regression.json`:

```json
{
  "main_inner_sha256": {
    "contact.html": "606d4ec30084bd8739f61101b2a7b5442a1414b90fa100bfac7f299d5fb87a50",
    "reviews.html": "6606e48aabd3d861b981f760510f4b4c4c50d7ee02707244d9417bdf8986a34c"
  },
  "script_sha256": {
    "assets/js/main.js": "2ed431d84934dc2cbafb487a4339012f013ac3e429066fd77e8a82893d29e394",
    "assets/js/qualification.js": "21212f804b1a40c749da732bbf43f9919d4b38099a5812bbac6cf6976f6b9303",
    "assets/js/reviews.js": "80bc60394ec295f371dc5afbe84b3b99697b69795aa33de619d5851e274149e6"
  }
}
```

- [ ] **Step 4: Run the regression tests and verify they pass**

Run:

```bash
python3 -m unittest tests/test_contact_reviews_regression.py -v
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit the regression guard**

```bash
git add tests/__init__.py tests/site_contracts.py tests/test_contact_reviews_regression.py tests/fixtures/contact_reviews_regression.json
git commit -m "test: protect contact and reviews behavior"
```

---

### Task 2: Build the shared visual foundation in CSS

**Files:**
- Create: `tests/test_visual_foundation.py`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: existing color custom properties and existing `.container`, `.site-header`, `.nav`, `.nav-links`, `.menu-btn`, `.btn`, `.section`, `.page-hero`, `.site-footer`, form, review, and pricing rules.
- Produces: `.visual-hero`, `.trust-rail`, `.editorial-thesis`, `.service-chapters`, `.service-chapter`, `.service-chapter__layout`, `.service-chapter__copy`, `.service-chapter__visual`, `.service-destinations`, `.service-destination`, `.code-diagram`, `.pdf-preview`, `.founder-bridge`, `.founder-layout`, `.founder-portrait`, `.breadcrumb`, `.service-hero`, `.service-flow`, `.service-directory`, `.process-timeline`, and `.proof-triptych` class contracts for Tasks 3–6.

- [ ] **Step 1: Write the failing shared-foundation tests**

Create `tests/test_visual_foundation.py`:

```python
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
            ".code-diagram",
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
```

- [ ] **Step 2: Run the shared-foundation tests and verify they fail**

Run:

```bash
python3 -m unittest tests/test_visual_foundation.py -v
```

Expected: palette and remote-dependency tests pass; class, focus, reduced-motion, and responsive-contract tests fail.

- [ ] **Step 3: Add the visual layout primitives without changing generic card/form behavior**

Reformat `assets/css/styles.css` for maintainability if needed, preserving every existing selector and declaration. Append the following rules after the existing component rules and before the existing responsive rules; do not change `.card`, `.price-card`, `.field`, `.review-form`, `.star-input`, or form-status behavior:

```css
:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 4px;
}

.visual-hero {
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  gap: clamp(32px, 6vw, 88px);
  align-items: center;
  min-height: min(780px, calc(100vh - 80px));
  padding-block: clamp(64px, 9vw, 120px);
}

.visual-hero__copy { max-width: 660px; }
.visual-hero__visual { margin: 0; }
.visual-hero__visual img,
.service-chapter__visual img,
.service-hero__visual img,
.founder-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.visual-hero__visual img { aspect-ratio: 8 / 5; border-radius: 34px; }

.trust-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border-block: 1px solid var(--line);
}
.trust-rail > div { padding: 22px clamp(12px, 2vw, 24px); }
.trust-rail > div + div { border-left: 1px solid var(--line); }
.trust-rail strong,
.trust-rail span { display: block; }

.editorial-thesis {
  margin: 0;
  padding-block: clamp(80px, 12vw, 170px);
  font-size: clamp(2.6rem, 7vw, 6.8rem);
  line-height: .94;
  letter-spacing: -.055em;
  max-width: 15ch;
}
.editorial-thesis::after {
  content: "";
  display: block;
  width: min(360px, 62vw);
  height: 4px;
  margin-top: 34px;
  background: linear-gradient(90deg, var(--brand), var(--accent));
}

.service-chapters { display: grid; gap: clamp(44px, 8vw, 112px); }
.service-chapter { border-block: 1px solid var(--line); }
.service-chapter__layout {
  display: grid;
  grid-template-columns: minmax(280px, .78fr) minmax(0, 1.22fr);
  gap: clamp(30px, 6vw, 86px);
  align-items: center;
  min-height: 520px;
  padding-block: clamp(38px, 6vw, 76px);
}
.service-chapter:nth-child(even) .service-chapter__copy { order: 2; }
.service-chapter:nth-child(even) .service-chapter__visual { order: 1; }
.service-chapter__copy { max-width: 520px; }
.service-destinations { display: grid; margin-top: 28px; border-top: 1px solid var(--line); }
.service-destination {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: baseline;
  padding-block: 16px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.service-destination::after { content: "→"; color: var(--brand); font-weight: 900; }
.service-destination:hover,
.service-destination:focus-visible { color: var(--brand); }
.service-chapter__visual {
  overflow: hidden;
  margin: 0;
  border-radius: 30px;
  background: var(--soft);
}
.service-chapter__visual img {
  aspect-ratio: 8 / 5;
}
.code-diagram {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20px, .25fr) minmax(0, 1fr) minmax(20px, .25fr) minmax(0, 1fr);
  gap: clamp(12px, 3vw, 28px);
  align-items: center;
  aspect-ratio: 8 / 5;
  padding: clamp(22px, 5vw, 58px);
  border-radius: 30px;
  background: var(--soft);
  border: 1px solid var(--line);
}
.code-diagram__node { padding: clamp(14px, 2vw, 24px); border: 2px solid var(--brand); border-radius: 18px; background: var(--bg); text-align: center; font-weight: 900; }
.code-diagram__node:last-child { border-color: var(--accent); }
.code-diagram__connector { height: 3px; background: linear-gradient(90deg, var(--brand), var(--accent)); }
.pdf-preview { display: block; margin: 0 0 22px; overflow: hidden; border: 1px solid var(--line); border-radius: 18px; background: var(--bg); }
.pdf-preview img { display: block; width: 100%; height: auto; aspect-ratio: 612 / 792; object-fit: cover; object-position: top; }

.founder-bridge,
.founder-layout,
.service-hero {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: clamp(32px, 7vw, 94px);
  align-items: center;
}
.founder-bridge { padding-block: clamp(70px, 10vw, 130px); }
.founder-portrait { margin: 0; overflow: hidden; border-radius: 34px; }
.founder-portrait img { aspect-ratio: 4 / 5; }

.breadcrumb { margin-block: 0 24px; color: var(--muted); font-size: .92rem; }
.breadcrumb ol { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; }
.breadcrumb li + li::before { content: "/"; margin-right: 8px; color: var(--line); }
.breadcrumb [aria-current="page"] { color: var(--ink); font-weight: 800; }

.service-hero { padding-block: clamp(48px, 8vw, 96px); }
.service-hero__visual { margin: 0; overflow: hidden; border-radius: 30px; }
.service-hero__visual img { aspect-ratio: 8 / 5; }
.service-flow { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); align-items: start; }
.service-flow .side-nav { top: 104px; }
.service-flow__content > section { scroll-margin-top: 110px; }

.service-directory { display: grid; gap: 1px; background: var(--line); border-block: 1px solid var(--line); }
.service-directory__link {
  display: grid;
  grid-template-columns: minmax(180px, .72fr) minmax(0, 1.28fr);
  gap: clamp(22px, 5vw, 64px);
  align-items: center;
  padding: clamp(24px, 4vw, 50px);
  background: var(--bg);
}
.service-directory__link picture img { display: block; width: 100%; aspect-ratio: 8 / 5; object-fit: cover; border-radius: 22px; }

.process-timeline { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 2px solid var(--brand); }
.process-timeline > div { padding: 24px 22px 0 0; }
.process-timeline__number { color: var(--brand); font-weight: 1000; }
.proof-triptych { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 4vw, 42px); }
.proof-triptych > article { padding-top: 22px; border-top: 3px solid var(--brand); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Merge these declarations into the existing `@media(max-width:920px)` and `@media(max-width:560px)` blocks:

```css
@media (max-width: 920px) {
  .visual-hero,
  .founder-bridge,
  .founder-layout,
  .service-hero,
  .service-chapter__layout,
  .service-directory__link,
  .service-flow {
    grid-template-columns: 1fr;
  }
  .service-chapter:nth-child(even) .service-chapter__copy,
  .service-chapter:nth-child(even) .service-chapter__visual { order: initial; }
  .service-chapter__layout { min-height: 0; }
  .trust-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .trust-rail > div:nth-child(3) { border-left: 0; border-top: 1px solid var(--line); }
  .trust-rail > div:nth-child(4) { border-top: 1px solid var(--line); }
  .process-timeline { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .proof-triptych { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .visual-hero { min-height: 0; padding-block: 48px; }
  .visual-hero__visual img,
  .service-chapter__visual,
  .service-hero__visual,
  .founder-portrait { border-radius: 22px; }
  .trust-rail,
  .process-timeline { grid-template-columns: 1fr; }
  .trust-rail > div + div { border-left: 0; border-top: 1px solid var(--line); }
  .service-chapter__layout { padding-block: 34px; }
  .code-diagram { grid-template-columns: 1fr; aspect-ratio: auto; }
  .code-diagram__connector { width: 3px; height: 28px; justify-self: center; }
}
```

- [ ] **Step 4: Run foundation and regression tests**

Run:

```bash
python3 -m unittest tests/test_visual_foundation.py tests/test_contact_reviews_regression.py -v
```

Expected: all 8 tests pass; Contact/Reviews hashes remain unchanged.

- [ ] **Step 5: Commit the shared foundation**

```bash
git add assets/css/styles.css tests/test_visual_foundation.py
git commit -m "feat: add founder-led visual foundation"
```

---

### Task 3: Build the mixed-media homepage and genuine proof previews

**Files:**
- Create: `scripts/build-case-study-previews.mjs`
- Create: `tests/case-study-previews.test.mjs`
- Create: `tests/test_homepage_visual_flow.py`
- Create: `assets/images/case-studies/epic-cloud-security-automation-first-page-800.webp`
- Create: `assets/images/case-studies/epic-disa-stig-hardening-first-page-800.webp`
- Create: `assets/images/case-studies/epic-network-infrastructure-first-page-800.webp`
- Modify: `index.html`
- Consume: the Workshop and founder-photo files listed in the Asset Interface and the three existing public PDFs named below.

**Interfaces:**
- Consumes: Task 2 visual classes, pinned Sharp from the original-media work, and `pdftoppm` for local page-one rendering.
- Produces: a `.visual-hero`, `.trust-rail`, `.editorial-thesis`, exactly four `.service-chapter` elements, exactly eight `.service-destination` anchors, one code-native website/store diagram, one real `.founder-bridge`, three `.pdf-preview` figures, `.proof-triptych`, and `.process-timeline`.
- Ownership: this task owns only the three PDF-derived preview files. The original-media plan owns Workshop/founder/social derivatives; the discoverability-security plan owns case-study HTML companions and PDF metadata.

- [ ] **Step 1: Write the failing preview-asset test**

Create `tests/case-study-previews.test.mjs`:

```js
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

const previews = [
  'epic-cloud-security-automation-first-page-800.webp',
  'epic-disa-stig-hardening-first-page-800.webp',
  'epic-network-infrastructure-first-page-800.webp'
];

test('case-study previews are faithful fixed-size page-one renders', async () => {
  for (const name of previews) {
    const path = `assets/images/case-studies/${name}`;
    const metadata = await sharp(path).metadata();
    assert.equal(metadata.width, 800);
    assert.equal(metadata.height, 1035);
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.ok((await stat(path)).size <= 120 * 1024, `${name} exceeds 120 KiB`);
  }
});
```

- [ ] **Step 2: Run the preview test and verify it fails**

Run:

```bash
node --test tests/case-study-previews.test.mjs
```

Expected: FAIL with `ENOENT` for the first preview.

- [ ] **Step 3: Add the local-only preview builder and create the previews**

Create `scripts/build-case-study-previews.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

const previews = [
  ['assets/projects/epic-cloud-security-automation-public-sample.pdf', 'assets/images/case-studies/epic-cloud-security-automation-first-page-800.webp'],
  ['assets/projects/epic-disa-stig-hardening-public-sample.pdf', 'assets/images/case-studies/epic-disa-stig-hardening-first-page-800.webp'],
  ['assets/projects/epic-network-infrastructure-public-sample.pdf', 'assets/images/case-studies/epic-network-infrastructure-first-page-800.webp']
];

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'epictech-case-previews-'));

try {
  for (const [input, output] of previews) {
    const prefix = join(temporaryDirectory, basename(output, '.webp'));
    execFileSync(
      'pdftoppm',
      ['-f', '1', '-l', '1', '-singlefile', '-png', '-r', '110', input, prefix],
      { stdio: 'inherit' }
    );
    mkdirSync(dirname(output), { recursive: true });
    await sharp(`${prefix}.png`)
      .resize({ width: 800, height: 1035, fit: 'contain', background: '#FFFFFF' })
      .webp({ quality: 82, effort: 6 })
      .toFile(output);
    process.stdout.write(`${output}\n`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
```

The script reads only local repository PDFs and writes only local repository previews. It must not contain a URL, network client, upload, browser automation, or reverse-image lookup. Run:

```bash
node scripts/build-case-study-previews.mjs
node --test tests/case-study-previews.test.mjs
```

Expected: the builder reports three outputs and the test passes.

- [ ] **Step 4: Write the failing homepage-flow test**

Create `tests/test_homepage_visual_flow.py`:

```python
import re
import unittest

from tests.site_contracts import read_text


HOME_SERVICE_LINKS = {
    "services/infrastructure.html": "Network & Wi-Fi",
    "services/firewalls.html": "Firewalls & Cybersecurity",
    "services/webhosting.html": "Websites",
    "services/ecommerce.html": "E-Commerce",
    "services/app-building.html": "Business Apps & Dashboards",
    "services/automation.html": "Automation",
    "services/software.html": "Forms & Internal Tools",
    "services/virtualization.html": "Virtualization Labs",
}

GENERATED_HOME_BASENAMES = {
    "epic-hero-connected-workshop",
    "epic-service-firewalls-security",
    "epic-service-automation",
    "epic-service-virtualization",
}

UNUSED_HOME_BASENAMES = {
    "epic-service-network-wifi",
    "epic-service-websites",
    "epic-service-business-apps",
    "epic-service-ecommerce",
    "epic-service-internal-tools",
}


class HomepageVisualFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = read_text("index.html")

    def test_approved_hero_and_trust_copy_exist(self) -> None:
        self.assertIn("Veteran owned. Family operated. Central Florida based.", self.html)
        self.assertIn("Small business IT: secure networks, websites, and custom tools", self.html)
        self.assertIn('class="visual-hero"', self.html)
        self.assertIn('fetchpriority="high"', self.html)
        for commitment in (
            "Security built in from the start",
            "Written scope and pricing before work begins",
            "Documentation included with every project",
            "Direct, accountable support",
        ):
            self.assertIn(commitment, self.html)

    def test_exactly_four_grouped_chapters_expose_eight_links(self) -> None:
        self.assertEqual(len(re.findall(r'<article class="service-chapter"', self.html)), 4)
        self.assertEqual(len(re.findall(r'class="service-destination"', self.html)), 8)
        for heading in (
            "Networks &amp; Security",
            "Websites &amp; E-Commerce",
            "Apps, Automation &amp; Internal Tools",
            "Virtualization Labs",
        ):
            self.assertIn(heading, self.html)
        for href, label in HOME_SERVICE_LINKS.items():
            with self.subTest(href=href):
                pattern = rf'<a[^>]+class="service-destination"[^>]+href="{re.escape(href)}"[^>]*>'
                reverse = rf'<a[^>]+href="{re.escape(href)}"[^>]+class="service-destination"[^>]*>'
                self.assertRegex(self.html, f"(?:{pattern}|{reverse})")
                self.assertIn(label, self.html)

    def test_homepage_uses_only_four_generated_raster_placements(self) -> None:
        self.assertEqual(self.html.count('data-media-source="generated"'), 4)
        for basename in GENERATED_HOME_BASENAMES:
            self.assertIn(basename, self.html)
        for basename in UNUSED_HOME_BASENAMES:
            self.assertNotIn(basename, self.html)

    def test_websites_and_ecommerce_use_a_code_native_diagram(self) -> None:
        chapter = re.search(r'<article class="service-chapter" id="websites-commerce">(.*?)</article>', self.html, re.DOTALL)
        self.assertIsNotNone(chapter)
        markup = chapter.group(1)
        self.assertRegex(markup, r'class="[^"]*\bcode-diagram\b[^"]*"')
        self.assertIn('data-media-source="code-native"', markup)
        self.assertNotIn("<img", markup)

    def test_founder_proof_process_and_close_use_real_evidence(self) -> None:
        self.assertIn('class="founder-bridge"', self.html)
        self.assertIn('href="founder.html"', self.html)
        self.assertIn("Technology should leave people better equipped.", self.html)
        self.assertIn('data-media-source="founder-photo"', self.html)
        self.assertIn("ethan-platt-graduation-close-1200.jpg", self.html)
        self.assertEqual(self.html.count('data-media-source="pdf-preview"'), 3)
        self.assertIn('class="proof-triptych"', self.html)
        self.assertIn('class="process-timeline"', self.html)
        for stem in (
            "epic-cloud-security-automation",
            "epic-disa-stig-hardening",
            "epic-network-infrastructure",
        ):
            self.assertIn(f"{stem}-first-page-800.webp", self.html)
            self.assertIn(f"{stem}-public-sample.pdf", self.html)

    def test_repeated_service_card_grid_is_removed(self) -> None:
        self.assertNotIn("service-cards", self.html)
        self.assertNotIn("service-chapter__link", self.html)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 5: Run the homepage test and verify it fails**

Run:

```bash
python3 -m unittest tests/test_homepage_visual_flow.py -v
```

Expected: all 6 tests fail against the card-based homepage.

- [ ] **Step 6: Replace the homepage hero and trust cards**

Keep the existing `<head>`, CSP, title, description, canonical, structured data, header destinations, H1, lead, and CTAs. Preserve “Veteran owned. Family operated.” in the eyebrow. Use the existing responsive hero source set and add `data-media-source="generated"` to its `<picture>`, empty alt text, intrinsic `1200`×`750` dimensions, `fetchpriority="high"`, and `decoding="async"`. Keep the four approved trust commitments in a `.trust-rail` immediately after the hero.

- [ ] **Step 7: Replace the repeated service grid with exactly four grouped editorial chapters**

Place `<blockquote class="container editorial-thesis">Service before scale. Clarity before complexity.</blockquote>` before `.service-chapters`. Use this exact chapter contract:

| Chapter ID and heading | Independently accessible destinations | Media |
|---|---|---|
| `networks-security` — Networks & Security | `services/infrastructure.html` — Network & Wi-Fi; `services/firewalls.html` — Firewalls & Cybersecurity | responsive `epic-service-firewalls-security` picture with `data-media-source="generated"` |
| `websites-commerce` — Websites & E-Commerce | `services/webhosting.html` — Websites; `services/ecommerce.html` — E-Commerce | semantic `<div class="service-chapter__visual code-diagram" data-media-source="code-native">` with Website, Secure checkout, and Customer flow nodes separated by two `aria-hidden="true"` `.code-diagram__connector` elements, and no `<img>` |
| `apps-automation-tools` — Apps, Automation & Internal Tools | `services/app-building.html` — Business Apps & Dashboards; `services/automation.html` — Automation; `services/software.html` — Forms & Internal Tools | responsive `epic-service-automation` picture with `data-media-source="generated"` |
| `virtualization-labs` — Virtualization Labs | `services/virtualization.html` — Virtualization Labs | responsive `epic-service-virtualization` picture with `data-media-source="generated"` |

Each generated chapter `<picture>` supplies AVIF and WebP `srcset` entries at 640, 1200, and 1920 pixels from the Asset Interface. Its fallback `<img>` uses the 1200-pixel WebP, `width="1200" height="750" alt="" loading="lazy" decoding="async"`, and no `fetchpriority`; only the hero receives high fetch priority.

Use one `<article class="service-chapter">` with each exact ID: `networks-security`, `websites-commerce`, `apps-automation-tools`, and `virtualization-labs`. Each article contains one `<div class="container service-chapter__layout">` and is not itself an anchor. Put the exact service hrefs from the table in individual ordinary `<a class="service-destination">` elements inside `.service-destinations`; do not nest links, use `role="link"`, or make JavaScript navigate. Retain the existing short service descriptions with only the minimal grouping edits required to avoid repetition. Keep IT Systems/Monthly Support outside the four chapters as a compact text rail linking to `pricing.html#care-plans`.

- [ ] **Step 8: Add the real founder bridge, PDF evidence, and code-native process**

Use the approved founder statement and existing responsive close-portrait sources. Add `data-media-source="founder-photo"` to the `<picture>` and preserve the informative alt text `Ethan Platt at his graduation ceremony`. Do not generate or generatively alter a founder image.

Retain the three existing case-study headings, descriptions, PDF destinations, `target="_blank"`, and `rel="noopener noreferrer"`. Change their wrapper to `.proof-triptych`, remove the generic `.card` class, and give each article a `<figure class="pdf-preview" data-media-source="pdf-preview">` containing its matching 800×1035 WebP. Use these exact informative alt texts: `First page of the Cloud Security & Automation public case study`, `First page of the DISA STIG-Aligned System Hardening public case study`, and `First page of the Business Network Infrastructure Design public case study`. Every preview `<img>` has `width="800"`, `height="1035"`, `loading="lazy"`, and `decoding="async"`. The preview is supporting evidence; the existing PDF anchor remains the actionable destination.

Retain Assess, Plan, Build, and Document and their exact current descriptions; change their wrapper to `.process-timeline`, remove the generic `.step` class, and use `.process-timeline__number`. Keep the final assessment CTA and footer destinations unchanged.

- [ ] **Step 9: Run homepage, preview, foundation, and protected-page tests**

Run:

```bash
node --test tests/case-study-previews.test.mjs
python3 -m unittest tests/test_homepage_visual_flow.py tests/test_visual_foundation.py tests/test_contact_reviews_regression.py -v
```

Expected: the Node preview test and all Python tests pass.

- [ ] **Step 10: Commit the homepage flow and genuine previews**

```bash
git add scripts/build-case-study-previews.mjs tests/case-study-previews.test.mjs tests/test_homepage_visual_flow.py index.html assets/images/case-studies
git commit -m "feat: build mixed-media homepage story"
```

---

### Task 4: Create the factual founder page

**Files:**
- Create: `founder.html`
- Create: `tests/test_founder_page.py`
- Consume: founder-photo files listed in the Asset Interface.

**Interfaces:**
- Consumes: Task 2 `.founder-layout`, `.founder-portrait`, `.process-timeline`, shared header/footer, and existing `assets/js/main.js`.
- Produces: `/founder.html` with one H1, the approved real portrait, factual story, four practical principles, assessment CTA, self-canonical, narrow self-hosted CSP, and no sensitive personal details or synthetic founder imagery.

- [ ] **Step 1: Write the failing founder-page test**

Create `tests/test_founder_page.py`:

```python
import re
import unittest

from tests.site_contracts import read_text


class FounderPageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.html = read_text("founder.html")

    def test_founder_page_has_approved_identity_and_one_h1(self) -> None:
        self.assertEqual(len(re.findall(r"<h1\b", self.html, re.IGNORECASE)), 1)
        self.assertIn("Technology should make work easier to understand and easier to do.", self.html)
        self.assertIn("A veteran founder focused on building clear, practical solutions.", self.html)
        self.assertIn('rel="canonical" href="https://epictech.club/founder.html"', self.html)

    def test_approved_facts_and_principles_are_visible(self) -> None:
        for text in (
            "former United States Marine",
            "communications and transmission systems",
            "B.S. in Information Technology",
            "B.S. in Cybersecurity",
            "valedictorian",
            "Advanced Achievement Award recipient",
            "Start with the problem",
            "Choose what fits",
            "Build security in",
            "Document the handoff",
        ):
            self.assertIn(text, self.html)

    def test_founder_portrait_is_responsive_and_informative(self) -> None:
        self.assertEqual(self.html.count('data-media-source="founder-photo"'), 1)
        self.assertNotIn('data-media-source="generated"', self.html)
        self.assertIn("ethan-platt-graduation-close-640.avif", self.html)
        self.assertIn("ethan-platt-graduation-close-1200.webp", self.html)
        self.assertIn('width="1200" height="1500"', self.html)
        self.assertIn('alt="Ethan Platt at his graduation ceremony"', self.html)

    def test_sensitive_details_are_absent(self) -> None:
        for forbidden in (
            "GPA",
            "security clearance",
            "student identifier",
            "home address",
            "personal telephone",
            "private email",
        ):
            self.assertNotIn(forbidden, self.html)

    def test_security_and_navigation_remain_self_hosted(self) -> None:
        self.assertIn("default-src 'self'", self.html)
        self.assertIn("script-src 'self'", self.html)
        self.assertNotIn("unsafe-inline", self.html)
        self.assertNotIn("unsafe-eval", self.html)
        self.assertIn('src="assets/js/main.js"', self.html)
        self.assertIn('href="contact.html"', self.html)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the founder test and verify it fails because the page does not exist**

Run:

```bash
python3 -m unittest tests/test_founder_page.py -v
```

Expected: `ERROR` with `FileNotFoundError` for `founder.html`.

- [ ] **Step 3: Create the founder-page document shell**

Create `founder.html` with `lang="en"`, UTF-8 and viewport metadata, the existing general-page CSP unchanged, `strict-origin-when-cross-origin`, title `Ethan Platt, Founder | EPIC TECH LLC`, a factual description, canonical `https://epictech.club/founder.html`, local stylesheet, skip link, labeled primary navigation, `<main id="main">`, shared footer, and deferred `assets/js/main.js`. The primary navigation destinations remain Services, Pricing, About, Reviews, and Schedule Assessment.

Use the responsive 4:5 founder `<picture>` contract from Task 3. Its hero contains this exact copy:

```html
<section class="page-hero">
  <div class="container founder-layout">
    <div>
      <span class="eyebrow">Founder</span>
      <h1>Technology should make work easier to understand and easier to do.</h1>
      <p class="lead">Ethan Platt founded EPIC TECH to help small businesses solve technical problems with clear scope, documented systems, and solutions sized for the work.</p>
      <p><strong>A veteran founder focused on building clear, practical solutions.</strong></p>
    </div>
    <picture class="founder-portrait" data-media-source="founder-photo">
      <source type="image/avif" srcset="assets/images/founder/ethan-platt-graduation-close-640.avif 640w, assets/images/founder/ethan-platt-graduation-close-1200.avif 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 42vw">
      <source type="image/webp" srcset="assets/images/founder/ethan-platt-graduation-close-640.webp 640w, assets/images/founder/ethan-platt-graduation-close-1200.webp 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 42vw">
      <img src="assets/images/founder/ethan-platt-graduation-close-1200.jpg" width="1200" height="1500" alt="Ethan Platt at his graduation ceremony" decoding="async">
    </picture>
  </div>
</section>
```

- [ ] **Step 4: Add the approved founder story in the confirmed order**

Use semantic sections and this exact, bounded factual copy:

```html
<section class="section">
  <div class="container">
    <span class="eyebrow">Why the work matters</span>
    <h2>Leave people better equipped.</h2>
    <p class="lead">A worthwhile technology project leaves people better equipped to work with clarity, efficiency, and confidence. The goal is not impressive technology for its own sake, but a more capable organization and dependable work.</p>
  </div>
</section>

<section class="section alt">
  <div class="container grid-2">
    <div>
      <span class="eyebrow">Service shaped the standard</span>
      <h2>Clear communication. Reliable systems. Documented handoff.</h2>
      <p>Ethan is a former United States Marine with experience in communications and transmission systems. That work shaped a practical standard: understand the environment, protect what matters, communicate clearly, and document the handoff.</p>
    </div>
    <div>
      <span class="eyebrow">Technical training with a practical purpose</span>
      <h2>Training applied to real work.</h2>
      <p>Ethan earned a B.S. in Information Technology and a B.S. in Cybersecurity and was recognized as valedictorian and an Advanced Achievement Award recipient in both programs. He applies that technical foundation to infrastructure, security planning, troubleshooting, and clear documentation.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <span class="eyebrow">What people can do next</span>
    <h2>Start with the problem in front of you.</h2>
    <p class="lead">EPIC TECH helps small businesses assess the current situation, choose a practical path, build the right-sized solution, and understand what was delivered.</p>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <span class="eyebrow">Practical principles</span>
    <h2>How the work is approached.</h2>
    <div class="process-timeline">
      <div><span class="process-timeline__number">1</span><h3>Start with the problem</h3></div>
      <div><span class="process-timeline__number">2</span><h3>Choose what fits</h3></div>
      <div><span class="process-timeline__number">3</span><h3>Build security in</h3></div>
      <div><span class="process-timeline__number">4</span><h3>Document the handoff</h3></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container cta">
    <h2>Start with a technology assessment.</h2>
    <p class="muted">A clear written plan comes before a larger build.</p>
    <a class="btn btn-primary" href="contact.html">Schedule assessment</a>
  </div>
</section>
```

- [ ] **Step 5: Run founder, homepage, foundation, and regression tests**

Run:

```bash
python3 -m unittest tests/test_founder_page.py tests/test_homepage_visual_flow.py tests/test_visual_foundation.py tests/test_contact_reviews_regression.py -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit the founder page**

```bash
git add founder.html tests/test_founder_page.py
git commit -m "feat: add factual founder story"
```

---

### Task 5: Turn the service index into a visual directory

**Files:**
- Create: `tests/test_service_directory.py`
- Modify: `services/index.html`
- Consume: eight service-art sets listed in the Asset Interface.

**Interfaces:**
- Consumes: Task 2 `.service-directory` and `.service-directory__link`.
- Produces: eight image-led ordinary anchors to all service pages plus the existing Monthly Support link to `../pricing.html#care-plans`; existing H1 and descriptions remain unchanged.

- [ ] **Step 1: Write the failing service-directory test**

Create `tests/test_service_directory.py`:

```python
import re
import unittest

from tests.site_contracts import read_text


DIRECTORY_LINKS = {
    "webhosting.html": ("Websites", "epic-service-websites"),
    "app-building.html": ("Business Apps & Dashboards", "epic-service-business-apps"),
    "infrastructure.html": ("Network & Wi-Fi", "epic-service-network-wifi"),
    "firewalls.html": ("Firewalls & Security", "epic-service-firewalls-security"),
    "automation.html": ("Automation", "epic-service-automation"),
    "ecommerce.html": ("E-Commerce", "epic-service-ecommerce"),
    "virtualization.html": ("Virtualization Labs", "epic-service-virtualization"),
    "software.html": ("Forms & Internal Tools", "epic-service-internal-tools"),
}


class ServiceDirectoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = read_text("services/index.html")

    def test_directory_preserves_h1_and_all_destinations(self) -> None:
        self.assertIn("Pick the problem you want fixed", self.html)
        for href, (heading, _) in DIRECTORY_LINKS.items():
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', self.html)
                self.assertIn(heading, self.html)
        self.assertIn('href="../pricing.html#care-plans"', self.html)

    def test_service_entries_use_visual_directory_contract(self) -> None:
        self.assertIn('class="service-directory"', self.html)
        self.assertEqual(self.html.count("service-directory__link"), 8)
        self.assertNotIn('class="grid-3"', self.html)
        self.assertNotIn('class="grid-2"', self.html)

    def test_service_images_are_lazy_and_decorative(self) -> None:
        self.assertEqual(self.html.count('loading="lazy"'), 8)
        self.assertGreaterEqual(self.html.count('alt=""'), 8)
        for href, (_, basename) in DIRECTORY_LINKS.items():
            with self.subTest(href=href):
                entry = re.search(
                    rf'<a[^>]+class="service-directory__link"[^>]+href="{re.escape(href)}"[^>]*>(.*?)</a>',
                    self.html,
                    re.DOTALL,
                )
                self.assertIsNotNone(entry)
                self.assertIn(f"{basename}-1200.avif", entry.group(1))
                self.assertIn(f"{basename}-1200.webp", entry.group(1))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the directory test and verify it fails**

Run:

```bash
python3 -m unittest tests/test_service_directory.py -v
```

Expected: destination test passes; visual-contract and image tests fail.

- [ ] **Step 3: Replace the card grids with eight exact visual entries**

Keep the existing H1, lead, service headings, descriptions, destinations, Monthly Support text/link, footer, metadata, CSP, and script. Add the shared skip link, labeled navigation, and `<main id="main">` if absent. Wrap the eight service links in one `.service-directory`; keep Monthly Support as a compact text rail after the directory.

Each service link follows this exact structure with its existing heading/description, mapped destination, and matching Asset Interface basename:

```html
<a class="service-directory__link" href="webhosting.html" aria-label="View website services">
  <picture>
    <source type="image/avif" srcset="../assets/images/service-visuals/epic-service-websites-640.avif 640w, ../assets/images/service-visuals/epic-service-websites-1200.avif 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 34vw">
    <source type="image/webp" srcset="../assets/images/service-visuals/epic-service-websites-640.webp 640w, ../assets/images/service-visuals/epic-service-websites-1200.webp 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 34vw">
    <img src="../assets/images/service-visuals/epic-service-websites-1200.webp" width="1200" height="750" alt="" loading="lazy" decoding="async">
  </picture>
  <div>
    <span class="eyebrow">Web</span>
    <h2>Websites</h2>
    <p>Fast launch sites, DNS, HTTPS, redirects, and website care plans.</p>
    <span aria-hidden="true">View website services →</span>
  </div>
</a>
```

Use H2 for every directory destination because the page H1 introduces a flat list. Keep “Less common requests” as visually hidden grouping context only if doing so does not introduce an extra H2 between service entries; the directory labels Virtualization Labs and Forms & Internal Tools remain visible.

- [ ] **Step 4: Run directory, homepage, and regression tests**

Run:

```bash
python3 -m unittest tests/test_service_directory.py tests/test_homepage_visual_flow.py tests/test_contact_reviews_regression.py -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit the visual service directory**

```bash
git add services/index.html tests/test_service_directory.py
git commit -m "feat: make service index a visual directory"
```

---

### Task 6: Apply one semantic flow to every service detail page

**Files:**
- Create: `tests/test_service_page_flow.py`
- Modify: `services/app-building.html`
- Modify: `services/automation.html`
- Modify: `services/ecommerce.html`
- Modify: `services/firewalls.html`
- Modify: `services/infrastructure.html`
- Modify: `services/software.html`
- Modify: `services/virtualization.html`
- Modify: `services/webhosting.html`
- Consume: matching service-art files listed in the Asset Interface.

**Interfaces:**
- Consumes: Task 2 `.breadcrumb`, `.service-hero`, `.service-hero__visual`, `.service-flow`, and existing `.side-nav`, package, proof, notice, button, and price classes.
- Produces: on every detail page, a skip link, `<main id="main">`, visible breadcrumb, image-led hero, sticky in-page navigation, unchanged package/pricing/proof content, and resolvable local fragments.

- [ ] **Step 1: Write the failing service-flow tests**

Create `tests/test_service_page_flow.py`:

```python
import re
import unittest

from tests.site_contracts import read_text


SERVICE_PAGES = {
    "services/app-building.html": ("Business Apps & Internal Dashboards", "epic-service-business-apps", ("Solutions we build", "App development pricing", "What this is good for", "What can be built", "How the process works", "What we do not overbuild", "Start with a plan")),
    "services/automation.html": ("Small automation that saves time and reduces mistakes", "epic-service-automation", ("Packages", "What is included", "Featured Case Study")),
    "services/ecommerce.html": ("Professional online stores built to generate sales", "epic-service-ecommerce", ("Packages", "Ongoing Store Care", "What's Included", "Why E-Commerce Matters")),
    "services/firewalls.html": ("Firewall and network security for small businesses", "epic-service-firewalls-security", ("Packages", "What is included", "Related Security Case Studies")),
    "services/infrastructure.html": ("Clean Wi-Fi and network setups that make sense", "epic-service-network-wifi", ("Packages", "What is included", "Featured Case Study")),
    "services/software.html": ("Lightweight tools for real business problems", "epic-service-internal-tools", ("Packages", "What is included")),
    "services/virtualization.html": ("Safe test labs for learning, demos, and small internal systems", "epic-service-virtualization", ("Packages", "What is included")),
    "services/webhosting.html": ("Business websites and online stores that are fast, secure, and built to grow", "epic-service-websites", ("Packages", "Selling online", "What is included", "Featured Case Study")),
}


class ServicePageFlowTests(unittest.TestCase):
    def test_each_page_has_landmarks_breadcrumb_and_visual_hero(self) -> None:
        for path, (h1, image, headings) in SERVICE_PAGES.items():
            html = read_text(path)
            with self.subTest(path=path):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertIn('aria-label="Breadcrumb"', html)
                self.assertIn('class="service-hero"', html)
                self.assertIn(f"{image}-1200.avif", html)
                self.assertIn(h1, html)
                self.assertEqual(len(re.findall(r"<h1\b", html, re.IGNORECASE)), 1)
                for heading in headings:
                    self.assertIn(heading, html)

    def test_existing_commercial_and_proof_destinations_remain(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            with self.subTest(path=path):
                self.assertIn('href="../contact.html"', html)
        self.assertIn("epic-cloud-security-automation-public-sample.pdf", read_text("services/automation.html"))
        self.assertIn("epic-network-infrastructure-public-sample.pdf", read_text("services/infrastructure.html"))
        self.assertIn("epic-secure-web-and-sdlc-public-sample.pdf", read_text("services/webhosting.html"))
        self.assertIn("epic-zero-trust-access-control-public-sample.pdf", read_text("services/firewalls.html"))

    def test_every_same_page_fragment_resolves(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            ids = set(re.findall(r'\bid="([^"]+)"', html))
            fragments = re.findall(r'href="#([^"]+)"', html)
            with self.subTest(path=path):
                self.assertTrue(set(fragments).issubset(ids), sorted(set(fragments) - ids))

    def test_service_art_is_lcp_prioritized_decorative_and_sized(self) -> None:
        for path in SERVICE_PAGES:
            html = read_text(path)
            with self.subTest(path=path):
                hero_image = re.search(r'<picture class="service-hero__visual">(.*?)</picture>', html, re.DOTALL)
                self.assertIsNotNone(hero_image)
                markup = hero_image.group(1)
                self.assertIn('width="1200" height="750"', markup)
                self.assertIn('alt=""', markup)
                self.assertIn('loading="eager"', markup)
                self.assertIn('fetchpriority="high"', markup)
                self.assertIn('decoding="async"', markup)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the service-flow tests and verify they fail**

Run:

```bash
python3 -m unittest tests/test_service_page_flow.py -v
```

Expected: breadcrumb, landmark, hero-image, and broken-fragment assertions fail; existing heading and destination assertions pass.

- [ ] **Step 3: Add the shared service hero and breadcrumb to all eight pages**

Preserve every page's title, description, canonical, CSP, H1, lead, packages, prices, descriptive copy, section IDs, contact actions, case-study PDFs, and footer links. Add the skip link and label the menu button/navigation consistently with the homepage. Add `<main id="main">`.

Immediately inside each main, use this exact breadcrumb/hero contract, substituting its existing H1/lead and mapped image basename:

```html
<section class="page-hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="../index.html">Home</a></li>
        <li><a href="index.html">Services</a></li>
        <li aria-current="page">Network &amp; Wi-Fi</li>
      </ol>
    </nav>
    <div class="service-hero">
      <div>
        <span class="eyebrow">Network &amp; Wi-Fi</span>
        <h1>Clean Wi-Fi and network setups that make sense</h1>
        <p class="lead">We design and clean up small business Wi-Fi, switching, access points, and network documentation so the setup is easier to support.</p>
      </div>
      <picture class="service-hero__visual">
        <source type="image/avif" srcset="../assets/images/service-visuals/epic-service-network-wifi-640.avif 640w, ../assets/images/service-visuals/epic-service-network-wifi-1200.avif 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 50vw">
        <source type="image/webp" srcset="../assets/images/service-visuals/epic-service-network-wifi-640.webp 640w, ../assets/images/service-visuals/epic-service-network-wifi-1200.webp 1200w" sizes="(max-width: 920px) calc(100vw - 32px), 50vw">
        <img src="../assets/images/service-visuals/epic-service-network-wifi-1200.webp" width="1200" height="750" alt="" loading="eager" fetchpriority="high" decoding="async">
      </picture>
    </div>
  </div>
</section>
```

Use these visible breadcrumb labels without changing page H1s: Business Apps & Dashboards, Automation, E-Commerce, Firewalls & Security, Network & Wi-Fi, Forms & Internal Tools, Virtualization Labs, and Websites.

- [ ] **Step 4: Normalize the service content wrapper without rewriting its content**

Change each service body's outer layout to:

```html
<section class="section">
  <div class="container service-flow">
    <aside class="side-nav" aria-label="On this page">
      <strong>On this page</strong>
    </aside>
    <div class="service-flow__content">
    </div>
  </div>
</section>
```

Move the page's existing in-page links into the aside and its existing content sections into `.service-flow__content`. Do not change the text, prices, CTA hrefs, proof links, IDs, or order. Keep a single H1 in the hero and preserve logical H2/H3 order. In `services/software.html`, remove the `href="#proof"` side-navigation item because that page has no proof section; do not invent evidence or redirect the label to unrelated content.

- [ ] **Step 5: Run service, directory, homepage, and protected-page tests**

Run:

```bash
python3 -m unittest tests/test_service_page_flow.py tests/test_service_directory.py tests/test_homepage_visual_flow.py tests/test_contact_reviews_regression.py -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit the service flow**

```bash
git add services/app-building.html services/automation.html services/ecommerce.html services/firewalls.html services/infrastructure.html services/software.html services/virtualization.html services/webhosting.html tests/test_service_page_flow.py
git commit -m "feat: unify service page visual flow"
```

---

### Task 7: Apply only the shared shell to Contact and Reviews

**Files:**
- Modify: `contact.html`
- Modify: `reviews.html`
- Test: `tests/test_contact_reviews_regression.py`

**Interfaces:**
- Consumes: Task 1 immutable main/script hashes and Task 2 shared stylesheet.
- Produces: consistent skip link, logo dimensions, labeled primary navigation, `aria-controls`, and `<main id="main">` while leaving protected page-specific markup and behavior byte-equivalent after normalization.

- [ ] **Step 1: Add failing shared-shell assertions to the regression test**

Add this method to `ContactReviewsRegressionTests`:

```python
    def test_shared_shell_accessibility_contract(self) -> None:
        for page in ("contact.html", "reviews.html"):
            html = read_text(page)
            with self.subTest(page=page):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertIn('aria-controls="nav-links"', html)
                self.assertIn('id="nav-links" aria-label="Primary navigation"', html)
                self.assertIn('aria-label="EPIC TECH home"', html)
                self.assertIn('width="787" height="904"', html)
```

- [ ] **Step 2: Run the shell assertion and verify Contact fails**

Run:

```bash
python3 -m unittest tests.test_contact_reviews_regression.ContactReviewsRegressionTests.test_shared_shell_accessibility_contract -v
```

Expected: Contact fails for missing skip link, main ID, labels, controls, and logo dimensions; Reviews fails only for missing logo dimensions.

- [ ] **Step 3: Update only the shared shell markup**

In `contact.html` and `reviews.html`:

- place `<a class="skip-link" href="#main">Skip to content</a>` immediately after `<body>`;
- set the brand anchor to `aria-label="EPIC TECH home"`;
- set the logo to `width="787" height="904"` without changing `src`, `alt`, or `class`;
- set the menu button to `aria-controls="nav-links"` while retaining `data-menu-button` and `aria-expanded="false"`;
- set the navigation to `id="nav-links" aria-label="Primary navigation"` while retaining `class="nav-links" data-nav-links`;
- set the opening main tag to `<main id="main">`.

Do not modify anything between the opening and closing main tags. Do not modify any script tag, CSP directive, form attribute, field, option, Turnstile element, WhatsApp link, data attribute, review container, or page-specific heading/copy.

- [ ] **Step 4: Run the entire protected-page suite**

Run:

```bash
python3 -m unittest tests/test_contact_reviews_regression.py -v
git diff -- contact.html reviews.html assets/js/main.js assets/js/qualification.js assets/js/reviews.js
```

Expected: all 4 tests pass; diff shows only shared-shell HTML changes; no JavaScript diff exists.

- [ ] **Step 5: Commit the shared shell changes**

```bash
git add contact.html reviews.html tests/test_contact_reviews_regression.py
git commit -m "fix: align contact and reviews shared shell"
```

---

### Task 8: Add site-wide accessibility, responsive, destination, and asset gates

**Files:**
- Create: `tests/test_visual_quality_gates.py`
- Modify: shared-shell markup in `index.html`, `about.html`, `pricing.html`, `founder.html`, `services/index.html`, and eight service detail pages only if the new tests reveal a defect.
- Modify: `assets/css/styles.css` only if the new tests or manual viewport review reveal a defect.

**Interfaces:**
- Consumes: all page and asset contracts from Tasks 1–7.
- Produces: one repeatable command that checks landmarks, H1 count, image attributes, local fragment resolution, script origins, responsive CSS, asset existence and byte budgets, homepage media counts, local-only preview generation, and protected-page regressions.

- [ ] **Step 1: Write the failing quality-gate test**

Create `tests/test_visual_quality_gates.py`:

```python
from __future__ import annotations

import re
import unittest
from pathlib import Path
from urllib.parse import urlsplit

from tests.site_contracts import ROOT, read_text


PAGES = (
    "index.html",
    "about.html",
    "pricing.html",
    "founder.html",
    "contact.html",
    "reviews.html",
    "services/index.html",
    "services/app-building.html",
    "services/automation.html",
    "services/ecommerce.html",
    "services/firewalls.html",
    "services/infrastructure.html",
    "services/software.html",
    "services/virtualization.html",
    "services/webhosting.html",
)

SERVICE_BASES = (
    "epic-service-network-wifi",
    "epic-service-firewalls-security",
    "epic-service-websites",
    "epic-service-business-apps",
    "epic-service-automation",
    "epic-service-ecommerce",
    "epic-service-virtualization",
    "epic-service-internal-tools",
)

CASE_PREVIEWS = (
    "epic-cloud-security-automation-first-page-800.webp",
    "epic-disa-stig-hardening-first-page-800.webp",
    "epic-network-infrastructure-first-page-800.webp",
)


class VisualQualityGateTests(unittest.TestCase):
    def test_landmarks_heading_and_navigation_contract(self) -> None:
        for page in PAGES:
            html = read_text(page)
            with self.subTest(page=page):
                self.assertIn('<a class="skip-link" href="#main">Skip to content</a>', html)
                self.assertRegex(html, r'<main\s+id="main"')
                self.assertEqual(len(re.findall(r"<h1\b", html, re.IGNORECASE)), 1)
                self.assertIn('aria-label="Primary navigation"', html)
                self.assertIn('aria-controls="nav-links"', html)

    def test_every_img_has_alt_width_and_height(self) -> None:
        for page in PAGES:
            for tag in re.findall(r"<img\b[^>]*>", read_text(page), re.IGNORECASE):
                with self.subTest(page=page, tag=tag):
                    self.assertRegex(tag, r'\balt="[^"]*"')
                    self.assertRegex(tag, r'\bwidth="\d+"')
                    self.assertRegex(tag, r'\bheight="\d+"')

    def test_same_page_fragments_resolve(self) -> None:
        for page in PAGES:
            html = read_text(page)
            ids = set(re.findall(r'\bid="([^"]+)"', html))
            fragments = set(re.findall(r'href="#([^"]+)"', html))
            with self.subTest(page=page):
                self.assertTrue(fragments.issubset(ids), sorted(fragments - ids))

    def test_local_html_destinations_exist(self) -> None:
        for page in PAGES:
            page_path = ROOT / page
            html = read_text(page)
            for href in re.findall(r'href="([^"]+)"', html):
                parsed = urlsplit(href)
                if parsed.scheme or href.startswith(("#", "mailto:", "tel:")):
                    continue
                target = (page_path.parent / parsed.path).resolve()
                if parsed.path.endswith("/"):
                    target = target / "index.html"
                elif not target.suffix:
                    continue
                with self.subTest(page=page, href=href):
                    self.assertTrue(target.exists(), f"missing destination: {href}")

    def test_only_approved_remote_script_origin_exists(self) -> None:
        for page in PAGES:
            remote_scripts = re.findall(r'<script[^>]+src="(https?://[^"]+)"', read_text(page))
            with self.subTest(page=page):
                if page in ("contact.html", "reviews.html"):
                    self.assertEqual(remote_scripts, ["https://challenges.cloudflare.com/turnstile/v0/api.js"])
                else:
                    self.assertEqual(remote_scripts, [])

    def test_homepage_media_hierarchy_and_loading_contract(self) -> None:
        home = read_text("index.html")
        self.assertEqual(home.count('data-media-source="generated"'), 4)
        self.assertEqual(home.count('data-media-source="founder-photo"'), 1)
        self.assertEqual(home.count('data-media-source="pdf-preview"'), 3)
        self.assertEqual(home.count('data-media-source="code-native"'), 1)
        self.assertEqual(home.count('fetchpriority="high"'), 1)
        self.assertEqual(len(re.findall(r'<article class="service-chapter"', home)), 4)
        self.assertEqual(len(re.findall(r'class="service-destination"', home)), 8)

    def test_preview_builder_is_local_only(self) -> None:
        builder = read_text("scripts/build-case-study-previews.mjs")
        self.assertNotRegex(builder, r"https?://")
        for forbidden in ("fetch(", "xmlhttprequest", "google", "lens", "upload"):
            self.assertNotIn(forbidden, builder.lower())

    def test_required_visual_assets_exist_and_meet_byte_budgets(self) -> None:
        hero = ROOT / "assets/images/service-visuals/epic-hero-connected-workshop-1920.avif"
        self.assertTrue(hero.exists())
        self.assertLessEqual(hero.stat().st_size, 250 * 1024)
        for base in SERVICE_BASES:
            for width, budget_kib in ((640, 90), (1200, 140), (1920, 160)):
                for extension in ("avif", "webp"):
                    path = ROOT / f"assets/images/service-visuals/{base}-{width}.{extension}"
                    with self.subTest(path=str(path)):
                        self.assertTrue(path.exists())
                        self.assertLessEqual(path.stat().st_size, budget_kib * 1024)
        for path in (
            ROOT / "assets/images/founder/ethan-platt-graduation-close-640.avif",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-640.webp",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.avif",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.webp",
            ROOT / "assets/images/founder/ethan-platt-graduation-close-1200.jpg",
        ):
            with self.subTest(path=str(path)):
                self.assertTrue(path.exists())
        for name in CASE_PREVIEWS:
            path = ROOT / "assets/images/case-studies" / name
            with self.subTest(path=str(path)):
                self.assertTrue(path.exists())
                self.assertLessEqual(path.stat().st_size, 120 * 1024)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run all tests and capture exact failures**

Run:

```bash
npm run test:media
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Expected before cleanup: failures identify any page missing shared landmarks/logo dimensions and any missing or oversized finalized asset; protected Contact/Reviews tests continue to pass.

- [ ] **Step 3: Fix only the failures reported by the quality gate**

For every page in `PAGES`, use the Task 7 shared header contract and add `width="787" height="904"` to the logo. Do not alter protected Contact/Reviews main content. Fix missing local destinations by correcting the link to its already-approved target; do not create new destinations or silently remove working actions. Optimize any over-budget derivative from its approved master without changing dimensions, crop, or visible content, then rerun the specific failing asset subtest.

- [ ] **Step 4: Run the complete automated suite**

Run:

```bash
npm run test:media
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Expected: every test passes with no skipped test and no warning.

- [ ] **Step 5: Run responsive and keyboard review from a local origin**

Start the static site:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Review `/`, `/about.html`, `/pricing.html`, `/founder.html`, `/services/`, `/services/app-building.html`, `/contact.html`, and `/reviews.html` at 320×800, 360×800, 768×1024, and 1440×900. At each viewport verify:

- `document.documentElement.scrollWidth <= window.innerWidth` is `true`;
- the skip link becomes visible on keyboard focus and lands on `#main`;
- the mobile menu opens from the Menu button, reports `aria-expanded="true"`, closes on Escape, and returns focus;
- all eight homepage service destinations remain visible without hover and activate as ordinary links;
- the four grouped desktop chapters become one logical column at 920px and retain copy-before-action reading order;
- the Websites & E-Commerce code-native diagram stays within the viewport at 320 CSS pixels, preserves Website → Secure checkout → Customer flow DOM order, and remains understandable with CSS disabled;
- the homepage contains only the four approved generated raster placements; the founder portrait and three proof previews are genuine local evidence;
- focus indicators are visible on white, soft, image-led, and ink-dark surfaces;
- Contact and Reviews forms, fields, Turnstile containers, data-backed review containers, and page-specific layouts are unchanged;
- no image causes layout movement after load;
- reduced-motion emulation removes image zoom and animated scrolling.

Stop the server with Control-C after review. Do not submit either public form during this visual QA pass.

- [ ] **Step 6: Run final security and originality diff review**

Run:

```bash
git diff --check
git diff -- assets/js/main.js assets/js/qualification.js assets/js/reviews.js contact.html reviews.html
rg -n "unsafe-inline|unsafe-eval|@import|https?://.*\.(woff2?|ttf|otf)" --glob '*.html' --glob '*.css'
git status --short
```

Expected: `git diff --check` is silent; JavaScript has no diff; Contact/Reviews show shared-shell changes only; no remote font or weakened CSP token was introduced; status lists only planned files. Visually confirm that artwork contains no vendor logo, readable UI, lock/shield cliché, generic hacker/server-room imagery, Apple device silhouette, Apple-like product stage, or copied Apple layout proportion.

Also inspect the three PDF previews against page one of their source PDFs and confirm that they are faithful renders with no generated or inserted content. Confirm that the visual-pages changes introduce no external upload/reverse-image action and do not invoke the superseded original-media external-review step.

- [ ] **Step 7: Commit the quality gates and final corrections**

```bash
git add tests/test_visual_quality_gates.py index.html about.html pricing.html founder.html contact.html reviews.html services/index.html services/app-building.html services/automation.html services/ecommerce.html services/firewalls.html services/infrastructure.html services/software.html services/virtualization.html services/webhosting.html assets/css/styles.css
git commit -m "test: enforce visual accessibility and performance gates"
```

---

## Final Verification

- [ ] Run all automated checks:

```bash
npm run test:media
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Expected: every Node media test and Python site-contract test passes.

- [ ] Confirm the protected behavior hashes still match:

```bash
python3 -m unittest tests/test_contact_reviews_regression.py -v
```

Expected: all 4 tests pass.

- [ ] Inspect the branch before requesting review:

```bash
git status --short
git log --oneline --decorate -8
git diff --check HEAD~8..HEAD
```

Expected: the working tree is clean, eight focused implementation commits are visible after the plan commit, and the range check is silent.

- [ ] Open the final homepage, About, Pricing, founder page, one representative service page, Contact, and Reviews at desktop and mobile sizes and record the completed manual checks in the pull-request description. Do not merge or deploy without the user's direction.
