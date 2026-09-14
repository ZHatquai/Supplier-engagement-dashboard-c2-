# Test data — Supplier Review Dashboard (Tool B)

32 seeded rows across 25 companies, built to exercise every view, status path,
and edge case in `docs/product-spec.md`. Company names are reused from the
builder's Wave 1 list; every contact identity is fabricated and every email
uses the reserved `.example` TLD, so nothing here can reach a real inbox.

## Files

| File | What it does |
|------|--------------|
| `seed-test-submissions.sql` | Deletes any previous run of the seed, inserts the 32 rows, then prints four verification queries |
| `teardown-test-submissions.sql` | Removes every seeded row and nothing else |

## How to run it

Run as `service_role`, through the Supabase MCP or the SQL editor. `execute_sql`,
not `apply_migration`: this is data, not schema, and it must not enter the
migration history.

Tool B holds no insert grant and must never gain one. Seeding is a builder
action against the shared project, not a dashboard capability.

**Before the first run**, check that none of the 25 company names already exists
as real data, because the seed opens with a delete on exactly those names:

```sql
select company_name, count(*) from public.submissions
where company_name in ('Quantum Dynamics S.A. de C.V.', 'Electro Plastics S.A.')
group by company_name;
```

Extend that list from the seed file's own delete block if you want the full check.

## Why direct inserts rather than `submit_submission`

`submit_submission` computes status at submit time and stamps `created_at` with
`now()`, so calling it 32 times would produce 32 rows all dated today and a
status mix you cannot fully control. The dashboard needs a date spread and a
known distribution across `active`, `needs_review`, and `superseded`.

Every seeded status is still one `submit_submission` would have produced. The
Branch column below names which one. Tool A's own logic was already verified
against this database on 14 September 2026 and is not what this data is testing.

### Optional live path

If you also want to watch Tool A's logic run, submit two or three rows through
the live portal after seeding, using a company name that is already in the seed
with an `active` row. Same route produces a paired `needs_review`; a later
EcoVadis submission supersedes the questionnaire row. Read
`pg_get_function_arguments` first if you want to call the function directly:

```sql
select p.proname, pg_get_function_arguments(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'submit_submission';
```

## What the seed produces

| | Count |
|---|---|
| Total rows | 32 |
| `active` | 22 (12 questionnaire, 10 EcoVadis) |
| `needs_review` | 6 |
| `superseded` | 4 |
| Companies with more than one row | 6 |
| Rows on the flag board | 12 |
| Flag counts present | 0, 1, 2, 2, 2, 3, 3, 3, 4, 5, 6, 7 |

Overview totals should read 22 active, with the route pie at 12 to 10 and the
two counters at 6 and 4, each opening the register filtered to that status.

## Scenario map

| # | Company | Route | Status | Branch it came from | What it tests |
|---|---------|-------|--------|---------------------|---------------|
| 1 | Quantum Dynamics S.A. de C.V. | questionnaire | `active` | No active row -> active | Flag board shows 0; register shows active/questionnaire |
| 2 | Electro Plastics S.A. | questionnaire | `active` | No active row -> active | Flag board shows 1; register shows active/questionnaire |
| 3 | Vertex Chemicals PT | questionnaire | `active` | No active row -> active | Flag board shows 2; register shows active/questionnaire |
| 4 | Prime Precision Pvt. Ltd. | questionnaire | `active` | No active row -> active | Flag board shows 3; register shows active/questionnaire |
| 5 | Prime Materials S.A. de C.V. | questionnaire | `active` | No active row -> active | Flag board shows 4; register shows active/questionnaire |
| 6 | Advanced Logistics Co. Ltd. | questionnaire | `active` | No active row -> active | Flag board shows 5; register shows active/questionnaire |
| 7 | Omni Materials Co. Ltd. | questionnaire | `active` | No active row -> active | Flag board shows 6; register shows active/questionnaire |
| 8 | Nova Logistics PT | questionnaire | `active` | No active row -> active | Flag board shows 7; register shows active/questionnaire |
| 9 | Global Materials Pvt. Ltd. | questionnaire | `active` | No active row -> active | 2 flags; s4_stress shows as unanswered on detail |
| 10 | Electro Chemicals Co. Ltd. | questionnaire | `active` | No active row -> active | 3 flags; s6_protected_area shown as given, raises nothing |
| 11 | Prime Chemicals Sdn. Bhd. | questionnaire | `active` | No active row -> active | 3 flags (' yes ', 'NO', ' no' all match after trim and lowercase) |
| 12 | Core Logistics Co. Ltd. | questionnaire | `active` | No active row -> active | 2 flags; s7_conflict_minerals shows as unanswered, never as a No |
| 13 | Electro Precision S.A. | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 14 | Nova Power PT | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 15 | Global Power Pvt. Ltd. | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 16 | Vertex Materials S.A. de C.V. | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 17 | Strata Power Co. Ltd. | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 18 | Electro Plastics Sdn. Bhd. | ecovadis | `active` | No active row -> active | Reads 'not assessable via questionnaire'; sorts to the end of the flag board |
| 19 | Alpha Components Co. Ltd. | questionnaire | `needs_review` | Active row, same route -> both needs_review | Paired needs_review; Review Page shows both, one note each |
| 20 | Alpha Components Co. Ltd. | questionnaire | `needs_review` | Active row, same route -> both needs_review | Paired needs_review; off the flag board while under review |
| 21 | Pinnacle Chemicals Sdn. Bhd. | ecovadis | `needs_review` | Active row, same route -> both needs_review | Paired needs_review with no flags to show |
| 22 | Pinnacle Chemicals Sdn. Bhd. | ecovadis | `needs_review` | Active row, same route -> both needs_review | Paired needs_review with no flags to show |
| 23 | Global Precision Co. Ltd. | questionnaire | `superseded` | Active questionnaire row, new EcoVadis -> superseded | Superseded counter; valid target for the flag action |
| 24 | Global Precision Co. Ltd. | ecovadis | `active` | No active row -> active | Active; same-company history shows both |
| 25 | Prime Logistics S.A. | ecovadis | `active` | No active row -> active | Stays active |
| 26 | Prime Logistics S.A. | questionnaire | `superseded` | Active EcoVadis row, new questionnaire -> superseded | Superseded; off the flag board despite being a questionnaire row |
| 27 | Electro Components Co. Ltd. | questionnaire | `needs_review` | Reviewer flag on an active row -> needs_review | Confirm returns blocked with the EcoVadis row's id and writes nothing |
| 28 | Electro Components Co. Ltd. | ecovadis | `active` | No active row -> active | send_company_to_review moves both to needs_review with no note |
| 29 | Nexus Chemicals GmbH | questionnaire | `needs_review` | Reviewer flag on an active row -> needs_review | Confirm succeeds and writes active; decline would write superseded |
| 30 | Alpha Materials S.A. de C.V. | questionnaire | `superseded` | Active questionnaire row, new EcoVadis -> superseded | Oldest of three on the detail page history |
| 31 | Alpha Materials S.A. de C.V. | ecovadis | `active` | No active row -> active | The only active row for this company |
| 32 | Alpha Materials S.A. de C.V. | questionnaire | `superseded` | Active questionnaire row, new EcoVadis -> superseded | Newest of three; superseded on arrival |

## The five scenarios worth walking by hand

1. **Blocked confirm.** Electro Components Co. Ltd. holds one `needs_review`
   questionnaire row and one `active` EcoVadis row. Confirming the first must
   return `blocked` with the second row's id and write nothing. Accepting the
   prompt runs `send_company_to_review`, moving both to `needs_review` with no
   note. The paired resolution that follows needs one note per row.
2. **Paired review.** Alpha Components Co. Ltd. (questionnaire) and Pinnacle
   Chemicals Sdn. Bhd. (EcoVadis) each hold two `needs_review` rows from a
   same-route duplicate. The Review Page must show both rows of each pair and
   refuse to save without a note on each.
3. **Clean single review.** Nexus Chemicals GmbH holds one `needs_review` row
   and no other row. Confirm should succeed and write `active`. It already
   carries a resolution trail from the flag decision, so the detail page has
   something to render before you take any action.
4. **Flag on a superseded row.** Global Precision Co. Ltd.'s questionnaire row
   is `superseded` and is a valid target for `flag`. A second `flag` on the
   resulting `needs_review` row must be refused.
5. **Company history.** Alpha Materials S.A. de C.V. holds three rows, one
   `active` and two `superseded`, for the same-company history block.

## Flag edge cases baked in

| Company | What is odd about it | Correct behaviour |
|---------|---------------------|-------------------|
| Global Materials Pvt. Ltd. | `s4_stress` is an empty string | No flag; shows as unanswered on the detail page |
| Electro Chemicals Co. Ltd. | `s6_protected_area` is `Maybe` | No flag; shown as given, never coerced to No |
| Prime Chemicals Sdn. Bhd. | `" yes "`, `"NO"`, `" no"`, `"No "` | Matching trims and lowercases, so this raises 3 |
| Core Logistics Co. Ltd. | `s7_conflict_minerals` key absent | No flag; unanswered, never counted as a No |

None of these raises a flag, which is the point. A flag invented from silence
would misstate what the supplier told us.

The ten EcoVadis rows must read "not assessable via questionnaire" and sort to
the end of the flag board in both sort directions. Never a zero, never an empty
indicator set.

## Two caveats

**The 19 non-flag answer values are display filler.** The seven flag-bearing
keys carry exact values and are the ones the build depends on. The other 19 hold
plausible text so the detail page has something to render by section. If a live
row shows a different value shape on any of them, for example `s2_scope2`
holding the Scope 2 verification dropdown rather than a figure, adjust the
filler. Nothing in Tool B parses these, so a mismatch costs display realism and
nothing else.

**Contact data is fabricated but it is still personal-shaped data.** It sits in
the same table, under the same RLS, and lands in the CSV export like any other
row. Run the teardown before the three colleagues start using the tool for real,
so the register they see holds only real suppliers.
