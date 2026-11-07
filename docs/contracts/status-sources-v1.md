# Status sources, v1

How old each source is, whether it is still being read, and which numbers lean on it. `finance/sources.py` builds it inside the pipeline and adds `sources` to `status.json`, published or held back. Shape: `status-sources-v1.schema.json`. `status-v1` is unchanged except for naming this optional field, and for optional additions listed below; consumers ignore what they do not want. Neither snapshot changes.

A build that stops before reading its sources (a bad owner file, an internal error) carries the last block unchanged: its `as_of` says how old it is.

Only dates, counts, basis points, masks and sender headers appear, never a payee, an amount, narration or message text. File names pass through `door.safe_name`: inert characters only, with any run of six or more digits masked.

## Fields

- `sources[]`: one row per source. `state` is one of:

| State | Means | Moves a number's confidence? |
|---|---|---|
| `ok` | Coming in | No |
| `late` | Past its normal cycle | Yes |
| `stale` | Past `stale_after_days` | Yes |
| `absent` | Expected, and nothing has come | Yes |
| `problem` | Coming in, but not being read: a sender below the parse floor, new wordings rising, or a changed collector shape | Yes |
| `not_connected` | No path to the box yet. Honest, not a fault. `connected` is false, and nothing warns | No |

`line` and `what_to_do` are plain words the app shows as they are. `last_at` is an instant where a source has one (SMS), so the app can say "2 hours ago"; otherwise `last_date`. `feeds` names what leans on it. `detail` on the SMS row holds rates over the last 30 days, per sender and per template, the senders under the floor, and new wordings against the 30 days before. A lifetime rate is deliberately not used: it hid one card at 35% under a 90% figure.

**Clarified 2026-11-06.** The `prices` row's `last_date` is the oldest price behind the investment total, and the `fx` row's is the rate that total used: the same dates as snapshot-v2's `invest.value_status.price_as_of` and `fx_as_of`, never one after the build's as-of. With nothing held, each is the newest on or before it. Before, both were the newest in the files, so a fund feed newer than the last stock export made Sources disagree with Invest and Today.

- `numbers`: `cash`, `due`, `likely_left`, `spend`, `invest`, each with `confidence` (`firm`, `estimate`, `low`, `unknown`), `because` (source ids) and a plain `line`. Bank SMS over 14 days old makes cash, Likely left and spend `low`. Today must show anything other than `firm`.
- `set_aside[]`: files refused at the door, or read only in part (`set_aside: false`), each with `file`, `code`, `reason` and `what_to_do`.
- `expected_absent[]`: ids of rows in state `absent`.
- `data_age`: oldest and newest date across messages and statements, and `sms_at`.

## Additions to status-v1, all optional

| Field | What |
|---|---|
| `attempt.generated_at` | When this attempt ran, by the caller's clock. If it is old, no build has run since: the app says so, which is how a build that never started reaches the owner |
| `sources` | This contract |
| `invariants` | `status-invariants-v1`, now written by the pipeline itself |

Gates in `status.json` only, so v1's bytes stay put: `scope_matches_nothing` (block), `input_set_aside`, `unknown_account`, `rules_missing`, `rule_too_broad`, `sms_shape`, `sms_wording_rise`, `amount_outlier`, `clock_ahead`, `clock_recovered` (warn). `owner_file_unreadable` (block) is the only gate of a build that could not load its config or rules.

## When a block is still right

A bad file holds nothing back by itself: it is set aside, named, and the rest publishes. These still hold the last good, and each reason names what to fix. Recovery is always the next build after the input is mended.

| Block | Why it cannot publish |
|---|---|
| `statement_damaged`, `statement_missing`, `balance_gap` | A set-aside or absent statement leaves a hole inside the running months, so cash cannot be proved across it. The owner can accept an exact hole in `accepted_gaps` |
| `balance_break` | A loaded statement's running balance does not add up |
| `bean_check`, `schema`, `sum_of_parts`, `provisional_overlap` | The ledger or the numbers contradict themselves |
| `regression` | A build earlier than the last good, far fewer rows, or a lost in-scope account |
| `owner_file_unreadable`, `scope_matches_nothing` | Without the config and rules, own transfers would post as spending |

An oldest or latest statement set aside leaves no hole: it publishes, and the figures it feeds read as estimates.

## Size caps

Per statement 5 MiB, all statements 32 MiB, config and rules 2 MiB each, other optional files 16 MiB. A statement row, balance or card total over ₹10 crore, a date before 2000 or over a year past the build's date, and a due date over a year from its statement are refused.
