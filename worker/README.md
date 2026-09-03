# EPIC TECH intake Worker

This directory contains a source-controlled candidate derived from Cloudflare Worker deployment f022c249, retrieved read-only from the Cloudflare dashboard on 2026-09-03. Secret values were not viewed or copied. The retrieved 788-line source had SHA-256 `688fc976e0c63598148e56da4e62bd8ee09d87dbb601c6ac0cb3ff278e945bf7` after LF normalization; `worker/src/index.js` is the patched candidate rather than a byte-identical archival copy.

The imported source preserves the deployed route, email, review moderation, KV, Google Places, CRM, queue, and scheduled-handler architecture. The local candidate additionally requires Siteverify to return:

- success: true;
- an exact hostname of epictech.club or www.epictech.club; and
- lead_intake for /lead-intake, or review_intake for /review-intake.

It also requires an exact approved `Origin`, an exact JSON media type, a non-array JSON object within the route's byte limit, consistent Turnstile token aliases, a configured HMAC secret, and an available route-specific rate limiter. Moderation links are shape-checked before KV lookup, and their HTML responses send CSP, anti-framing, referrer, permissions, and MIME-sniffing headers.

Run the focused tests from the repository root:

~~~powershell
npm run test:worker
npm run worker:check
npm run worker:check:staging
~~~

The two `worker:check` commands perform local Wrangler dry runs only. They bundle the Worker and validate the source-controlled production and staging binding candidates without uploading or deploying them.

## Isolated staging

The staging Worker is `epictech-emailer-staging` at `https://epictech-emailer-staging.ethanplatt0120.workers.dev`. It has no custom domain and uses only these staging namespaces:

- `epictech-reviews-staging` (`f3539b9c01f84c6498e0800e8f25162f`)
- `epictech-lead-queue-staging` (`6942ed5c35b644ef84f4601f61fe496d`)
- `epictech-staging-events` (`886f75c19d714468b18a078fbf3d5f45`)

Every non-OPTIONS staging request requires the encrypted `STAGING_ACCESS_TOKEN` through `X-Epictech-Staging-Key`. The Worker also requires its request origin and `STAGING_BASE_URL` to equal the source-pinned staging Worker origin; it fails closed when a required staging secret or binding is absent. Only the two local QA origins in `wrangler.staging.jsonc` receive CORS permission. The production Wrangler configuration explicitly pins `ENVIRONMENT=production` while preserving its dashboard-owned variables.

Staging never calls Resend, the CRM, or Google Places, even if production-named variables are injected. It stores would-be email and CRM payloads in `STAGING_EVENTS` with a one-hour expiration. Staging review records also expire after one hour, including published records. The staging Turnstile secret is Cloudflare's public always-pass test secret and is deliberately separate from production. A live check on 2026-09-03 found the dummy Siteverify response to contain `hostname: example.com` with no `action`, despite the documentation example showing `localhost` and `test`; staging pins the observed dummy identity, while production continues to require its exact real hostname/action pair.

The live synthetic checks returned 404 without the staging key, blocked the production Origin, and returned 200 for both lead and review submissions. Key-only inspection confirmed three one-hour event captures, one one-hour pending review, and no queued lead. Synthetic payload values were not read back.

## Production bindings

Observed production configuration:

- REVIEWS_KV is bound to the existing review namespace.
- ALLOWED_ORIGINS is https://epictech.club,https://www.epictech.club.
- NOTIFY_FROM and NOTIFY_TO are configured as text variables.
- CRM_INGEST_SECRET, GOOGLE_PLACES_API_KEY, INTAKE_HMAC_SECRET, RESEND_API_KEY, REVIEW_APPROVAL_SECRET, and TURNSTILE_SECRET_KEY are encrypted secrets.
- The custom domain is intake.epictech.club; production and preview workers.dev access are disabled.

The source-controlled `wrangler.jsonc` maps the observed `REVIEWS_KV` namespace, disables `workers.dev` and preview URLs, preserves dashboard-managed variables with `keep_vars`, declares the six existing encrypted secrets as required, and defines independent 60-second rate limits for leads and reviews. This configuration intentionally omits routes, leaving `intake.epictech.club` dashboard-managed. The dashboard confirms compatibility date `2025-05-23`, no compatibility flags, no cron triggers, and no queue consumers.

Namespace IDs `1001` and `1002` are distinct from each other. Cloudflare does not expose a separate rate-limit namespace registry, so an operator must recheck all active Worker bindings immediately before deploying. Staging uses separate IDs `2001` and `2002`; its configuration must never be substituted for the production-targeted config.

Do not commit secret values. Wrangler preserves encrypted secrets, and the deployment command is intentionally not exposed as an npm script. Deployment remains an owner-approved action.

## Known deployment blockers

- Deployed version `f022c249` reads only `CRM_INGEST_URL`, while production currently defines `CRN_INGEST_URL`. The local candidate accepts the legacy name as a fallback and prefers the canonical name, so deployment will activate the existing CRM endpoint; a later dashboard rename is still recommended.
- No LEAD_QUEUE, lead rate-limiter, or review rate-limiter binding is active in production. The two rate-limit bindings are ready in the local Wrangler configuration but require an authorized deploy.
- The production hostname/action patch has passed isolated staging checks but has not been deployed to production.
- No synthetic production form submission has been authorized or performed.

Follow [the intake security contract](../docs/intake-worker-security.md) before deployment.
