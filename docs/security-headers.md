# Cloudflare security-header rollout

Status: local documentation only; no Cloudflare rule has been created or activated.

Owner authorization is required before every live stage. Do not activate any rule from this document during local preparation. The existing HTML meta CSP remains the current enforcement layer until the later gates below are completed.

## Fixed rule contracts

Create response-header rules with Cloudflare Rules → Transform Rules → Modify Response Header. Use **Set static**, not **Add static**, so a rollout cannot create duplicate header fields. Later response-header rules can overwrite earlier rules; verify rule order with Cloudflare Trace.

### Standard HTML rule

Expression:

```text
(http.host eq "epictech.club" and not (http.request.uri.path in {"/contact.html" "/reviews.html"}) and not ends_with(http.request.uri.path, ".pdf"))
```

Policy value:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; form-action 'self' mailto:; frame-ancestors 'none'; upgrade-insecure-requests
```

### Contact and Reviews rule

Expression:

```text
(http.host eq "epictech.club" and http.request.uri.path in {"/contact.html" "/reviews.html"})
```

Policy value:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://intake.epictech.club; frame-src https://challenges.cloudflare.com; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

The protected policy preserves the current Turnstile script/frame origin and the `https://intake.epictech.club` connection origin. Do not expand either allowlist.

### Base apex-page response headers

Set these exact static values on both HTML response rules:

```text
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=15552000
```

### Public PDF rule

Expression:

```text
(http.host eq "epictech.club" and starts_with(http.request.uri.path, "/assets/projects/") and ends_with(http.request.uri.path, ".pdf"))
```

Set this exact static value:

```text
X-Robots-Tag: noindex, follow
```

PDF `noindex, follow` is a response-header policy, not a PDF content edit.

## Security boundaries

- Do not add `unsafe-inline` or `unsafe-eval`.
- Do not self-host or hash the dynamic Turnstile script.
- Do not add Cloudflare Web Analytics, external fonts, trackers, review widgets, or CDNs.
- Do not expand HSTS to `includeSubDomains` or `preload` until `epictech.club`, `intake.epictech.club`, and every other subdomain are confirmed permanently HTTPS-capable and the owner separately approves the lockout risk.
- Do not whitelist bots by User-Agent alone; use Cloudflare verified-bot classifications or provider-published networks.
- Preserve the Turnstile action bindings: `lead_intake` on Contact and `review_intake` on Reviews. The intake Worker must reject a Siteverify result whose returned `action` does not exactly match the requested endpoint.
- Preserve the Contact and Reviews endpoint origins, form behavior, meta CSP, and protected-source hashes recorded below.

## Stage 0 — inventory and baseline

Before creating or enabling anything, export or record all existing configuration and evidence:

- Transform Rules and Managed Transforms.
- Current response headers and baseline response headers for a standard page, Contact, Reviews, and a public PDF.
- Current HSTS configuration.
- Existing redirects and redirect order.
- WAF and custom rules.
- Bot Fight Mode or Bot Management.
- Crawler controls and verified-bot settings.
- DNS and proxy status for every hostname.
- Record every subdomain's HTTPS capability, including the intake service.
- Cloudflare Trace and evaluation-order evidence for redirects, transforms, and relevant security rules.

Stop if an existing rule overlaps any proposed expression or header. Resolve and document that overlap before continuing. Create all proposed rules disabled, preserving their intended order, and capture the disabled configuration for review.

## Stage 1 — report only

This stage requires separate owner authorization before any live change.

1. Keep every existing meta CSP in place as enforcement.
2. Add the two path-specific policies as `Content-Security-Policy-Report-Only`, using the exact values above.
3. Set static the five base response headers on both HTML rules.
4. Set static the PDF `X-Robots-Tag` rule.
5. Confirm response headers and rule evaluation with Cloudflare Trace. Confirm later response-header rules have not overwritten these values.
6. Test home, Founder, all Services pages, all Case Studies, Privacy, Contact, and Reviews in browser consoles.
7. Exercise mobile navigation, all service destinations, contact submission, review retrieval, review submission, Turnstile, and WhatsApp.

Critical-flow testing may begin only after the owner authorizes live testing. Form submissions, review actions, and other external side effects require the owner's specific approval at test time. Record the headers, console results, request paths, and any violations before advancing.

## Stage 2 — enforce

This stage requires a second owner approval after Stage 1 evidence is clean.

1. Replace `Content-Security-Policy-Report-Only` with `Content-Security-Policy` using the same path-specific values.
2. Keep every meta CSP temporarily; the response-header and meta policies intersect and must not break a tested flow.
3. Verify live headers, Cloudflare Trace, browser consoles, navigation, Contact/Reviews behavior, Turnstile, intake connections, review retrieval, and WhatsApp again.
4. If any critical flow fails, disable only the new enforcing CSP rules and retain the existing meta policy while investigating. Do not loosen `script-src`, `connect-src`, `frame-src`, or `form-action` as a rollback shortcut.

Do not advance without saved evidence from both a standard page and the protected Contact/Reviews path.

## Stage 3 — deduplicate

Remove the meta CSP from non-protected HTML only after the enforcing response header is live.

After live `Content-Security-Policy` is confirmed on a standard page and on both Contact and Reviews, make a separate later code change that removes the meta CSP only from non-protected HTML. Leave the meta CSP in `contact.html` and `reviews.html`. The enforcing response-header policy remains authoritative and supplies effective `frame-ancestors` protection and `object-src 'none'`.

Run the full local suite, obtain deployment approval, deploy that separate code change, and verify headers, Cloudflare Trace, browser consoles, and every critical flow a third time. Remove report-only rules only after clean enforcement.

## Protected-source baselines

These normalized source hashes must remain unchanged throughout the rollout:

- `contact.html` main: `8487e5667cf353d6c3960426efd8680b87b621b1067c8479cd00d509744b0c50`
- `reviews.html` main: `e52cc64e5f63e076a8d2f53f49c69924d13ed0cc539da6fafa625cc801946676`
- `assets/js/main.js`: `2ed431d84934dc2cbafb487a4339012f013ac3e429066fd77e8a82893d29e394`
- `assets/js/qualification.js`: `21212f804b1a40c749da732bbf43f9919d4b38099a5812bbac6cf6976f6b9303`
- `assets/js/reviews.js`: `2f81e2d8ab918f6bbb26963367f00fcb4a23a1cb70806cd0e4e436f42782f865`

Any hash mismatch stops the rollout until the change is explained and separately approved.
