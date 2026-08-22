# Security response headers

`epictech.club` is a static site on GitHub Pages, proxied through Cloudflare
(orange-cloud DNS). GitHub Pages does not let you set custom HTTP response
headers on static files, no matter what you put in a `<meta>` tag. The
`Content-Security-Policy` on every page today is delivered via a `<meta
http-equiv="Content-Security-Policy">` tag, which works for most CSP
directives, but a few things can only be set as a real HTTP header. Those
have to come from Cloudflare, sitting in front of GitHub Pages.

## What a meta-tag CSP cannot do

- `frame-ancestors` is **ignored** when delivered via `<meta>` (browsers
  print a console warning about this, which you may have seen). It only
  takes effect as a real `Content-Security-Policy` HTTP header.
- `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` are not CSP directives at all,
  they are separate headers, and none of them can be set via `<meta>`.

## How to add them via Cloudflare

Cloudflare → your zone (`epictech.club`) → **Rules** → **Transform Rules** →
**Modify Response Header** (this is on the free plan). Create one rule that
matches all requests to the zone (`Hostname equals epictech.club` or similar)
and adds:

| Header | Value | Why |
|---|---|---|
| `X-Frame-Options` | `DENY` | Backstops `frame-ancestors 'none'` for older browsers that don't honor CSP `frame-ancestors`. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Matches what's already set via `<meta name="referrer">` on every page, promoted to a real header. |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=()` | The site doesn't use any of these; explicitly deny them. |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from MIME-sniffing responses. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for two years, including subdomains. Only add this once you've confirmed every subdomain you actually use (including `intake.epictech.club`) is HTTPS-only, since `includeSubDomains` applies to all of them. |

Do **not** duplicate the full `Content-Security-Policy` here unless you
remove the `<meta>` tag version, browsers apply the most restrictive
intersection of multiple CSPs, and having two slightly different versions to
keep in sync is a maintenance trap. The `<meta>` CSP already correctly locks
down `script-src`, `connect-src`, `form-action`, and the Turnstile origin,
leave it as the source of truth for CSP specifically, and only add
`frame-ancestors` protection via `X-Frame-Options` at the Cloudflare layer as
described above.

## What NOT to change

Per the site's existing security posture, none of these should be loosened:

- `connect-src 'self' https://intake.epictech.club` (on `contact.html` and
  `reviews.html`), don't add other origins.
- `form-action 'self'`, this is why the HTML fallback on both forms submits
  back to the page itself rather than directly to the Worker.
- `script-src 'self' https://challenges.cloudflare.com`, don't add
  `unsafe-inline` or `unsafe-eval`. If you ever want Cloudflare Web
  Analytics (the auto-injected `static.cloudflareinsights.com` beacon you
  may have seen blocked in the console), that requires explicitly adding
  `https://static.cloudflareinsights.com` to `script-src`, a deliberate
  choice to make separately, not a default to reach for.
