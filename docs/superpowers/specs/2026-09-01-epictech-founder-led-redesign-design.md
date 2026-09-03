# EPIC TECH Founder-Led Redesign Design

Date: 2026-09-01

Repository: `ethan-cyber12/EPICTECH.club`

Status: Approved design

## Purpose

Redesign EPIC TECH so it feels human, visual, calm, and trustworthy without changing its established colors, core wording, service functionality, forms, pricing logic, or security posture. The experience should reduce repeated card layouts and large text blocks, introduce original service imagery, create a dedicated founder page, and improve conventional SEO, entity clarity, answer-engine extraction, and crawler access.

The visual standard may take inspiration from the clarity and restraint of high-quality editorial product sites, including Apple, but must not copy Apple assets, code, typefaces, device silhouettes, copy, layouts, section proportions, or animation timing.

## Confirmed constraints

- Preserve the EPIC TECH palette:
  - Blue `#0B5CFF`
  - Deep blue `#083B9A`
  - Green `#00B67A`
  - Ink `#101820`
  - White `#FFFFFF`
  - Soft background `#F4F7FB`
- Keep **“Veteran owned. Family operated.”** in the homepage hero.
- Make only minor wording changes needed for clarity, trust, accessibility, privacy accuracy, and search metadata.
- Preserve existing destinations, forms, assessment flow, WhatsApp integration, reviews workflow, and pricing behavior.
- Leave the Contact and Reviews pages' content, structure, form fields, API behavior, and page-specific functionality unchanged. Apply only the shared visual shell and styling needed for site-wide continuity.
- Do not weaken the Content Security Policy or add third-party fonts, trackers, widgets, or CDNs merely for design or SEO.
- Use original EPIC TECH graphics and the founder photos supplied by Ethan Platt.
- Do not publish unnecessary personally identifiable information.

## Design direction

The approved direction is **Founder-led editorial**.

The site will use generous space, strong type hierarchy, real human proof, and four grouped editorial service chapters. The experience should feel confident without sounding self-promotional. The homepage will introduce the business standard, show related services through distinct visual stories, and lead naturally to the founder page without repeating one generated image treatment for every offering.

### Visual concept: The EPIC Signal Workshop

Service imagery will depict abstract architectural technical environments rather than generic stock photos or literal product screenshots. A recurring cobalt signal path connects systems while green nodes indicate healthy outcomes. White and soft surfaces provide clarity; ink structures add contrast.

Avoid:

- Vendor logos or readable user interfaces
- Lock-and-shield clichés
- Device glamour shots
- Generic hackers, server rooms, or glowing stock-photo hands
- Apple-style devices, gradients, layout proportions, or product-stage compositions
- Decorative complexity that competes with headings or calls to action

### Mixed evidence-led media system

Media must explain the offer or prove the work rather than fill space. Use the following hierarchy:

1. Original EPIC Signal Workshop art for the homepage hero and selected technical categories where an abstract system view adds meaning.
2. Code-native HTML/CSS diagrams for concepts that are clearer as structure, sequence, or flow. These components must remain understandable without an image request and must not imitate a vendor interface.
3. Genuine first-page previews derived locally from existing public case-study PDFs as evidence of real deliverables.
4. A real, privacy-safe founder portrait for the founder bridge and founder page.

Do not create a synthetic, suit-altered, or otherwise AI-generated depiction of Ethan. Do not upload founder photographs, generated art, PDF previews, or unpublished site assets to Google Lens, reverse-image services, or any other external review service during the remaining work. All remaining originality and visual review must use local files and locally served pages only.

## Homepage structure

### Header

Retain existing navigation destinations and the assessment action. Improve responsive spacing, keyboard focus, `aria-current`, navigation labeling, and mobile behavior without changing the navigation model.

### Hero

Eyebrow:

> Veteran owned. Family operated. Central Florida based.

The existing core hero message remains. The left side contains the current value proposition and assessment path. The right side contains the original EPIC Signal Workshop hero visual.

### Trust rail

Use a borderless four-part rail beneath the hero:

1. Security built in from the start
2. Written scope and pricing before work begins
3. Documentation included with every project
4. Direct, accountable support

These are operating commitments, not badges or unverified superlatives. If any commitment is not universally true, it must be narrowed before publication.

### Editorial thesis

Use a large, spacious statement:

> Service before scale. Clarity before complexity.

### Service chapters

Replace the repeated homepage card grid with exactly four alternating, full-width grouped chapters. Each chapter contains one meaningful visual treatment, short existing service descriptions, and independently focusable semantic links for every service it represents. A chapter that contains multiple destinations is not itself a link.

Exact grouping and media treatment:

1. **Networks & Security** — links to Network & Wi-Fi and Firewalls & Cybersecurity; uses the firewall/security Workshop raster.
2. **Websites & E-Commerce** — links to Websites and E-Commerce; uses a semantic HTML/CSS site-to-store diagram and no Workshop raster.
3. **Apps, Automation & Internal Tools** — links to Business Apps & Dashboards, Automation, and Forms & Internal Tools; uses the automation Workshop raster.
4. **Virtualization Labs** — links to Virtualization Labs; uses the virtualization Workshop raster.

This produces exactly eight independently labeled and keyboard-accessible service links. The homepage may place no more than four generated rasters total: the hero plus the firewall, automation, and virtualization chapter art. All eight prepared service artworks remain available as thumbnails on `/services/` and as the matching hero artwork on their detail pages.

Interaction is restrained:

- No scroll-jacking, autoplay, or parallax
- Optional hover image scale no greater than approximately `1.02`
- Clear focus indicators
- Reduced-motion support
- No JavaScript-driven navigation when an ordinary anchor is sufficient

### Founder bridge

Use one authentic founder image and a concise statement connecting military communications experience, technical education, service, and practical problem solving. The bridge links to `/founder.html`.

Supporting statement:

> Technology should leave people better equipped.

### Proof, process, and close

Present up to three existing case studies in a compact editorial triptych. Each item uses a locally generated, faithful first-page preview of its genuine public PDF, retains the current heading and description, and links to the existing PDF. Show the existing work process as a code-native continuous timeline rather than more cards. End with the current assessment action and preserve its functionality.

## Founder page

Create `/founder.html`. Keep `/about.html` as the company-level page.

### Hero

Use the supplied close graduation portrait as the main founder image.

Heading:

> Technology should make work easier to understand and easier to do.

Introduction:

> Ethan Platt founded EPIC TECH to help small businesses solve technical problems with clear scope, documented systems, and solutions sized for the work.

Supporting line:

> A veteran founder focused on building clear, practical solutions.

### Founder story order

1. Why the work matters
2. Service shaped the standard
3. Technical training with a practical purpose
4. What people can do next
5. Practical principles
6. Assessment call to action

### Confirmed factual background

- Former United States Marine with experience in communications and transmission systems
- B.S. in Information Technology
- B.S. in Cybersecurity
- Valedictorian in both degree programs
- Advanced Achievement Award recipient in both degree programs

Recommended credentials wording:

> Ethan earned a B.S. in Information Technology and a B.S. in Cybersecurity and was recognized as valedictorian and an Advanced Achievement Award recipient in both programs. He applies that technical foundation to infrastructure, security planning, troubleshooting, and clear documentation.

Do not publish military dates, unit or station details, clearances, GPA, cohort details, student identifiers, diploma images, home address, personal telephone numbers, or private email addresses.

### Service philosophy

The page should communicate that a worthwhile technology project leaves people better equipped to work with clarity, efficiency, and confidence. The goal is not impressive technology for its own sake, but a more capable organization and dependable work.

Practical principles:

1. Start with the problem
2. Choose what fits
3. Build security in
4. Document the handoff

## Photo handling

Supplied photos:

- Close graduation portrait: founder-page hero and optional small homepage founder bridge
- Full-body graduation portrait: optional education/training section
- Open-arms graduation portrait: optional founder-page closing section

Before publication:

- Strip EXIF, GPS, device, and timestamp metadata
- Crop unnecessary location signage and bystanders
- Produce responsive AVIF and WebP variants
- Retain a suitable fallback format
- Add intrinsic dimensions
- Use descriptive alt text only where the image adds information
- Do not create AI versions of Ethan for every service visual; the real portrait is a stronger trust signal
- Do not alter Ethan's clothing or appearance with generative editing; use only privacy-safe derivatives of the supplied real photographs
- Do not upload source or derivative portraits to any external image-analysis or reverse-image service

## Original image asset plan

Prepared master concepts for the service directory and service-detail pages:

- `epic-hero-connected-workshop-master.png`
- `epic-service-network-wifi-master.png`
- `epic-service-firewalls-security-master.png`
- `epic-service-websites-master.png`
- `epic-service-business-apps-master.png`
- `epic-service-automation-master.png`
- `epic-service-ecommerce-master.png`
- `epic-service-virtualization-master.png`
- `epic-service-internal-tools-master.png`

Generate high-resolution masters, then create responsive AVIF/WebP sizes near 640, 1200, and 1920 pixels where appropriate.

Homepage placement is intentionally narrower than the asset catalog. It uses only `epic-hero-connected-workshop`, `epic-service-firewalls-security`, `epic-service-automation`, and `epic-service-virtualization`. The other service rasters remain required for `/services/` thumbnails and their matching detail-page heroes; they are not placed on the homepage.

Performance targets:

- Hero image approximately 250 KB or less where quality permits
- Service images approximately 160 KB or less on desktop and 90 KB or less on mobile where quality permits
- Hero image loaded eagerly only if it is the measured LCP asset
- Offscreen images use `loading="lazy"` and `decoding="async"`
- Explicit width, height, and aspect ratio prevent layout movement

## Service pages

Retain existing service wording and functionality. Improve visual and semantic organization with compact factual sections drawn from current content:

- Who the service is for
- Deliverables
- Process and prerequisites
- Remote versus on-site coverage where accurate
- Boundaries and limitations
- Relevant case study or outcome
- Two to four genuine FAQs where useful
- Related services with descriptive anchors
- Visible breadcrumbs

The `/services/` directory preserves one thumbnail and one ordinary link for every service. Each detail page uses its matching service artwork in the hero. Homepage grouping must not merge, hide, or remove any service destination from these pages.

Do not introduce city-swapped doorway pages, filler copy, or artificial word-count targets.

## Contact and Reviews pages

The user approves the current Contact and Reviews pages. Do not redesign their page-specific sections or change their copy, fields, validation, Turnstile use, review submission, review retrieval, or API connections.

Only the following shared updates may flow through to them:

- Header and footer treatment
- Existing palette variables
- Type scale and spacing normalization
- Focus states and responsive navigation
- Global accessibility improvements that do not alter page behavior

Any shared CSS change must be regression-tested on both pages. Crawlability improvements that would require changing the Reviews page source are deferred. The separate Privacy page may still be corrected to describe the existing contact and review data flows accurately.

## Case studies

Create server-readable HTML companion pages for the existing public case-study PDFs. Preserve the current PDF downloads, add meaningful document metadata, and decide deliberately whether PDFs remain indexable or canonicalize to their HTML companions. The visual-pages work owns up to three locally rendered first-page homepage preview assets; the later discoverability work owns the HTML companions and PDF metadata and must not replace those preview assets with synthetic artwork.

## SEO and entity design

Keep the existing fundamentals: unique titles, descriptions, self-canonicals, one H1 per page, robots file, and sitemap.

### Canonical consolidation

- Change internal links from `/index.html` to `/`
- Change internal links from `/services/index.html` to `/services/`
- Add exact permanent redirects for both duplicate URLs through Cloudflare

### Structured data graph

Replace deprecated `ProfessionalService` markup with an accurate graph using stable identifiers:

- `https://epictech.club/#website`
- `https://epictech.club/#business`
- `https://epictech.club/#ethan-platt`
- Per-page `#webpage`, `#breadcrumb`, and `#service`

Use:

- `WebSite`
- `Organization`
- `ProfilePage` and `Person` on the founder page
- `AboutPage` on the company about page
- `BreadcrumbList`
- One `Service` node per service page
- `hasCredential` for the two degrees

Do not invent a public street address. Use `LocalBusiness` only if an accurate publishable business address and eligibility requirements are satisfied. Omit empty `sameAs` arrays; add only verified public profiles.

Structured data must describe visible content and must not require weakening `script-src` with `unsafe-inline`.

### AI and answer-engine crawlability

Prioritize standards with established value:

- Crawlable server-rendered HTML
- Correct redirects, canonicals, sitemap, and status codes
- Clear headings, descriptive links, factual summaries, and visible evidence
- Consistent entity identity
- Fast, stable pages
- Search Console and Bing verification
- Cloudflare verified-bot log checks

Treat `/llms.txt` as an optional experiment only after the standards work is complete. It must never replace HTML, robots, sitemap, or structured data.

Robots policy should separate ordinary search/answer retrieval from training crawlers. The owner must make the final training-crawler policy decision. Robots rules are not a security control.

## Privacy and trust accuracy

Update the separate Privacy page so it accurately describes:

- Contact data posted to the intake service
- Review submission and moderation
- Approved review retrieval and publication
- Cloudflare Turnstile processing
- Data categories and purpose
- Relevant processors
- Retention and deletion approach
- Contact options

Do not claim that forms only open the visitor's email client when the site submits data to the intake service.

Avoid unsupported language such as:

- Certified veteran-owned, unless certification is current and verifiable
- Military-grade
- Unhackable or 100% secure
- Best, industry-leading, or trusted by hundreds without evidence
- Unverified rankings, statistics, certifications, awards, or client counts

## Security architecture

Preserve the existing narrow source policy and exact intake/Turnstile origins.

Required deployment work:

- Deliver CSP as an HTTP response header through Cloudflare
- Test the policy in report-only mode before enforcement
- Ensure `frame-ancestors 'none'` is delivered by the response header
- Add `X-Frame-Options: DENY` as compatible defense in depth
- Include `object-src 'none'`
- Use `frame-src 'none'` on pages that do not contain Turnstile
- Preserve the absence of `unsafe-eval` and executable `unsafe-inline`
- Verify `Referrer-Policy`, `Permissions-Policy`, and `X-Content-Type-Options`
- Expand HSTS only after every subdomain, especially the intake subdomain, is confirmed permanently HTTPS-capable
- Do not whitelist bots solely by spoofable user-agent strings; use Cloudflare verified bots or provider-published networks

After CSP/header changes, test contact submission, review submission, review retrieval, Turnstile, WhatsApp, mobile navigation, and every service destination.

## Accessibility and semantics

- Add a consistent skip link and `<main>` landmark where absent
- Maintain one descriptive H1 per page
- Use visible, logical heading order
- Ensure all service destinations are ordinary semantic links
- Provide strong keyboard focus
- Preserve adequate color contrast
- Respect reduced-motion preferences
- Use meaningful alternative text and empty alt text for decorative art
- Add visible breadcrumbs to service and case-study pages
- Fix the broken `services/software.html#proof` destination

## Performance and quality gates

- No third-party font dependency
- No unnecessary runtime framework
- Responsive assets with fixed dimensions
- No more than four generated raster placements on the homepage, including the hero
- Faithful PDF first-page previews are derived locally, are not synthetic, and have fixed intrinsic dimensions
- Code-native diagrams remain legible at 320 CSS pixels, preserve logical DOM reading order, and do not require JavaScript
- Avoid layout shifts and unnecessary JavaScript
- Validate mobile and desktop layouts at representative breakpoints
- Target field Core Web Vitals at the 75th percentile: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, CLS at or below 0.1
- Validate structured data against Schema.org and Google tools for supported types
- Crawl internal links, fragments, canonicals, sitemap entries, and redirects before release
- Check open-graph previews and image accessibility

## Rollout

1. Create an isolated feature branch.
2. Add tests and audit scripts for links, metadata, structured data, accessibility basics, and asset dimensions.
3. Build the shared visual foundation and responsive navigation.
4. Implement the homepage and founder page.
5. Add original service assets and representative social images.
6. Refine service pages without changing their behavior.
7. Add HTML case studies.
8. Correct structured data, canonicals, sitemap, robots policy, and Privacy-page content.
9. Confirm that Contact and Reviews retain their current page-specific design and functionality while inheriting the shared shell.
10. Prepare Cloudflare redirect and response-header instructions/configuration.
11. Run full local verification and a content/security review.
12. Open a pull request for user review; do not merge or deploy without the user's direction.

## Acceptance criteria

- The site uses the existing EPIC TECH palette throughout.
- The homepage hero retains “Veteran owned. Family operated.”
- Core functionality and destinations are unchanged.
- Contact and Reviews retain their current content, page-specific structure, forms, API behavior, and functionality.
- The homepage is image-led and no longer dominated by repeated cards.
- The homepage contains exactly four grouped editorial service chapters and eight obvious, independently accessible service-page links.
- The homepage contains no more than four generated raster placements including the hero, while `/services/` and every service detail page retain their complete matching artwork.
- The founder is represented only by an approved real photograph; no synthetic founder image is published.
- Up to three homepage proof items use faithful first-page previews from genuine public case-study PDFs.
- The remaining design, implementation, and review work performs no external media uploads or reverse-image lookups.
- A new founder page uses the approved factual story and corrected academic recognition.
- Published photos contain no sensitive metadata.
- Assets are original and do not copy Apple intellectual property or visual trade dress.
- Pages remain fast, responsive, keyboard accessible, and stable.
- Search metadata, canonicals, structured data, sitemap, and server-readable proof are internally consistent.
- The Privacy page matches actual form and review data flows.
- Response security headers are documented and verified without weakening the existing CSP model.
- All automated checks and manual critical-flow tests pass before a pull request is presented as ready.
