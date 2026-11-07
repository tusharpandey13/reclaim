# 0002. "Likely left before salary" is the headline question

Status: Accepted

## Context

The owner opens the app with about ten seconds and one question, near daily, often one-handed: am I fine until salary? The current bank balance misleads, because it is high before rent and card bills have gone. "Cash left at month end" is also wrong when salary lands on or near the last day: measured on the 30th, it either counts a salary that has not arrived or hides that the account dips the day before.

Concepts weighed for the home screen included a single safe-to-spend score (rejected: an opaque composite and a point forecast, where this owner needs to see the sum), a feed of what changed (rejected: most days nothing changes, and it cannot say where you stand), a generated letter, and a month calendar. The winner was one vertical column of time with the answer at the top.

## Decision

Today's hero is the expected bank balance at the close of the day before the next salary is due, with that date printed. It is cash, less bills due by that date, less the usual everyday spending for those days. Salary is never in it. If salary is more than a week late, or there is no regular salary, the date falls back to the month's last day and the reason is stated.

- It is a range, never a bare point. The range comes from walking the same forecast forward over past months and measuring how far it missed.
- Too little history gives a sentence, not a number. A range wider than two soft cushions reads "too early to tell".
- Moves to investing are not spending and are not predicted; how often they happened is printed beside the figure.
- The home skeleton never reorders. The range narrows by itself through the month; one chores slot appears near month end.

## Consequences

The headline answers the real decision (relax, or hold back this week) and stays honest about uncertainty. The range has been measured landing about 6 times in 10 rather than the 8 in 10 the rule aims for, so the app says it is still being tested. A confident wrong range is worse than no number: if real months keep falling outside it, the headline must widen or lose prominence.

The older month-end figure (`forecast.likely_left`) is still published, so a client that reads it keeps working.
