# 0003. Choose, don't configure

Status: Accepted

## Context

The owner's standing complaint about finance tools is effort: getting to the information needed takes work, and novel controls have to be learned again after every absence. Forms and settings pages are the usual answer to "what range?", "which month?" or "what is this payee?", and each asks the reader to know the answer before seeing the consequence.

## Decision

The app picks sensible defaults and offers a few visible choices, each already showing its answer. It does not ask the owner to fill in forms or tune settings.

- **Ranges are picked for you.** Spend opens on the last 30 days, because the calendar month is empty on the 3rd. Bills and Spend have a small chooser (a stepper plus Month, 3 months or Year) rather than a date picker.
- **Picking a month for a big expense is 12 tiles**, each coloured and worded with what that month means, with the chart above so the consequence is in view while choosing. The earliest month that fits is chosen on arrival.
- **Naming a payee offers a guess with Yes or No** ("Likely: a person, so a transfer"), suggestions in thumb reach, Skip always available, and Undo instead of "are you sure".
- **Reports are prepared outputs** with Preview and Download, not a report builder.
- **What-ifs are separate try-out screens**, never a page-wide mode that can be forgotten.
- The few stored inputs are the two cushions and Plan's monthly invest amount. The theme choice is the only thing kept in the browser.

## Consequences

Most screens answer without a tap, and every choice is reversible on the same screen. The cost is less flexibility: someone wanting an arbitrary date range or a custom report cannot build one here. Defaults such as the 30-day window and the thresholds are reasoned, not tuned on real data, and may need moving.

Rejected: an "Ask" form as Plan's first screen (it says nothing when something is wrong and nobody asked); a horizon picker on a chart that can show the whole range; plan-level "can this move?" questions, since the tiles already show every month; a chat surface for money questions, because a wrong answer about money is expensive.
