# 0007. No red for "could"

Status: Accepted

## Context

One status rule governs cash against the owner's two cushions, a soft one to stay above and a hard one not to cross. For a forecast with median `m` and half-range `h`, the kinds are `sell` (median under hard), `dip` (median under soft), `could` (median fine, but the low end `m − h` under hard), `just` and `fits`. Originally `could` drew pale red, the same as `dip`.

A replay of the rule on the owner's real history, many days across the last twelve months judged against how each month came out, showed that `could` and `dip` days never went under a cushion, and most red days overall were false alarms. A colour that fires when nothing happens trains the reader to ignore red, and red has to keep meaning money trouble. Five options were weighed: keep it, draw `could` in ink and words, show `could` only late in the month when the range is narrow, use a narrower range for this one test, or keep red but say "unlikely".

## Decision

`could` draws no red, anywhere `step` is read: Today, Plan and the year chart. It reads in ink and words that say how likely and how far, such as "March could dip, but likely won't". Red stays for `dip` and `sell`, where the median itself is under a cushion, and deepens with the amount that would have to be sold. When the range is too wide to judge, `could` is not told at all.

The same principle runs through the palette. Past money never turns red. Spending money is never red by itself; it takes a comparison with the owner's own baseline. Unnamed payees are a chore, shown amber, not danger. Market events on the Invest year are neutral ink, since a market fall is not a judgement on the owner's money. The pale red zone under the soft cushion on charts stays, as a background, not a status.

## Consequences

Red becomes rare and therefore readable. The cost is that a genuine risk visible only in the low end of the range is now quieter, carried by words alone. That was judged acceptable because, in the replay, no such day went under. The rule lives in one place in code, so it can move if real data argues otherwise.

Rejected: options (a), (c), (d) and (e) above; (b) was the smallest change and cost nothing on the evidence.
