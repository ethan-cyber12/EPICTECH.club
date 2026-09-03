# Crawler policy

Crawler policy: allow

Decision date: 2026-09-02

Search retrieval: allow

## Decision and scope

This decision preserves the existing wildcard-allow posture and the owner's stated search-discovery objective. It is not a new data-access grant: `robots.txt` cannot grant access that the site's authorization, server, or security controls otherwise deny.

The site explicitly allows Googlebot and bingbot. The wildcard rule allows other compliant crawlers unless a future policy adds a narrower restriction.

## Operational limits

Enforcement note: robots.txt is a preference for compliant crawlers, not access control.

Crawler behavior can vary by provider, so provider documentation should be reviewed when behavior changes.

Cloudflare note: bot controls, WAF, and verified-bot settings can override or affect access and must be audited separately before live rollout. This local policy record does not activate or change any Cloudflare setting.

## Official references

- [Google crawler documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Cloudflare bot documentation](https://developers.cloudflare.com/bots/)
