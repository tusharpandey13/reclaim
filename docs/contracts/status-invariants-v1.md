# Status invariants, v1

Checks that compare the ledger with what must be true in the world, on real data, in every build. `finance/invariants.py` holds them; the pipeline runs them in every build and adds `invariants` to `status.json`. Shape: `status-invariants-v1.schema.json`. `status-v1` itself is unchanged except for naming this optional field; consumers ignore it until they want it.

They hold nothing back and cannot fail a build. A crash gives `state: failed` with a type name. Only counts, basis points, and masks or sender headers appear, never a name, an amount or a date. The block in `status.json` lasts until the next build, which rewrites the file; the checks then add it again.

| Check | Fires when | `count` | Today | Proposed |
|---|---|---|---|---|
| `open_bill_bank_debit` | A bill reads as open, and an unpaired bank debit on or after its statement equals what is due, the full bill or the card's running balance. A debit a rule called an expense does not count | Bills | warn | warn |
| `card_ledger_vs_statement` | A card's ledger balance differs from its latest statement's closing | Cards | warn | block: see below |
| `clearing_stranded` | A line in Unmatched, Internal or CardPayments has no equal and opposite partner after 10 days | Lines | warn | warn |
| `fall_through_share` | Over 15% of the running 6 months' rupees sit in the floors, Income:Unclassified or Unmatched | 0 or 1, with `bp` | warn | warn |
| `salary_missing` | A whole month since statements began has no salary. A salary that slipped over a month end does not count | Months | warn | warn |
| `provisional_share` | An SMS row is over 45 days old, or over 30% of the running months' own-account rupees rest on SMS | 0 or 1, with `bp` | warn | warn |
| `payment_rows_vs_statement` | A statement prints different payments from the rows read as payments | Statements | warn | warn |
| `card_sms_completeness` | Under 90% of a card's statement debits, of at least 5, had an SMS in the running months, so its tail reads low | Cards, with the lowest `bp` | warn | warn |
| `sender_drift` | Over the last 60 days, most of a bank sender's SMS, of at least 3, could not be read | Senders | warn | warn |
| `unknown_money_sender` | An SMS with an amount and a money verb came in the last 60 days from a header no template knows | Messages | warn | warn |
| `active_out_of_scope` | A bank or card outside `accounts_in_scope` moved money in the last 90 days | Accounts | warn | warn |

Thresholds are guesses until they have met real data.

**To run:** nothing to do: the pipeline writes the block, so the box's unit needs no line. `python3 finance/invariants.py --db … --publish … --as-of …` still re-runs them by hand.

This report stays warn-only. Since 2026-11-03 the same comparison is also a blocking gate, `card_ledger_vs_statement` in `status.json` `gates`, for in-scope cards not listed in `allowed_balance_breaks`. Its two real differences were rows a statement prints though dated before it opens, right after a break in the chain; both now count.
