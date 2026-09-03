# Intake Worker security contract

Status: client-side action binding is implemented in this branch. The deployed Worker source was imported into `worker/src/index.js`, and the candidate now enforces the exact hostname/action contract, strict request-origin and JSON boundaries, bounded streaming reads, route-specific rate-limit bindings, and hardened moderation responses. An isolated staging Worker passed synthetic validation on 2026-09-03. No production configuration change, submission, or deployment was performed.

## Read-only production evidence

The Cloudflare dashboard was reviewed on 2026-09-02 without changing configuration or sending a live form submission:

- The production Turnstile widget is in Managed mode and is restricted to `epictech.club` and `www.epictech.club`.
- The Turnstile secret is held as an encrypted Worker secret.
- The intake Worker calls Siteverify, but the reviewed implementation accepted the result by checking `success` only. It did not also require the expected `hostname` and endpoint-specific `action`.
- Production and preview `workers.dev` routes are disabled; the Worker is exposed through its custom domain.
- No intake-specific rate limit was identified during the review.
- `ALLOWED_ORIGINS` is configured for the apex and `www` origins, and the required secret values are stored as encrypted variables.
- Production defines `CRN_INGEST_URL`, while deployed version `f022c249` reads only `CRM_INGEST_URL`. The local candidate gives the canonical name precedence and supports `CRN_INGEST_URL` as a compatibility fallback, so deploying the candidate would activate the currently configured CRM URL. Renaming the variable remains recommended cleanup, not a local-code blocker.
- The account showed one Worker application and one active KV binding on 2026-09-03. The local Wrangler configuration uses distinct rate-limit namespace IDs `1001` and `1002`; because Cloudflare does not expose a namespace registry, active bindings must be rechecked immediately before deployment.
- The dashboard confirms compatibility date `2025-05-23`, no compatibility flags, no cron triggers, and no queue consumers. The committed configuration preserves that compatibility date and declares no triggers.

These observations are point-in-time dashboard evidence. Deployment `f022c249` was copied without secret values into `worker/src/index.js` on 2026-09-03, fingerprinted as SHA-256 `688fc976e0c63598148e56da4e62bd8ee09d87dbb601c6ac0cb3ff278e945bf7` after LF normalization, then patched. The first hardened candidate was pushed to the feature branch as commit `f2dda4f`; none of these changes are a production attestation because production has not been deployed or verified.

## Required Turnstile boundary

The public widget and Worker must use this exact route-to-action contract:

| Worker route | Widget action | Allowed Siteverify hostnames |
| --- | --- | --- |
| `POST /lead-intake` | `lead_intake` | `epictech.club`, `www.epictech.club` |
| `POST /review-intake` | `review_intake` | `epictech.club`, `www.epictech.club` |

For both POST routes, the Worker must fail closed unless all of these checks pass before any email, storage, moderation, or other side effect:

1. The request method is `POST`, `Origin` is one of the exact approved origins, and the media type is exactly `application/json` with optional parameters.
2. A streaming reader rejects request bodies above 10,000 bytes for leads or 16,000 bytes for reviews before buffering more data; the decoded JSON must be a non-array object and pass the route schema.
3. The Turnstile token is present, no longer than 2,048 characters, and unambiguous when both supported field names are supplied.
4. The route-specific rate-limit binding is available and allows the pseudonymous client key. A missing, malformed, or failing binding returns a generic 503; exhaustion returns 429 with `Retry-After`.
5. Siteverify is called server-side with the encrypted secret, token, and Cloudflare-provided client address.
6. The Siteverify HTTP response and JSON are valid, `success` is true, `hostname` is in the exact allowlist above, and `action` exactly matches the route.

Cloudflare documents that Siteverify is mandatory and that tokens are single-use and expire after five minutes: [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Cloudflare also documents `data-action` as the value returned during validation: [Turnstile widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).

## Request and response controls

- Return CORS headers only for the exact approved site origin. Do not reflect an arbitrary `Origin`, enable credentials, or broaden the allowed methods and headers.
- Reject unsupported methods and paths. Keep `GET /reviews` read-only and separate from the two submission routes.
- Preserve the reviewed static Google review link. Backend response data must never replace that trusted destination.
- Do not log form bodies, Turnstile tokens, email addresses, phone numbers, messages, review text, or Worker secrets. Log bounded event names, response classes, and non-sensitive request IDs instead.
- Return generic public errors. Keep detailed Siteverify and storage failures in restricted observability data without personal submission content.
- Publish only moderated review fields. Never return review email addresses or unapproved records from `GET /reviews`.

## Abuse and availability controls

The local candidate calls a route-scoped Worker rate-limit binding before Siteverify or storage work. `LEAD_RATE_LIMITER` allows 6 calls per 60 seconds and `REVIEW_RATE_LIMITER` allows 3 calls per 60 seconds, using separate locally assigned namespaces. Production must recheck account-wide namespace use, monitor HTTP 429 responses, and revisit these starting thresholds with real traffic. Cloudflare notes that Worker rate-limit counters are permissive and local to a Cloudflare location, so they are an abuse layer rather than an exact accounting mechanism: [Workers Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Any IP-based edge rule must allow for shared networks and accessibility tools. Turnstile validation, the honeypot, strict schemas, body limits, bounded upstream work, and monitoring remain required even when an edge rate rule is present.

## Staging evidence

The isolated Worker `epictech-emailer-staging` is exposed only on its own `workers.dev` URL and has no production route or custom domain. It binds three newly created staging KV namespaces and rate-limit namespaces `2001` and `2002`; production's review namespace and local production rate IDs are not referenced by the staging configuration.

Staging requires an encrypted 64-hex-character access token on every substantive request, an exact source-pinned Worker URL match, complete staging bindings, and exact local QA CORS origins. It uses Cloudflare's public dummy Turnstile secret only under explicit staging test mode. Resend and CRM are not bound: their would-be payloads are captured to staging KV for one hour, while Google Places is disabled outright in staging even if production variables are injected. Staging review records expire after one hour. The production configuration pins `ENVIRONMENT=production`, ignores all staging credentials, and continues to enforce the real site hostname/action pairs.

Live synthetic checks on 2026-09-03 used only `example.test` identities and Cloudflare's public dummy token. Missing credentials returned 404, the production Origin was blocked, and lead/review success paths returned 200. Metadata-only KV inspection found three expiring capture keys, one expiring pending-review key, and no queued lead. Payload values and secrets were not read. Cloudflare's live dummy response contained `hostname: example.com` and no `action`, which differs from the current documentation example; this exception is pinned to explicit staging mode and does not weaken production validation.

## Deployment gates

- [x] Derive the source-controlled candidate from deployed Worker version `f022c249` without secret values and record the retrieved source fingerprint.
- [x] Add a reviewed deployment configuration that maps the existing review KV namespace, preserves dashboard-managed variables, and commits no secret values.
- [x] Add unit tests for accepted action/hostname pairs and fail-closed handling of wrong actions, look-alike hostnames, failed Siteverify responses, conflicting or oversized tokens, oversized or malformed bodies, disallowed origins, and unavailable dependencies.
- [x] Add route-specific rate-limit bindings with distinct local namespace IDs.
- [x] Provision an isolated non-production Worker, three staging KV namespaces, separate rate-limit IDs, staging-only encrypted secrets, and an environment-specific Wrangler configuration.
- [x] Deploy the non-production Worker and verify authentication, origin blocking, dummy Turnstile validation, lead/review success responses, staging-only writes, and one-hour expiration metadata.
- [ ] Immediately before deployment, recheck every active Worker binding and confirm namespace IDs `1001` and `1002` do not share counters with another binding.
- [ ] Review storage, moderation access, deletion/retention operations, observability redaction, and secret rotation.
- [x] After owner authorization, run one synthetic staging Contact submission and one synthetic staging Review submission and confirm storage behavior; the records self-delete after one hour.
- [ ] After a separate production authorization, run one synthetic production Contact submission and one synthetic production Review submission, confirm delivery/storage/moderation behavior, and remove the synthetic records.
- [ ] Deploy production only after the staged tests pass, then verify the exact custom-domain routes and Turnstile Analytics.

Until every gate above that applies to production is satisfied, the intake backend remains a publication blocker even though the static site build is green.
