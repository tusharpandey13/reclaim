# Architecture Decision Records

Decisions behind the Reclaim web client, with the reasoning and what was rejected. Each record is short and stands alone. To change a decision, add a new record that supersedes the old one, and mark the old one's status.

| # | Decision | In one line |
|---|---|---|
| [0001](0001-bank-statements-are-the-only-cash-truth.md) | Bank statements are the only source of cash truth | Only statements post cash; messages are provisional, receipts and corrections are metadata that never change an amount. |
| [0002](0002-likely-left-before-salary-is-the-headline.md) | "Likely left before salary" is the headline question | Today answers the expected balance the day before the next salary, as a range, with a sentence instead of a number when history is short. |
| [0003](0003-choose-dont-configure.md) | Choose, don't configure | Sensible defaults and a few visible choices that already show their answer, instead of forms, settings and builders. |
| [0004](0004-tight-layout.md) | Tight layout | One fact per line; legends, captions and method notes sit behind an (i). |
| [0005](0005-status-chips-for-variance-not-colour.md) | Status chips for variance, not colour | Variance is a word in a chip; fill colour means group identity only. |
| [0006](0006-per-group-normalised-scales.md) | Per-group normalised scales | Each group is drawn against its own usual band; only groups off their usual are shown. |
| [0007](0007-no-red-for-could.md) | No red for "could" | Red only when the median itself is under a cushion; a possible dip reads in ink and words. |
| [0008](0008-tailnet-only-no-cloud-no-third-party-loads.md) | Tailnet only, no cloud, no third-party loads | Data stays on the owner's box; no aggregator or enrichment API, and a strict CSP blocks every remote load. |
| [0009](0009-invented-data-demo-and-tests.md) | Invented-data demo and tests | All figures here are invented; tests reproduce real behaviour's shapes with hand-worked expected values. |
| [0010](0010-hash-routes-relative-paths.md) | Hash routes and relative paths | The same build runs under any URL prefix with no server rule, and URLs never carry names or amounts. |
| [0011](0011-versioned-contracts-and-hash-checked-snapshot.md) | Versioned contracts, hash-checked snapshot | Add v2, never break v1; the client reads the snapshot the manifest names and checks its hash. |

The backend these records refer to (ingest server, finance pipeline, Android collector) is in development and not part of this repository.
