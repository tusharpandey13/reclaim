# 0008. Tailnet only, no cloud, no third-party loads

Status: Accepted

## Context

Reclaim exists to take personal data back from the services that hold it. Bank messages, statements and mail describe where someone lives, what they buy and who they pay. Most finance apps get there by sending that data to an account aggregator or a merchant-enrichment service; one Indian product, for example, buys merchant data from a UPI insights provider. Any of these would send the owner's spending off their own hardware.

Leaks are also easy to make by accident in a web client. A logo fetched from a CDN by merchant name, a web font from a font host, or a price looked up per ticker each tells a third party something private.

## Decision

All collected data stays on a small home server the owner controls, reachable only over their private tailnet. The web client enforces the same boundary.

- **No cloud and no aggregator.** No account-aggregation API, no hosted enrichment, no LLM API for naming merchants. Merchant names come from rules and the owner's own corrections, with any local-model suggestion running on the box and needing confirmation.
- **Nothing loads from a third party, ever.** Fonts are subset and bundled; every icon ships in the bundle; no `<img src>` is built from a merchant name. The build sets a strict Content-Security-Policy (`default-src 'none'`, with only `'self'` for scripts, styles, fonts, connections, manifest and worker, and `data:` images).
- **No exposure beyond the tailnet.** Membership grants read. The one write path sits behind the tailnet's own identity header, fails closed, and is bound to localhost on the box. Public tunnelling is never used.
- **Prices are fetched in bulk** from public sources; never per ticker, since that reveals holdings.
- **The phone keeps nothing.** The client reads data into memory; a failed save stays on screen with Try again, and no write is queued on disk. Hash routes may carry a group or month, never a name or amount.

## Consequences

Privacy holds by construction, and the CSP turns an accidental remote load into a visible failure. The costs are real: no automatic bank connection (statements must be supplied), weaker merchant naming than a commercial dataset, no access away from the tailnet, and no brand logos beyond what open icon sets provide.

This repository ships only the web client on invented data, so it inherits the CSP and the no-remote-load rule but none of the box.
