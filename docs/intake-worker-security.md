# Intake Worker security contract

Status: client-side action binding is implemented in this branch. The deployed Worker source was imported into `worker/src/index.js`, and the local candidate now enforces the exact hostname/action contract. Rate controls, live submissions, production configuration changes, and deployment are not authorized or completed by this document.

## Read-only production evidence

The Cloudflare dashboard was reviewed on 2026-09-02 without changing configuration or sending a live form submission:

- The production Turnstile widget is in Managed mode and is restricted to `epictech.club` and `www.epictech.club`.
- The Turnstile secret is held as an encrypted Worker secret.
- The intake Worker calls Siteverify, but the reviewed implementation accepted the result by checking `success` only. It did not also require the expected `hostname` and endpoint-specific `action`.
- Production and preview `workers.dev` routes are disabled; the Worker is exposed through its custom domain.
- No intake-specific rate limit was identified during the review.
- `ALLOWED_ORIGINS` is configured for the apex and `www` origins, and the required secret values are stored as encrypted variables.
- Production defines `CRN_INGEST_URL`, while the deployed source reads `CRM_INGEST_URL`. The mismatch prevents the optional CRM branch from being enabled as intended and has not been changed in production.

These observations are point-in-time dashboard evidence. Deployment `f022c249` was copied without secret values into `worker/src/index.js` on 2026-09-03, fingerprinted as SHA-256 `688fc976e0c63598148e56da4e62bd8ee09d87dbb601c6ac0cb3ff278e945bf7` after LF normalization, then patched locally. The local source is not yet a production attestation because it has not been staged or deployed.

## Required Turnstile boundary

The public widget and Worker must use this exact route-to-action contract:

| Worker route | Widget action | Allowed Siteverify hostnames |
| --- | --- | --- |
| `POST /lead-intake` | `lead_intake` | `epictech.club`, `www.epictech.club` |
| `POST /review-intake` | `review_intake` | `epictech.club`, `www.epictech.club` |

For both POST routes, the Worker must fail closed unless all of these checks pass before any email, storage, moderation, or other side effect:

1. The request method is `POST`, the media type is `application/json`, and the body is within a documented small limit.
2. The Turnstile token is present and no longer than 2,048 characters.
3. Siteverify is called server-side with the encrypted secret, token, and Cloudflare-provided client address. A generated idempotency key may be used for a safe verification retry.
4. The Siteverify HTTP response and JSON are valid, `success` is true, `hostname` is in the exact allowlist above, and `action` exactly matches the route.
5. The request body passes a server-side allowlist schema and length checks. Client-side cleanup is only a usability control.

Cloudflare documents that Siteverify is mandatory and that tokens are single-use and expire after five minutes: [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Cloudflare also documents `data-action` as the value returned during validation: [Turnstile widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).

## Request and response controls

- Return CORS headers only for the exact approved site origin. Do not reflect an arbitrary `Origin`, enable credentials, or broaden the allowed methods and headers.
- Reject unsupported methods and paths. Keep `GET /reviews` read-only and separate from the two submission routes.
- Preserve the reviewed static Google review link. Backend response data must never replace that trusted destination.
- Do not log form bodies, Turnstile tokens, email addresses, phone numbers, messages, review text, or Worker secrets. Log bounded event names, response classes, and non-sensitive request IDs instead.
- Return generic public errors. Keep detailed Siteverify and storage failures in restricted observability data without personal submission content.
- Publish only moderated review fields. Never return review email addresses or unapproved records from `GET /reviews`.

## Abuse and availability controls

Add a route-scoped Worker rate-limit binding before the submission handlers perform Siteverify or storage work. Use separate namespaces for lead and review submission traffic and monitor HTTP 429 responses. Cloudflare notes that Worker rate-limit counters are permissive and local to a Cloudflare location, so they are an abuse layer rather than an exact accounting mechanism: [Workers Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Any IP-based edge rule must allow for shared networks and accessibility tools. Turnstile validation, the honeypot, strict schemas, body limits, bounded upstream work, and monitoring remain required even when an edge rate rule is present.

## Deployment gates

- [x] Export deployed Worker version `f022c249` into source control without secret values.
- [ ] Add a reviewed deployment configuration that maps the existing KV namespace and encrypted variables without committing secret values.
- [ ] Add unit tests for accepted action/hostname pairs and rejections for a wrong action, look-alike hostname, expired or duplicate token, oversized body, malformed JSON, disallowed origin, and unavailable Siteverify.
- [ ] Add route-specific rate-limit bindings and verify their namespace IDs do not collide with unrelated Workers.
- [ ] Review storage, moderation access, deletion/retention operations, observability redaction, and secret rotation.
- [ ] Deploy to a non-production environment with a separate Turnstile widget and secret.
- [ ] After owner authorization, run one synthetic Contact submission and one synthetic Review submission, confirm storage/moderation behavior, and remove the synthetic records.
- [ ] Deploy production only after the staged tests pass, then verify the exact custom-domain routes and Turnstile Analytics.

Until every gate above that applies to production is satisfied, the intake backend remains a publication blocker even though the static site build is green.
