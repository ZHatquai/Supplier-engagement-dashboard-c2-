# Access Matrix — The Corporate Supplier Review Dashboard 2026

**Written against:** product-spec.md v2.0 · supabase-setup.md as of 14 September 2026
**Population pattern:** P1 — public, stays anonymous (declared here; no short matrix existed before this run)
**Date:** 20 September 2026
**Author:** Zyad Hatquai
**Status:** Confirmed
**Companion file:** user-stories.md

> The source of truth for who may do what. The Project Governor lifts Section 7 into
> CLAUDE.md. Claude Code builds the login and every line of Section 6 with the mechanism
> that line names (an RLS policy, a trigger, a narrow function, a server function holding
> the service role key, or the screen) in the same pass. The screen test as each named
> person triggers every `no` and every scoped `yes` in Section 1. The handover ships this
> file unchanged. Section 6 of product-spec.md points here from v2.0 on and holds no grid
> of its own.
>
> Every cell names a real table and one of the seven actions. A screen or route is never a
> cell; screen refusals live in user-stories.md and are enforced through the tables behind
> the screen. Export never exceeds read.
>
> **Population pattern note.** This tool is Tool B of a two-tool stack sharing one Supabase
> project with the Supplier Sustainability Portal (Tool A, live at v3.0, unaffected by this
> build). The `anon` rule below is Tool A's already-built, already-live behaviour: `anon`
> may create a `submissions` row only through `submit_submission`, and holds no policy and
> no grant on any table. This matrix does not re-derive that rule; it records it as
> unchanged and applies the same deny-all to the new `profiles` table.

---

## 1. The matrix

Legend: `yes` = all rows · `own` = rows the role owns (Section 2) · `no` = refused, in the
database, not only in the screen · `—` = not applicable to this table.

Actions are always these seven, in this order: create, read, update, change state, delete,
export, maintain lists.

### submissions

Business content (`company_name`, `contact_name`, `contact_email`, `contact_phone`,
`job_title`, `department`, `route`, `ecovadis_link`, `questionnaire_answers`) is frozen for
every role from the moment Tool A creates the row. Only `status` and the resolution trail
(`resolved_by`, `resolved_at`, `resolution_note`) ever change, and only through the two
functions below. There is no single frozen "final" state: `status` cycles
`needs_review → active/superseded` and back to `needs_review` via `flag`, for as long as
the row exists.

| Action | EHS | ESG | Procurement | admin (flag) | anon (no login) |
|---|---|---|---|---|---|
| create | no | no | no | no | no — Tool A's `submit_submission` only, `service_role` |
| read | yes | yes | yes | yes | no |
| update (direct) | no | no | no | no | no |
| change state — confirm (`needs_review` → `active`) | yes | yes | no | yes (via its business role) | no |
| change state — decline (`needs_review` → `superseded`) | yes | yes | no | yes (via its business role) | no |
| change state — flag (`active`/`superseded` → `needs_review`) | yes | yes | no | yes (via its business role) | no |
| delete | no | no | no | no | no |
| export (CSV, register columns only) | yes | yes | yes | yes | no |
| maintain lists | — | — | — | — | — |

The admin flag adds no action on `submissions` beyond whatever the flag-holder's own
business role already grants (today, ESG). It is not a fifth permission level on this
table.

### profiles

New this build. No `created_by` — a profile is created by invite, not by a submitter. No
history table this version — see Section 4.

| Action | EHS | ESG | Procurement | admin (flag) | anon |
|---|---|---|---|---|---|
| create / invite | no | no | no | yes — via the Netlify Function only | no |
| read | yes — all rows | yes — all rows | yes — all rows | yes — all rows | no |
| update — `role`, `is_admin` | no | no | no | yes — via `set_user_role` only, **never on the caller's own row** | no |
| update — `is_active` (deactivate/reactivate) | no | no | no | yes — via the Netlify Function only | no |
| update — `email` (kept in sync at invite/reset) | no | no | no | yes — via the Netlify Function only | no |
| change own password | own (self only) | own (self only) | own (self only) | own (self only) | no |
| delete | no | no | no | no — deactivate only, no hard delete | no |
| export | — | — | — | — | — |
| maintain lists | — | — | — | — | — |

`read = yes` for every authenticated role, EHS and Procurement included: the two review
functions read a caller's own row to check `role`, and the table policy is not scoped per
row. This means EHS or Procurement could read the full roster (email, role, admin flag,
active state) through the API even though the User Management screen never renders for
them — that is a screen refusal, not a table refusal, and is recorded as such in
Section 4.

**The self-change refusal, stated once, applies identically to `role`, `is_admin`, and
`is_active`:** `set_user_role` and the Netlify Function's `set_active` action both compare
the target `user_id` (or its Auth-derived equivalent) to the caller's own profile before
doing anything, and refuse with `not_authorized` if they match — writing nothing. If the
tool's only Admin needs their own role, flag, or active state changed, that happens in the
Supabase dashboard by the platform owner, exactly as the standard rule requires for every
role, admin, and active change everywhere else.

---

## 2. Ownership

- **submissions**: belongs to nobody. Every authenticated role (EHS, ESG, Procurement,
  admin) reads every row; there is no `created_by` scoping and none is added by this
  build. `own` does not apply to this table.
- **profiles**: belongs to the account itself, via `user_id` (references `auth.users(id)`).
  Ownership never changes — a profile is not reassigned to a different login identity.
  "Own" is used only for the Change Password action (a user changing their own password),
  never for `role`, `is_admin`, or `is_active`, which nobody changes on their own row,
  admin included.

---

## 3. The people

| Role | Named first holder | Layer | Screens |
|---|---|---|---|
| EHS | EHS Manager — sustaintrend@gmail.com | business | Login, Change Password, Overview, Risk Flag Board, Supplier Register, Supplier Detail (with action area), Review Page, blocked-confirm prompt |
| ESG | ESG Lead — z.hatquai@sustainos.io | business | same as EHS |
| Procurement | Procurement Manager — z.hatquai@gmail.com | business | Login, Change Password, Overview, Risk Flag Board, Supplier Register, Supplier Detail (no action area) |
| admin | held today by the ESG Lead's account (z.hatquai@sustainos.io) | app admin (`profiles.is_admin`) | everything its underlying business role sees, plus User Management |
| platform owner | Zyad Hatquai | outside the app | Supabase, Netlify |
| anon | no name | no login | none of this tool; Tool A's submission form only |

Admin actions, fixed and unchanged by this run's correction: invite a user (via the
Netlify Function), deactivate/reactivate a user (via the Netlify Function), reset a user's
password (via the Netlify Function), reassign any **other** user's role or Admin flag (via
`set_user_role`), read everything. Admin is not exempt from Section 7 rule 2: it cannot
touch its own `role`, `is_admin`, or `is_active` through the app.

This tool is Tool B of a two-tool stack: the Supplier Sustainability Portal (Tool A,
unaffected by this build) has the `anon` column and no business role of its own inside
this matrix — its own submitter-facing rules were already established at its build and
are recorded here only as the carried-over `anon` row. The internal tool (this one, Tool
B) has EHS, ESG, Procurement, admin, and platform owner. One matrix, because one database.

---

## 4. Exceptions (column-level, not built at the access stage)

| Column | Hidden from | Why | Fix (later list) |
|---|---|---|---|
| *(none — see the screen-vs-table note below)* | | | |

No column is hidden from any role that may read its table. The one thing worth recording
here so it isn't mistaken for a leak: `profiles` grants table-wide `SELECT` to every
authenticated role, so EHS and Procurement could read the full roster through the API even
though the User Management **screen** never renders for them (nav link and route both
gated on `is_admin`). That is a screen refusal, enforced in `user-stories.md`, not a
column or row restriction Row-Level Security is being asked to provide. Nothing here sits
on the later list.

---

## 5. Schema delta (what the access stage adds to supabase-setup.md, in one pass)

| Object | Add | Why |
|---|---|---|
| `user_role` (new enum) | `ehs`, `esg`, `procurement` | the three functional roles a profile can hold |
| `profiles` (new table) | `user_id` (uuid, PK, references `auth.users(id)`), `email` (text, kept in sync by every admin action), `role` (`user_role`), `is_admin` (boolean, default `false`), `is_active` (boolean, default `true`), `created_at`, `updated_at`, `updated_by` (text — the acting admin's email). No `created_by` (a profile is created by invite, not by a submitter). No history table this version — deferred per spec Section 12; goes on the later list below, not built now. | the people, and what each login may do |
| `resolve_submission` (existing function) | one role check at the top: caller's `profiles.role` must be `ehs` or `esg`, else refuse `not_authorized`, write nothing | Procurement cannot review |
| `send_company_to_review` (existing function) | same role check, same refusal | Procurement cannot accept the blocked-confirm prompt |
| `set_user_role` (new function) | `SECURITY DEFINER`, `search_path` pinned to `public, pg_temp`, `EXECUTE` revoked from `public`/`anon`, granted to `authenticated` only; checks caller `is_admin = true`, refuses if the target `user_id` is the caller's own row, validates `p_role`, writes `role`/`is_admin`/`updated_at`/`updated_by` | role and Admin-flag reassignment, admin-gated, self-change refused |
| Netlify Function (new, not a DB object) | one endpoint, three actions (`invite`, `set_active`, `reset_password`), service role key read server-side only, checks caller's `profiles.is_admin` before anything, refuses `set_active`/`reset_password` against the caller's own row | the three operations RLS cannot express, because they touch `auth.users` directly |
| RLS policy + grant on `profiles` | `authenticated` → `SELECT`, all rows | the review functions' own role check, and the roster the panel renders |

Seed: `profiles` rows for the three existing v1.0 accounts, `role` per spec Section 2,
`is_admin = true` on the confirmed ESG Lead account only. `submissions` is untouched by
this schema delta — no new column, no new index, no new constraint.

**Later list (not this version):** a history table on `profiles` recording who changed
what and when (currently `updated_by`/`updated_at` show only the most recent change); the
last-Admin-lockout safeguard remains out of scope per spec Section 15, but note that this
matrix's self-change refusal makes that lockout reachable in a way the spec's original text
did not anticipate — if the sole Admin's account is ever deactivated or its own role needs
changing, only the platform owner in the Supabase dashboard can recover it.

---

## 6. Policy plan (one line per `own` and per `no`)

| # | Table | Action | Role | Rule in words | Mechanism | Screen test |
|---|---|---|---|---|---|---|
| 1 | submissions | read | EHS, ESG, Procurement, admin | all rows | policy (SELECT) — carried over from v1.0, unchanged | each of the four accounts opens the Register and sees every row |
| 2 | submissions | create | everyone (authenticated) | no policy | none (default deny; `service_role` via Tool A only) | no account can insert a row from the browser |
| 3 | submissions | update (direct) | everyone (authenticated) | no policy; status and the resolution trail change only through the two functions | none | a direct `UPDATE` on `submissions` from any authenticated session is refused |
| 4 | submissions | change state (confirm / decline / flag) | EHS, ESG | role check inside the function: caller's `profiles.role` is `ehs` or `esg`, else refused | function (`resolve_submission`, `send_company_to_review`) | EHS and ESG each confirm, decline, and flag a test row; each succeeds |
| 5 | submissions | change state (confirm / decline / flag) | Procurement | refused with `not_authorized`, nothing written | function | Procurement calls `resolve_submission` directly (bypassing the UI) and is refused; the action area does not render on Supplier Detail |
| 6 | submissions | delete | everyone | no policy | none | no delete works from any account |
| 7 | submissions | export | EHS, ESG, Procurement, admin | follows read; no separate rule | screen | all four accounts export the same CSV, honouring their filters |
| 8 | profiles | read | EHS, ESG, Procurement, admin | all rows | policy (SELECT) | any signed-in account can read the roster via the API, even without the panel |
| 9 | profiles | create / invite | everyone except admin | no policy | none | a non-admin cannot invite a user, in the UI or at the endpoint |
| 10 | profiles | create / invite | admin | via the Netlify Function only, `is_admin` checked server-side | server function (service role key, admin-gated) | Admin invites a test email; a direct call to the endpoint as a non-admin returns 403 and creates nothing |
| 11 | profiles | update — `role`, `is_admin` (another user's row) | admin | via `set_user_role` only | function (`set_user_role`) | Admin changes Procurement's role; the change is reflected on Procurement's next action, no stale session |
| 12 | profiles | update — `role`, `is_admin` (own row) | admin | refused, writes nothing, even for the sole Admin | function (`set_user_role`) | the ESG Lead's account attempts to change its own role or drop its own Admin flag; refused |
| 13 | profiles | update — `is_active` (another user's row) | admin | via the Netlify Function's `set_active` action only | server function (service role key, admin-gated) | Admin deactivates EHS; EHS's session is invalidated and sign-in is refused until reactivated |
| 14 | profiles | update — `is_active` (own row) | admin | refused, same self-change rule as role/admin flag | server function | the ESG Lead's account attempts to deactivate itself; refused |
| 15 | profiles | update — `role`, `is_admin`, `is_active` | EHS, ESG, Procurement (non-admin) | no policy, and no function grants them execute | none | a non-admin has no dropdown, toggle, or endpoint that writes these three fields, on any row including their own |
| 16 | profiles | delete | everyone including admin | no policy; deactivate only, no hard delete exposed anywhere | none | no delete works from any account or endpoint |
| 17 | profiles | change own password | EHS, ESG, Procurement, admin | own account only, via the Change Password screen | Supabase Auth (`updateUser`) | each of the four accounts changes its own password; nobody can change another's from this screen |
| 18 | every table | any | anon | nothing on `profiles`; on `submissions`, create only through `submit_submission` (Tool A, unchanged); no policy and no table grant otherwise | none (default deny; the function is the write path) | a logged-out visitor reaches nothing through this tool's API; Tool A's public form still submits through its function |

Default deny applies to every table: where no line above says yes, the answer is nothing.
Every function that checks `is_admin` or `role` reads it fresh from `profiles` on every
call, never cached and never trusted from the client, so a role change mid-session is
enforced on the very next action.

**The gate.** The refusal test has two halves, both recorded in PROGRESS.md before this
access stage is deployed. **Half A (Claude Code, during the build):** every `no` cell
above, and the two self-change refusals in particular, attempted through the API (RPC, the
Netlify Function's endpoints) as each named person's session and as a logged-out visitor,
with the result pasted into PROGRESS.md under "Refusal test record". **Half B (the named
people):** every test in this table run as the named person on the screen — including
Procurement confirming the action area truly does not render, and the ESG Lead confirming
their own role/flag/active controls in the panel refuse to apply to their own row.

---

## 7. Hard rules for CLAUDE.md (the Governor lifts these verbatim)

1. The refusal happens in the database, or in a server function that holds the secret key
   and checks every request itself; never only in the screen. RLS is enabled on
   `submissions` and `profiles` and is never disabled to make something work. `anon` has no
   policy and no table grant on either table; Tool A's public form writes only through
   `submit_submission`. The Netlify Function holds the service role key and bypasses RLS,
   so for its three operations the function is the rule: it checks the caller's session and
   `profiles.is_admin` before doing anything, every time, regardless of what the UI shows.
2. Nobody can change their own `role`, `is_admin`, or `is_active` through the app — Admin
   included. `set_user_role` and the Netlify Function's `set_active` action both refuse a
   caller acting on their own profile row and write nothing. If the sole Admin's own role,
   flag, or active state ever needs to change, that happens in the Supabase dashboard by
   the platform owner, the same route every role/admin/active change ultimately has as its
   backstop.
3. `submissions`' business content is frozen for everyone from the moment Tool A creates
   the row; nothing on this build ever edits a supplier-provided value. There is no single
   frozen "final" status — `status` moves between `active`, `superseded`, and
   `needs_review` only through `resolve_submission` and `send_company_to_review`, both
   gated on `role` being `ehs` or `esg`.
4. Nothing is deleted through the app. No `submissions` row is ever deleted; no `profiles`
   row is ever hard-deleted — a user is deactivated (`is_active = false`) and can be
   reactivated. Deletion requests for supplier personal data are still actioned by hand in
   the Supabase table editor, unchanged from v1.0 and outside this tool's write surface.
5. `profiles` carries `created_at`, `updated_at`, `updated_by` as its audit columns; it has
   no `created_by` (created by invite, not by a submitter) and no history table this
   version (deferred — see Section 5's later list). `submissions` carries no new audit
   columns in this build; its existing `resolved_by`/`resolved_at`/`resolution_note` from
   v1.0 are unchanged.

---

## 8. Handover paragraph (for the handover package, plain language)

The Corporate Supplier Review Dashboard has three functional roles and one flag on top of
them. EHS (the EHS Manager) and ESG (the ESG Lead) can read every supplier submission and
confirm, decline, or flag it for review, each with a mandatory note; Procurement
(the Procurement Manager) reads and exports identically but can take no review action at
all — no button, no endpoint that accepts its role. The Admin flag, held today by the ESG
Lead's account, layers a User Management panel on top of whichever business role it sits
on: inviting, deactivating, reactivating, resetting the password of, and reassigning the
role of any other user — but never its own. No user can change their own role, Admin flag,
or active state, Admin included; that recovery path lives only in the Supabase dashboard,
held by the platform owner, Zyad Hatquai. Nothing is ever deleted — accounts are
deactivated, submissions are never removed, and a supplier's own data is never edited by
this tool. The rules are enforced in the database and in the one narrowly-scoped server
function that touches account creation directly, so they hold regardless of what the
screen shows. Moving the Supabase and Netlify accounts to a company account changes none of
these rules.
