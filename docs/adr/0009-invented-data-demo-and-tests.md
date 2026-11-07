# 0009. Invented-data demo and tests, shaped by real behaviour

Status: Accepted

## Context

The client has to be reviewed, demonstrated and tested by people and tools that must never see the owner's money. At the same time, a design that has only met tidy invented numbers fails on real ones. An audit found that a full suite of about 300 passing tests could all pass with a wrong number on screen: tests injected finished snapshots, fixtures were tidy (both sides of every card payment on the same day, only one card ever paid), and no test stated what the output should be from what happened in the world. The one live bug lived in none of the things tested.

## Decision

Every figure in this repository is invented. Tests are built from how real money behaves, rendered in invented form.

- **The demo runs on a generated invented world**, shipped as a published snapshot with its manifest. Merchants, tickers and funds are made up, and copy says so where it matters ("example market events, not your data").
- **Fixtures are generated, never hand-copied from real output**, and data states (fresh, stale, blocked, empty, damaged) each get their own fixture.
- **Real shapes, invented values.** Where real data showed something the design had not met (long all-caps payee names, a third of lines unnamed, a wide range, late and partial card payments, resends, salary drift) the shape is reproduced with invented values and pinned by a test.
- **Expected values are worked by hand** from what happened in the invented world, not copied from what the code printed. A known failure is marked by id and fails loudly the moment it starts passing; an expected value is never changed to make a test pass.
- Before release, files are scanned for names, handles, phone numbers and card digits.

## Consequences

The repository can be public, and tests catch wrong numbers rather than only wrong rendering. The cost is that nothing here proves the numbers are true of a real month: the range's hit rate, the thresholds and the brand table have been checked only on the owner's own data, privately, and real-phone font scaling and screen readers are not verified. The fixture generator and the specs that build snapshots from raw inputs depend on the backend pipeline, which this repository does not ship: here there is one demo snapshot, the unit tests, and an end-to-end smoke suite over every page.

Rejected: anonymising real data (re-identification risk, and one slip is permanent); pinning literals copied from output (they prove only that the code agrees with itself).
