# Security remediation rollout

Prepared against GitHub main 35e99e8567b572127f456fec3f7e806ce5979fba. Deployment evidence and final status are recorded in the accompanying remediation report.

## Public reviews feed

1. Compare the currently deployed Worker source and bindings with the reviewed source. Preserve email/review secrets, allowed origins, notification addresses and the custom domain. The owner chose email-only lead delivery: remove CRM endpoint variables, the CRM secret, the old lead-queue binding and any retry schedule. The source has no CRM forwarding or scheduled retry handler.
2. Check all account Workers for rate-limit namespace collisions. The new feed IDs **1003 (production)** and **2003 (staging)** were verified unused across both existing account Workers on September 4, 2026. Recheck before any later deployment. Both must remain distinct from each other and all existing account bindings. The feed budget is 30 requests per 60 seconds per HMAC-hashed Cloudflare client IP. A separate shared key in this same dedicated namespace limits expensive rebuilds across clients in each Cloudflare location. Existing staging submission limits of 10 leads and 30 reviews per minute are preserved.
3. Run `npm run worker:check` and `npm run worker:check:staging`. Deploy the complete bundled Worker, including `src/reviews-cache.js`, and the new binding together. Missing limiter configuration intentionally returns 503; a depleted client budget returns 429.
4. Verify first in isolated staging using its existing access-token mechanism and synthetic data. Staging remains private and never contacts Google or Resend. Synthetic emails are captured for one hour. No CRM forwarding exists in either environment.
5. Deploy the verified bundle/configuration to production using the existing account deployment process. Verify ordinary feed reads and both allowed browser origins without submitting real leads/reviews or load-testing production.

The public payload is fresh for 60 seconds and retained internally for up to five minutes for explicit stale revalidation/failure fallback. A KV snapshot avoids repeated list/get fan-out across cold isolates; a payload-only edge cache and isolate cache avoid repeated KV reads. Client responses may remain cached beyond the internal retention window, for up to roughly ten minutes total during failures. Signed approval invalidates the local/edge snapshot and shared KV snapshot after publishing. Other Cloudflare locations can briefly retain older data until their TTL expires; KV and Cache API do not provide globally atomic invalidation. Promise coalescing is per isolate, rate counters per Cloudflare location, and KV snapshots/backoff are eventually consistent. These are abuse controls, not a strict global billing cap. Configure Google API budget/quota alerts separately when needed.

Google refreshes have a three-second timeout, five-minute failure backoff, and preserve the last successful payload. KV write failure retains local backoff. Intake, moderation, errors, and authenticated staging responses remain no-store. Cache entries never contain request-specific CORS headers or private pending-review fields.

Rollback: use the recorded prior version only for an emergency, then reapply the security and email-only changes. An older bundle restores earlier security weaknesses and CRM forwarding code; never restore retired CRM endpoint variables or its secret. Preserve email/review secrets and review KV data. The new cache keys (`reviews:feed:v1`, `google:reviews:retry`) are additive and expire. The detached staging lead-queue namespace was not deleted.

## Enforced anti-framing

The epictech.club rule **Security - prevent form framing** (ID `a24f3d289b6e45c2bcb0be9ff138c0db`) was deployed and verified on September 4, 2026. Do not create a duplicate. The version-controlled rule in `cloudflare-anti-framing-rule.json` belongs in the **http_response_headers_transform** ruleset. It appends a separate enforced CSP policy containing only `frame-ancestors 'none'` and sets `X-Frame-Options: DENY`. This preserves other CSP policies and does not alter script, connection, font, image, or Turnstile allowlists. Review later rules for overrides.

GitHub Pages does not apply a Cloudflare-style `_headers` file. A meta CSP cannot enforce frame-ancestors; this patch removes that ignored directive while retaining other meta protections. Report-only CSP does not prevent framing. The broader CSP proposal in the supplied screenshot is separate from this narrow fix.

Run `node scripts/verify-live-security-headers.mjs`. It passed on both contact.html and reviews.html at 23:39:13 UTC after rollout. Before rollout, both returned 200 without CSP or X-Frame-Options. The www hostname returns a valid HTTPS 301 redirect to the corresponding protected apex page; the verifier deliberately rejects redirects, so use the canonical apex URL. HSTS max-age=15552000 and nosniff were already present. This patch does not enable HSTS preload or includeSubDomains without a verified complete subdomain inventory.

Rollback: disable only this added transform rule. Removing it restores the framing exposure.

Official references: [Rate limits](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [Cache API locality and limitations](https://developers.cloudflare.com/workers/runtime-apis/cache/), [Response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/).
