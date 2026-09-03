# EPIC TECH intake Worker

This directory contains the source-controlled copy of Cloudflare Worker deployment f022c249, retrieved read-only from the Cloudflare dashboard on 2026-09-03. Secret values were not viewed or copied. The retrieved 788-line source had SHA-256 `688fc976e0c63598148e56da4e62bd8ee09d87dbb601c6ac0cb3ff278e945bf7` after LF normalization; `worker/src/index.js` is the patched candidate rather than a byte-identical archival copy.

The imported source preserves the deployed route, email, review moderation, KV, Google Places, CRM, queue, and scheduled-handler architecture. The local candidate additionally requires Siteverify to return:

- success: true;
- an exact hostname of epictech.club or www.epictech.club; and
- lead_intake for /lead-intake, or review_intake for /review-intake.

Run the focused tests from the repository root:

~~~powershell
npm run test:worker
~~~

## Production bindings

Observed production configuration:

- REVIEWS_KV is bound to the existing review namespace.
- ALLOWED_ORIGINS is https://epictech.club,https://www.epictech.club.
- NOTIFY_FROM and NOTIFY_TO are configured as text variables.
- CRM_INGEST_SECRET, GOOGLE_PLACES_API_KEY, INTAKE_HMAC_SECRET, RESEND_API_KEY, REVIEW_APPROVAL_SECRET, and TURNSTILE_SECRET_KEY are encrypted secrets.
- The custom domain is intake.epictech.club; production and preview workers.dev access are disabled.

Do not commit secret values. A staged Wrangler configuration must preserve the existing namespace IDs and encrypted secrets.

## Known deployment blockers

- Production currently defines CRN_INGEST_URL, but the Worker reads CRM_INGEST_URL. Correcting the production name is an external configuration change and has not been performed.
- No LEAD_QUEUE, lead rate-limiter, or review rate-limiter binding was visible.
- The local hostname/action patch has not been staged or deployed.
- No synthetic production form submission has been authorized or performed.

Follow [the intake security contract](../docs/intake-worker-security.md) before deployment.
