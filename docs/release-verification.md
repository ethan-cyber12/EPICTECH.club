# Local release verification — 2026-09-03

- Branch: `codex/epictech-founder-led-redesign-handoff`
- Verified implementation history includes `373d200` (`chore: harden EPICTECH publication candidate`), `ed55b06` (`fix: bind Turnstile actions and lock review link`), and `f2dda4f` (`feat: harden and configure intake worker`); the isolated staging work is recorded below
- Merge base with `origin/main`: `c10c8bd2677a22b2dac299cdb7caba72a4b6e7fc`
- Scope: the current base plus the listed local release-hardening changes and `http://127.0.0.1:4173` preview
- Working tree: the pushed Worker candidate and current staging-isolation changes pass their local and staged checks; the final working-tree security scan completed with zero reportable findings, and the changes remain uncommitted pending owner authorization to commit and push
- Local decision: the site passes its local build and release contracts, and the intake candidate passes isolated staging. Production publication remains blocked by the owner, edge-header, production-deployment, and live-service gates below.

No production form was submitted, and no production Cloudflare route, secret, KV namespace, search engine, validator, bot log, `main` branch, or service was changed. The owner authorized transfer of the reviewed commits to the existing remote feature branch and provisioning of an isolated staging stack. Staging-only resources were created and synthetic `example.test` lead/review requests were sent; merge and production deployment remain separate gates. Current browser work used localhost; the historical production review-feed observation below remains read-only evidence from the earlier task.

## Completed local evidence

### Automated suites and static parsing

| Check | Exact command | Observed result |
| --- | --- | --- |
| Full Python contract suite | `python -m unittest discover -s tests -p 'test_*.py' -q` | PASS: 110 tests, 0 failures/errors |
| Node media, Worker-security, and public-artifact suite | `npm run test:media` | PASS: 56 tests, 0 failures/skips |
| Focused intake Worker security suite | `npm run test:worker` | PASS: 27 tests, 0 failures/skips |
| Production-targeted Worker bundle and binding validation | `npm run worker:check` | PASS: Wrangler 4.128.0 dry run; 35.06 KiB upload / 9.12 KiB gzip; production review KV plus distinct 6/min lead and 3/min review rate-limit bindings resolved; production mode is source-pinned; no upload or deploy |
| Staging Worker bundle and binding validation | `npm run worker:check:staging` | PASS: Wrangler 4.128.0 dry run; 35.06 KiB upload / 9.12 KiB gzip; three staging KV bindings plus separate rate IDs `2001` and `2002` resolved; no upload or deploy during the check |
| Published-media verification | `npm run media:verify` | PASS: 15 founder files, 54 service visuals, 2 social files, 54 service hashes, 0 privacy findings |
| Originality gate | `npm run media:originality` | PASS: 9 reviewed originals, minimum pairwise distance 15, 0 private masters present in this clone, 54 public derivatives verified; the record honestly retains the opt-out evidence |
| Allowlisted deployment build | `npm run site:build` | PASS: 117 public files copied to `_site`; source-only and development paths are rejected by contract tests |
| Dependency audit | `npm audit --audit-level=high` | PASS: 0 vulnerabilities |
| Secret scan | `gitleaks dir .` and `gitleaks git .` using the pinned workflow version | PASS: 0 findings in the current tree and Git history; synthetic test fixtures are narrowly allowlisted |
| Repository vulnerability/misconfiguration scan | Trivy cached/offline high/critical vulnerability, secret, and misconfiguration scan | PASS: 0 findings; CycloneDX SBOM generated |
| Standard Codex Security scan | Whole-repository, source-backed scan with independent validation | COMPLETE: 2 Low findings, 0 Critical/High/Medium findings |
| Worker/staging working-tree security scan | Codex Security diff scan with independent validation and attack-path analysis | COMPLETE: all 8 changed surfaces reviewed; 3 conditional candidates validated and suppressed under the stated attacker model; 0 reportable findings; defense-in-depth patches added and reverified |
| JavaScript syntax | `node --check assets/js/main.js`, `node --check assets/js/qualification.js`, `node --check assets/js/reviews.js`, `node --check worker/src/index.js` | PASS: all four exit 0 |
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

For each route below, the final local smoke served the generated `_site` artifact at `http://127.0.0.1:4173`, requested the route with PowerShell `Invoke-WebRequest`, and required status `200`. Content types were checked against the platform's known Python-server mappings; production MIME values remain a live-host gate.

HTML routes — PASS 25/25 as `200 text/html`:

- `/`, `/about.html`, `/founder.html`, `/pricing.html`, `/contact.html`, `/reviews.html`, `/privacy.html`
- `/services/`, `/services/app-building.html`, `/services/automation.html`, `/services/ecommerce.html`, `/services/firewalls.html`, `/services/infrastructure.html`, `/services/software.html`, `/services/virtualization.html`, `/services/webhosting.html`
- `/case-studies/`, `/case-studies/cloud-security-automation.html`, `/case-studies/cybersecurity-compliance.html`, `/case-studies/disa-stig-hardening.html`, `/case-studies/managed-it-patch-management.html`, `/case-studies/network-infrastructure.html`, `/case-studies/secure-web-and-sdlc.html`, `/case-studies/vulnerability-remediation.html`, `/case-studies/zero-trust-access-control.html`

Discovery files — PASS 2/2:

- `/robots.txt`: `200 text/plain`
- `/sitemap.xml`: `200 text/xml` from the Windows Python preview server (production should serve an XML media type)

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
- `/assets/images/service-visuals/epic-hero-connected-workshop-1920.webp`: `200 application/octet-stream` from the Windows Python preview server (production must serve `image/webp`)

Total allowlisted-artifact route/media smoke: **37/37** expected resources returned status 200. Thirty-five used their exact expected media type; the Windows Python preview server used the two documented MIME fallbacks above. This proves artifact completeness, not production routing, MIME configuration, or headers.

### Browser evidence already observed

- Services directory: widths 320, 360, 768, 920, 1280, and 1440 px passed with no horizontal overflow, broken media, layout movement, or console errors. The responsive visual set contained 38 healthy URLs.
- Services/discoverability follow-up: the Services hub at 1440 and 360 px and Firewalls at 1280 and 360 px showed complete media, visible proof/related links, no overflow, a static mobile side navigation, and no console warnings/errors.
- Privacy: 1280 and 360 px passed. Desktop reading width was 820 px; all five sections and the ordinary email link were visible; neither width overflowed; console warnings/errors were empty. At 360 px the menu opened with `aria-expanded="true"`, Escape closed it with `aria-expanded="false"`, focus returned to the menu button, and the visible focus outline was solid.
- Contact and Reviews were visually rerun from the active branch at desktop width after their approved redesign. The assessment hero, protected form, process guide, WhatsApp band, FAQ, review trust rail, live-proof areas, accessible rating fieldset, and review assurance panel rendered without horizontal overflow. No form or review submission was sent.
- A read-only request to the existing public reviews endpoint confirmed that the approved First Option Insulation review remains the single on-site review. The page continues to retrieve that review dynamically; no customer quote, name, or rating was invented or copied into static markup.
- Current-head browser rerun: homepage, pricing, Contact, Reviews, and Cloud Security & Automation passed at 1280 px and 390 px with no horizontal overflow or broken images. The mobile menu opens below the header with `aria-expanded="true"`. Pricing exposes the corrected heading hierarchy, and the case study exposes its canonical social metadata and high-priority hero. The local Reviews feed displayed its expected unavailable state because the production intake service is outside the local preview; no live request or submission was used as release evidence.
- Final local Lighthouse 13.4.1 on the generated homepage scored Performance 100, Accessibility 100, Best Practices 96, and SEO 100, with FCP 0.9 s, LCP 1.4 s, TBT 0 ms, and CLS 0. The earlier missing-favicon request was removed by declaring the approved WebP logo on all 25 public pages. The remaining console item is the expected warning that `frame-ancestors` is ignored in a meta CSP; verified production response headers remain the required remedy.

These viewport and local-browser observations are not field performance measurements and do not prove Core Web Vitals.

### Protected behavior and content

`tests/test_contact_reviews_regression.py`, the privacy/crawler/service suites, and the security runbook all agree on these protected baselines:

| Protected surface | SHA-256 |
| --- | --- |
| `contact.html` normalized `<main>` content | `8487e5667cf353d6c3960426efd8680b87b621b1067c8479cd00d509744b0c50` |
| `reviews.html` normalized `<main>` content | `e52cc64e5f63e076a8d2f53f49c69924d13ed0cc539da6fafa625cc801946676` |
| `assets/js/main.js` | `2ed431d84934dc2cbafb487a4339012f013ac3e429066fd77e8a82893d29e394` |
| `assets/js/qualification.js` | `21212f804b1a40c749da732bbf43f9919d4b38099a5812bbac6cf6976f6b9303` |
| `assets/js/reviews.js` | `2f81e2d8ab918f6bbb26963367f00fcb4a23a1cb70806cd0e4e436f42782f865` |

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

### Security review outcome

The standard Codex Security scan completed against the stabilized source snapshot with complete repository coverage. It validated two Low-severity findings and no Critical, High, or Medium findings:

- `contact.html` and `reviews.html` currently place `frame-ancestors 'none'` only in meta-delivered CSP. Browsers ignore `frame-ancestors` in a meta policy, so anti-framing is not effective until the documented HTTP response CSP and `X-Frame-Options: DENY` are activated at the edge. The attack requires a tailored lure, victim interaction, and Turnstile completion; this limits severity but does not remove the publication gate.
- The scan snapshot found that `.github/workflows/security-baseline.yml` installed the exact Semgrep version `1.172.0` while pip still resolved its transitive dependency closure without hashes. The transfer candidate remediates this by running the official `semgrep/semgrep:1.172.0` image pinned to immutable OCI digest `sha256:65dcd4408adda7c183a6b4550cb1e9b19f7f627a6fbb7e0559bd466bedc44d7b`; the mutable pip-resolution step and Python setup were removed.

The earlier scan found no source-backed injection, traversal, unsafe parsing, upload, secret-exposure, or dependency vulnerability. It deferred the backend-provided Google review URL because the intake implementation was not yet in the repository. The subsequent hardening makes the reviewed static destination immutable and adds a regression test for external, look-alike, proxy, redirect, and different-business values.

The earlier repository scan could not verify the out-of-repository intake Worker's server-side controls. The exact dashboard-managed source for deployment `f022c249` has since been imported into `worker/src/index.js`, making its validation, schemas, CORS, storage, moderation, and outbound flows reviewable locally. The candidate and both source-controlled configurations pass Wrangler dry runs. Isolated staging runtime behavior is now verified; logging/retention operations, production binding activation, and production deployment remain open.

### Cloudflare intake review and local hardening

A read-only Cloudflare dashboard review on 2026-09-02 established a narrower production finding without changing configuration or sending a live submission. The Turnstile widget is in Managed mode, is restricted to `epictech.club` and `www.epictech.club`, and uses an encrypted Worker secret. The custom-domain Worker calls Siteverify, but the reviewed implementation accepted a result by checking `success` only; it did not also require the expected `hostname` and endpoint-specific `action`. Production and preview `workers.dev` routes were disabled, and no intake-specific rate limit was identified.

This branch now supplies `lead_intake` and `review_intake` actions from the two widgets and contains a source-controlled Worker candidate that rejects a production Siteverify result unless `success` is true, `hostname` is exactly `epictech.club` or `www.epictech.club`, and `action` exactly matches the selected route. It also enforces exact submission origins, byte-bounded JSON objects, consistent token aliases, fail-closed route rate limits, and hardened moderation responses. The reviewed static EPIC TECH Google review destination remains immutable: backend response data cannot replace it with an arbitrary external, look-alike, proxy, redirect, or different-business URL. The earlier fix is deployed only to `epictech-emailer-staging`, where secret-authenticated synthetic checks returned 200 for lead and review flows without contacting Resend or CRM. The current local hardening additionally source-pins staging mode to the exact staging Worker origin, pins production mode in the production configuration, and prevents staging from contacting or caching Google Places even if production variables are accidentally injected. Those latest local defenses have not been redeployed. Production remains unchanged; operational review and production rollout still follow [the intake Worker security contract](intake-worker-security.md).

The 2026-09-03 settings review found `CRN_INGEST_URL` configured in Cloudflare while deployed version `f022c249` reads only `CRM_INGEST_URL`. The local candidate now prefers the canonical name and supports the deployed legacy name as a fallback, with signed-request and queue-failure regression tests. Deploying the candidate would therefore activate the current CRM endpoint; renaming the dashboard variable remains recommended cleanup rather than a local-code blocker.

### Authenticated GitHub repository evidence

- Repository: `ethan-cyber12/EPICTECH.club`; authenticated access has admin, maintain, push, pull, and triage permission.
- The current feature branch remains directly based on the inspected `main` and was behind by zero at transfer time; its additional commits are the handoff, release-hardening, and verification records.
- `main` reports `protected: false`; the repository exposes no rulesets and no required status checks. Establish branch protection or a repository ruleset with the release and security checks required before merging this publication candidate.
- No open pull request exists for the current feature branch at the time of inspection.
- `claude/content-alignment-positioning` is stale and diverged (ahead 1, behind 28) and deletes two service pages; `claude/epic-tech-seo-audit-3150v7` has no unique commits and is behind 29. Neither branch is a safe architecture source for this transfer, so neither was merged.
- GitHub Pages settings could not be independently read through the authenticated repository connector. The browser session available to this task was not signed in and GitHub CLI is not installed, so the publication source remains an explicit owner/deployment gate rather than an inferred fact.

### Branch evidence

`git diff --shortstat origin/main...373d200` reported **170 files changed, 15,106 insertions, and 510 deletions** for committed implementation work. The later release and Worker commits extend that baseline. The current feature branch intentionally remains ahead of its remote until the owner explicitly authorizes publishing the internal Worker source.

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

- [x] **Privacy retention/deletion wording:** the owner confirmed on 2026-09-02 (America/Los_Angeles) that the existing `privacy.html` statement reflects current operations. No fixed retention period or unsupported deletion promise was added.
- [ ] **Effective anti-framing protection:** before launch, activate and verify the documented enforcing response CSP with `frame-ancestors 'none'` and `X-Frame-Options: DENY` on Contact and Reviews. Report-Only CSP does not satisfy this gate.
- [ ] **Deploy only the allowlisted artifact:** production must consume generated `_site`, never the repository root. Bind the approval record to the intended Git account, target, revision, and artifact digest.
- [x] **Manual GitHub Pages workflow:** `.github/workflows/deploy-pages.yml` accepts no push or pull-request trigger, fails unless the selected ref is `main` and the owner-supplied 40-character SHA exactly matches it, reruns the release contracts, records a deterministic file-manifest digest, uploads only `_site`, uses SHA-pinned official actions, and requests Pages write permissions only in the deployment job.
- [ ] **GitHub Pages repository configuration:** in repository Settings, set the Pages source to **GitHub Actions** and configure the `epictech.club` custom domain before the first approved manual run. The checked-in `CNAME` file alone does not configure the repository setting.
- [ ] **Merge and publication:** the release candidate was transferred to its existing feature branch under the current authorization. Pull-request creation, merge, deployment, and production publication remain separate actions and were not performed.
- [ ] **Protected merge path:** configure branch protection or a repository ruleset for `main` and require the release/security checks before merging; `main` is currently unprotected and has no required checks.
- [x] **Security workflow supply chain:** the unhashed pip-resolved Semgrep dependency closure was replaced with the official versioned image pinned by immutable OCI digest.
- [ ] **Canonical redirects:** activate the documented permanent redirects only after authorization, then verify their production status, destination, and order.
- [ ] **Cloudflare Stage 0 — inventory:** record existing transforms, headers, HSTS, redirects, WAF/bot/AI controls, DNS/proxy state, subdomain HTTPS support, overlaps, and Trace order before creating rules.
- [ ] **Cloudflare Stage 1 — report only:** after separate owner approval, create disabled/reviewed rules and then test the exact report-only CSP, base headers, PDF header, consoles, and critical flows.
- [ ] **Cloudflare Stage 2 — enforcement:** only after clean Stage 1 evidence and a second owner approval, enforce the exact path-specific CSPs while retaining all meta CSPs and rerun critical-flow checks.
- [ ] **Cloudflare Stage 3 — meta-CSP deduplication:** only after verified enforcement, make a separate code/deployment change for non-protected pages; Contact and Reviews remain protected.
- [ ] **Live response evidence:** production HTML security headers, PDF `X-Robots-Tag: noindex, follow`, Cloudflare Trace, and verified-bot logs remain unchecked because live Cloudflare/network work was outside this task.
- [ ] **Contact/Reviews integrations:** isolated staging intake and Turnstile success/failure paths are exercised. Production contact delivery, review retrieval/submission/moderation, and WhatsApp external-side-effect checks still require specific authorization.
- [ ] **Intake backend controls:** source derivation, hostname/action enforcement, strict intake parsing, stable IP-keyed route limits, legacy/canonical CRM compatibility, contract tests, source-controlled production/staging configurations, and isolated staging deployment are complete. Recheck production rate namespace IDs and finish operations/retention/observability review before an authorized production rollout.
- [ ] **External schema/search validation:** Schema.org Validator, Google Rich Results, Search Console, Bing Webmaster Tools, sitemap submission, and index inspection were not contacted. Local schema parsing is not a substitute.
- [x] **Local performance:** Lighthouse 13.4.1 passed the generated homepage at 100 Performance, 100 Accessibility, 96 Best Practices, and 100 SEO. This is reproducible lab evidence only; live PageSpeed and field Core Web Vitals remain production follow-ups.
- [x] **Final representative browser rerun:** current-head desktop and mobile checks completed locally for homepage, pricing, Contact, Reviews, and a representative case study without overflow, broken images, or form submissions.

## Publication gate

Do not merge or publish this branch until the repository Pages source and custom domain are configured, the Contact/Reviews anti-framing response headers are enforced and verified, the intake Worker production controls are reviewed, and the intended commit, push, merge, and manual deployment actions are separately authorized. The manual Pages workflow is ready and publishes only `_site`; it has no automatic branch trigger. The owner has confirmed the Privacy retention/deletion statement. Cloudflare activation, live form/review tests, redirects, validators, search submissions, performance measurement, and production verification remain separate staged actions; this local record grants no authority to perform them.
