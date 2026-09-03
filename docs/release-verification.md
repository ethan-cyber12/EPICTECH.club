# Local release verification — 2026-09-02

- Branch: `codex/epictech-founder-led-redesign-implementation`
- Verified implementation HEAD: `04e884c` (`docs: stage Cloudflare security headers safely`)
- Merge base with `origin/main`: `c10c8bd2677a22b2dac299cdb7caba72a4b6e7fc`
- Scope: local files and the already-running `http://127.0.0.1:4173` preview only
- Starting worktree: clean (`git status --short --branch` showed only the branch line)
- Local decision: the checked implementation passes its local release contracts. Publication remains blocked by the owner and live-service gates listed below.

No live site, external form, review service, Cloudflare setting, search engine, validator, bot log, deployment target, or remote Git branch was contacted or changed for this verification.

## Completed local evidence

### Automated suites and static parsing

| Check | Exact command | Observed result |
| --- | --- | --- |
| Full Python contract suite | `/Users/ethanplatt/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest discover -s tests -p 'test_*.py' -q` | PASS: 97 tests, 0 failures/errors |
| Node media suite | `npm run test:media` | PASS: 27 tests, 0 failures/skips |
| Published-media verification | `npm run media:verify` | PASS: 15 founder files, 54 service visuals, 2 social files, 54 service hashes, 0 privacy findings |
| Originality gate | `npm run media:originality` | PASS: 9 reviewed originals, minimum pairwise distance 15, 9 private masters and 54 public derivatives verified; the record honestly retains 16 user-opt-out reviews rather than claiming they occurred |
| Dependency audit | `npm audit --offline --audit-level=high` | PASS: 0 vulnerabilities found from the installed dependency state; no network or package installation used |
| JavaScript syntax | `node --check assets/js/main.js`, `node --check assets/js/qualification.js`, `node --check assets/js/reviews.js` | PASS: all three exit 0 |
| Sitemap XML | `xmllint --noout sitemap.xml` | PASS: well-formed XML |
| Repository JSON | `/Users/ethanplatt/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -c 'import json,pathlib; skip={".git","node_modules",".superpowers",".private-media","__pycache__"}; files=[p for p in pathlib.Path(".").rglob("*.json") if not (set(p.parts)&skip)]; [json.load(p.open(encoding="utf-8")) for p in files]; print(f"PASS JSON: {len(files)} files parsed")'` | PASS: 5 JSON files parsed |
| Whitespace/error markers | `git diff --check` | PASS: no output |

The passing Python suite supplies the following structural evidence:

- `tests/test_structured_data.py` parses JSON-LD and verifies unique graph IDs, self URLs, visible entity agreement, breadcrumbs, and the stable Organization/WebSite/Person relationships.
- `tests/test_canonicals.py`, `tests/test_site_contracts.py`, and `tests/test_visual_quality_gates.py` verify canonical conventions, dynamic discovery, local HTML targets, and same-page fragments.
- `tests/test_sitemap_and_robots.py` proves that `sitemap.xml` equals all 25 self-canonical public HTML pages, has unique URLs and the exact date split, and that `robots.txt` and `docs/crawler-policy.md` implement the approved open policy.
- `tests/test_security_docs.py` verifies the exact Cloudflare path expressions, two CSP values, five base headers, PDF `X-Robots-Tag`, **Set static** behavior, conservative HSTS, rollout order, rollback boundaries, and owner gates.
- `tests/test_case_studies.py` verifies all eight PDF/HTML pairs, exact transcription of all seven public sections, full-document leakage protection, original PDF stream/page/box/render preservation, and deterministic, idempotent metadata updates. The Node media suite separately verifies the three published page-one previews.

Local vocabulary and graph validation does **not** claim eligibility for Google rich results. Eligibility and search-engine interpretation remain external checks.

### Canonical, crawler, and route evidence

The sitemap contains exactly 25 canonical page URLs, all substantively updated by `2026-09-02`. It contains no `changefreq` or `priority` fields.

The crawler policy explicitly allows the approved search/answer groups (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `Googlebot`, and `bingbot`), then applies wildcard `Allow: /` and publishes the sitemap URL. Training-crawler policy is allow, with no training-agent `Disallow`. This is a preference for compliant crawlers; `robots.txt` is **not access control** and cannot guarantee crawling, indexing, citation, or model training.

For each route below, the local smoke used `curl -sS -o /dev/null -w '%{http_code} %{content_type}' 'http://127.0.0.1:4173<route>'`, then required status `200` and the expected content type.

HTML routes — PASS 25/25 as `200 text/html`:

- `/`, `/about.html`, `/founder.html`, `/pricing.html`, `/contact.html`, `/reviews.html`, `/privacy.html`
- `/services/`, `/services/app-building.html`, `/services/automation.html`, `/services/ecommerce.html`, `/services/firewalls.html`, `/services/infrastructure.html`, `/services/software.html`, `/services/virtualization.html`, `/services/webhosting.html`
- `/case-studies/`, `/case-studies/cloud-security-automation.html`, `/case-studies/cybersecurity-compliance.html`, `/case-studies/disa-stig-hardening.html`, `/case-studies/managed-it-patch-management.html`, `/case-studies/network-infrastructure.html`, `/case-studies/secure-web-and-sdlc.html`, `/case-studies/vulnerability-remediation.html`, `/case-studies/zero-trust-access-control.html`

Discovery files — PASS 2/2:

- `/robots.txt`: `200 text/plain`
- `/sitemap.xml`: `200 application/xml`

Public PDFs — PASS 8/8 as `200 application/pdf`:

- `/assets/projects/epic-cloud-security-automation-public-sample.pdf`
- `/assets/projects/epic-cybersecurity-compliance-public-sample.pdf`
- `/assets/projects/epic-disa-stig-hardening-public-sample.pdf`
- `/assets/projects/epic-managed-it-patch-management-public-sample.pdf`
- `/assets/projects/epic-network-infrastructure-public-sample.pdf`
- `/assets/projects/epic-secure-web-and-sdlc-public-sample.pdf`
- `/assets/projects/epic-vulnerability-remediation-public-sample.pdf`
- `/assets/projects/epic-zero-trust-access-control-public-sample.pdf`

Representative responsive media — PASS 2/2:

- `/assets/images/service-visuals/epic-hero-connected-workshop-1920.avif`: `200 image/avif`
- `/assets/images/service-visuals/epic-hero-connected-workshop-1920.webp`: `200 image/webp`

Total local route/media smoke: **37/37** expected resources returned status 200 and the expected content type. This proves only the local preview behavior; it does not prove production routing or headers.

### Browser evidence already observed

- Services directory: widths 320, 360, 768, 920, 1280, and 1440 px passed with no horizontal overflow, broken media, layout movement, or console errors. The responsive visual set contained 38 healthy URLs.
- Services/discoverability follow-up: the Services hub at 1440 and 360 px and Firewalls at 1280 and 360 px showed complete media, visible proof/related links, no overflow, a static mobile side navigation, and no console warnings/errors.
- Privacy: 1280 and 360 px passed. Desktop reading width was 820 px; all five sections and the ordinary email link were visible; neither width overflowed; console warnings/errors were empty. At 360 px the menu opened with `aria-expanded="true"`, Escape closed it with `aria-expanded="false"`, focus returned to the menu button, and the visible focus outline was solid.
- Contact and Reviews were visually rerun from the active branch at desktop width after their approved redesign. The assessment hero, protected form, process guide, WhatsApp band, FAQ, review trust rail, live-proof areas, accessible rating fieldset, and review assurance panel rendered without horizontal overflow. No form or review submission was sent.
- A read-only request to the existing public reviews endpoint confirmed that the approved First Option Insulation review remains the single on-site review. The page continues to retrieve that review dynamically; no customer quote, name, or rating was invented or copied into static markup.

These viewport and local-browser observations are not field performance measurements and do not prove Core Web Vitals.

### Protected behavior and content

`tests/test_contact_reviews_regression.py`, the privacy/crawler/service suites, and the security runbook all agree on these protected baselines:

| Protected surface | SHA-256 |
| --- | --- |
| `contact.html` normalized `<main>` content | `7d920e1f2bde274aae8637a1a2694fee1422072472049314a6b732c0a4da2d9b` |
| `reviews.html` normalized `<main>` content | `fc682564abc4b465820e7b9f754c24d6cce4b8efdfa7b3a10c53bfb87323323e` |
| `assets/js/main.js` | `2ed431d84934dc2cbafb487a4339012f013ac3e429066fd77e8a82893d29e394` |
| `assets/js/qualification.js` | `21212f804b1a40c749da732bbf43f9919d4b38099a5812bbac6cf6976f6b9303` |
| `assets/js/reviews.js` | `80bc60394ec295f371dc5afbe84b3b99697b69795aa33de619d5851e274149e6` |

The local checks confirm that the Contact and Reviews endpoints, Turnstile origins, WhatsApp link, scripts, and shared accessible shell remain present. They do not exercise any external side effect.

### Design, founder, and proof invariants

- Approved colors remain exactly `#0B5CFF`, `#083B9A`, `#00B67A`, `#101820`, `#FFFFFF`, and `#F4F7FB` (case-insensitive CSS representation).
- The homepage retains the exact trust line `Veteran owned. Family operated.`
- Founder positioning remains `A veteran founder focused on building clear, practical solutions.` The visible facts stay bounded to former United States Marine service, communications/transmission-systems experience, B.S. Information Technology, B.S. Cybersecurity, valedictorian in both programs, and Advanced Achievement Award recipient in both programs.
- `Technologist` and prohibited sensitive/private details are absent. The founder media contract uses the supplied real graduation photograph, not a synthetic portrait; media verification found no founder-image privacy issue.
- Exact visible proof mapping passed for all eight services:
  - Business Apps & Internal Dashboards → Secure Website & Application Practices
  - Automation → Cloud Security & Automation
  - E-Commerce → Secure Website & Application Practices
  - Firewalls & Security → Cybersecurity & Compliance Assessment
  - Network & Wi-Fi → Business Network Infrastructure Design
  - Forms & Internal Tools → Secure Website & Application Practices
  - Virtualization Labs → Cloud Security & Automation
  - Websites → Secure Website & Application Practices
- Each service detail retains exactly one mapped HTML proof link and two mapped related-service links. All eight case-study companions link their corresponding original PDF and service destination, and all local targets resolve.

### Branch evidence

Before adding this evidence-only document, `git diff --shortstat origin/main...04e884c` reported **161 files changed, 13,861 insertions, and 436 deletions**. The implementation range is based on merge base `c10c8bd2677a22b2dac299cdb7caba72a4b6e7fc`; this count intentionally excludes the present evidence record.

Relevant task-sized commit sequence from case studies through the security runbook:

1. `c015f6b feat: publish accessible HTML case studies`
2. `2c8a333 test: harden case study preservation contracts`
3. `6011577 test: make PDF render checks portable`
4. `2a7a371 feat: strengthen services visual rhythm`
5. `3ab20bf feat: connect services to public proof`
6. `b675e2f fix: align privacy notice with intake flows`
7. `deabb91 feat: publish canonical sitemap and crawler policy`
8. `04e884c docs: stage Cloudflare security headers safely`

## Pending owner, live, and external gates

- [ ] **Privacy retention/deletion wording:** the owner must confirm that the drafted operational statement in `privacy.html` is true before publication. No fixed retention period or unsupported deletion promise was invented.
- [ ] **Deployment/Git publication:** push, pull request, merge, deployment, and production publication require separate authorization and were not performed.
- [ ] **Canonical redirects:** activate the documented permanent redirects only after authorization, then verify their production status, destination, and order.
- [ ] **Cloudflare Stage 0 — inventory:** record existing transforms, headers, HSTS, redirects, WAF/bot/AI controls, DNS/proxy state, subdomain HTTPS support, overlaps, and Trace order before creating rules.
- [ ] **Cloudflare Stage 1 — report only:** after separate owner approval, create disabled/reviewed rules and then test the exact report-only CSP, base headers, PDF header, consoles, and critical flows.
- [ ] **Cloudflare Stage 2 — enforcement:** only after clean Stage 1 evidence and a second owner approval, enforce the exact path-specific CSPs while retaining all meta CSPs and rerun critical-flow checks.
- [ ] **Cloudflare Stage 3 — meta-CSP deduplication:** only after verified enforcement, make a separate code/deployment change for non-protected pages; Contact and Reviews remain protected.
- [ ] **Live response evidence:** production HTML security headers, PDF `X-Robots-Tag: noindex, follow`, Cloudflare Trace, and verified-bot logs remain unchecked because live Cloudflare/network work was outside this task.
- [ ] **Contact/Reviews integrations:** contact submission, review retrieval, review submission, Turnstile, intake endpoints, and WhatsApp external-side-effect checks require specific live-test authorization and were not exercised.
- [ ] **External schema/search validation:** Schema.org Validator, Google Rich Results, Search Console, Bing Webmaster Tools, sitemap submission, and index inspection were not contacted. Local schema parsing is not a substitute.
- [ ] **Performance:** no Lighthouse executable is installed locally, and packages were not downloaded. Live Lighthouse/PageSpeed and field Core Web Vitals remain pending; viewport checks are not performance evidence.
- [ ] **Final representative browser rerun:** the in-app browser was unavailable during this final task. Earlier completed-task browser evidence is recorded above, but this item remains unchecked rather than overstated.

## Publication gate

Do not publish this branch until the owner confirms the Privacy retention/deletion statement and separately authorizes the intended Git/deployment action. Cloudflare activation, external form/review testing, redirects, validators, search submissions, production performance measurement, and live verification each remain separate staged actions; this local record grants no authority to perform them.
