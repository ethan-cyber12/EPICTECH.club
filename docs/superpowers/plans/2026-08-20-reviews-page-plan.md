# Reviews Page — Implementation Plan

Branch: `claude/new-setup`. Two projects touched: this repo (`EPICTECH.club`, static
site) and `epictech-worker/worker.js` (Cloudflare Worker, separate untracked
folder — I edit the file directly, you redeploy via `wrangler deploy` or the
dashboard, same as today).

## Decisions locked in from brainstorming
- Reviews page shows both real Google reviews (fetched server-side, cached) and
  on-site testimonials (submitted by visitors, manually approved).
- Extend the existing worker rather than standing up a new one.
- Approval is a signed link in the existing Resend notification email — no
  admin page, no login.
- Form collects name, 1-5 star rating, review text, and email (email is never
  shown publicly — used only so you can verify/reply).
- Reviews live at `/reviews.html` only (no homepage snippet).
- Review text is rendered with `textContent`, never `innerHTML` (stored-XSS
  prevention — user-submitted content will be publicly displayed).
- CORS fail-open fix from the security review is included (`worker.js:206-208`).

## Task 1 — Worker: fail-closed CORS
File: `epictech-worker/worker.js`, function `cors()`.
Only set `Access-Control-Allow-Origin` when the origin is actually on the
allowlist, instead of falling open when `ALLOWED_ORIGINS` is empty/misconfigured.
No behavior change for the current, correctly-configured deployment.

## Task 2 — Worker: review routes
File: `epictech-worker/worker.js`. Restructure the single-path `fetch` handler
into a small router (`/lead-intake` unchanged) and add:

- `POST /review-intake` — Turnstile + honeypot + HMAC client-hash, same
  pattern as lead intake. Validates name/rating(1-5)/text/email, stores
  `review:pending:<uuid>` in a new `REVIEWS_KV` namespace (30-day TTL, same
  idiom as the existing `LEAD_QUEUE` TTL), emails you via the existing
  `sendEmail()` helper with the review content plus signed Approve/Reject
  links. Email failure returns 500 (fail loud, matches lead-intake — a review
  nobody gets notified about is as bad as a lost lead).
- `GET|POST /review-approve` / `GET|POST /review-reject` — verifies an HMAC
  signature over `id.action.expiresAt` using `crypto.subtle.verify`
  (constant-time, action bound into the signature so the link can't be
  replayed against the other action). **GET only renders a confirmation
  page — it never mutates anything**, since email clients/security scanners
  open links automatically via GET. Only a **POST** from that confirmation
  page (re-verifying the same signature) moves `pending` → `published`
  (stripping email/client-hash, since published entries are public) or
  deletes it. Not found (already actioned, or past the 30-day TTL) → a plain
  "already processed" HTML page, not an error. If email delivery fails after
  the pending KV record is written, the record is deleted before returning
  500 (no orphaned un-notified pending reviews on retry).
- `GET /reviews` — public. Returns published on-site reviews plus cached
  Google Places data (rating, total count, up to 5 snippets, and a
  `googleReviewUrl` built server-side from `GOOGLE_PLACE_ID` — so the
  frontend never needs the place ID hardcoded). Refreshes the Google cache
  from the Places API when it's >24h old; on API failure, serves the last
  good cache instead of erroring; if there's no cache yet, that field is
  simply omitted.

Field limits enforced server-side: name 2–100 chars, email ≤254 chars, review
text 10–2,000 chars, rating an integer 1–5, request body ≤16,000 bytes. The
HTML notification email HTML-escapes every visitor-controlled value; the
public page never uses `innerHTML` for review content either.

New secrets/vars you'll need to add in Cloudflare (I won't ask you to paste
these to me — add directly via `wrangler secret put` / the dashboard):
`GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `REVIEW_APPROVAL_SECRET`. New KV
namespace binding: `REVIEWS_KV`.

## Task 3 — `reviews.html`
New page, following the existing page template (header/nav/footer, CSP meta
matching `contact.html`'s pattern: Turnstile script-src/frame-src, `connect-src
'self' https://intake.epictech.club`). Sections: Google rating summary +
snippets (rendered by JS), on-site review list (rendered by JS), submission
form (name, 5-star radio input, review text, honeypot, Turnstile, email).

## Task 4 — `assets/js/reviews.js`
New file, same defensive style as `main.js`/`qualification.js`
(`textContent`/`createElement` only, no `innerHTML`). On load: `fetch()` the
worker's `/reviews`, render results, degrade gracefully if the request fails
or returns nothing yet. On submit: client-side validation, Turnstile token
check, POST to `/review-intake`, show a "submitted — will appear once
approved" message (must not imply it's live immediately).

## Task 5 — Nav + footer
Add a "Reviews" link to `nav-links` on every page: `index.html`, `about.html`,
`pricing.html`, `contact.html`, `services/index.html` and each
`services/*.html`. Only `index.html` has a footer `mini-links` section (every
other page's footer is link-free) — added there too. `privacy.html` has no
nav (minimal page) — leave it as-is.

## Task 6 — CSS
Add to `assets/css/styles.css`: a read-only star-rating display, an
accessible 5-star radio-group input for the form, and a review-card style —
reusing `.card`/`.field`/`.btn`/`.form-status` wherever they already fit.

## Task 7 — Docs
Add a short section to `epictech-worker/DEPLOY.md` (same style as the
existing Resend section) covering: new secrets, new KV namespace + binding,
deploy steps, and a manual post-deploy test checklist (submit → check email →
click Approve → confirm it appears on `/reviews.html`; submit → Reject →
confirm it does not).

## Verification
- Static HTML/CSS/JS: verified in-browser via the local preview tool —
  layout, CSP console-clean, form client-side validation, graceful handling
  of a failed `/reviews` fetch (the real worker won't have these routes live
  until you deploy).
- Worker routes: cannot be end-to-end tested by me — no deploy access to your
  Cloudflare account. Task 7's checklist is what you'll run after deploying.
