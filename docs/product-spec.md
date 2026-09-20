# Product Spec — The Corporate Supplier Review Dashboard 2026

**Version:** 2.1
**Date:** 20 September 2026
**Author:** Zyad Hatquai
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Review Dashboard 2026

**What it does:** An internal, login-protected dashboard that displays the supplier submissions already stored in The Corporate's `submissions` table, scores every active questionnaire submission against seven sustainability risk criteria, and lets EHS and ESG confirm, decline, or re-open submissions for review. Procurement can see the same data but cannot act on it. One account additionally carries an Admin flag, giving it an in-app User Management panel to invite, deactivate, reactivate, reset the password of, and reassign the role of any user. The tool still reads existing supplier data and writes nothing new to `submissions` except the outcome of a review decision.

**Who uses it:** Four accounts at The Corporate — an EHS Manager, an ESG Lead, and a Procurement Manager, each with a distinct role, plus the ESG Lead's account also carrying the Admin flag. Accounts are created in-app by the Admin; there is no public signup.

**Why it exists:** The Supplier Sustainability Portal (v3.0, live) writes every supplier submission to Supabase, but nothing surfaces that data. This tool replaces the Supabase table editor with a purpose-built review surface, the risk screening the raw table cannot provide, and — from this version on — role-appropriate access instead of one shared permission set.

**Build status:** Iteration — previous version was v1.0 (Confirmed, built and test-passed against the live project per `PROGRESS.md` session 2, not yet deployed). v1.0 gave all three colleagues identical rights: everyone could confirm, decline and flag. v2.0 changed the access model from A2 to **A3**: EHS and ESG keep full review rights; Procurement becomes read-only with no actions; and the ESG Lead's account additionally carries an Admin flag with a new User Management panel. **v2.1 is a correction, not a new feature**, made by the Access Architect's full run against this spec: v2.0's text allowed an Admin to change their own role, Admin flag, or active state; `access-matrix.md` and `user-stories.md` instead refuse that — for every Admin, not only "the last one" — and this version brings the spec in line with the matrix, since the matrix is what Claude Code actually builds from. It is the second tool in an existing stack. The Supplier Sustainability Portal remains Tool A, already live at v3.0, and nothing in it changes as part of this build.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** Unchanged from v1.0. The tool reads an existing database table written by another tool, and its own review decisions (status changes plus the resolution trail) are written back and must survive the session. This version adds a second reason: who is allowed to do what is itself now data — held in a new `profiles` table — rather than a fixed rule that treats every login the same.

**D3 is triggered if any of the following are true — check all that apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [x] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | No |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | Yes |

**Reason:** v1.0 was A2 because all three colleagues had identical rights. That is no longer true: EHS and ESG can act on submissions, Procurement cannot, and one account can manage other users' access in-app. The moment any logged-in person has an admin action inside the app itself, rather than in the Supabase dashboard, the tool is A3 by definition — this is true independently of the EHS/ESG/Procurement split.

> **Promotion rule:** Not applicable as a promotion. D3 was already triggered independently by the persistence requirements above, and was already triggered by v1.0's A2. A3 does not change the data model decision, only the access rules on top of it.

---

### If Access Model is A2 — complete both questions

Not applicable. This tool is A3. Auth configuration, signup model, and the login mechanics live in Section 6.

---

### If Access Model is A3 — define all roles

| Role name | Who this is | Named first holder | What they can see | What they can do |
|-----------|------------|---------------------|-------------------|-----------------|
| EHS | EHS representative | EHS Manager — sustaintrend@gmail.com | Everything: Overview, Risk Flag Board, Supplier Register, Supplier Detail, CSV export | Confirm, decline, and flag for review, each requiring a note. Cannot create, edit, or delete a submission, and cannot change any supplier-provided value. |
| ESG | ESG lead | ESG Lead — z.hatquai@sustainos.io | Everything EHS sees, plus the User Management panel | Everything EHS can do, plus every Admin action below (this account also carries the Admin flag) |
| Procurement | Procurement representative | Procurement Manager — z.hatquai@gmail.com | Everything EHS sees | Nothing. No confirm, decline, flag, or note. Read-only on every screen, including Supplier Detail — the action area does not render for this role at all. |
| Admin *(a flag on top of any role, not a separate account type)* | Whoever the Admin flag is set on — today the ESG Lead | Same person as the ESG Lead row above | Everything their underlying role sees, plus the User Management panel | Invite a new user, deactivate or reactivate any *other* user, reset any *other* user's password, and reassign any *other* user's role and Admin flag — at any time, not only right after an invite. **Cannot do any of the four to their own account** — see Section 6. |

> The named first holder is what the Access Architect reads when it runs its full pass against the real tables (see Section 14); a group is not an answer. Real personal names were deliberately not recorded here — the position is what matters, per the builder.

---

### Tier

**Tier:** 3 — unchanged. D3+A2 and D3+A3 are the same tier; what changes is the shape of the rules underneath it. v1.0 needed one grant and two functions with no role check. v2.0 adds a `profiles` table, a role check inside the two existing functions, one new function for role reassignment, and one narrowly-scoped server-side admin path for the three operations that touch `auth.users` directly.

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

---

### Standalone or Stack

**This tool is:** Part of a stack. See Section 4. Unchanged from v1.0 — still Tool B in the two-tool stack sharing one Supabase project with the Supplier Sustainability Portal (Tool A).

---

## Section 3 — Arms

> Document search and AI knowledge bases are outside this framework version. Not applicable to this tool.

---

### AI API Arm

**Active:** No

Unchanged from v1.0. Nothing in this tool is summarised, explained, classified, or generated by an AI model.

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | CSV |
| What is exported | Unchanged from v1.0: the Supplier Register rows, and only the register's own columns — `company_name`, `contact_name`, `route`, `status`, `created_at`. Honours the active status and route filters, ignores search and sort. |
| PDF design intent | N/A — CSV only |
| Who can export | **New in v2.0.** All four accounts — EHS, ESG, Procurement, and Admin. Export is a read action; Procurement's restriction is on writing review decisions, not on reading or exporting what it can already see on screen. |

---

### Email Arm

**Active:** No

Unchanged from v1.0. No email is sent by this tool. In particular, invites are still handed over manually — see Section 6 — so this remains declined rather than becoming active in this version.

---

### Scheduled Automation Arm

**Active:** No

Unchanged from v1.0.

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind CSS. Unchanged. |
| Deployment target | Netlify |
| Deployment | Unchanged: GitHub push to main, then Netlify auto-deploys. This iteration adds one new Netlify Function (see Section 6 and Section 11) alongside the existing static frontend build; Netlify serves both from the same site. |

**GitHub — pre-build requirement:** Unchanged. This is an iteration, so it keeps the existing repo — no new repo is created for this version.

---

### CONDITIONAL: Supabase project — Tier 3

**Supabase project status:** Existing, unchanged from v1.0. "The corporate live build (New)", created by Tool A's build on 7 September 2026. Claude Code must not create a project and must not create the `submissions` table, its enums, its constraint, its indexes, or Tool A's two functions. This build adds one new table (`profiles`), one new enum (`user_role`), and three new functions — see Section 5 and Section 6.

**Supabase plan:** Pro. Unchanged from v1.0.

| Detail | Answer |
|--------|--------|
| Project name | The corporate live build (New) |
| Project ID / ref | Deliberately not recorded in this spec, in this repo, or in any committed file. Unchanged. |
| Region | eu-central-1 (Frankfurt) |
| Postgres | 17 |
| supabase-setup.md location | `docs/supabase-setup.md`, already present in this repo from v1.0. Claude Code updates it at every save point that touches the database, including this build's changes. |

---

### CONDITIONAL: Stack

Unchanged from v1.0. Still Tool B — internal login-protected review dashboard — in the two-tool stack with the Supplier Sustainability Portal (Tool A, unaffected by this build).

---

## Section 5 — Data Architecture

### Existing table — `submissions` — read by this tool, not created by it

Unchanged from v1.0. Every column already exists and none is recreated, renamed, retyped, or dropped by this build.

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| id | Submission ID | uuid, primary key | Automatic | Yes |
| company_name | Company name | Text | Supplier, via Tool A | Yes |
| contact_name | Contact full name | Text | Supplier, via Tool A | Yes |
| contact_email | Contact email | Text | Supplier, via Tool A | Yes |
| contact_phone | Contact phone | Text | Supplier, via Tool A | Yes |
| job_title | Job title | Text | Supplier, via Tool A | Yes |
| department | Department | Text | Supplier, via Tool A | Yes |
| route | Submission route | Enum `submission_route`: `ecovadis` / `questionnaire` | System, via Tool A | Yes |
| ecovadis_link | EcoVadis scorecard link | Text | Supplier, EcoVadis route only | EcoVadis route only |
| questionnaire_answers | Questionnaire answers, S2 to S7 | jsonb | Supplier, questionnaire route only | Questionnaire route only |
| status | Submission status | Enum `submission_status`: `active` / `superseded` / `needs_review` | Tool A at submit, Tool B at review | Yes |
| created_at | Submission timestamp | timestamptz | Automatic | Yes |
| resolved_by | Who made the last review decision | Text | Tool B, added in v1.0 | No |
| resolved_at | When that decision was made | timestamptz | Tool B, added in v1.0 | No |
| resolution_note | Why that decision was made | Text | Tool B, added in v1.0 | No |

No change to `submissions` in this build. The three resolution columns, added in v1.0, are unchanged.

### New in v2.0 — table `profiles`

One row per user, holding the role and admin state that the app itself enforces. This is new; `auth.users` already exists (managed by Supabase) and is not modified directly except through the admin operations in Section 6.

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| user_id | Links to the Supabase Auth account | uuid, primary key, references `auth.users(id)` | Automatic, set when Admin invites the user | Yes |
| email | The user's login email | Text | Copied from `auth.users` at invite time, kept in sync by every admin action | Yes |
| role | Functional role | Enum `user_role`: `ehs` / `esg` / `procurement` | Set by Admin at invite time, changeable later | Yes |
| is_admin | Whether this account carries the Admin flag | Boolean, default `false` | Set by Admin | Yes |
| is_active | Whether the account can currently sign in | Boolean, default `true` | Set by Admin via deactivate/reactivate. Mirrors the Supabase Auth ban state so the User Management panel can render a list without a second call to the Auth admin API. | Yes |
| created_at | When the profile was created | timestamptz | Automatic | Yes |
| updated_at | When the profile was last changed | timestamptz | Automatic, set by every function that touches this row | Yes |
| updated_by | Who last changed it | Text — the email of the admin who made the change | Automatic, read from the caller's session | No, null until the first change |

**Why `email` is duplicated here rather than read from `auth.users`:** `auth.users` is a Supabase-managed table that an ordinary authenticated client cannot read directly. Rather than exposing it, the User Management panel reads `profiles`, which carries just enough — email, role, admin flag, active state — to render the list and take action. Nothing else from `auth.users` is copied anywhere.

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| submissions | Existing, unchanged this build. One row per completed supplier submission plus the resolution trail. | company_name, contact_name, route, status, created_at, questionnaire_answers, resolved_by, resolved_at, resolution_note |
| profiles | New this build. One row per user, holding role and admin state. | user_id, email, role, is_admin, is_active |

**Main record and its states:**

| Detail | Answer |
|--------|--------|
| Main record | One submission (unchanged) and, new this build, one user profile |
| States, in order | Submission: `needs_review` → `active` / `superseded`, as in v1.0. Profile: `active` ↔ `deactivated` (`is_active` toggled by Admin; no other states) |
| Login-ready columns | `profiles` carries `created_at`, `updated_at`, `updated_by` as the Governor's standard set. `created_by` does not apply here — a profile's own existence is created by the invite action, not by a submitter. |

**File storage:** No. Unchanged.

**Derived or calculated data:** Yes, unchanged from v1.0. The seven risk flags and the flag count are computed in the browser at render time from `questionnaire_answers`. Never stored.

### Reading the questionnaire answer keys

Unchanged from v1.0 and already resolved per `PROGRESS.md`: the seven flag-bearing keys were read from a live row during the v1.0 build session and are recorded in `docs/supabase-setup.md` and `src/lib/questionnaireSchema.js`. No action needed in this build.

---

## Section 6 — Access and Permissions

**Auth configuration:**

| Detail | Answer |
|--------|--------|
| Authentication method | Email and password, via Supabase Auth. Unchanged from v1.0. |
| Signup model | Invite-only, unchanged in substance — **but the mechanism moves in this version.** In v1.0 the builder created accounts directly in the Supabase dashboard. In v2.0, Admin creates accounts from inside the tool's own User Management panel. Public signup remains disabled in Supabase Auth settings; there is still no self-serve signup path anywhere in the UI. |
| Invite flow | Manual handoff, confirmed by the builder. Admin fills in a new user's email, role, and (optionally) the Admin flag. The tool generates a one-time starter password, creates the account, creates its `profiles` row, and shows the password once in a copy-once panel. Admin sends it to the person themselves, over Teams or in person — exactly as today, just triggered in-app instead of in the Supabase dashboard. No email is sent by the tool. |
| Change Password screen | **New this build.** A signed-in user can change their own password at any time from a small account screen — nobody else's. This is the natural complement to Admin-issued starter passwords and resets: without it, a reset password can only ever be handed over again, never chosen by the user themselves. Recorded here as a deliberate small addition; flagged in Section 15 for the builder's sign-off. |

> **Privacy note — standing for every A2/A3 spec:** user accounts store email addresses. For internal and client tools this falls under the organization's existing privacy framework rather than a consent flow. Unchanged, now covering four identities instead of three.

**Handover request:** Unchanged from v1.0 — if this tool ever leaves the teaching context and runs against a real corporate identity estate, move authentication to The Corporate's single sign-on.

---

**Roles and access — plain language:**

| Role | What they broadly see and do |
|------|------------------------------|
| EHS | Sees every submission and its full detail. Can confirm, decline, and flag, each with a mandatory note. |
| ESG | Same as EHS, plus the User Management panel and every admin action (this account also carries the Admin flag). |
| Procurement | Sees every submission and its full detail, including CSV export. Cannot confirm, decline, or flag. No action area renders on Supplier Detail for this role. |
| Admin *(a flag, not a role of its own)* | Invite/deactivate/reactivate/reset-password/reassign-role on any user, at any time. Layered on top of whichever functional role the account holds. |

> Because this tool is now A3, the row-level rules that used to sit directly in this section move to `access-matrix.md`, produced by the Access Architect skill's full run — see Section 14. This section states the plain-language shape of the rules; the matrix and the functions below are the enforced version of them.

---

### How the browser reaches the database

Unchanged in principle from v1.0, with one narrow, deliberate addition.

**Reads and the two review functions** still go browser-direct to Supabase using the publishable (anon) key, with Supabase Auth handling login and RLS doing the enforcing — exactly as in v1.0. **This part of the v1.0 hard rule stands: the service role key is never used for reading or reviewing submissions, and it never reaches the browser.**

**The one exception, scoped narrowly:** the three admin operations that touch `auth.users` directly — invite, deactivate/reactivate, and password reset — cannot be done through RLS at all, because RLS governs table rows, not Supabase's own user-management API. These three, and only these three, run through **one new Netlify Function**, holding the Supabase service role key as a Netlify environment variable, never exposed to the browser bundle. The function itself checks the caller's session and their `profiles.is_admin` flag before doing anything — the same authorization check the UI already uses to decide whether to show the panel at all, done again server-side so a refusal doesn't depend on the browser having hidden the button correctly.

**Role reassignment does not need the service role key.** Changing `profiles.role` or `profiles.is_admin` is an ordinary table write, so it goes through a fourth `SECURITY DEFINER` Postgres function — `set_user_role`, below — following the exact pattern already used for `resolve_submission`. No new key, no Netlify Function, for that one action.

This is a deliberate, documented departure from v1.0's blanket rule ("the service role key is not used by this tool and must never be added to it"). v2.0 narrows that rule rather than removing it: the key exists in exactly one place, is never read by the browser, and is used for exactly three named operations.

---

**Current state of the table, carried over from v1.0:** RLS is enabled and forced on `submissions` with the `authenticated` select policy and grant from v1.0 already in place. This build does not touch that policy.

**RLS rules on `submissions` — who can read and write what:**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|-----------|
| submissions | anon (not signed in) | No | No | No | No |
| submissions | authenticated — any role | Yes — all rows | No | No direct update. Status changes only through the two functions below, which now also check role. | No |
| submissions | service_role | Yes | Yes | Yes | Yes — unchanged, used by Tool A's submission function |

**The anon deny-all stays exactly as it is.** Unchanged from v1.0.

**RLS rules on `profiles` — new this build:**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|-----------|
| profiles | anon (not signed in) | No | No | No | No |
| profiles | authenticated — any role | Yes — all rows (needed for the User Management panel to render a roster, and for the two review functions to check a caller's own role) | No | No direct update. Role and admin-flag changes only through `set_user_role`, below. | No |
| profiles | service_role | Yes | Yes, via the Netlify Function's invite action only | Yes, via the Netlify Function's deactivate/reactivate/reset actions only | No — see Section 15 on account removal |

---

**Four Postgres functions now involved. Two carried over with a new check; two new.**

All are `SECURITY DEFINER`, pin `search_path` to `public, pg_temp`, have `EXECUTE` revoked from `public` and `anon`, and are granted to `authenticated` only.

**`resolve_submission(p_id uuid, p_action text, p_note text) → jsonb`** — carried over from v1.0, one new check added.

Before doing anything else, the function reads the caller's `profiles.role`. If it is not `ehs` or `esg`, it refuses and writes nothing, returning `{"ok": false, "error": "not_authorized", "message": "Your role cannot take review actions."}`. Everything else — the three actions, the mandatory note, the wrong-status refusal, the blocked confirm, the advisory lock — is exactly as in v1.0 and is not repeated here; see `docs/supabase-setup.md` for the full behaviour.

**`send_company_to_review(p_id uuid) → jsonb`** — carried over from v1.0, same new check added. Refuses with `not_authorized` for a `profiles.role` of `procurement`. Otherwise unchanged.

**`set_user_role(p_user_id uuid, p_role text, p_is_admin boolean) → jsonb`** — new this build.

- Reads the caller's `profiles.is_admin`. If not `true`, refuses and writes nothing: `{"ok": false, "error": "not_authorized"}`.
- **Self-change refusal — corrected in v2.1.** Before anything else, compares `p_user_id` to the caller's own profile. If they match, refuses and writes nothing: `{"ok": false, "error": "not_authorized"}`. This applies to every Admin, including the sole one — there is no exception for "the only admin left." If the tool's only Admin needs their own role or flag changed, that happens in the Supabase dashboard, by the platform owner, exactly as every role/admin/active change ultimately has that as its backstop. (v2.0 read: "An Admin can reassign their own role... this is allowed, not specially guarded." That text was superseded by the Access Architect's full run and is corrected here — see Section 15.)
- Validates `p_role` is one of `ehs`, `esg`, `procurement`; any other value is refused with `{"ok": false, "error": "invalid_role"}`.
- Updates the target row's `role`, `is_admin`, `updated_at`, and `updated_by` (the caller's email, read from `auth.jwt()`, never supplied by the client).
- No note is required — this is an administrative action, not a review decision, and carries no resolution trail.
- Returns `{"ok": true, "row": {...}}` on success.

**What `authenticated` explicitly still cannot do, unchanged from v1.0 plus the new table:**
- Insert or delete a submission
- Change any supplier-provided field
- Write `status` directly, bypassing the transition rules
- Edit or erase a `resolution_note` once written
- Insert, update, or delete a `profiles` row directly — every change goes through `set_user_role` or the Netlify Function

---

### Admin operations — the one Netlify Function, service role key scoped narrowly

| Detail | Answer |
|--------|--------|
| What it does | Exposes three actions behind one endpoint: `invite` (create the `auth.users` row and the matching `profiles` row, generate a one-time starter password, return it once), `set_active` (ban or unban the account — this is the deactivate/reactivate toggle), `reset_password` (set a new one-time starter password on the account, return it once). |
| What triggers it | The Admin clicking a button in the User Management panel. Never triggered automatically. |
| Function placement | Netlify Function — user-triggered. |
| Authorization | The function verifies the caller's Supabase session token and reads their `profiles.is_admin` before performing any action. A non-admin caller — even one who reaches the endpoint directly, bypassing the UI — is refused. **`set_active`, corrected in v2.1: also refuses when the target account is the caller's own** — an Admin cannot deactivate or reactivate themselves through this endpoint, matching the same self-change rule as `set_user_role`. `invite` and `reset_password` have no target-is-caller case to guard: invite always creates a new account, and nothing stops an Admin resetting their own password this way, though the Change Password screen is the normal route for that. |
| Key storage | The Supabase **service role key** is a Netlify environment variable, read only inside this one function, never sent to the browser, never referenced in any client-side file. This is the one narrow exception to the v1.0 rule — see the note above. |
| One-time passwords | Generated server-side, returned once in the function's response, shown once in the UI with a copy button and a clear "this will not be shown again" warning, and never written to any log, database column, or file. The account's actual password lives only as the hash Supabase Auth already stores. |
| If it fails | The error is shown to Admin in the panel — invalid email, user already exists, and so on. No retry logic, no queue. |

---

## Section 7 — GDPR

**GDPR outcome:** **Not applicable** — unchanged from v1.0. This tool still collects no personal data through any form or upload of its own.

**Reasoning, on the record:** Unchanged. Every supplier-facing personal field was collected by Tool A under its own consent. This build introduces no new supplier-facing data collection.

**What is new in v2.0, on the same footing as v1.0's login note:** a fourth login identity (the Admin flag doesn't add a person, it's layered on the ESG Lead's existing account) and the mechanics of issuing and resetting a starter password in-app rather than in the Supabase dashboard. Per the scope rule, login identities on an invite-only tool are covered by the organisation's existing privacy framework, not a consent flow — this was already true in v1.0 and remains true. The one-time password handling described in Section 6 (never logged, never stored beyond the hash, shown once) is recorded here because it is good practice for personal-adjacent credential handling, not because it changes the GDPR outcome.

**Two standing notes carried into this spec, unchanged from v1.0:**

1. The CSV export moves personal data out of the controlled system, now available to Procurement as well as EHS and ESG. Same reasoning as v1.0: it stays inside the consented purpose, recorded as a known limit.
2. Deletion requests are unchanged — they still arrive at `sustainability@thecorporate.com` and are actioned by hand in the Supabase table editor. Deactivating a user's login (Section 6) is not a deletion and does not touch `submissions`.

Data continues to be stored in eu-central-1 (Frankfurt) and retained indefinitely unless deletion is requested.

---

## Section 8 — Screen and UI Structure

### Login Screen

Unchanged from v1.0.

- **Purpose:** Keep everything behind an authenticated session.
- **What is visible:** The Corporate wordmark, an email field, a password field, a sign-in button, an inline error area. No signup link.
- **User actions:** Enter email and password, sign in.
- **What happens next:** On success, the Overview tab (Tab 1). On failure, a single generic message.

---

### New — Change Password screen

- **Purpose:** Let any signed-in user set their own password, replacing a starter password Admin issued.
- **What is visible:** Current password field, new password field, confirm-new-password field, a save button. Reachable from an account menu, visible to all four accounts regardless of role.
- **User actions:** Enter current and new password, save.
- **What happens next:** Supabase Auth updates the password for the current session only — this is a normal client-side `updateUser` call, not an admin operation, and needs no new key or function. A success message confirms. A wrong current password shows an inline error.

---

### Tab 1 — Overview and Risk Flag Board

Unchanged from v1.0 for EHS, ESG, and Procurement alike — all three roles see identical content here, since Procurement's restriction is on actions, not on reading. See the original blocks below.

#### Block 1 — Overview

- **Purpose:** Answer "what is in the system right now" in one glance.
- **What is visible:** Three summary numbers (active rows only: total, EcoVadis, questionnaire), a route pie chart, and two clickable side counters — Needs review and Superseded.
- **User actions:** Click either counter.
- **What happens next:** Opens Tab 2 (Supplier Register) with the status filter pre-set. Unchanged.

#### Block 2 — Risk Flag Board

Unchanged from v1.0 — one line per active submission, seven flag indicators or "not assessable via questionnaire" for EcoVadis rows, the filter interlock. Visible identically to all four roles.

---

### Tab 2 — Supplier Register

Unchanged from v1.0 for reading, sorting, searching, filtering, and exporting — available identically to all four roles, per the export-arm decision in Section 3.

---

### Supplier Detail

Unchanged for the read-only parts — header, identity block, EcoVadis or questionnaire block, risk summary, resolution trail, history block. **The action area now depends on role as well as status:**

- **Action area, by role:**
  - EHS or ESG, status `needs_review` → Confirm and Decline, both requiring a note.
  - EHS or ESG, status `active` or `superseded` → Flag for review, requiring a note.
  - **Procurement, any status → no action area renders at all.** Not disabled buttons — nothing in that space. The page ends at the resolution trail and history block.
- **What happens next:** unchanged for EHS/ESG — see the Review Page and blocked-confirm prompt below. Not applicable for Procurement.

---

### Review Page

Unchanged from v1.0. Reachable only by EHS or ESG taking an action from Supplier Detail or the blocked-confirm prompt; Procurement never reaches this page because it never sees the action that opens it.

---

### Blocked-confirm prompt

Unchanged from v1.0.

---

### A consequence of the flag action, recorded so it is not read as a bug

Unchanged from v1.0.

---

### New — User Management panel (Admin only)

- **Purpose:** Let Admin manage who can sign in and what they can do, without leaving the tool.
- **Reachable via:** A link in the header, visible only when the signed-in account's `profiles.is_admin` is `true`. Not present in the navigation at all for a non-admin account — same principle as Procurement's missing action area.
- **What is visible:** A table of every row in `profiles` — email, role, Admin flag, active/deactivated state. An "Invite user" button above the table. Per row: a role dropdown (EHS / ESG / Procurement), an Admin-flag toggle, a Deactivate/Reactivate toggle, and a Reset password button. **Corrected in v2.1: on the signed-in Admin's own row, the role dropdown and the Admin-flag and Deactivate/Reactivate toggles are disabled**, with a short inline note ("change your own access from the Supabase dashboard"), since the functions behind them now refuse a self-target anyway — the UI reflects that rather than letting the Admin discover it via an error.
- **User actions:**
  - **Invite user:** opens a small form — email, role, Admin flag (off by default). On submit, calls the Netlify Function's invite action. On success, a one-time panel shows the generated starter password with a copy button and a "shown once" warning; closing it does not show the password again.
  - **Change role / Admin flag:** editing the dropdown or toggle and saving calls `set_user_role` directly (no service role key involved). Takes effect immediately — a signed-in session whose role just changed sees its own new rights on its next action, since every check reads `profiles` fresh.
  - **Deactivate / Reactivate:** a simple inline confirm ("Deactivate this account? They will be signed out and unable to log in until reactivated.") then calls the Netlify Function's `set_active` action. Not available on the Admin's own row — see above.
  - **Reset password:** a simple inline confirm, then calls the Netlify Function's `reset_password` action. Shows the new one-time password the same way the invite flow does.
- **What happens next:** the table refreshes from `profiles` after any action. There is no separate confirmation screen beyond the inline confirms described above — this stays a single, simple panel, not a multi-step wizard.
- **Empty state:** not applicable — the table always holds at least the Admin's own row.

---

## Section 9 — Logic and Calculations

### A. The seven risk flags

Unchanged from v1.0. See `docs/supabase-setup.md` for the full table of questions and flag directions.

---

### B. Status transitions

Unchanged from v1.0 in every respect except the new authorization check, which is documented once here rather than repeated across both functions.

---

### C. New — Role authorization

**Inputs:** the caller's `profiles.role` and `profiles.is_admin`, read fresh inside each function on every call — never cached, never trusted from the client.

**Rules:**

| Action | Requires | Refusal |
|--------|----------|---------|
| `resolve_submission` (confirm / decline / flag) | `role` is `ehs` or `esg` | `not_authorized` |
| `send_company_to_review` (accept on the blocked-confirm prompt) | `role` is `ehs` or `esg` | `not_authorized` |
| `set_user_role` (reassign role or Admin flag) | `is_admin` is `true` | `not_authorized` |
| Netlify Function — invite / deactivate / reactivate / reset password | `is_admin` is `true` | HTTP 403, shown as an error in the panel |

**Output:** either the action proceeds exactly as it would have in v1.0 (for the two review functions) or newly in this build (for role and admin actions), or it is refused and nothing is written.

**Edge cases:**
- **A role change mid-session.** If Admin changes someone's role while they're signed in, that person's next action re-reads `profiles` and is checked against the new role — there is no stale in-memory permission.
- **Any Admin changing their own role, flag, or active state.** Corrected in v2.1: refused outright by `set_user_role` and by the Netlify Function's `set_active` action, for every Admin, not only when they're the last one — see Section 6. The consequence is a real, accepted gap: if the tool's only Admin is ever deactivated or needs their own access changed, no path inside the app can recover it. Recovery is the platform owner acting directly in the Supabase dashboard — see Section 15.
- **A deactivated account with an open session.** Supabase's ban mechanism invalidates the session, so their next request is refused at the Auth layer before it ever reaches these functions.

---

## Section 10 — Brand and Visual Direction

Unchanged from v1.0. The `the-corporate-brand` skill governs every UI decision in this build too, including the new Change Password screen and User Management panel — same Chalk/Linen/Stone palette, same two-use Acid Lime cap, no border-radius, no shadows.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database reads, the two review functions, `set_user_role`, and Auth | Publishable (anon) key, browser-safe | Netlify environment variable, `VITE_`-prefixed |
| Supabase Admin API | Invite, deactivate/reactivate, and password reset — **new in v2.0** | Service role key — bypasses RLS entirely | Netlify environment variable, **not** `VITE_`-prefixed, read only inside the one admin Netlify Function |

**Environment variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | The project URL | Unchanged from v1.0. Browser-facing by design. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (anon) key | Unchanged from v1.0. |
| `SUPABASE_SERVICE_ROLE_KEY` | **New in v2.0.** The project's service role key | Server-side only. Not `VITE_`-prefixed, so Vite never bakes it into the browser bundle. Read only by the one admin Netlify Function. Never referenced anywhere in `src/`. |

> **Security rule — updated for v2.0.** No API key, token, password, or credential may appear in any HTML file, any client-side JavaScript file, or any file committed to GitHub. The v1.0 rule that the service role key "has no place in this tool at all" is narrowed, not removed: it now has exactly one place — the Netlify environment variable read by the one admin function — and it must never appear in `src/`, in any file the browser receives, or in any committed file. Claude Code must verify this explicitly at the save point that adds the function, and again at the acceptance-criteria pass (Section 13).

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase project URL, ref, publishable key | Available — unchanged from v1.0 | Already in the Netlify environment |
| Supabase service role key | Available — exists on the project, not yet added to this tool's environment | Supabase dashboard → Project Settings → API. Add as a Netlify environment variable, **not** `VITE_`-prefixed, before the build session that adds the admin function. |
| The four accounts | The three from v1.0 already exist with temporary passwords (per `PROGRESS.md`, not yet rotated). This build adds `profiles` rows for those three (role assigned per Section 2) and sets `is_admin = true` on the ESG Lead's account — a one-time data migration, not a new account. | Builder confirms which existing account is the ESG Lead before the build session, so Claude Code assigns the Admin flag correctly. |

Nothing else. No AI provider, no Resend, no third-party service of any kind.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Any change whatsoever to the Supplier Sustainability Portal | Unchanged from v1.0. |
| Editing any supplier-provided value | Unchanged from v1.0. |
| Automatic invite emails | Confirmed manual handoff. Adding this later means the Email arm, a verified sending domain, and Resend — see Section 3. |
| Self-service password reset (a forgotten-password link) | Not requested. Admin resets it via the User Management panel instead. |
| An audit log of admin actions (who invited whom, who changed a role and when) | Not requested. `profiles` holds current state only (`updated_by`, `updated_at` show the *last* change, not a history). If this matters later, it is a new table and a small addition, not a redesign. |
| An in-app recovery path if the sole Admin's own account is ever deactivated or its role needs changing | By design, per v2.1: self-change is refused for every Admin, with no exception. The only recovery is the platform owner acting directly in the Supabase dashboard. Not a gap to build around — the alternative (letting an Admin change their own access) was the v2.0 behaviour this version corrects. |
| Email alerts on a new `needs_review` row | Unchanged from v1.0 — declined. |
| AI reading, summarising, or classifying the open-ended S2 to S7 answers | Unchanged from v1.0 — declined. |
| Scheduled jobs, digests, or automated recalculation | Unchanged from v1.0 — declined. |
| Undoing or editing a resolution note once written | Unchanged from v1.0. |
| A separate `rejected` status | Unchanged from v1.0. |
| Supplier roster, non-responder tracking, submission chasing | Unchanged from v1.0. |
| Weighting, scoring, or grading the seven flags | Unchanged from v1.0. |
| Flag columns or questionnaire answers in the CSV | Unchanged from v1.0. |
| PDF export of a supplier submission | Unchanged from v1.0. |
| Automated EcoVadis scorecard validation | Unchanged from v1.0. |
| Deleting submissions from the dashboard | Unchanged from v1.0. |
| Permanently deleting a user account from this tool | Confirmed: deactivate only, reversible. A hard delete of a Supabase Auth user is not exposed anywhere in the UI. |

---

## Section 13 — Acceptance Criteria

Items 1 to 25 are carried over from v1.0 and re-verified where role now matters. New and changed items below.

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1–25 | v1.0 criteria | See `docs/product-spec.md` v1.0 history in Section 16, and re-run against all four accounts where "the three accounts" is referenced. Item 2 in particular now reads: all four accounts sign in; EHS, ESG, and Procurement reach every read-only view identically; only EHS and ESG can act; only the ESG Lead's account (Admin) reaches the User Management panel. | [ ] |
| 26 | Procurement cannot review, in the UI and at the function | The action area does not render on Supplier Detail for the Procurement account. Calling `resolve_submission` or `send_company_to_review` directly (bypassing the UI) as Procurement is refused with `not_authorized` and writes nothing. | [ ] |
| 27 | EHS and ESG are otherwise identical | Both roles reach every read view and every review action identically. Neither sees the User Management panel unless `is_admin` is also true. | [ ] |
| 28 | The User Management panel is admin-gated, in the UI and at the endpoint | The panel and its nav link render only for `is_admin = true`. A direct call to the admin Netlify Function's endpoints as a non-admin returns 403 and changes nothing. | [ ] |
| 29 | Invite creates a working account | Inviting a new email with a role creates an `auth.users` row and a matching `profiles` row, returns a one-time password exactly once, and that password successfully signs in. The password is not retrievable a second time from the UI. | [ ] |
| 30 | Deactivate and reactivate work | Deactivating a user immediately prevents sign-in (existing session, if any, is invalidated) and sets `profiles.is_active = false`. Reactivating restores sign-in and sets it back to `true`. `submissions` rows are untouched by either action. | [ ] |
| 31 | Reset password works | After a reset, the old password no longer signs in and the new one-time password does, shown once. | [ ] |
| 32 | Role and Admin-flag changes take effect immediately | Changing a signed-in user's role or Admin flag is reflected on their very next action — no stale permission, no requirement to sign out and back in. | [ ] |
| 32a | An Admin cannot change their own access, in the UI or at the function — **new in v2.1** | The Admin's own row in the User Management panel has its role dropdown and its Admin-flag and Deactivate/Reactivate toggles disabled. A direct call to `set_user_role` or the Netlify Function's `set_active` action, targeting the caller's own `user_id`, is refused with `not_authorized` and writes nothing — tested for role change, Admin-flag removal, and self-deactivation. | [ ] |
| 33 | The service role key never reaches the browser | It does not appear in the built `dist` bundle, in any `src/` file, or in any committed file. It is read only inside the one admin Netlify Function, confirmed by inspecting the deployed bundle for the string. | [ ] |
| 34 | Export still works for all four roles | CSV export succeeds identically for EHS, ESG, Procurement, and Admin, honouring the same status/route filters as v1.0. | [ ] |
| 35 | Change Password screen works | A signed-in user can change their own password with the correct current password; a wrong current password is rejected with an inline error; the change does not require Admin. | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 3

---

### What v1.0 already completed — not repeated in this build

Per `PROGRESS.md` session 2: the frontend, the three resolution columns, `resolve_submission`, `send_company_to_review`, the RLS policy and grant for `authenticated`, and the three Supabase Auth accounts already exist and were test-passed (281 assertions). This iteration does not redo any of that — it adds to it.

---

### Pre-build steps — complete before opening Claude Code for this iteration

- [x] **Access Architect skill — full run.** Complete as of 20 September 2026: `access-matrix.md` and `user-stories.md` are written and confirmed. Its self-change refusal correction is what produced this v2.1 edit — see Section 1, Section 6, and Section 15.
- [ ] Project Governor skill — `CLAUDE.md` and `PROGRESS.md` updated from this spec, in Iteration Mode (keeps `PROGRESS.md`'s existing history rather than resetting it)
- [ ] `product-spec.md` (this file) replaces the v1.0 copy at the repo root
- [ ] Confirm which of the three existing accounts is the ESG Lead, so Claude Code assigns `is_admin = true` to the right one when seeding `profiles`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added as a Netlify environment variable, **not** `VITE_`-prefixed — see Section 11
- [ ] Existing GitHub repo, existing Netlify site — no new repo, no new site for this iteration

---

### Tier 3 — this iteration's build session

- [ ] Open Claude Code in the existing project folder; it reads the updated `product-spec.md`, `CLAUDE.md`, `PROGRESS.md`, `access-matrix.md`, `user-stories.md`, and `docs/supabase-setup.md`
- [ ] Claude Code creates the `user_role` enum and the `profiles` table per Section 5
- [ ] Claude Code seeds `profiles` for the three existing accounts (role per Section 2, `is_admin = true` on the confirmed ESG Lead account only)
- [ ] Claude Code adds the RLS policy and grant on `profiles` per Section 6
- [ ] Claude Code adds the role check inside `resolve_submission` and `send_company_to_review`
- [ ] Claude Code builds `set_user_role` per Section 6
- [ ] Claude Code builds the one admin Netlify Function (invite / set_active / reset_password) per Section 6, reading the service role key only server-side
- [ ] Claude Code builds the Change Password screen and the User Management panel per Section 8
- [ ] Claude Code updates Supplier Detail so the action area is role-conditional per Section 8
- [ ] Claude Code verifies in-database that `anon` still has zero privilege on `submissions` and on `profiles`, and that `authenticated` has no direct write grant on either
- [ ] Claude Code updates `docs/supabase-setup.md`: the new enum, the new table, the new RLS policy, the two new/changed functions, the new environment variable, and the last-updated line
- [ ] Test locally against the live project: every acceptance criterion in Section 13, including the service-role-key bundle check
- [ ] Push to main, Netlify auto-deploys
- [ ] Confirm live: all four accounts sign in and see the correct rights; an invite, a deactivate/reactivate, and a password reset each work end to end against the live project

---

### Post-build — unchanged from v1.0

- [ ] Copy the updated `docs/supabase-setup.md` back into Tool A's repo

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| The Change Password screen was added by inference — it wasn't explicitly requested, but follows naturally from Admin-issued and Admin-reset passwords. Confirm it's wanted. | Builder | No — Claude Code proceeds with it unless told otherwise before the session |
| ~~Should the last Admin be prevented from removing their own Admin flag~~ — **resolved in v2.1.** The Access Architect's full run set this as a hard refusal for every Admin, not only the last one; `access-matrix.md` and `user-stories.md` are the source of truth Claude Code builds from. | Resolved | — |
| Is an audit trail of admin actions (who invited whom, who changed a role) wanted at some point? Currently `profiles.updated_by`/`updated_at` show only the most recent change. | Builder | No — deferred, listed in Section 12 |
| The three existing v1.0 accounts' passwords are still temporary, per `PROGRESS.md`. Should they be rotated via the new admin panel once it's built, instead of in the Supabase dashboard? | Builder | No — either route works; the panel makes it easier once live |
| All items still open in v1.0's `PROGRESS.md` remaining work (merge to main, disable public signup, Netlify config confirm, Pro plan upgrade, teardown of test data, live test pass) | Builder | These are unchanged by this spec and are tracked in `PROGRESS.md`, not here |
| Deployed URL for this tool | Builder | No — confirmed after deployment |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 14 September 2026 | Initial build. Internal login-protected review dashboard joining the existing "The corporate live build (New)" Supabase project as Tool B in a two-tool stack. Supabase Auth with email and password, invite-only, three accounts, one permission set (A2, Tier 3). Browser-direct database access using the publishable key, with a select policy and grant for `authenticated` and the `anon` deny-all left untouched. Three nullable columns added to `submissions` for the resolution trail. Two SECURITY DEFINER functions added for status transitions, with an advisory lock on the normalised company name and a blocked confirm that prevents a second active row per company. Overview with active-only totals, a route pie chart, and clickable needs_review and superseded counters. Risk flag board computing seven unweighted flags from the workbook's seven Yes/No dropdowns, with EcoVadis rows shown as not assessable rather than zero-flag, and a filter interlock pinning status to active and route to questionnaire. Supplier register with sort, company search, status and route filters, and a CSV export of register columns only. Supplier detail with full S2 to S7 answers by section, the resolution trail, and same-company history. Review page handling both the paired and single needs_review cases with a mandatory note per row. GDPR confirmed not applicable. Supabase project moved to the Pro plan. |
| v2.0 | 20 September 2026 | Access model changed A2 → A3: role-based permissions replace one shared permission set. New `profiles` table (role: ehs/esg/procurement, is_admin, is_active) and `user_role` enum. EHS and ESG keep full review rights (confirm/decline/flag with mandatory notes); Procurement becomes read-only everywhere, including no action area on Supplier Detail; CSV export stays available to all four roles. `resolve_submission` and `send_company_to_review` gain a role check, refusing Procurement with `not_authorized`. New `set_user_role` SECURITY DEFINER function for role/admin-flag reassignment, admin-gated, no service-role key needed. New User Management panel (Admin-only, reached via a nav link visible only to `is_admin = true`) for invite, deactivate/reactivate, and password reset — the first two and reset run through one new, narrowly-scoped Netlify Function holding the Supabase service role key server-side only, a deliberate, documented exception to v1.0's blanket "no service role key" rule. Invite stays manual handoff (one-time starter password shown once, sent by Admin over Teams/in person) — no email arm added. New Change Password screen lets any signed-in user set their own password. ESG Lead's existing account (z.hatquai@sustainos.io) seeded as the first Admin at migration. GDPR outcome unchanged — not applicable. |
| v2.1 | 20 September 2026 | Correction from the Access Architect's full run against v2.0, no new feature. v2.0 allowed an Admin to change their own role, Admin flag, or active state ("not specially guarded"). `access-matrix.md` and `user-stories.md` instead refuse this outright, for every Admin including the sole one, with no "last admin" exception. `set_user_role` and the Netlify Function's `set_active` action both now compare the target to the caller's own profile and refuse with `not_authorized`, writing nothing, when they match. The User Management panel disables the role dropdown and the Admin-flag and Deactivate/Reactivate toggles on the signed-in Admin's own row. The accepted consequence: recovering a locked-out sole Admin has no in-app path and requires the platform owner acting directly in the Supabase dashboard — recorded as a deliberate design choice, not a gap to fix. Section 15's related open question is resolved. Section 13 gains acceptance criterion 32a. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
