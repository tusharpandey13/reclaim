# 0010. Hash routes and relative paths, so it works under any URL prefix

Status: Accepted

## Context

The client is served from a sub-path on the owner's box, behind the tailnet's own reverse proxy, and the demo is served from a different prefix on a static host. Client-side path routing needs a server rule that sends every unknown path to `index.html`; without it, a reload or a shared link returns 404. Each host would need its own rule, and the box's proxy is deliberately minimal.

URLs also leak. A path is sent to the server and can end up in logs; the fragment after `#` never leaves the browser.

## Decision

The app uses hash routes and relative paths only.

- Vite builds with `base: './'`, and the web manifest's `start_url` and `scope` are `./`. Every asset, the service worker and the data files are fetched relative to `index.html`.
- Pages are `#/today`, `#/spend`, `#/bills/<card>` and so on. Filters ride in the hash's query string.
- A hash may carry a page, a group, a month or a card's short label. It never carries a payee name or an amount.
- Data files (`manifest.json`, `status.json`, the hashed snapshot) sit beside `index.html` and are served `no-store`. Hashed assets may be cached as immutable; `index.html` and `sw.js` are `no-cache`.

## Consequences

The same build runs unchanged at the root of a dev server, under a sub-path on the box, or from a demo folder, with no fallback rule, and reload never 404s. Copying `dist/` is the whole deploy. The costs are cosmetic URLs with a `#`, and no server-side knowledge of which page is open, which this app does not want anyway.

Rejected: history-API routing with a server fallback (a rule per host, and paths reach logs); absolute asset paths (break under a prefix).
