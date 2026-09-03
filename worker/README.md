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
~~~

`worker:check` performs a local Wrangler dry run only. It bundles the Worker and validates the source-controlled binding candidate without uploading or deploying it.

## Production bindings

Observed production configuration:

- REVIEWS_KV is bound to the existing review namespace.
- ALLOWED_ORIGINS is https://epictech.club,https://www.epictech.club.
- NOTIFY_FROM and NOTIFY_TO are configured as text variables.
- CRM_INGEST_SECRET, GOOGLE_PLACES_API_KEY, INTAKE_HMAC_SECRET, RESEND_API_KEY, REVIEW_APPROVAL_SECRET, and TURNSTILE_SECRET_KEY are encrypted secrets.
- The custom domain is intake.epictech.club; production and preview workers.dev access are disabled.

The source-controlled `wrangler.jsonc` maps the observed `REVIEWS_KV` namespace, disables `workers.dev` and preview URLs, preserves dashboard-managed variables with `keep_vars`, declares the six existing encrypted secrets as required, and defines independent 60-second rate limits for leads and reviews. This configuration intentionally omits routes, leaving `intake.epictech.club` dashboard-managed. The dashboard confirms compatibility date `2025-05-23`, no compatibility flags, no cron triggers, and no queue consumers.

Namespace IDs `1001` and `1002` are distinct from each other. Cloudflare does not expose a separate rate-limit namespace registry, so an operator must recheck all active Worker bindings immediately before deploying. The production-targeted config is not a staging config: staging requires its own Worker name, KV namespace, rate-limit namespace IDs, hostname, and Turnstile widget/secret.

Do not commit secret values. Wrangler preserves encrypted secrets, and the deployment command is intentionally not exposed as an npm script. Deployment remains an owner-approved action.

## Known deployment blockers

- Deployed version `f022c249` reads only `CRM_INGEST_URL`, while production currently defines `CRN_INGEST_URL`. The local candidate accepts the legacy name as a fallback and prefers the canonical name, so deployment will activate the existing CRM endpoint; a later dashboard rename is still recommended.
- No LEAD_QUEUE, lead rate-limiter, or review rate-limiter binding is active in production. The two rate-limit bindings are ready in the local Wrangler configuration but require an authorized deploy.
- The local hostname/action patch has not been staged or deployed.
- No isolated staging Worker, KV namespace, hostname, rate-limit namespaces, or Turnstile widget/secret has been provisioned.
- No synthetic production form submission has been authorized or performed.

Follow [the intake security contract](../docs/intake-worker-security.md) before deployment.
