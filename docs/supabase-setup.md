# Supabase Setup — "The corporate live build (New)"

> Schema source of truth for **both** tools sharing this project. Update this file at every save
> point that touches the database (CLAUDE.md, Supabase section), and copy it back into Tool A's repo
> so the two tools do not drift.

**Last updated:** 21 September 2026 — Tool B session 3, Supplier Review Dashboard v2.1 build (authorization).

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
| B — Supplier Review Dashboard 2026 (v2.1) | Internal login-protected review dashboard. Reads every row, writes status and the resolution trail only, plus its own `profiles` table. | Dashboard repo | Browser-direct, publishable (anon) key + Supabase Auth + RLS, plus one server function holding the service role key for three `auth.users` operations |

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
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify (Tool B) — **new at v2.0** | Tool B's one admin Netlify Function only. Not `VITE_`-prefixed, so Vite never bakes it into the browser bundle. |

Tool B's two `VITE_` values are `VITE_`-prefixed and therefore reach the browser. That is correct:
the publishable key opens nothing on its own, because `anon` holds zero policies and zero grants.

**The service role key rule, narrowed at v2.0, not removed.** v1.0 said the service role key had no
place in Tool B at all. It now has exactly one: a Netlify environment variable, without a `VITE_`
prefix, read only inside Tool B's one admin Netlify Function (`netlify/functions/admin-users.js`).
It must never appear in `src/`, in the built bundle, in `.env.local`, or in any committed file.
Verified at the v2.1 save point: `SERVICE_ROLE` and `service_role` appear nowhere in `src/` or in
`dist/`, and no JWT-shaped literal appears in either.

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

## Table — `profiles` — new at v2.0, Tool B only

One row per user of Tool B, holding the role and admin state the app enforces. Tool A neither reads
nor writes this table.

| Column | Type | Null | Written by | Notes |
|--------|------|------|-----------|-------|
| `user_id` | uuid | no | Tool B | primary key, `references auth.users (id)`. No `ON DELETE` action, deliberately: nothing removes a profile as a side effect. |
| `email` | text | no | Tool B | Copied from `auth.users` at invite time and re-synced by every admin action. Duplicated here because an ordinary authenticated client cannot read `auth.users`. |
| `role` | `user_role` | no | Tool B | enum: `ehs` \| `esg` \| `procurement` |
| `is_admin` | boolean | no | Tool B | default `false`. A flag on top of the functional role, not a fourth role. |
| `is_active` | boolean | no | Tool B | default `true`. Mirrors the Supabase Auth ban state, so the User Management panel renders a roster without a second call to the Auth admin API. |
| `created_at` | timestamptz | no | Tool B | `now()` |
| `updated_at` | timestamptz | no | Tool B | `now()` at creation; set by every function that changes the row |
| `updated_by` | text | **yes** | Tool B | Email of the admin who made the last change, read from the caller's session. Null until the first change. |

**No `created_by`** — a profile is created by an invite, not by a submitter. **No history table this
version**: `updated_by`/`updated_at` show the most recent change only. Both are deliberate, recorded
in `docs/access-matrix.md` Section 5.

New enum `user_role`: `ehs`, `esg`, `procurement`.

No index beyond the primary key. The roster is a handful of rows and is always read whole.

Seeded at the v2.1 build for the three accounts that already existed: `sustaintrend@gmail.com` as
`ehs`, `z.hatquai@sustainos.io` as `esg` with `is_admin = true`, `z.hatquai@gmail.com` as
`procurement`. Matched on email, so the migration file carries no generated identifier.

## Auth

Supabase Auth, **email and password only**, invite-only. Public signup is disabled in the dashboard
and Tool B carries no signup UI and no self-service password reset. Accounts live in `auth.users`,
managed by Supabase.

**Changed at v2.0: three permission sets, not one.** Every signed-in user no longer holds identical
access. `profiles.role` decides who may take a review decision (`ehs` and `esg` may, `procurement`
may not) and `profiles.is_admin` decides who may manage other users. Both are read fresh from
`profiles` inside every function on every call, never cached and never trusted from the client, so a
role change mid-session takes effect on that account's very next action with no re-login.

**Changed at v2.0: accounts are created in the tool, not the dashboard.** An admin invites a user
from the User Management panel; the admin Netlify Function creates the `auth.users` row and the
matching `profiles` row and returns a one-time starter password once. No email is sent — the handoff
is manual, by design. Deactivation is a Supabase Auth ban, mirrored onto `profiles.is_active`; it is
reversible and there is no hard delete of an account anywhere in the tool.

**Nobody changes their own `role`, `is_admin`, or `is_active` through the app, admin included.**
`set_user_role` and the Netlify Function's `set_active` action both compare the target to the
caller's own row and refuse, writing nothing. The only route to changing an admin's own access is
the platform owner in the Supabase dashboard.

## RLS

RLS is **enabled and forced** on `submissions` and, from v2.0, on `profiles`.

| Table | Role | Read | Insert | Update | Delete |
|-------|------|------|--------|--------|--------|
| submissions | anon | no | no | no | no |
| submissions | authenticated | **yes — all rows** | no | no | no |
| submissions | service_role | yes | yes | yes | yes |
| profiles | anon | no | no | no | no |
| profiles | authenticated | **yes — all rows** | no | no | no |
| profiles | service_role | yes | yes | yes | yes |

- `anon` — **zero policies and zero grants on both tables.** Tool A's public portal depends on this
  lock on `submissions`, and the same deny-all is applied to `profiles`. Never add a policy for
  `anon`, never re-grant anything to `anon`, and never disable or unforce RLS on either table.
- `authenticated` — one `SELECT` policy per table, `authenticated_read_all_submissions` and
  `authenticated_read_all_profiles`, both `using (true)`, each with a matching `SELECT` grant. The
  grant matters twice over: grants were revoked from both roles in Tool A's build, so a policy alone
  would do nothing on `submissions`; and this project's `ALTER DEFAULT PRIVILEGES` grants **all**
  privileges on a newly created public table to `anon` and `authenticated`, so `profiles` had to be
  revoked down to nothing before `SELECT` was granted back. No insert, update, or delete grant exists
  on either table.
- **`profiles` is readable by every signed-in role, Procurement and EHS included.** That is
  deliberate: both review functions read the caller's own row to check `role`, and the User
  Management panel renders the roster from it. The panel's own restriction is a screen refusal — the
  nav link and the route are both gated on `is_admin` — not a row restriction, and
  `docs/access-matrix.md` Section 4 records it as such rather than as a leak.
- `service_role` — bypasses RLS. Used by Tool A's submission function and, from v2.0, by Tool B's one
  admin Netlify Function.

Because `postgres` holds `BYPASSRLS`, the `SECURITY DEFINER` functions below write to both tables
despite `FORCE ROW LEVEL SECURITY`. That is why no write policy exists on either table and none
should be added.

Verified in-database on 21 September 2026, on both tables and all five functions, with
`has_table_privilege`, `has_function_privilege`, and by actually attempting each operation under
`SET LOCAL ROLE`: `anon` is refused `SELECT` on both tables (42501) and `EXECUTE` on all five
functions; `authenticated` holds `SELECT` on both tables and is refused `INSERT`, `UPDATE`, and
`DELETE` on both (42501).

The Supabase security advisor reports no `rls_enabled_no_policy` on either table. It does report
`authenticated_security_definer_function_executable` (WARN) for `resolve_submission`,
`send_company_to_review`, and `set_user_role` — that is this tool's whole design, not a defect: the
narrow function is exactly how a signed-in user is allowed to write without a table grant. The
pre-existing `rls_auto_enable` finding is unchanged and is not either tool's function.

## Functions

Five now: Tool A's two, unchanged, and Tool B's three. All five are `SECURITY DEFINER` with
`search_path` pinned to `public, pg_temp`. The four that touch `submissions` take
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

`EXECUTE` revoked from `public` and `anon` on all three.

**The role check, added at v2.1, is the same on both review functions.** Before any argument is
validated and before any row is read, the function reads the caller's `profiles.role`:

```sql
select p.role into v_role from public.profiles p where p.user_id = auth.uid();
if v_role is null or v_role not in ('ehs', 'esg') then
  return jsonb_build_object('ok', false, 'error', 'not_authorized',
    'message', 'Your role cannot take review actions.');
end if;
```

It sits immediately after the `no_session` check, so v1.0's error taxonomy is unchanged for a caller
with no session at all, and before everything else, so a refused caller learns nothing about the row
it named and writes nothing. The role is read fresh on every call and never cached.

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

**`set_user_role(p_user_id uuid, p_role text, p_is_admin boolean) → jsonb`** — new at v2.1.

The only path by which `profiles.role` and `profiles.is_admin` ever change. It needs no service role
key: changing them is an ordinary table write, so it follows the same pattern as the two functions
above.

The refusals, in this order, each writing nothing:

| Order | Condition | Returns |
|-------|-----------|---------|
| 1 | no session | `no_session` |
| 2 | caller's `profiles.is_admin` is not `true` | `not_authorized` |
| 3 | `p_user_id` is null, or is the caller's own `user_id` | `not_authorized` |
| 4 | `p_role` is not `ehs`, `esg`, or `procurement` | `invalid_role` |
| 5 | the target has no profile row | `not_found` |

Check 3 has **no exception, not even for the sole Admin**, and sits before `p_role` is validated, so
an admin naming their own `user_id` is refused with `not_authorized` whatever role they asked for.
If an admin's own role or flag has to change, the platform owner does it in the Supabase dashboard.

On success it writes `role`, `is_admin`, `updated_at`, and `updated_by` (the caller's email from
`auth.jwt()`, never supplied by the client) and returns `{"ok": true, "row": {...}}`. No note is
required — this is an administrative action, not a review decision, and carries no resolution trail.

### Tool B — the one admin Netlify Function, not a Postgres function

`netlify/functions/admin-users.js`. Three actions behind one endpoint, for the three operations RLS
cannot express because they touch `auth.users` directly rather than a table row:

| Action | What it does |
|--------|--------------|
| `invite` | Creates the `auth.users` row (email confirmed) and the matching `profiles` row, and returns a one-time starter password once. Refuses if a profile already holds that email. |
| `set_active` | Bans or unbans the account (`ban_duration` `876000h` or `none`) and mirrors it onto `profiles.is_active`. **Refuses when the target is the caller's own row**, matching `set_user_role`. |
| `reset_password` | Sets a new one-time password and returns it once. No self-target guard — an admin may reset their own password this way, though the Change Password screen is the normal route. |

It holds `SUPABASE_SERVICE_ROLE_KEY` server-side and therefore bypasses RLS, so **for these three
operations the function is the rule**. On every request, before anything else, it validates the
caller's Supabase access token and re-reads that caller's `profiles.is_admin`. A non-admin reaching
the endpoint directly gets HTTP 403 and nothing changes. One-time passwords are generated with
`node:crypto`, returned once, and never logged, never written to a column, and never stored anywhere
but the hash Supabase Auth already keeps.

Every action also re-syncs `profiles.email` from `auth.users` and stamps `updated_at`/`updated_by`.

### Verified against the live database, 21 September 2026 (v2.1)

Seventeen function-level refusals, each attempted with the named person's session claims set on the
connection exactly as PostgREST sets them, and each confirmed to have written nothing:

- Procurement calling `resolve_submission` (confirm on a `needs_review` row, flag on an `active` row,
  and against an id that does not exist) and `send_company_to_review` — all `not_authorized`. The
  third case proves the refusal lands before the row is even looked up.
- A logged-out caller on all three Tool B functions — `no_session`.
- EHS and Procurement calling `set_user_role` — `not_authorized`.
- The ESG Lead calling `set_user_role` against **their own** `user_id`, both to change their role and
  to drop their own Admin flag — `not_authorized` both times.
- Controls proving the gates let the right callers through rather than refusing everything: EHS
  reaches `not_found` and `note_required`, ESG reaches `invalid_action`, and the Admin reaches
  `invalid_role` and `not_found`.

And, inside a transaction that was then rolled back, the write paths: EHS flagged an active row to
`needs_review` with its own email on the trail; the Admin reassigned the Procurement Manager to
`ehs`; that same account then confirmed on its very next call with no re-login; the Admin put the
role back; and the account was refused again immediately.

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
`department`, plus the internal user email addresses held in `auth.users` and, from v2.0, copied into
`profiles.email` and `profiles.updated_by`. Stored in eu-central-1 (Frankfurt). Retained indefinitely
unless deletion is requested.

The `profiles` copy is the same address the account already holds in `auth.users`, held there because
an ordinary authenticated client cannot read `auth.users`. Nothing else from `auth.users` is copied
anywhere. A departing colleague is deactivated, not deleted; if their record has to go entirely, the
platform owner removes it in the Supabase dashboard, `profiles` row first, because the foreign key to
`auth.users` has no `ON DELETE` action.

Deletion requests arrive at `sustainability@thecorporate.com` and are actioned by deleting the row(s)
in the Supabase table editor. Tool B builds no deletion capability and `authenticated` holds no
delete grant. Note that deleting a row also destroys its resolution trail, which is accepted.

Tool B's CSV export carries `company_name` and `contact_name` out of the controlled system onto a
laptop, outside RLS and outside any deletion process. It stays inside the purpose the supplier
consented to and is recorded as a known limit, not a defect.

## Migrations

Applied to the live project and saved as files in Tool B's repo under `supabase/migrations/`:

| File | What it does |
|------|--------------|
| `20260921090000_create_user_role_enum_and_profiles_table.sql` | the `user_role` enum, the `profiles` table, the revoke-then-grant, RLS enabled and forced, the `authenticated` select policy |
| `20260921090100_seed_profiles_for_existing_accounts.sql` | profiles for the three v1.0 accounts, matched on email |
| `20260921090200_add_role_check_to_review_functions.sql` | the role check inside `resolve_submission` and `send_company_to_review` |
| `20260921090300_create_set_user_role_function.sql` | `set_user_role`, with both refusals |

The seven migrations before these were applied to the project during Tool A's build and Tool B's
v1.0 session and exist in the database's migration history, not as files in this repo. Their effect
is what the rest of this document describes.

## Pre-existing objects not created by either build

`public.rls_auto_enable()` is an event-trigger function already present in the project. It enables
RLS automatically on any new table created in `public`. It is a safety guard, it touches no
application data, and it was left in place. The security advisor lists it as anon-executable; being
an event-trigger function it cannot meaningfully be invoked over the REST API.
