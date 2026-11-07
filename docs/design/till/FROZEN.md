# Till: frozen

**Date: 2026-11-03.** All figures are invented. Open `index.html` to flip through the screens; everything works from this folder with relative paths, and nothing loads from outside it.

## What is frozen

- Till, the design for Reclaim: Today (four states), Spend, Name payees, Bills (three states), Invest, Reports, the flatmates report, Plan, desktop, data states, light and dark.
- `SPEC.md`, `plan2/SPEC.md` and `plan/SPEC.md` (the storage, forecast and simulation sections `plan2/SPEC.md` refers to). Build from these. `DEBATE.md` and `review/` are the reasoning.
- `mocks/assets/tokens.css` and `till.css`, the one source of values.
- `icons/`: glyphs, the mapping and a React export. `ICONS.md` has the licences. The rule is in `SPEC.md` section 8.

**Not part of the freeze:** `mocks/alt-letter.html`, `mocks/alt-sheet.html`, and the Plan runner-ups `plan2/mocks/alt-*`. They are rejected options, kept for reference only.

## Owner's decisions of 3 November

Asap and the Line's caption stay. The marker is on the amount left, on Today's hero and Line, with the ± outside it, never near red. The visible SMS tag is gone, and "83% of November is on a bank statement" and "See what is not confirmed" label provisional money. Icons run throughout. Soft cushion dashed and hard solid on both Today and Plan. Page titles at 32. Indigo for investing. No marker on Bills under a cushion. Every open type item is marked decided in `review/TYPE-REVIEW.md`.

## Owner's decisions of 6 November

**No red for Could (D1).** A month or a hero whose middle is above the soft cushion, with only the low end of its range under the hard cushion, is a possibility, not a problem. It reads in ink and words, on Today, Plan and everywhere `step` is read: no pale red chip, no red diamond on the year chart, no red caption mark. The words say how likely and how far: Plan's opening reads "March could dip, but likely won't", then "A costly month could take it ₹Xk under your hard cushion", X being the hard cushion less the range's low end. Red stays for Dips and Sell, where the middle itself is under a cushion. The pale red zone under the soft cushion on the chart is a background, not a status, and stays. The marker now falls on a Could hero, as on any ink figure. The rule is `step` in `app/src/lib/status.ts`.

**Fewer Estimate chips (G5).** The chip tells figures apart only if most do not carry it. One rule, `doubtWord` in `app/src/lib/data.ts`, read by `DoubtTag` and `DoubtNote`:
- Firm: no chip. Low confidence and Not sure: always.
- Estimate (a source behind the figure is late, gone or set aside): only when the figure itself is really uncertain, that is, under half its rupees are on a statement (cash: statement balance against what came by message since; owed: the same over every card; spend and Likely left: this month's items; investments: holdings not estimated), or its range is wide, a half-range over half the soft cushion. A figure a statement mostly proves, with a narrow or no range, carries none.
- A Likely card bill row not on a statement carries the chip only when its range is wide by the same test; "Due about" and the section's sentence already say it is an estimate.
- Where the chip stays, its reason waits one tap away under Why. Investments' own `Est` tag per holding, and a fixed chip on Today's after-salary row, are outside this rule.

## Choices made while the owner slept

- Marker on an earned-green hero: the figure turns ink on the marker. Its ± and chip stay green and carry the state.
- Marker in the Line's row: on the amount, with the ± outside, the same as the hero.
- "SMS" as a tag is gone, and so is the word where it stood in for the tag: "Less payments since then". The word stays only in empty-state copy ("your first statement or SMS").
- Lucide and Simple Icons. Nothing hand-drawn.
- Amazon has no glyph in Simple Icons. Zomato, Paytm, Uber, KFC, IKEA, Zara and Google Pay are wordmarks unreadable at 22 px. All fall back to their category. See `ICONS.md`.
- In the Bills mock, "Phone" became Airtel and "Streaming" became Netflix, invented, so more than one brand glyph can be seen.
- Icons stay off tabs, status marks, chores, calendar, month tiles, portfolio map and the "See as list" group tables.
- `merchant_id` cannot identify a brand and `snapshot-v1` has no `category`. Brands match on `name`, categories on `group`. See `SPEC.md` section 8.
- `plan/SPEC.md` is included because `plan2/SPEC.md` depends on it. The rest of `plan/` is history, left out, and its flow mock is off the flip-through.
- Plan runner-ups stay out of the freeze and got no icons.

## Checks on the final files

- **Audits** (`work/freeze-final/audit.py`): overflow, contrast, tap targets, clipped text, label overlap, type sizes, pale text, script errors. All screens and states at 360, 390, 430 and 1280, light and dark, including Plan. Zero failures in every check. `alt-letter` and `alt-sheet` are skipped as out of scope. The overlap check compares text with text, so icons against text were checked by eye on screenshots.
- **Network:** 2,096 requests in the last run, all to `127.0.0.1:5173`, none failed. No remote URL in any mock's source.
- **Marker** (`checks.py`): none near red, at most one per section, lowest contrast 14.33 light, 11.84 dark.
- **Icons** (`iconcheck.py`): no status colour on any icon, all decorative. `iconFor` has 10 passing tests. The React export type-checks under the app's compiler settings. It has not been run inside the app.
- **Private data** (`privcheck.py`): no owner names, personal handles, phone numbers or card digits found in any file. Remaining word and number hits were reviewed by category with the value masked: a colour word, public businesses, ordinary words, and one round number used as a code threshold and an invented figure. Screenshots and fonts are binary and were not scanned; the screenshots show only pages that were.

Older paths in the specs and reviews under `work/` and `shots/` (the type candidates, earlier contrast output) point at scratch files that were not kept. `work/freeze-final/` holds only the final check scripts.

## Not verified

- A real phone or a real thumb.
- Real data. Every figure and every layout has only met invented numbers.
- Screen readers.
- Android font scaling.
- The ± back-test: whether the printed range holds about 8 times in 10.

Also unchecked: the 5% line on real money, and how real merchant names hit the brand table.

## This may reopen

The real-data analysis comes next and may reopen specific rules, not the design as a whole. Most likely: the ± format and its "8 in 10" sentence, the 5% deep-red line, the earned-green bar, the usual ladder's thresholds, the group labels (the mocks use friendly names that are not in `TOP_GROUPS`), and the keyword and brand tables. Change such a rule here, in the spec, and say why.
