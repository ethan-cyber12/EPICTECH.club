# EPIC TECH Original Media and Founder Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Produce privacy-safe founder-photo derivatives, an original EPIC Signal Workshop asset family, representative social images, and verified founder credential/metadata contracts for the approved founder-led redesign.

**Architecture:** Keep all user-supplied photographs and high-resolution workshop masters under one gitignored private-media boundary. A pinned Sharp pipeline creates the exact self-hosted AVIF/WebP/JPEG files consumed by the visual-pages plan, strips metadata by construction, enforces dimensions and budgets, and records reproducible hashes. This plan owns media processing and, after the visual-pages work exists, only the Open Graph/Twitter tags in the homepage and founder-page heads; it never edits published body markup, CSS, navigation, structured data, or service functionality.

**Tech Stack:** Node.js 20 or newer; npm; node:test; Sharp 0.35.4; OpenAI ImageGen through the imagegen skill; static HTML metadata; Python's local HTTP server; Lighthouse 12.8.2.

**Spec:** docs/superpowers/specs/2026-09-01-epictech-founder-led-redesign-design.md

## Global Constraints

- Preserve the EPIC TECH palette exactly: blue #0B5CFF, deep blue #083B9A, green #00B67A, ink #101820, white #FFFFFF, and soft background #F4F7FB.
- Use only Ethan Platt's supplied real photographs for founder imagery. Do not create a synthetic version of Ethan.
- Strip EXIF, GPS, device, timestamp, IPTC, XMP, and comment metadata from every published founder image.
- Do not publish a raw portrait, a private review sheet, or a high-resolution workshop master.
- Crop out or exclude readable school identifiers, diploma details, vehicle plates, precise location signs, and unconsented bystanders.
- Do not publish military dates, unit or station details, clearances, GPA, cohort details, student identifiers, diploma images, a home address, a personal telephone number, or a private email address.
- The approved visible credentials are: B.S. in Information Technology; B.S. in Cybersecurity; valedictorian in both degree programs; Advanced Achievement Award recipient in both degree programs.
- Do not change the confirmed award label to Academic Scholar.
- Original workshop art must not copy Apple assets, code, typefaces, device silhouettes, copy, layouts, section proportions, animation timing, visual trade dress, or another vendor's marks or readable interfaces.
- Workshop art must avoid lock/shield clichés, device glamour shots, generic hackers, server rooms, glowing hands, vendor logos, and readable text.
- Produce workshop AVIF and WebP variants at 640×400, 1200×750, and 1920×1200.
- Produce the founder close portrait at 640×800 and 1200×1500 in AVIF/WebP, plus a 1200×1500 JPEG fallback.
- Prepare the full-body and open-arms photographs at 640×960 and 1200×1800 in AVIF/WebP, plus 1200×1800 JPEG fallbacks, but do not add them to a page without a separately approved placement.
- Target the 1920-pixel homepage hero at or below 250 KB where quality permits.
- Target service images at or below 90 KB at 640 pixels, 140 KB at 1200 pixels, and 160 KB at 1920 pixels where quality permits; do not destroy visible quality merely to force a number.
- Give every published image intrinsic dimensions. Use empty alt text for decorative workshop art and concise descriptive alt text for informative founder portraits.
- Only a measured above-the-fold LCP candidate may load eagerly or use fetchpriority="high"; offscreen images use loading="lazy" and decoding="async".
- Do not add third-party fonts, trackers, widgets, CDNs, a runtime framework, autoplay, parallax, scroll-jacking, unsafe-inline, or unsafe-eval.
- Do not change Contact or Reviews page-specific content, structure, fields, validation, scripts, APIs, or behavior.
- Do not merge, deploy, or activate external configuration without the user's direction.

## Cross-Plan Execution Order

1. Execute this plan's Tasks 1–5 to produce the media files and content/metadata handoff.
2. Execute docs/superpowers/plans/2026-09-01-epictech-visual-pages.md. That plan owns assets/css/styles.css, index.html and founder.html body markup, service-page image markup, and page-specific visual tests.
3. Execute this plan's Task 6 to add only the approved Open Graph/Twitter tags and verify the founder claims against the completed page bodies.
4. Execute this plan's Task 7 as the combined media/founder verification gate.
5. Complete both plans' verification gates before the discoverability/security plan changes structured data, sitemap, privacy, or deployment documentation.

This sequencing prevents two plans from independently creating founder.html or competing over published page markup.

## Exact Asset Interface Produced for the Visual-Pages Plan

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

Additional prepared but initially unused founder files:

    assets/images/founder/ethan-platt-graduation-full-body-{640,1200}.{avif,webp}
    assets/images/founder/ethan-platt-graduation-full-body-1200.jpg
    assets/images/founder/ethan-platt-graduation-open-arms-{640,1200}.{avif,webp}
    assets/images/founder/ethan-platt-graduation-open-arms-1200.jpg

Social files owned by this plan:

    assets/images/social/epic-tech-home-og-1200x630.jpg
    assets/images/social/ethan-platt-founder-og-1200x630.jpg

## Private Inputs, Never Committed

    .private-media/founder/ethan-close-graduation-original
    .private-media/founder/ethan-full-body-graduation-original
    .private-media/founder/ethan-open-arms-graduation-original
    .private-media/workshop-masters/epic-hero-connected-workshop-master.png
    .private-media/workshop-masters/epic-service-network-wifi-master.png
    .private-media/workshop-masters/epic-service-firewalls-security-master.png
    .private-media/workshop-masters/epic-service-websites-master.png
    .private-media/workshop-masters/epic-service-business-apps-master.png
    .private-media/workshop-masters/epic-service-automation-master.png
    .private-media/workshop-masters/epic-service-ecommerce-master.png
    .private-media/workshop-masters/epic-service-virtualization-master.png
    .private-media/workshop-masters/epic-service-internal-tools-master.png

Founder inputs are intentionally extensionless. Sharp identifies the real format from file bytes, so the original HEIC, JPEG, PNG, or WebP attachment may be staged without assigning a false extension.

## File and Interface Map

### Tooling

- Modify: .gitignore
- Create: package.json
- Create: package-lock.json
- Create: scripts/media-catalog.mjs
- Create: scripts/audit-source-media.mjs
- Create: scripts/build-media.mjs
- Create: scripts/build-review-sheets.mjs
- Create: scripts/normalize-workshop-masters.mjs
- Create: scripts/originality-lib.mjs
- Create: scripts/record-originality.mjs
- Create: scripts/verify-originality.mjs
- Create: scripts/verify-media.mjs
- Create: scripts/founder-content-contract.mjs
- Create: scripts/verify-founder-content.mjs

### Tests

- Create: tests/media-catalog.test.mjs
- Create: tests/founder-media.test.mjs
- Create: tests/originality.test.mjs
- Create: tests/published-media.test.mjs
- Create: tests/founder-content-contract.test.mjs

### Originality records

- Create: docs/media/epic-signal-workshop-prompts.md
- Create: docs/media/epic-signal-workshop-originality.json
- Create: docs/media/founder-content-and-social-metadata.json
- Create: docs/media/original-media-handoff.md

### Published page ownership

- Modify only the `<head>` social-image metadata after visual-pages completion: index.html
- Modify only the `<head>` social-image metadata after visual-pages completion: founder.html
- Do not modify: assets/css/styles.css
- Do not modify: any service-page HTML

### Stable JavaScript interfaces

scripts/media-catalog.mjs exports:

    founderAssets: FounderAsset[]
    workshopAssets: WorkshopAsset[]
    socialAssets: SocialAsset[]
    outputPath(base: string, width: number, format: string): string

scripts/build-media.mjs exports:

    encodeToBudget(pipeline: sharp.Sharp, format: "avif" | "webp" | "jpg", maximumBytes: number): Promise<Buffer>
    buildFounderAsset(asset: FounderAsset): Promise<string[]>
    buildWorkshopAsset(asset: WorkshopAsset): Promise<string[]>
    buildSocialAsset(asset: SocialAsset): Promise<string>

scripts/originality-lib.mjs exports:

    sha256File(path: string): Promise<string>
    differenceHash(path: string): Promise<bigint>
    hammingDistance(left: bigint, right: bigint): number

---

### Task 1: Establish the private-media boundary and exact asset catalog

**Files:**
- Modify: .gitignore
- Create: package.json
- Create: package-lock.json
- Create: tests/media-catalog.test.mjs
- Create: scripts/media-catalog.mjs

**Interfaces:**
- Consumes: The private inputs and exact public output interface above.
- Produces: founderAssets, workshopAssets, socialAssets, and outputPath() for Tasks 2–5.

- [ ] **Step 1: Protect private source and review directories before staging media**

Append exactly to .gitignore:

    .private-media/
    .media-review/
    node_modules/

Run:

    git check-ignore -v .private-media/founder/ethan-close-graduation-original .private-media/workshop-masters/epic-hero-connected-workshop-master.png .media-review/founder-contact-sheet.jpg node_modules/sharp/package.json

Expected: four lines naming .gitignore. Stop before staging any photograph if a path is not ignored.

- [ ] **Step 2: Add the pinned local build dependency**

Create package.json:

    {
      "name": "epictech-static-site",
      "private": true,
      "type": "module",
      "engines": {
        "node": ">=20"
      },
      "scripts": {
        "test:media": "node --test tests/*.test.mjs",
        "media:founder": "node scripts/build-media.mjs --group founder",
        "media:workshop": "node scripts/build-media.mjs --group workshop",
        "media:social": "node scripts/build-media.mjs --group social",
        "media:build": "node scripts/build-media.mjs --group all",
        "media:verify": "node scripts/verify-media.mjs",
        "media:originality": "node scripts/verify-originality.mjs"
      },
      "devDependencies": {
        "sharp": "0.35.4"
      }
    }

Run:

    npm install --package-lock-only
    npm ci

Expected: package-lock.json is created and node_modules remains ignored.

- [ ] **Step 3: Write the failing catalog contract test**

Create tests/media-catalog.test.mjs:

    import assert from 'node:assert/strict';
    import test from 'node:test';
    import {
      founderAssets,
      workshopAssets,
      socialAssets,
      outputPath
    } from '../scripts/media-catalog.mjs';

    test('catalog exposes the three supplied founder sources', () => {
      assert.deepEqual(founderAssets.map((asset) => asset.id), [
        'ethan-platt-graduation-close',
        'ethan-platt-graduation-full-body',
        'ethan-platt-graduation-open-arms'
      ]);
      assert.deepEqual(founderAssets.map((asset) => asset.input), [
        '.private-media/founder/ethan-close-graduation-original',
        '.private-media/founder/ethan-full-body-graduation-original',
        '.private-media/founder/ethan-open-arms-graduation-original'
      ]);
      for (const asset of founderAssets) {
        assert.deepEqual(asset.widths, [640, 1200]);
        assert.deepEqual(asset.formats, ['avif', 'webp']);
        assert.deepEqual(asset.jpgWidths, [1200]);
        assert.match(asset.outputBase, /^assets\/images\/founder\//);
      }
    });

    test('catalog matches the visual-pages workshop interface exactly', () => {
      assert.deepEqual(workshopAssets.map((asset) => asset.id), [
        'epic-hero-connected-workshop',
        'epic-service-network-wifi',
        'epic-service-firewalls-security',
        'epic-service-websites',
        'epic-service-business-apps',
        'epic-service-automation',
        'epic-service-ecommerce',
        'epic-service-virtualization',
        'epic-service-internal-tools'
      ]);
      for (const asset of workshopAssets) {
        assert.deepEqual(asset.widths, [640, 1200, 1920]);
        assert.deepEqual(asset.formats, ['avif', 'webp']);
        assert.match(asset.master, /^\.private-media\/workshop-masters\//);
        assert.equal(asset.outputBase, 'assets/images/service-visuals/' + asset.id);
      }
    });

    test('catalog defines two complete social images', () => {
      assert.deepEqual(socialAssets.map((asset) => asset.output), [
        'assets/images/social/epic-tech-home-og-1200x630.jpg',
        'assets/images/social/ethan-platt-founder-og-1200x630.jpg'
      ]);
      for (const asset of socialAssets) {
        assert.equal(asset.width, 1200);
        assert.equal(asset.height, 630);
      }
    });

    test('outputPath is stable', () => {
      assert.equal(
        outputPath('assets/images/service-visuals/epic-service-websites', 1200, 'avif'),
        'assets/images/service-visuals/epic-service-websites-1200.avif'
      );
    });

- [ ] **Step 4: Run the catalog test and verify red**

Run:

    node --test tests/media-catalog.test.mjs

Expected: FAIL with ERR_MODULE_NOT_FOUND for scripts/media-catalog.mjs.

- [ ] **Step 5: Implement the catalog**

Create scripts/media-catalog.mjs:

    export const founderAssets = [
      {
        id: 'ethan-platt-graduation-close',
        input: '.private-media/founder/ethan-close-graduation-original',
        outputBase: 'assets/images/founder/ethan-platt-graduation-close',
        widths: [640, 1200],
        formats: ['avif', 'webp'],
        jpgWidths: [1200],
        aspect: { width: 4, height: 5 },
        crop: { strategy: 'attention' },
        alt: 'Ethan Platt at his graduation ceremony'
      },
      {
        id: 'ethan-platt-graduation-full-body',
        input: '.private-media/founder/ethan-full-body-graduation-original',
        outputBase: 'assets/images/founder/ethan-platt-graduation-full-body',
        widths: [640, 1200],
        formats: ['avif', 'webp'],
        jpgWidths: [1200],
        aspect: { width: 2, height: 3 },
        crop: { strategy: 'attention' },
        alt: 'Ethan Platt in graduation attire'
      },
      {
        id: 'ethan-platt-graduation-open-arms',
        input: '.private-media/founder/ethan-open-arms-graduation-original',
        outputBase: 'assets/images/founder/ethan-platt-graduation-open-arms',
        widths: [640, 1200],
        formats: ['avif', 'webp'],
        jpgWidths: [1200],
        aspect: { width: 2, height: 3 },
        crop: { strategy: 'attention' },
        alt: ''
      }
    ];

    const workshopIds = [
      'epic-hero-connected-workshop',
      'epic-service-network-wifi',
      'epic-service-firewalls-security',
      'epic-service-websites',
      'epic-service-business-apps',
      'epic-service-automation',
      'epic-service-ecommerce',
      'epic-service-virtualization',
      'epic-service-internal-tools'
    ];

    export const workshopAssets = workshopIds.map((id) => ({
      id,
      master: '.private-media/workshop-masters/' + id + '-master.png',
      outputBase: 'assets/images/service-visuals/' + id,
      widths: [640, 1200, 1920],
      formats: ['avif', 'webp'],
      aspect: { width: 8, height: 5 },
      budgets: id === 'epic-hero-connected-workshop'
        ? { 640: 120000, 1200: 200000, 1920: 250000 }
        : { 640: 90000, 1200: 140000, 1920: 160000 }
    }));

    export const socialAssets = [
      {
        id: 'epic-tech-home-og',
        input: '.private-media/workshop-masters/epic-hero-connected-workshop-master.png',
        output: 'assets/images/social/epic-tech-home-og-1200x630.jpg',
        width: 1200,
        height: 630,
        position: 'attention',
        maximumBytes: 600000
      },
      {
        id: 'ethan-platt-founder-og',
        input: '.private-media/founder/ethan-close-graduation-original',
        output: 'assets/images/social/ethan-platt-founder-og-1200x630.jpg',
        width: 1200,
        height: 630,
        position: 'attention',
        maximumBytes: 600000
      }
    ];

    export function outputPath(base, width, format) {
      return base + '-' + width + '.' + format;
    }

- [ ] **Step 6: Run the catalog test and verify green**

Run:

    node --test tests/media-catalog.test.mjs

Expected: four tests pass.

- [ ] **Step 7: Commit the private boundary and catalog**

Run:

    git add .gitignore package.json package-lock.json scripts/media-catalog.mjs tests/media-catalog.test.mjs
    git commit -m "test: define original media interface"

Expected: git status does not list node_modules or .private-media.

---

### Task 2: Prepare all three founder photographs without publishing source metadata

**Files:**
- Private inputs: .private-media/founder/*
- Create: scripts/audit-source-media.mjs
- Create: scripts/build-media.mjs
- Create: scripts/build-review-sheets.mjs
- Create: tests/founder-media.test.mjs
- Create: assets/images/founder/*

**Interfaces:**
- Consumes: founderAssets and outputPath() from scripts/media-catalog.mjs.
- Produces: encodeToBudget(), buildFounderAsset(), 15 public founder derivatives, and one ignored contact sheet.

- [ ] **Step 1: Stage the three supplied attachments under exact ignored names**

Save the supplied files without conversion to:

    .private-media/founder/ethan-close-graduation-original
    .private-media/founder/ethan-full-body-graduation-original
    .private-media/founder/ethan-open-arms-graduation-original

Run:

    git check-ignore -v .private-media/founder/ethan-close-graduation-original .private-media/founder/ethan-full-body-graduation-original .private-media/founder/ethan-open-arms-graduation-original
    git ls-files .private-media

Expected: all three are ignored and git ls-files prints nothing.

- [ ] **Step 2: Add a metadata-safe source audit**

Create scripts/audit-source-media.mjs:

    import sharp from 'sharp';
    import { founderAssets } from './media-catalog.mjs';

    for (const asset of founderAssets) {
      const metadata = await sharp(asset.input, { failOn: 'error' }).metadata();
      if (!metadata.width || metadata.width < 1200) {
        throw new Error(asset.id + ' must be at least 1200 pixels wide');
      }
      console.log(JSON.stringify({
        id: asset.id,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        orientation: metadata.orientation || null,
        hasExif: Boolean(metadata.exif),
        hasIptc: Boolean(metadata.iptc),
        hasXmp: Boolean(metadata.xmp),
        hasComments: Boolean(metadata.comments)
      }));
    }

This script must never print raw EXIF, IPTC, XMP, GPS, device, serial-number, or timestamp values.

Run:

    node scripts/audit-source-media.mjs

Expected: three one-line summaries and no raw metadata values.

- [ ] **Step 3: Write the failing founder-output tests**

Create tests/founder-media.test.mjs:

    import assert from 'node:assert/strict';
    import { stat } from 'node:fs/promises';
    import test from 'node:test';
    import sharp from 'sharp';
    import { founderAssets, outputPath } from '../scripts/media-catalog.mjs';

    test('founder derivatives have exact dimensions and no private metadata', async () => {
      for (const asset of founderAssets) {
        for (const width of asset.widths) {
          const height = Math.round(width * asset.aspect.height / asset.aspect.width);
          for (const format of asset.formats) {
            const path = outputPath(asset.outputBase, width, format);
            const metadata = await sharp(path).metadata();
            assert.equal(metadata.width, width, path);
            assert.equal(metadata.height, height, path);
            for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
              assert.equal(metadata[key], undefined, path + ' contains ' + key);
            }
          }
        }
        for (const width of asset.jpgWidths) {
          const path = outputPath(asset.outputBase, width, 'jpg');
          const metadata = await sharp(path).metadata();
          assert.equal(metadata.width, width, path);
          assert.equal(metadata.height, Math.round(width * asset.aspect.height / asset.aspect.width), path);
          assert.equal(metadata.format, 'jpeg', path);
          for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
            assert.equal(metadata[key], undefined, path + ' contains ' + key);
          }
        }
      }
    });

    test('founder files stay within bounded delivery sizes', async () => {
      for (const asset of founderAssets) {
        assert.ok((await stat(outputPath(asset.outputBase, 640, 'avif'))).size <= 180000);
        assert.ok((await stat(outputPath(asset.outputBase, 640, 'webp'))).size <= 220000);
        assert.ok((await stat(outputPath(asset.outputBase, 1200, 'avif'))).size <= 320000);
        assert.ok((await stat(outputPath(asset.outputBase, 1200, 'webp'))).size <= 400000);
        assert.ok((await stat(outputPath(asset.outputBase, 1200, 'jpg'))).size <= 500000);
      }
    });

- [ ] **Step 4: Run the founder-output tests and verify red**

Run:

    node --test tests/founder-media.test.mjs

Expected: FAIL with ENOENT for the first assets/images/founder output.

- [ ] **Step 5: Implement the adaptive encoder and founder builder**

Create scripts/build-media.mjs. Import mkdir, readFile, writeFile from node:fs/promises, dirname from node:path, Sharp, and the three catalog arrays.

Use these exact quality floors:

    const qualities = {
      avif: [52, 48, 44, 40],
      webp: [80, 76, 72, 68],
      jpg: [84, 80, 76, 72]
    };

Implement:

    export async function encodeToBudget(pipeline, format, maximumBytes) {
      for (const quality of qualities[format]) {
        let buffer;
        if (format === 'avif') {
          buffer = await pipeline.clone().avif({ quality, effort: 6 }).toBuffer();
        } else if (format === 'webp') {
          buffer = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
        } else {
          buffer = await pipeline.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
        }
        if (buffer.length <= maximumBytes) return buffer;
      }
      throw new Error(format + ' cannot meet ' + maximumBytes + ' bytes without crossing the quality floor');
    }

    export async function buildFounderAsset(asset) {
      await mkdir(dirname(asset.outputBase), { recursive: true });
      const outputs = [];
      for (const width of asset.widths) {
        const height = Math.round(width * asset.aspect.height / asset.aspect.width);
        let pipeline = sharp(asset.input, { failOn: 'error' }).rotate().toColorspace('srgb');
        if (asset.crop.strategy === 'extract') pipeline = pipeline.extract(asset.crop);
        pipeline = pipeline.resize({
          width,
          height,
          fit: 'cover',
          position: asset.crop.strategy === 'attention' ? 'attention' : 'centre'
        });
        for (const format of asset.formats) {
          const maximumBytes = width === 640
            ? (format === 'avif' ? 180000 : 220000)
            : (format === 'avif' ? 320000 : 400000);
          const path = outputPath(asset.outputBase, width, format);
          await writeFile(path, await encodeToBudget(pipeline, format, maximumBytes));
          outputs.push(path);
        }
        if (asset.jpgWidths.includes(width)) {
          const path = outputPath(asset.outputBase, width, 'jpg');
          await writeFile(path, await encodeToBudget(pipeline, 'jpg', 500000));
          outputs.push(path);
        }
      }
      return outputs;
    }

The CLI accepts only --group founder, workshop, social, or all and exits nonzero for every other value. In this task, implement the founder branch; Tasks 4–5 add the other branches.

- [ ] **Step 6: Build and test founder derivatives**

Run:

    npm run media:founder
    node --test tests/founder-media.test.mjs

Expected: 15 files and two passing tests.

- [ ] **Step 7: Build a private contact sheet**

Create scripts/build-review-sheets.mjs. Composite the three 1200-pixel JPEGs onto a #F4F7FB canvas, label them only with their public asset ids, and write .media-review/founder-contact-sheet.jpg. Do not include the raw sources or metadata.

Run:

    node scripts/build-review-sheets.mjs --group founder

Expected: the contact sheet exists and git check-ignore identifies .gitignore.

- [ ] **Step 8: Complete the crop and privacy gate**

Inspect all three 1200-pixel JPEGs at 100 percent. Pass only when:

- Ethan's face is sharp and unobstructed.
- The close crop preserves natural headroom and shoulders.
- The full-body and open-arms crops preserve hands, feet, and graduation attire.
- No school identifier, diploma text/serial, vehicle plate, home detail, precise location sign, or unconsented bystander is readable.

If an attention crop fails, measure a safe rectangle in source pixels and replace that asset's crop with:

    {
      strategy: 'extract',
      left: measured integer,
      top: measured integer,
      width: measured integer,
      height: measured integer
    }

The four measured integers come from the actual supplied image and are evidence, not guessed defaults. Rebuild and repeat the review. Do not blur or generatively alter Ethan.

- [ ] **Step 9: Verify the source boundary and commit**

Run:

    git ls-files .private-media .media-review
    git add scripts/audit-source-media.mjs scripts/build-media.mjs scripts/build-review-sheets.mjs scripts/media-catalog.mjs tests/founder-media.test.mjs assets/images/founder
    git commit -m "feat: prepare privacy-safe founder media"

Expected: git ls-files prints nothing; the commit contains only processed public files and tooling.

---

### Task 3: Generate the EPIC Signal Workshop masters in private storage

**Files:**
- Create: docs/media/epic-signal-workshop-prompts.md
- Create: scripts/normalize-workshop-masters.mjs
- Private outputs: .private-media/workshop-masters/*.png

**Interfaces:**
- Consumes: workshopAssets and the approved art direction.
- Produces: Nine distinct, metadata-free private masters at an 8:5 ratio and at least 1920×1200.

- [ ] **Step 1: Record the shared generation prompt**

Create docs/media/epic-signal-workshop-prompts.md with:

    Create a completely original abstract architectural technical illustration for EPIC TECH. Use a wide 8:5 landscape composition at a minimum final size of 1920 by 1200 pixels. Build the scene from clean white and #F4F7FB surfaces, precise #101820 structural forms, a recurring #0B5CFF signal path, restrained #083B9A depth accents, and small #00B67A healthy-state nodes. The result should feel calm, spatial, technical, and editorial, with generous negative space and clear hierarchy. Use no text, letters, numbers, logos, readable interface, vendor marks, shields, padlocks, hackers, server rooms, glowing hands, smartphones, laptops, device glamour shots, photoreal product stages, Apple-like devices, Apple gradients, Apple layout proportions, or recognizable brand design language. Make this composition materially different from every other EPIC Signal Workshop image while retaining the palette and signal-path motif.

Add these subject prompts:

1. epic-hero-connected-workshop — Five distinct abstract work areas connected by one cobalt path; green nodes show healthy handoffs; center-right emphasis with quiet space around the system.
2. epic-service-network-wifi — A layered field connects a central routing structure to several small-business work zones; show reach and separation without a Wi-Fi icon.
3. epic-service-firewalls-security — A cobalt route passes through architectural checkpoints and controlled partitions; show verification and segmentation without shields or locks.
4. epic-service-websites — Modular content planes move through a clean publishing path into an organized public-facing structure; no browser, screen, or literal interface.
5. epic-service-business-apps — Separate inputs become an orderly connected workflow through reusable modules; no dashboard screenshot.
6. epic-service-automation — Repeated manual paths converge into one reliable route with healthy checkpoints; no robots or gears.
7. epic-service-ecommerce — Abstract catalog, order, payment, and fulfillment zones connect through one signal route; no cart, card, currency symbol, or checkout screen.
8. epic-service-virtualization — Nested compute volumes share a calm pool of abstract resources while remaining separated; no server rack or device enclosure.
9. epic-service-internal-tools — An operations hub connects records, approvals, and handoffs across several work areas; make its geometry visibly different from business apps.

After every generation, append a completed log row with id, tool “OpenAI ImageGen,” exact private output path, and decision “approved” or “regenerate.” Do not create blank rows.

- [ ] **Step 2: Use the imagegen skill for nine independent generations**

For each id, call ImageGen with the shared prompt plus that id's subject prompt. Do not use Apple, competitor, stock, or vendor imagery as a reference. Save the result to the exact private master path.

Expected: nine private PNGs. If a result is smaller than 1920×1200, ask ImageGen for a higher-resolution regeneration of the same original concept; do not upscale a small raster and label it a master.

- [ ] **Step 3: Normalize private masters without metadata or upscaling**

Create scripts/normalize-workshop-masters.mjs:

    import { rename } from 'node:fs/promises';
    import sharp from 'sharp';
    import { workshopAssets } from './media-catalog.mjs';

    for (const asset of workshopAssets) {
      const metadata = await sharp(asset.master, { failOn: 'error' }).metadata();
      if (!metadata.width || !metadata.height || metadata.width < 1920 || metadata.height < 1200) {
        throw new Error(asset.id + ' master must be at least 1920 by 1200 pixels');
      }
      const cropWidth = Math.min(metadata.width, Math.floor(metadata.height * 8 / 5));
      const cropHeight = Math.floor(cropWidth * 5 / 8);
      if (cropWidth < 1920 || cropHeight < 1200) {
        throw new Error(asset.id + ' cannot produce a 1920 by 1200 crop without upscaling');
      }
      const temporary = asset.master + '.normalized.png';
      await sharp(asset.master, { failOn: 'error' })
        .rotate()
        .toColorspace('srgb')
        .resize(cropWidth, cropHeight, { fit: 'cover', position: 'attention', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(temporary);
      const clean = await sharp(temporary).metadata();
      for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
        if (clean[key] !== undefined) throw new Error(asset.id + ' retained ' + key);
      }
      await rename(temporary, asset.master);
    }

Run:

    node scripts/normalize-workshop-masters.mjs

Expected: nine 8:5 masters, each at least 1920×1200, with no private metadata.

- [ ] **Step 4: Perform the visual art-direction gate**

Review the nine masters together. Approve only when every image:

- Uses the approved palette plus ordinary antialiasing/color interpolation.
- Has no readable text, vendor logo, interface, shield, lock, generic hacker, server room, glowing hand, device glamour shot, or Apple-like stage/device composition.
- Is distinguishable from the other eight at thumbnail size.
- Leaves visual quiet for adjacent page copy.
- Uses the cobalt path and green health nodes without repeating another asset's geometry.

Regenerate a failed image with the same subject prompt plus the failed criterion. Keep every generated master private.

- [ ] **Step 5: Commit only the prompt record and normalizer**

Run:

    git ls-files .private-media
    git add docs/media/epic-signal-workshop-prompts.md scripts/normalize-workshop-masters.mjs
    git commit -m "docs: record original workshop generation"

Expected: git ls-files prints nothing. No master PNG is committed.

---

### Task 4: Record originality review evidence and reject internal near-duplicates

**Files:**
- Create: scripts/originality-lib.mjs
- Create: scripts/record-originality.mjs
- Create: scripts/verify-originality.mjs
- Create: tests/originality.test.mjs
- Create: docs/media/epic-signal-workshop-originality.json

**Interfaces:**
- Consumes: Nine private reviewed masters and workshopAssets.
- Produces: sha256File(), differenceHash(), hammingDistance(), and a review manifest that names the generation method without asserting legal ownership.

- [ ] **Step 1: Write failing hashing tests**

Create tests/originality.test.mjs:

    import assert from 'node:assert/strict';
    import { mkdtemp, writeFile } from 'node:fs/promises';
    import { tmpdir } from 'node:os';
    import { join } from 'node:path';
    import test from 'node:test';
    import sharp from 'sharp';
    import { sha256File, differenceHash, hammingDistance } from '../scripts/originality-lib.mjs';

    test('hash helpers are deterministic', async () => {
      const directory = await mkdtemp(join(tmpdir(), 'epic-originality-'));
      const file = join(directory, 'sample.bin');
      await writeFile(file, 'EPIC TECH');
      assert.equal(await sha256File(file), await sha256File(file));
      assert.equal(hammingDistance(0n, 3n), 2);
    });

    test('differenceHash separates distinct geometry', async () => {
      const directory = await mkdtemp(join(tmpdir(), 'epic-dhash-'));
      const left = join(directory, 'left.png');
      const right = join(directory, 'right.png');
      await sharp({ create: { width: 90, height: 80, channels: 3, background: '#0B5CFF' } }).png().toFile(left);
      await sharp({ create: { width: 90, height: 80, channels: 3, background: '#00B67A' } })
        .composite([{ input: Buffer.from('<svg width="90" height="80"><rect x="45" width="45" height="80" fill="#101820"/></svg>') }])
        .png()
        .toFile(right);
      assert.notEqual(await differenceHash(left), await differenceHash(right));
    });

- [ ] **Step 2: Run the hashing tests and verify red**

Run:

    node --test tests/originality.test.mjs

Expected: FAIL with ERR_MODULE_NOT_FOUND for scripts/originality-lib.mjs.

- [ ] **Step 3: Implement the hashing library**

Create scripts/originality-lib.mjs:

    import { createHash } from 'node:crypto';
    import { readFile } from 'node:fs/promises';
    import sharp from 'sharp';

    export async function sha256File(path) {
      return createHash('sha256').update(await readFile(path)).digest('hex');
    }

    export async function differenceHash(path) {
      const pixels = await sharp(path).resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer();
      let hash = 0n;
      let bit = 0n;
      for (let row = 0; row < 8; row += 1) {
        for (let column = 0; column < 8; column += 1) {
          if (pixels[row * 9 + column] > pixels[row * 9 + column + 1]) hash |= 1n << bit;
          bit += 1n;
        }
      }
      return hash;
    }

    export function hammingDistance(left, right) {
      let value = left ^ right;
      let count = 0;
      while (value !== 0n) {
        value &= value - 1n;
        count += 1;
      }
      return count;
    }

Run:

    node --test tests/originality.test.mjs

Expected: two tests pass.

- [ ] **Step 4: Perform two-service reverse-image review**

Run every full private master through both Google Lens and Bing Visual Search. Inspect the top visually similar results from both services. Pass only when neither service surfaces a materially matching composition, proprietary interface, recognizable vendor illustration, or copied scene. Compare the contact sheet with Apple's current public home and product pages for obvious trade-dress resemblance without downloading Apple assets into the repository.

Reverse-image search can surface obvious similarity; it does not prove legal ownership. Regenerate any questionable master before recording approval.

- [ ] **Step 5: Implement and run the originality recorder**

scripts/record-originality.mjs must require:

    --visual approved
    --reverse-search no-material-match
    --trade-dress clear

It computes each private master SHA-256 and 16-character difference hash and writes docs/media/epic-signal-workshop-originality.json with:

    {
      "schemaVersion": 1,
      "generationTool": "OpenAI ImageGen",
      "assets": [
        {
          "id": value from workshopAssets,
          "privateMasterName": basename only,
          "sourceSha256": actual SHA-256,
          "differenceHash": actual 16-character hexadecimal hash,
          "publicDerivatives": [],
          "review": {
            "noVendorMarks": true,
            "noReadableTextOrUi": true,
            "noForbiddenCliches": true,
            "noAppleTradeDress": true,
            "reverseImageSearch": "no-material-match",
            "humanDecision": "approved"
          }
        }
      ]
    }

The phrases describing actual values above define the generated fields; the script writes real ids, basenames, and hashes, never those descriptions.

Run:

    node scripts/record-originality.mjs --visual approved --reverse-search no-material-match --trade-dress clear

Expected: nine records. The JSON contains no private directory path and no personal data.

- [ ] **Step 6: Implement the originality verifier**

scripts/verify-originality.mjs must:

- Recompute the private source hashes when .private-media is present.
- Require every review flag and decision.
- Reject duplicate SHA-256 values.
- Reject any master pair whose difference-hash Hamming distance is below 12, naming both ids and the observed distance.
- If private masters are absent, still verify manifest shape, decisions, uniqueness, and any publicDerivative hashes recorded by Task 5.

Run:

    npm run media:originality

Expected: PASS summary naming nine reviewed originals and a minimum pairwise distance of at least 12.

- [ ] **Step 7: Commit the review evidence**

Run:

    git add scripts/originality-lib.mjs scripts/record-originality.mjs scripts/verify-originality.mjs tests/originality.test.mjs docs/media/epic-signal-workshop-originality.json
    git commit -m "test: document workshop originality review"

---

### Task 5: Build the exact public media interface and social images

**Files:**
- Modify: scripts/build-media.mjs
- Modify: scripts/build-review-sheets.mjs
- Modify: scripts/record-originality.mjs
- Create: scripts/verify-media.mjs
- Create: tests/published-media.test.mjs
- Create: assets/images/service-visuals/*
- Create: assets/images/social/*

**Interfaces:**
- Consumes: workshopAssets, socialAssets, reviewed private masters, and encodeToBudget().
- Produces: 54 service-visual derivatives, two social JPEGs, derivative hashes in the originality manifest, and the exact visual-pages asset interface.

- [ ] **Step 1: Write failing published-media tests**

Create tests/published-media.test.mjs:

    import assert from 'node:assert/strict';
    import { stat } from 'node:fs/promises';
    import test from 'node:test';
    import sharp from 'sharp';
    import { workshopAssets, socialAssets, outputPath } from '../scripts/media-catalog.mjs';

    test('service visuals have exact dimensions, formats, budgets, and no metadata', async () => {
      for (const asset of workshopAssets) {
        for (const width of asset.widths) {
          const height = Math.round(width * asset.aspect.height / asset.aspect.width);
          for (const format of asset.formats) {
            const path = outputPath(asset.outputBase, width, format);
            const metadata = await sharp(path).metadata();
            assert.equal(metadata.width, width, path);
            assert.equal(metadata.height, height, path);
            if (format === 'avif') {
              assert.ok(['avif', 'heif'].includes(metadata.format), path);
            } else {
              assert.equal(metadata.format, format, path);
            }
            for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
              assert.equal(metadata[key], undefined, path + ' contains ' + key);
            }
            assert.ok((await stat(path)).size <= asset.budgets[width], path);
          }
        }
      }
    });

    test('social images are complete metadata-free JPEGs', async () => {
      for (const asset of socialAssets) {
        const metadata = await sharp(asset.output).metadata();
        assert.equal(metadata.width, 1200, asset.output);
        assert.equal(metadata.height, 630, asset.output);
        assert.equal(metadata.format, 'jpeg', asset.output);
        for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
          assert.equal(metadata[key], undefined, asset.output + ' contains ' + key);
        }
        assert.ok((await stat(asset.output)).size <= asset.maximumBytes, asset.output);
      }
    });

- [ ] **Step 2: Run the tests and verify red**

Run:

    node --test tests/published-media.test.mjs

Expected: FAIL with ENOENT for the first service visual.

- [ ] **Step 3: Add workshop and social build functions**

Extend scripts/build-media.mjs:

    export async function buildWorkshopAsset(asset) {
      await mkdir(dirname(asset.outputBase), { recursive: true });
      const outputs = [];
      for (const width of asset.widths) {
        const height = Math.round(width * asset.aspect.height / asset.aspect.width);
        const base = sharp(asset.master, { failOn: 'error' })
          .toColorspace('srgb')
          .resize({ width, height, fit: 'cover', position: 'attention', withoutEnlargement: true });
        for (const format of asset.formats) {
          const path = outputPath(asset.outputBase, width, format);
          await writeFile(path, await encodeToBudget(base, format, asset.budgets[width]));
          outputs.push(path);
        }
      }
      return outputs;
    }

    export async function buildSocialAsset(asset) {
      await mkdir(dirname(asset.output), { recursive: true });
      const pipeline = sharp(asset.input, { failOn: 'error' })
        .rotate()
        .toColorspace('srgb')
        .resize({ width: 1200, height: 630, fit: 'cover', position: asset.position });
      await writeFile(asset.output, await encodeToBudget(pipeline, 'jpg', asset.maximumBytes));
      return asset.output;
    }

Before buildWorkshopAsset() runs, call the originality verifier with private-source checking enabled. The --group behavior is:

    founder  => founderAssets
    workshop => originality verification, then workshopAssets
    social   => originality verification, then socialAssets
    all      => founder, workshop, social

- [ ] **Step 4: Build and test public media**

Run:

    npm run media:workshop
    npm run media:social
    node --test tests/published-media.test.mjs

Expected: 54 service visual files, two social JPEGs, and two passing tests.

- [ ] **Step 5: Record public derivative hashes**

Extend scripts/record-originality.mjs so each workshop record's publicDerivatives contains six objects, ordered by width then format:

    {
      "path": exact published path,
      "width": 640 or 1200 or 1920,
      "format": "avif" or "webp",
      "sha256": actual published-file hash
    }

Run:

    node scripts/record-originality.mjs --visual approved --reverse-search no-material-match --trade-dress clear
    npm run media:originality

Expected: 54 public derivative hashes and a passing originality check.

- [ ] **Step 6: Add the independent public-media verifier**

Create scripts/verify-media.mjs. It must:

- Re-run every dimension, format, metadata, and budget assertion from tests/founder-media.test.mjs and tests/published-media.test.mjs.
- Require exactly 15 files in assets/images/founder, 54 in assets/images/service-visuals, and two in assets/images/social.
- Reject a master.png, private source, or unsupported extension in any public image directory.
- Compare every service-visual hash with docs/media/epic-signal-workshop-originality.json.
- Scan public image bytes for GPS, DateTimeOriginal, Make, Model, SerialNumber, gmail.com, and tel:, failing with the path and token if found.

Run:

    npm run media:verify

Expected: PASS summary with 15 founder files, 54 service visuals, two social files, and zero privacy findings.

- [ ] **Step 7: Build and inspect contact sheets**

Extend scripts/build-review-sheets.mjs with:

    --group workshop => .media-review/workshop-contact-sheet.jpg
    --group social   => .media-review/social-contact-sheet.jpg

Run:

    node scripts/build-review-sheets.mjs --group workshop
    node scripts/build-review-sheets.mjs --group social

Inspect for banding, malformed geometry, accidental text, cropped green nodes, subject cutoff, and unsafe social-image crops. A budget pass does not override a visual failure. If minimum allowed quality looks poor, simplify or regenerate the master instead of lowering quality again.

- [ ] **Step 8: Verify the visual-pages paths before commit**

Run:

    test -f assets/images/service-visuals/epic-hero-connected-workshop-1920.avif
    test -f assets/images/service-visuals/epic-service-internal-tools-1200.webp
    test -f assets/images/founder/ethan-platt-graduation-close-640.avif
    test -f assets/images/founder/ethan-platt-graduation-close-1200.webp
    test -f assets/images/founder/ethan-platt-graduation-close-1200.jpg
    git ls-files .private-media .media-review

Expected: all tests exit zero and git ls-files prints nothing.

- [ ] **Step 9: Commit the public interface**

Run:

    git add scripts/build-media.mjs scripts/build-review-sheets.mjs scripts/record-originality.mjs scripts/verify-media.mjs tests/published-media.test.mjs docs/media/epic-signal-workshop-originality.json assets/images/founder assets/images/service-visuals assets/images/social
    git commit -m "feat: add original responsive media"

---

### Task 6: Add social metadata and verify founder content after the visual-pages plan

**Files:**
- Create: tests/media-metadata-founder-claims.test.mjs
- Modify head only: index.html
- Modify head only: founder.html

**Interfaces:**
- Consumes: index.html and founder.html produced by Tasks 3–4 of docs/superpowers/plans/2026-09-01-epictech-visual-pages.md and the two social JPEGs from Task 5.
- Produces: complete Open Graph/Twitter image metadata and an automated contract for the approved founder credentials and exclusions.

- [ ] **Step 1: Confirm the visual-pages prerequisites exist**

Run:

    test -f founder.html
    rg -n 'ethan-platt-graduation-close-1200.jpg' index.html founder.html
    rg -n 'Advanced Achievement Award recipient' founder.html

Expected: founder.html exists; both pages reference the close portrait; founder.html contains the approved award wording. If any check fails, stop and complete visual-pages Tasks 3–4 rather than recreating their body markup here.

- [ ] **Step 2: Write the failing metadata and founder-claims test**

Create tests/media-metadata-founder-claims.test.mjs:

    import assert from 'node:assert/strict';
    import { readFile } from 'node:fs/promises';
    import test from 'node:test';

    const home = await readFile('index.html', 'utf8');
    const founder = await readFile('founder.html', 'utf8');

    function count(text, value) {
      return text.split(value).length - 1;
    }

    test('home social metadata uses the original workshop image', () => {
      assert.match(home, /<meta property="og:image" content="https:\/\/epictech\.club\/assets\/images\/social\/epic-tech-home-og-1200x630\.jpg">/);
      assert.match(home, /<meta property="og:image:width" content="1200">/);
      assert.match(home, /<meta property="og:image:height" content="630">/);
      assert.match(home, /<meta property="og:image:type" content="image\/jpeg">/);
      assert.match(home, /<meta property="og:image:alt" content="Abstract EPIC TECH signal workshop connecting business technology systems">/);
      assert.match(home, /<meta name="twitter:card" content="summary_large_image">/);
      assert.match(home, /<meta name="twitter:image" content="https:\/\/epictech\.club\/assets\/images\/social\/epic-tech-home-og-1200x630\.jpg">/);
    });

    test('founder social metadata identifies Ethan without private detail', () => {
      assert.match(founder, /<meta property="og:image" content="https:\/\/epictech\.club\/assets\/images\/social\/ethan-platt-founder-og-1200x630\.jpg">/);
      assert.match(founder, /<meta property="og:image:width" content="1200">/);
      assert.match(founder, /<meta property="og:image:height" content="630">/);
      assert.match(founder, /<meta property="og:image:type" content="image\/jpeg">/);
      assert.match(founder, /<meta property="og:image:alt" content="Ethan Platt, founder of EPIC TECH LLC">/);
      assert.match(founder, /<meta name="twitter:card" content="summary_large_image">/);
      assert.match(founder, /<meta name="twitter:image" content="https:\/\/epictech\.club\/assets\/images\/social\/ethan-platt-founder-og-1200x630\.jpg">/);
    });

    test('approved credentials are exact and bounded', () => {
      assert.equal(count(founder, 'B.S. in Information Technology'), 1);
      assert.equal(count(founder, 'B.S. in Cybersecurity'), 1);
      assert.equal(count(founder, 'valedictorian'), 1);
      assert.equal(count(founder, 'Advanced Achievement Award recipient'), 1);
      assert.match(founder, /both programs/);
      assert.doesNotMatch(founder, /Academic Scholar/i);
    });

    test('founder content excludes sensitive or inflated claims', () => {
      assert.match(founder, /former United States Marine/);
      assert.match(founder, /communications and transmission systems/);
      assert.doesNotMatch(founder, /honorably discharged|Sergeant|certified veteran-owned|military-grade|cybersecurity engineer|GPA|clearance|deployment|duty station|home address|gmail\.com|tel:/i);
      assert.doesNotMatch(founder, /\b20(1[0-9]|2[0-9])\s*[–-]\s*20(1[0-9]|2[0-9])\b/);
    });

    test('founder portrait contract remains informative and responsive', () => {
      assert.match(founder, /ethan-platt-graduation-close-640\.avif/);
      assert.match(founder, /ethan-platt-graduation-close-1200\.webp/);
      assert.match(founder, /ethan-platt-graduation-close-1200\.jpg/);
      assert.match(founder, /width="1200" height="1500"/);
      assert.match(founder, /alt="Ethan Platt at his graduation ceremony"/);
    });

- [ ] **Step 3: Run the focused test and verify metadata red**

Run:

    node --test tests/media-metadata-founder-claims.test.mjs

Expected: credential/content tests pass from the visual-pages output and the two metadata tests fail because the social-image tags are absent or still reference the logo.

- [ ] **Step 4: Add exact homepage social metadata without changing main**

Record the main-region hash:

    node -e "import('node:fs/promises').then(async f=>{const c=await f.readFile('index.html','utf8');const m=c.match(/<main[^>]*>([\\s\\S]*?)<\\/main>/i);console.log((await import('node:crypto')).createHash('sha256').update(m[1]).digest('hex'));})"

Replace only the existing home og:image/twitter:image block with:

    <meta property="og:image" content="https://epictech.club/assets/images/social/epic-tech-home-og-1200x630.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="Abstract EPIC TECH signal workshop connecting business technology systems">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="https://epictech.club/assets/images/social/epic-tech-home-og-1200x630.jpg">
    <meta name="twitter:image:alt" content="Abstract EPIC TECH signal workshop connecting business technology systems">

Re-run the main-region hash command. Expected: the hash is unchanged.

- [ ] **Step 5: Add exact founder social metadata without changing main**

Record founder.html's main-region hash with the same command, replacing index.html with founder.html. Add:

    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="EPIC TECH LLC">
    <meta property="og:title" content="Ethan Platt, Founder | EPIC TECH LLC">
    <meta property="og:description" content="A veteran founder focused on clear, practical technology for small businesses.">
    <meta property="og:url" content="https://epictech.club/founder.html">
    <meta property="og:image" content="https://epictech.club/assets/images/social/ethan-platt-founder-og-1200x630.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="Ethan Platt, founder of EPIC TECH LLC">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Ethan Platt, Founder | EPIC TECH LLC">
    <meta name="twitter:description" content="A veteran founder focused on clear, practical technology for small businesses.">
    <meta name="twitter:image" content="https://epictech.club/assets/images/social/ethan-platt-founder-og-1200x630.jpg">
    <meta name="twitter:image:alt" content="Ethan Platt, founder of EPIC TECH LLC">

Do not add structured data in this plan; the discoverability/security plan owns the stable entity graph and hasCredential nodes.

Re-run the founder main-region hash. Expected: the hash is unchanged.

- [ ] **Step 6: Run metadata, visual-page, and protected-page tests**

Run:

    node --test tests/media-metadata-founder-claims.test.mjs
    python3 -m unittest tests/test_founder_page.py tests/test_homepage_visual_flow.py tests/test_contact_reviews_regression.py -v

Expected: all tests pass and Contact/Reviews hashes remain unchanged.

- [ ] **Step 7: Commit the metadata and claim contract**

Run:

    git add tests/media-metadata-founder-claims.test.mjs index.html founder.html
    git commit -m "feat: add original media social metadata"

---

### Task 7: Complete the cross-plan media and founder verification gate

**Files:**
- Verify: all files changed by Tasks 1–6
- Local-only: .media-review/lighthouse-home.html
- Local-only: .media-review/lighthouse-founder.html

**Interfaces:**
- Consumes: The public asset interface, the visual-pages integration, social metadata, founder claim tests, and private sources when available.
- Produces: A clean reproducibility, privacy, content, performance, and accessibility evidence set.

- [ ] **Step 1: Rebuild from the private sources and prove deterministic output**

Run:

    npm ci
    npm run media:build
    npm run media:originality
    npm run media:verify
    npm run test:media
    git diff --exit-code -- assets/images/founder assets/images/service-visuals assets/images/social docs/media/epic-signal-workshop-originality.json

Expected: every command exits zero and rebuild creates no tracked diff.

- [ ] **Step 2: Prove no private source or master is tracked**

Run:

    git ls-files .private-media .media-review
    git ls-files 'assets/images/*master*' 'assets/images/**/*master*'

Expected: both commands print nothing.

- [ ] **Step 3: Verify all cross-plan tests**

Run:

    python3 -m unittest discover -s tests -v
    npm run test:media
    git diff --check

Expected: Python and Node suites pass with zero failures and no whitespace errors.

- [ ] **Step 4: Run local Lighthouse checks**

In one terminal:

    python3 -m http.server 4173

In another:

    npx --yes lighthouse@12.8.2 http://127.0.0.1:4173/ --only-categories=performance,accessibility,seo --preset=desktop --output=html --output-path=.media-review/lighthouse-home.html --chrome-flags="--headless --no-sandbox"
    npx --yes lighthouse@12.8.2 http://127.0.0.1:4173/founder.html --only-categories=performance,accessibility,seo --preset=desktop --output=html --output-path=.media-review/lighthouse-founder.html --chrome-flags="--headless --no-sandbox"

Expected: no missing-alt, aspect-ratio, unsized-image, crawlability, or duplicate-H1 failure; observed local LCP at or below 2.5 seconds and CLS at or below 0.1. Lighthouse does not establish field INP, so preserve the specification's INP target for later field monitoring.

- [ ] **Step 5: Complete responsive and privacy review**

At 360×800, 768×1024, and 1440×900:

- Confirm the browser selects an appropriately sized source and does not choose a 1920-pixel service visual at 360 pixels.
- Confirm homepage and founder hero images reserve space before loading.
- Confirm workshop art is decorative and announced as empty alt.
- Confirm the founder portrait is announced once as “Ethan Platt at his graduation ceremony.”
- Confirm founder face and attire remain properly framed.
- Confirm no school identifier, diploma detail, precise location sign, bystander, or hidden metadata is exposed.
- Confirm both 1200×630 social images retain important content in common center-crop safe areas.
- Confirm visible keyboard focus and reduced-motion behavior from the visual-pages plan remain intact.

- [ ] **Step 6: Complete the final founder-claim review**

Read founder.html beside the approved spec and confirm:

- Former United States Marine with experience in communications and transmission systems is the only military-role detail.
- B.S. in Information Technology and B.S. in Cybersecurity are exact.
- Valedictorian and Advanced Achievement Award recipient each apply to both programs.
- Academic Scholar, certified veteran-owned, cybersecurity engineer, military-grade, honorably discharged, rank, service dates, GPA, cohort, unit, station, clearance, home address, personal phone, and private email are absent.

Expected: every visible claim maps to the approved spec and the automated claim test.

- [ ] **Step 7: Review repository state**

Run:

    git status --short
    git log --oneline --max-count=10

Expected: private media and review files are absent; the history contains the frequent focused commits above. If a gate fails, return to the owning task, write or tighten the focused failing test, apply the minimum correction, rerun the full gate, and use that task's exact staging list.

- [ ] **Step 8: Prepare the implementation handoff**

Report:

- Nine reviewed original workshop concepts and the originality manifest
- 54 workshop derivatives, 15 founder derivatives, and two social images
- Confirmation that no source photo or high-resolution master is tracked
- Exact automated and Lighthouse commands with outcomes
- Any size-budget exception, which requires explicit user acceptance before PR readiness
- Confirmation that Contact and Reviews are unchanged
- Confirmation that founder credentials use the approved wording

Do not open a pull request, merge, or deploy until every gate passes and the user directs the next action.
