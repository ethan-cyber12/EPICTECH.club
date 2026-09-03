# Crawler policy

Training-crawler policy: allow

Decision date: 2026-09-02

Search and answer retrieval: allow

## Decision and scope

This decision preserves the existing wildcard-allow posture and follows the owner's stated maximum AI crawlability objective. It is not a new data-access grant: `robots.txt` cannot grant access that the site's authorization, server, or security controls otherwise deny.

The site explicitly allows OAI-SearchBot, PerplexityBot, Perplexity-User, Googlebot, and bingbot. GPTBot and Google-Extended have no `Disallow` rule, so the wildcard rule continues to allow them.

## Operational limits

Enforcement note: robots.txt is a preference for compliant crawlers, not access control.

User-triggered agents may handle robots.txt differently from automated crawlers. Provider documentation should be reviewed when crawler behavior changes.

Cloudflare note: AI Crawl Control, WAF, and verified-bot settings can override or affect access and must be audited separately before live rollout. Cloudflare has announced an AI-bot policy transition scheduled for September 15, 2026. This local policy record does not activate or change any Cloudflare setting.

## Official references

- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)
- [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Google crawler documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Cloudflare AI bot policy transition](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/)
