# 0011. Versioned contracts; the snapshot is a hash-checked, manifest-named file

Status: Accepted

## Context

The client, the finance pipeline and the collectors evolve separately, and the client on a phone may be older than the data it reads. A changed meaning is more dangerous than a missing field: a client that reads `likely_left` under its old meaning shows a confident wrong headline. Builds can also fail half-way, leaving a mix of old and new files, and a published file can be damaged in transit or on disk.

## Decision

Every boundary has a written, versioned contract, and changes are additive or get a new version.

- **Add v2, never break v1 in place.** Adding an optional, nullable field is allowed within a version; consumers ignore unknown fields, and the build validates strictly. Removing, renaming or changing a meaning means a new version, published beside the old one until clients have moved. `snapshot-v2` is published beside `snapshot-v1`, whose bytes do not change; v2 drops v1's old fields so nothing can read the old meaning by accident.
- **What real data cannot supply is null**, with a path and plain reason in an `absent` list. The client shows the reason, never a zero.
- **The manifest names the snapshot.** Files are content-addressed (`snapshot-v2.<hash>.json`), written first, and the manifest is written last. The client reads the manifest, fetches the file it names, checks its SHA-256, then validates it. A mismatch is shown as damaged data, not rendered.
- **A failed build never overwrites the last good one.** `status.json` is advisory and says why: blocked keeps the last good numbers with a one-line reason; a warning shows new numbers with a note. Blocks are only for what cannot be true.
- Build time lives only in the manifest, so a rebuild from the same inputs is byte-identical.

## Consequences

A client always sees one whole build, old clients keep working, and damage is detected rather than displayed. The costs are duplication (two snapshot versions published for a while, two validators kept in agreement by a shared case table) and stale-but-honest screens when a gate blocks. A false block makes the whole app stale over one check, which is why most checks only warn.

Rejected: a live read API (more moving parts, no read benefit for daily data); editing v1 in place; trusting files without a hash.
