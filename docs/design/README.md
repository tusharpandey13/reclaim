# Design

The frozen "Till" design the client is built from, with its reasoning. All figures in these files are invented.

- `till/FROZEN.md`: what is frozen and the owner's decisions since.
- `till/SPEC.md`, `till/plan2/SPEC.md`, `till/plan/SPEC.md`: the specs. Build from these.
- `till/DEBATE.md`, `till/plan2/DEBATE.md`, `till/plan2/COLD-READ.md`, `till/review/`: the reasoning and reviews behind them.
- `till/index.html`: flip through the static mocks (open the file; nothing loads from outside the folder).
- `till/icons/`: glyphs, mapping and licences (`till/ICONS.md`).

Paths such as `app/src/...` in these documents refer to `client/html/src/...` in this repository. Some documents mention backend files (`finance/...`) and audit scripts that are not published yet. The decisions are summarised as ADRs in [`../adr/`](../adr/).

Cushion figures here (soft ₹25k, hard ₹10k) are invented, like every other figure, and were set after the freeze; worked examples were adjusted to match, so a few mock totals may be off by a little.

Brand logos, described in `till/SPEC.md` section 8 and `till/FROZEN.md`, are not shipped in this repository: every payee gets its category's outline icon. See `till/ICONS.md`.
