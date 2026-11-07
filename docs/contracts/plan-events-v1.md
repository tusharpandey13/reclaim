# plan.events.v1

Saved big expenses and hand-entered figures: one append-only JSONL file under `RECLAIM_DATA_DIR`, separate from `corrections.jsonl`, so replaying corrections can never touch a plan. Passed to the build with `--plan-events`. Read by `finance/plan_store.py` into `snapshot-v2`'s `plan_inputs`. Never written to the ledger. Payloads are never logged.

```json
{"v":1,"eid":"e-9f2c","at":"2026-11-02T21:14:00+05:30","op":"create","id":"pln_0003","data":{"title":"Car down payment","amount":222222,"ym":"2027-08","by":null,"flex":"any","spread":1,"status":"planned","match_hint":null,"note":null}}
{"v":1,"eid":"e-9f30","at":"2026-11-03T08:00:00+05:30","op":"update","id":"pln_0003","base_rev":1,"set":{"ym":"2027-09"}}
{"v":1,"eid":"e-a112","at":"2026-11-03T09:00:00+05:30","op":"status","id":"pln_0003","to":"cancelled"}
{"v":1,"eid":"e-b220","at":"2026-11-03T10:00:00+05:30","op":"match","id":"pln_0003","txn":"st:abc:0","amount":225000,"ym":"2027-09","source":"statement","closes":true}
{"v":1,"eid":"e-b310","at":"2026-11-03T11:00:00+05:30","op":"unmatch","id":"pln_0003","txn":"st:abc:0"}
{"v":1,"eid":"e-c001","at":"2026-11-03T12:00:00+05:30","op":"set","set":{"soft":25000,"hard":10000,"invest":66666,"eq":80}}
```

| Field | Meaning |
|---|---|
| `eid` | Made by the client. A repeat is a retry and changes nothing |
| `at` | An instant with an offset. Events are applied oldest first, so line order cannot matter. One dated after the build's as-of is left out, so an earlier rebuild gives its earlier bytes |
| `id` | The plan. Never reused; a second `create` with the same id is ignored and counted |
| `amount` | Whole rupees. Paise appear only once it is in the snapshot |
| `ym` | First month. `spread` months, in equal parts, with any odd rupee on the earliest parts |
| `by` | Latest wanted month, or null |
| `flex` | `fixed`, `earlier` or `any` |
| `status` | `planned`, `paid` or `cancelled`. Undo is one more event |
| `base_rev` | The revision an edit was made from. A mismatch still wins, and sets `changed_elsewhere` |
| `txn`, `closes` | A statement payment matched to the plan, and whether it finishes it |

**Settings** (`op: set`, last write wins): `soft`, `hard`, `invest`, `essentials` in whole rupees; `eq` a whole percentage; `sell_vests` a boolean; `yearly_bills` a list of `{ym, name, amount}`. An unknown setting rejects the line.

**Derived, not stored:** overdue (planned, its last month has ended, not closed; it stays counted, rolled into the first month, so the forecast stays cautious) and remaining (amount less matched payments, never below zero).

**Damage:** a line that cannot be used, and a torn last line, are ignored and counted in `plan_inputs.store`; the numbers still publish. A writer must start a new line if the file does not end in one. A file that cannot be opened stops the build, as with corrections.

**Not here:** the write endpoint and its auth, and a GET for the fold. Both are the app's next need; see `snapshot-v2.md`.
