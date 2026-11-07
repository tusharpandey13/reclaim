# App write contract v1

The finance app's only write path, served by `finance/write_api.py`: stdlib Python, its own process, bound to `127.0.0.1` only, behind `tailscale serve` at `/reclaim/api/`. The ingest server is not involved.

## Rules

- **Append-only.** One JSON line per request. Nothing is edited or removed. Undo is one more line.
- **No amount can change.** A correction has no way to name an amount or account: the build's own parser (`corrections._parse`) refuses any other key. A Plan event's `amount` is the owner's planned figure. It reaches projections only, never the ledger.
- **Identity fails closed.** `tailscale serve` sets `Tailscale-User-Login` on each proxied request and overwrites any value the client sent, so a client on the tailnet cannot forge it. The header must equal `RECLAIM_WRITE_OWNER`, or the request is refused with `401`. A device with a tag has no user login, so it is refused too. A POST's `Origin` must equal `RECLAIM_WRITE_ORIGIN`. Either env var missing: every read and write of these lines is refused with `503`. The login is never hard-coded or committed, and **the deploy job must set both**.
- **Trust rests on the bind.** The header means nothing to a caller that reaches the port directly, so the service refuses any address but `127.0.0.1` at startup. Nothing else on the box may proxy to this port. Snapshot, manifest and status reads are tailnet-only, through `tailscale serve`, with no login check.
- **Size.** Body at most 8 KiB, `application/json` only, no chunked or compressed body. Each file at most 8 MiB, then `507`.
- **Logs** hold route, method, status, duration and counts. Never a body, a field or a login.
- **Responses** are `Cache-Control: no-store`.
- **Retries are safe.** A repeated `id` or `eid` changes nothing and answers `duplicate: true`.

## Endpoints

| Method and path | Body | Success |
|---|---|---|
| `GET /reclaim/api/healthz` | | `{"ok":true}`. No identity needed, no data |
| `POST /reclaim/api/corrections` | One correction line | `{"ok":true,"duplicate":false}` |
| `GET /reclaim/api/corrections` | | `{"ok":true,"seq":N,"lines":[...]}` |
| `POST /reclaim/api/plan-events` | One Plan event | `{"ok":true,"duplicate":false}`, plus `changed_elsewhere` on an `update` with `base_rev` |
| `GET /reclaim/api/plan-events` | | `{"ok":true,"seq":N,"lines":[...]}` |

Failure: `{"ok":false,"error":"<fixed code>"}`.

| Status | Means | App does |
|---|---|---|
| 400, 411, 413, 415 | Refused. Nothing written | Says not saved. No retry offered for the same content |
| 401, 403 | Not the owner, or wrong origin | Says it could not confirm it is you. Retry offered, no loop |
| 503 | Not configured | Says saving is off |
| 507 | File full | Says the store is full |
| 500, network failure | May or may not have been written | Says not saved, Try again sends the same id |

## Correction line

Exactly as in `finance/corrections.py`, read by the build with `--corrections <dir>/corrections.jsonl`:

```json
{"id":"<uuid>","at":"2026-11-03T09:00:00Z","key":"<alias key or source key>","scope":"similar","merchant":"Ravi Stores","group":"Food","treatment":"expense"}
{"id":"<uuid>","at":"2026-11-03T09:00:05Z","revoke":"<uuid of the first>"}
```

## Plan event, `plan.events.v1`

File `plan.events.jsonl`, separate from corrections, so replaying statement corrections can never touch a plan. Folded by the app, oldest first.

```json
{"v":1,"eid":"<id>","at":"…","op":"create","id":"pln_<id>","data":{"title":"Car","amount":222222,"ym":"2027-08","by":null,"flex":"any","spread":1,"status":"planned","match_hint":null,"note":null}}
{"v":1,"eid":"<id>","at":"…","op":"update","id":"pln_<id>","base_rev":1,"set":{"ym":"2027-09"}}
{"v":1,"eid":"<id>","at":"…","op":"status","id":"pln_<id>","to":"cancelled"}
{"v":1,"eid":"<id>","at":"…","op":"set","set":{"soft":40000,"hard":10000,"invest":66666,"eq":80}}
```

| Field | Allowed |
|---|---|
| `title` | 1 to 120 characters, no control or bidi characters |
| `amount` | Whole rupees, 1 to 10^11 |
| `ym` | `YYYY-MM` |
| `spread` | 1, 3 or 6 |
| `flex` | `any`, `earlier`, `fixed` |
| `status`, `to` | `planned`, `cancelled`. Only a statement marks a plan paid |
| `set` keys | As `plan-events-v1.md`: `soft`, `hard`, `invest`, `essentials` in whole rupees; `eq` a whole percentage; `sell_vests`; `yearly_bills` |

**Undo of a new plan** is a `status` event to `cancelled` whose `eid` starts `undo-`. Same shape, so forecasts read it as cancelled, and the app leaves it out of "cancelled" and history. Older lines are unaffected.

Every event also passes `finance/plan_store._parse`, the parser the build reads with, so a saved line can never be dropped there as invalid. It applies `ledger.sanitize_merchant` to titles when it folds, so a title can read shorter after a rebuild. `match` and `unmatch` are refused for now: only a statement closes a plan, and nothing produces them yet.

Build input: pass `--plan-events <dir>/plan.events.jsonl` and `--corrections <dir>/corrections.jsonl`.

**Conflict.** Last write wins, and history keeps both. An `update` whose `base_rev` is behind answers `changed_elsewhere: true`, and the app says so.

## Serving, for the deploy job

The app uses only relative paths and hash routes, so it needs no fallback rule and works under `/reclaim/`.

| Path under `/reclaim/` | From | Headers |
|---|---|---|
| Everything in `app/dist/` | `npm --prefix app run build` on the Mac. It holds no data | Normal. `sw.js` must not be cached for long: `Cache-Control: no-cache` |
| `manifest.json`, `status.json`, `snapshot-v2.<hash>.json` | The build's publish directory, beside `index.html` | `Cache-Control: no-store`, required |
| `api/*` | Proxy to `finance/write_api.py` on `127.0.0.1:8793`, through `tailscale serve`, so `Tailscale-User-Login` is set by it and cannot be spoofed | From the service |

Optional, and safe to skip: a gzip copy beside a file (`<file>.gz`, never older than the file) may be sent to a client that accepts gzip, with `Content-Encoding: gzip` and `Vary: Accept-Encoding`. Files under `assets/` carry Vite's content hash in their name and may be `Cache-Control: max-age=31536000, immutable`. The rest of `app/dist/`, `index.html` included, is `no-cache` and answers a revalidation with `304`. Data files stay `no-store`.

Also send `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'`. The build carries it as a meta tag too.

Service, with both values from the deploy job's own config, never from this repo: `RECLAIM_WRITE_OWNER=<tailscale login> RECLAIM_WRITE_ORIGIN=https://<your-box> python3 finance/write_api.py --dir <dir>`, on its own user. Build with `--corrections <dir>/corrections.jsonl --plan-events <dir>/plan.events.jsonl --generated-at <instant>`, and add both files to the encrypted backup. Until `--generated-at` is passed the app shows the date with no time and no stale strip.

## What the phone keeps

Nothing. A failed save stays on screen, in memory, with Try again. No write is queued on disk, and the service worker never caches this path.
