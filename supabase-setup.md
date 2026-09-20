# Supabase Setup — "The corporate live build (New)"

> Schema source of truth for **both** tools sharing this project. Update this file at every save
> point that touches the database (CLAUDE.md, Supabase section), and copy it back into Tool A's repo
> so the two tools do not drift.

**Last updated:** 14 September 2026 — Tool B session 1, Supplier Review Dashboard v1.0 build.

## Project

| Detail | Value |
|--------|-------|
| Project name | The corporate live build (New) |
| Project ID / ref | Not recorded here — see the Supabase dashboard |
| Project URL | Not recorded here — held only in the Netlify environment variables |
| Region | eu-central-1 (Frankfurt) — GDPR |
| Plan | Pro |
| Postgres | 17 |
| Created | 7 September 2026, by the builder in the Supabase dashboard |

## Tools sharing this project

| Tool | Role | Repo | Reaches the database via |
|------|------|------|--------------------------|
| A — Supplier Sustainability Portal 2026 (v3.0) | Public supplier-facing submission portal. Owns the schema. Creates every row. | Portal repo | Server-side Netlify Function, service role key |
| B — Supplier Review Dashboard 2026 (v1.0) | Internal login-protected review dashboard. Reads every row, writes status and the resolution trail only. | Dashboard repo | Browser-direct, publishable (anon) key + Supabase Auth + RLS |

**Division of ownership — a hard rule.** Tool A inserts rows and computes status at submit time.
Tool B never inserts and never deletes, and changes status only through its two functions below.
Tool A never touches the three resolution columns.

## Access model

Two different patterns, deliberately.

| Env var | Where it is set | Used by |
|---------|-----------------|---------|
| `SUPABASE_URL` | Netlify (Tool A) | Tool A's submission function only |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify (Tool A) | Tool A's submission function only |
| `VITE_SUPABASE_URL` | Netlify (Tool B) | Tool B's browser bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Netlify (Tool B) | Tool B's browser bundle |
| `SECRETS_SCAN_OMIT_KEYS` | Netlify (Tool B) | Netlify's secrets scanner, which otherwise fails the build on the two `VITE_` values |

Tool B's two values are `VITE_`-prefixed and therefore reach the browser. That is correct: the
publishable key opens nothing on its own, because `anon` holds zero policies and zero grants. The
service role key is **not used by Tool B and must never be added to it** — not to the code, not to
its Netlify environment, not to `.env.local`.

**Neither the project URL nor the project ref may appear in any committed file, in either repo, or
in any commit message.** Refer to the project by name.

## Table — `submissions`

One row per completed submission, either route.

| Column | Type | Null | Written by | Notes |
|--------|------|------|-----------|-------|
| `id` | uuid | no | Tool A | primary key, `gen_random_uuid()` |
| `company_name` | text | no | Tool A | non-blank; duplicate matching key |
| `contact_name` | text | no | Tool A | non-blank |
| `contact_email` | text | no | Tool A | non-blank; format validated in the function |
| `contact_phone` | text | no | Tool A | non-blank; no format validation, by design |
| `job_title` | text | no | Tool A | non-blank |
| `department` | text | no | Tool A | non-blank, free text |
| `route` | `submission_route` | no | Tool A | enum: `ecovadis` \| `questionnaire` |
| `ecovadis_link` | text | yes | Tool A | required on the EcoVadis route, null on the Questionnaire route |
| `questionnaire_answers` | jsonb | yes | Tool A | required on the Questionnaire route, null on the EcoVadis route |
| `status` | `submission_status` | no | Tool A at submit, Tool B at review | enum: `active` \| `superseded` \| `needs_review` |
| `created_at` | timestamptz | no | Tool A | `now()` |
| `resolved_by` | text | **yes** | Tool B | Added 14 September 2026. Email of the reviewer who took the last decision, read from `auth.jwt()` inside the function. The client never supplies it. |
| `resolved_at` | timestamptz | **yes** | Tool B | Added 14 September 2026. |
| `resolution_note` | text | **yes** | Tool B | Added 14 September 2026. Write-once per decision; the next decision on that row overwrites all three columns together. |

**The three resolution columns are nullable, with no default, no `NOT NULL`, and no check
constraint — deliberately.** Tool A's `submit_submission` inserts a fixed column list. Anything
stricter on these three would break that insert and force a change to Tool A. Verified after the
change: a real submission through `submit_submission` still writes on both routes.

Constraint `submissions_route_payload_check` enforces the route/payload pairing: an `ecovadis` row
carries a link and no answers; a `questionnaire` row carries answers and no link. Six non-blank
check constraints cover the text identity fields. None was altered by Tool B's build.

Indexes: `lower(btrim(company_name))` (duplicate matching), `status`, `created_at desc`. Unchanged —
the first two are exactly what the dashboard's grouping and filtering need, so no index was added.

### `questionnaire_answers` keys

26 keys, all matching `^s[2-7]_`, defined by Tool A's `src/lib/questionnaireSchema.js`. Read from a
live row on 14 September 2026. Tool B maps them to the workbook sections for display and reads seven
of them for its risk flags.

| Section | Keys |
|---------|------|
| S2 Climate and Decarbonisation | `s2_scope1`, `s2_scope2`, `s2_scope3`, `s2_sbti`, `s2_projects`, `s2_barriers` |
| S3 Pollution and PFAS | `s3_pfas`, `s3_pfas_roadmap`, `s3_substances`, `s3_wastewater` |
| S4 Water and Marine Resources | `s4_withdrawal`, `s4_stress`, `s4_recycling`, `s4_contingency` |
| S5 Circular Economy and Waste | `s5_waste`, `s5_pcr`, `s5_circularity`, `s5_zero_waste` |
| S6 Biodiversity and Ecosystems | `s6_assessment`, `s6_protected_area`, `s6_initiatives` |
| S7 Social, Labour and Governance | `s7_human_rights_policy`, `s7_due_diligence`, `s7_code_of_conduct`, `s7_grievance`, `s7_conflict_minerals` |

The seven Yes/No flag-bearing keys, and the answer that raises each flag:

| Key | Flag raised when |
|-----|------------------|
| `s2_sbti` | `No` |
| `s3_pfas` | `Yes` |
| `s4_stress` | `Yes` |
| `s6_protected_area` | `Yes` |
| `s7_human_rights_policy` | `No` |
| `s7_due_diligence` | `No` |
| `s7_conflict_minerals` | `No` |

Flags are computed in the browser at render time and are never stored in the database.

## Auth

Supabase Auth, **email and password only**, invite-only. The three reviewer accounts are created by
the builder in the dashboard (Authentication → Users) and public signup is disabled there. Tool B
carries no signup UI, no password-reset self-service, and no account-creation path. Accounts live in
`auth.users`, managed by Supabase. One permission set — every signed-in user holds identical access.

## RLS

RLS is **enabled and forced** on `submissions`.

| Table | Role | Read | Insert | Update | Delete |
|-------|------|------|--------|--------|--------|
| submissions | anon | no | no | no | no |
| submissions | authenticated | **yes — all rows** | no | no | no |
| submissions | service_role | yes | yes | yes | yes |

- `anon` — **zero policies and zero grants, unchanged from Tool A's build.** Tool A's public portal
  depends on this lock. Never add a policy for `anon`, never re-grant anything to `anon`, and never
  disable or unforce RLS on this table.
- `authenticated` — one policy, `authenticated_read_all_submissions` (`SELECT`, `using (true)`),
  plus a re-issued `SELECT` grant. The grant matters: grants were revoked from both roles in Tool A's
  build, so a policy alone would do nothing. No insert, update, or delete grant exists, so status and
  the resolution trail can only change through the two functions below.
- `service_role` — unchanged, bypasses RLS, used by Tool A's submission function.

Verified in-database on 14 September 2026 with `has_table_privilege` and `has_function_privilege`:
`anon` returns false for select, insert, update, and delete on the table and false for execute on all
four functions. `authenticated` returns true for select only, and false for insert, update, and
delete.

The Supabase security advisor reported `rls_enabled_no_policy` (INFO) on this table until the
`authenticated` select policy was added. It no longer does. Deny-all for `anon` remains the design.

## Functions

All four are `SECURITY DEFINER` with `search_path` pinned to `public, pg_temp`, and all four take
`pg_advisory_xact_lock(hashtextextended(lower(btrim(company_name)), 0))` before reading, so a
submission and a review decision for the same company serialise against each other rather than racing.

### Tool A — granted to `service_role` only

**`check_submission_duplicate(p_company_name text, p_route submission_route) → jsonb`**
Advisory only, used to show the "warn but allow" message before submitting. Returns
`{"duplicate": bool, "kind": "none" | "same_route" | "cross_route"}` by matching `company_name`
case-insensitively and whitespace-insensitively against rows with `status = 'active'`.

**`submit_submission(...) → submissions`**
The duplicate check, the status computation, any status update to existing rows, and the insert all
happen inside this one call.

| Situation | New row | Existing rows |
|-----------|---------|---------------|
| No active row | `active` | — |
| Active row, same route | `needs_review` | same-route active rows → `needs_review` |
| Active row, other route, new is `ecovadis` | `active` | questionnaire active rows → `superseded` |
| Active row, other route, new is `questionnaire` | `superseded` | unchanged (`ecovadis` stays `active`) |

### Tool B — granted to `authenticated` only

`EXECUTE` revoked from `public` and `anon` on both.

**`resolve_submission(p_id uuid, p_action text, p_note text) → jsonb`**

`p_action` is `confirm`, `decline`, or `flag`.

| Action | Valid starting status | Ending status |
|--------|----------------------|---------------|
| `confirm` | `needs_review` | `active` |
| `decline` | `needs_review` | `superseded` |
| `flag` | `active` or `superseded` | `needs_review` |

Enforced inside the function, not in the browser:
- A non-blank `p_note` is required for all three actions. Whitespace-only is rejected.
- An action against a row in the wrong status is rejected and nothing is written.
- **The blocked confirm.** On `confirm`, the function counts other rows for the same company with
  `status = 'active'`. If any exist the confirm is refused and **nothing is written**, returning
  `{"ok": false, "blocked": true, "conflicting_count": n, "conflicting_ids": [...], "conflicts": [{id, route, created_at}]}`.
  `flag` and `decline` never trigger the block.
- `resolved_by` is read from `auth.jwt() ->> 'email'`. The client cannot supply it or attribute a
  decision to someone else.

Returns `{"ok": true, "action": ..., "row": {...}}` on success, and
`{"ok": false, "error": "note_required" | "invalid_action" | "wrong_status" | "not_found" | "no_session", "message": ...}`
otherwise.

**`send_company_to_review(p_id uuid) → jsonb`**

The accept action on the blocked-confirm prompt. Takes the row the reviewer was trying to confirm
plus every other `active` row for that company and sets all of them to `needs_review`. Writes
`resolved_by` and `resolved_at` on every row it touches and **leaves `resolution_note` untouched** —
no note is required at this step; the note comes with the decision that follows. Returns
`{"ok": true, "company_key": ..., "affected_count": n, "affected_ids": [...]}`.

Refused with `no_conflict` if the company no longer holds a conflicting active row, and with
`wrong_status` if the target row is no longer `needs_review`.

### Verified against the live database, 14 September 2026

Tool A: first submission `active`; a following EcoVadis submission went `active` and flipped the
questionnaire row to `superseded` — unchanged behaviour after the three columns were added.

Tool B: blank note rejected; unknown action rejected; confirm on an `active` row rejected; action on a
missing row returns not-found; `flag` on a `superseded` row wrote `needs_review` with the reviewer's
email and note; a second `flag` on the now-`needs_review` row was rejected; `confirm` while the
company held an active EcoVadis row returned `blocked` with the conflicting ID and wrote nothing;
`send_company_to_review` moved both rows to `needs_review` without writing a note; the paired
resolution then set one row `active` and the other `superseded`, each with its own note and
`resolved_by`.

## Resolving `needs_review`

Done in Tool B's review page. The Supabase table editor is no longer the mechanism — that was
recorded as temporary in the portal's v3.0 spec (§12) and is now replaced.

## GDPR

Personal data: `company_name`, `contact_name`, `contact_email`, `contact_phone`, `job_title`,
`department`, plus the three reviewer email addresses held in `auth.users`. Stored in eu-central-1
(Frankfurt). Retained indefinitely unless deletion is requested.

Deletion requests arrive at `sustainability@thecorporate.com` and are actioned by deleting the row(s)
in the Supabase table editor. Tool B builds no deletion capability and `authenticated` holds no
delete grant. Note that deleting a row also destroys its resolution trail, which is accepted.

Tool B's CSV export carries `company_name` and `contact_name` out of the controlled system onto a
laptop, outside RLS and outside any deletion process. It stays inside the purpose the supplier
consented to and is recorded as a known limit, not a defect.

## Pre-existing objects not created by either build

`public.rls_auto_enable()` is an event-trigger function already present in the project. It enables
RLS automatically on any new table created in `public`. It is a safety guard, it touches no
application data, and it was left in place. The security advisor lists it as anon-executable; being
an event-trigger function it cannot meaningfully be invoked over the REST API.
