# 0001. Bank statements are the only source of cash truth

Status: Accepted

## Context

Reclaim sees the same money several times. A bank sends a message when a payment happens, a mail or receipt may describe what was bought, and weeks later a statement lists the payment again with a balance beside it. If each of these could post money, one payment would be counted twice, and "Have in bank" would drift away from the number the bank prints. That figure is the one number that must equal the bank, so trust in the whole app rests on it.

Early tests showed the cost of getting this wrong. A card bill was treated as paid only when a card-side credit appeared, so bills the bank had already paid stayed on screen as due.

## Decision

Only bank and card statements create cash postings. Everything else is metadata or provisional.

- A payment seen only in a bank message is provisional. It shows in totals with its trust stated, and is replaced by the statement row when that arrives. A payment is never posted from both.
- No non-statement source may move an amount inside a period a statement covers.
- Receipts and order mail can add what was bought (`purchased`), and corrections can rename a payee or change its group. Neither can change an amount, a date or a funding account.
- A card statement that does not add up writes no rows at all.
- Plans and what-ifs move only labelled projections, never the ledger. Only a statement closes a plan.

The client labels provisional money in words ("Most of this month is on a bank statement", "See what is not confirmed"), not with a tag on every figure.

## Consequences

Cash is provable and rebuilds are byte-identical from raw inputs. The cost is lag and gaps. Money in a bank with no statement is not counted as cash, which can understate "Have in bank" until the owner supplies one; this is a known open fault, kept because counting such accounts carelessly would add stale message-only balances to the one figure that must match the bank. A missing statement in the running months blocks a build rather than guessing across the hole.

Rejected: letting messages post and reconciling later (double counts, and a wrong headline costs trust that does not come back); a visible "SMS" tag on every figure (the owner found it noise, so provenance moved one tap away).
