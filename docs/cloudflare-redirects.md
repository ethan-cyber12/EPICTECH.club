# Cloudflare canonical redirects

This runbook documents the future canonical-redirect rollout for EPIC TECH. It
does not authorize or activate a Cloudflare change. Apply it only after the
branch containing the normalized internal links has been deployed and the site
owner has separately approved activation.

## Pre-activation inventory

Before creating or enabling either rule, export or record the current zone
configuration and confirm all of the following:

- the existing HTTP-to-HTTPS behavior and whether it is handled by Cloudflare,
  GitHub Pages, or both;
- the current `www.epictech.club` normalization behavior and its final target;
- every active Cloudflare Bulk Redirect and Single Redirect rule, including
  priority and evaluation order;
- whether another rule already matches either exact path below;
- whether the proposed order would create a chain or loop with host, `www`, or
  HTTPS normalization.

Keep that inventory with the change record. Do not proceed if an existing rule
overlaps either exact hostname/path pair; reconcile the conflict and repeat the
inventory first.

## Exact Single Redirect rules

Configure two Cloudflare Single Redirect rules. Each rule is scoped to the
apex hostname `epictech.club` and one exact path. Query strings are preserved.
Subpath matching is disabled. `www` and all other subdomains are excluded.

1. Home duplicate

   - Source URL: `https://epictech.club/index.html`
   - Expression: `(http.host eq "epictech.club" and http.request.uri.path eq "/index.html")`
   - Target: `https://epictech.club/`
   - Status: `301`
   - Preserve query string: yes

2. Service-hub duplicate

   - Source URL: `https://epictech.club/services/index.html`
   - Expression: `(http.host eq "epictech.club" and http.request.uri.path eq "/services/index.html")`
   - Target: `https://epictech.club/services/`
   - Status: `301`
   - Preserve query string: yes

These expressions intentionally do not match paths such as
`/archive/index.html`, `/services/index.html/extra`, or any subdomain. Place the
rules after any required host/HTTPS normalization only if the pre-activation
inventory proves that order produces a single redirect hop and no conflict.

## Staged activation

1. Deploy the site version whose internal links already use `/` and
   `/services/`.
2. Record baseline responses for all verification URLs below.
3. Obtain separate owner authorization for the Cloudflare change.
4. Create both rules disabled and compare their expressions, targets, status,
   query behavior, and order with this runbook.
5. Enable the rules together, then immediately run every verification check.

The rules remain documentation-only until these deployment and authorization
steps are complete.

## Verification

Check the direct redirects:

```sh
curl -sS -o /dev/null -D - https://epictech.club/index.html
curl -sS -o /dev/null -D - https://epictech.club/services/index.html
```

Each response must contain one `301` and the exact corresponding `Location`
target above. Then confirm the preferred destination and preserved query
strings:

```sh
curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' https://epictech.club/index.html
curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' https://epictech.club/services/index.html
curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' 'https://epictech.club/index.html?source=redirect-check'
curl -sS -L -o /dev/null -w '%{http_code} %{url_effective}\n' 'https://epictech.club/services/index.html?source=redirect-check'
```

The first two follow checks must end with `200` at the preferred URL. The query
checks must end at the same preferred paths with
`?source=redirect-check` intact. Also confirm that these non-target URLs are not
matched by either rule:

```sh
curl -sS -o /dev/null -D - https://www.epictech.club/index.html
curl -sS -o /dev/null -D - https://epictech.club/archive/index.html
curl -sS -o /dev/null -D - https://epictech.club/services/index.html/extra
```

Any redirect on those controls must come only from previously inventoried host
or site behavior, never from these two path rules.

## Rollback

If a target, status, query string, rule order, or control check is wrong,
disable these two rules immediately. Do not delete or alter pre-existing
redirects. Re-run the direct, follow, query, and exclusion checks to confirm the
previous behavior has returned, then use the saved inventory to diagnose the
conflict before proposing another activation.
