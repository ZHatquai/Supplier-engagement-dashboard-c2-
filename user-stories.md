# User Stories — The Corporate Supplier Review Dashboard 2026

**Written against:** product-spec.md v2.0 · supabase-setup.md as of 14 September 2026
**Date:** 20 September 2026
**Author:** Zyad Hatquai
**Status:** Confirmed
**Population pattern:** P1, as in access-matrix.md
**Companion file:** access-matrix.md (every story below cites exactly one cell of it:
`[table · action · role]`; a story that needs two cells is two stories)

> Read by the Project Governor (Iteration Mode) and by Claude Code when it builds the
> role checks and the User Management panel together. Each acceptance line is a screen
> test: the named person does the thing and sees the result. Stories whose cell is `no`
> are refusal tests and are as important as the others.

---

## The people

| Role | Named first holder | Layer | Opens |
|---|---|---|---|
| EHS | EHS Manager — sustaintrend@gmail.com | business | Login, Change Password, Overview, Risk Flag Board, Supplier Register, Supplier Detail (with action area), Review Page, blocked-confirm prompt |
| ESG | ESG Lead — z.hatquai@sustainos.io | business | same as EHS |
| Procurement | Procurement Manager — z.hatquai@gmail.com | business | Login, Change Password, Overview, Risk Flag Board, Supplier Register, Supplier Detail (no action area) |
| admin | held today by the ESG Lead's account | app admin (flag on `profiles.is_admin`) | everything its underlying role sees, plus User Management |
| platform owner | Zyad Hatquai | outside the app | Supabase and Netlify dashboards |

This tool is Tool B of a two-tool stack. All screens above belong to this tool. Tool A (the
Supplier Sustainability Portal) is unaffected by this build and has no stories here beyond
the carried-over `anon` refusal below, which belongs to its submission form.

EHS and ESG hold different values in `profiles.role` and are tracked separately because the
Admin flag can move between them (and to Procurement) over time, but their review rights
are identical today — every EHS story below applies to ESG unchanged, and is not repeated
story-for-story.

- **As a visitor with no login, I reach nothing in this tool, so that nothing leaks.**
  `submissions · read · anon` and `profiles · read · anon` (both = no)
  Acceptance: the login screen is the only page; a direct read of either table from the
  browser returns a permission error. Tool A's public submission form is unaffected and
  keeps writing through `submit_submission`.

---

## Stories by role and screen

### EHS — Overview, Risk Flag Board, Supplier Register

- **As EHS, I see the active-row totals, the route pie chart, and the needs-review and
  superseded counters, so that I know what needs my attention.** `submissions · read · EHS`
  Acceptance: the EHS Manager opens the Overview and sees identical numbers to ESG and
  Procurement; clicking either counter opens the Register pre-filtered to that status.
- **As EHS, I see every active questionnaire row's seven flag indicators, so that I can
  triage by risk.** `submissions · read · EHS`
  Acceptance: the EHS Manager opens the Risk Flag Board and sees flags computed for every
  active questionnaire row; EcoVadis rows read "not assessable via questionnaire".
- **As EHS, I search, sort, filter, and export the Supplier Register, so that I can work the
  full list and share a CSV.** `submissions · read · EHS`, `submissions · export · EHS`
  Acceptance: the EHS Manager filters to `needs_review`, exports, and the CSV carries the
  five register columns honouring that filter.

### EHS — Supplier Detail, Review Page, blocked-confirm prompt

- **As EHS, I confirm or decline a `needs_review` submission with a note, so that a
  reviewed row reaches its outcome.** `submissions · change state (confirm/decline) · EHS`
  Acceptance: the EHS Manager opens a `needs_review` row, enters a note, confirms it; the
  row becomes `active` and shows the EHS Manager's email and the note in the resolution
  trail. A blank note is rejected inline before the call is made.
- **As EHS, I flag an `active` or `superseded` row back to `needs_review` with a note, so
  that a row I've reconsidered gets a fresh look.** `submissions · change state (flag) · EHS`
  Acceptance: the EHS Manager flags a `superseded` row with a note; it becomes
  `needs_review` and reappears in the counter and the register under that status.
- **As EHS, I accept the blocked-confirm prompt when a company already holds another active
  row, so that the conflict is resolved by review rather than by a silent overwrite.**
  `submissions · change state (flag, via send_company_to_review) · EHS`
  Acceptance: the EHS Manager's confirm attempt is blocked with the conflicting row named;
  accepting sends both rows to `needs_review` with no note required at that step.
- **As EHS, I cannot invite, deactivate, or reassign a user, so that account management
  stays with Admin.** `profiles · create/update · EHS` (= no)
  Acceptance: the EHS Manager has no User Management link in the header; a direct call to
  the admin Netlify Function's endpoints as EHS returns 403 and changes nothing.

### ESG — everything EHS does, plus User Management (Admin flag)

- **As ESG (Admin), I do everything EHS does on submissions, so that either of us can carry
  the review workload.** `submissions · change state · ESG`
  Acceptance: the ESG Lead confirms, declines, and flags test rows identically to the EHS
  Manager's stories above.
- **As Admin, I invite a new user by email and role, so that a new colleague can sign in
  without touching the Supabase dashboard.** `profiles · create · admin`
  Acceptance: the ESG Lead opens User Management, invites a test email as Procurement, and
  the panel shows a one-time starter password once with a copy button; that password signs
  the new account in; the panel never shows it again.
- **As Admin, I deactivate a user, so that a leaver is refused sign-in at once.**
  `profiles · update (is_active) · admin`
  Acceptance: the ESG Lead deactivates the Procurement Manager's account; that account's
  open session is invalidated and its next sign-in attempt is refused; `submissions` rows
  are untouched.
- **As Admin, I reactivate a deactivated user, so that access can be restored without a new
  invite.** `profiles · update (is_active) · admin`
  Acceptance: the ESG Lead reactivates the Procurement Manager's account; sign-in succeeds
  again with the same credentials.
- **As Admin, I reset another user's password, so that a locked-out colleague can get back
  in without a self-service flow.** `profiles · update (via the Netlify Function) · admin`
  Acceptance: the ESG Lead resets the EHS Manager's password; the panel shows the new
  one-time password once; the old password no longer signs in.
- **As Admin, I reassign another user's role or Admin flag, so that access follows who is
  actually doing the work.** `profiles · update (role, is_admin) · admin`
  Acceptance: the ESG Lead changes the Procurement Manager's role to EHS; on that account's
  next action, it can confirm and decline — no stale permission, no re-login required.
- **As Admin, I cannot change my own role, Admin flag, or active state, so that the sole
  Admin can never accidentally lock the tool out of itself through the app.**
  `profiles · update (role, is_admin, is_active) · admin` (= no, when the target is the
  caller's own row)
  Acceptance: the ESG Lead's account attempts to drop its own Admin flag from the panel and
  is refused with `not_authorized`, nothing written; the same attempt against
  `set_user_role` and the Netlify Function's `set_active` action directly, bypassing the
  UI, is refused identically.

### Procurement — Overview, Risk Flag Board, Supplier Register, Supplier Detail (read only)

- **As Procurement, I see every submission's full detail and every risk flag, exactly as
  EHS and ESG do, so that I can factor risk into sourcing decisions.**
  `submissions · read · Procurement`
  Acceptance: the Procurement Manager opens the Overview, the Risk Flag Board, the
  Register, and any Supplier Detail page and sees content identical to EHS and ESG.
- **As Procurement, I export the Supplier Register to CSV, so that I can work the list
  outside the tool, the same as EHS and ESG.** `submissions · export · Procurement`
  Acceptance: the Procurement Manager exports with a status/route filter applied and gets
  the same five-column CSV as the other roles would for that filter.
- **As Procurement, I cannot confirm, decline, or flag a submission, so that review
  decisions stay with EHS and ESG.** `submissions · change state · Procurement` (= no)
  Acceptance: opening any Supplier Detail page as the Procurement Manager renders no action
  area at all — not disabled buttons, nothing in that space; calling `resolve_submission`
  or `send_company_to_review` directly as Procurement is refused with `not_authorized` and
  writes nothing.
- **As Procurement, I cannot reach the Review Page or the blocked-confirm prompt, so that I
  never see a workflow I cannot act in.** `submissions · change state · Procurement` (= no)
  Acceptance: the Procurement Manager has no entry point into either screen, because both
  are reached only from the action area it never sees.
- **As Procurement, I cannot see or reach User Management, so that account administration
  stays with Admin.** `profiles · create/update · Procurement` (= no)
  Acceptance: the Procurement Manager has no User Management link in the header; a direct
  call to the admin Netlify Function's endpoints as Procurement returns 403.

### Every role — Change Password

- **As any signed-in user, I change my own password, so that I can replace a starter or
  reset password Admin issued.** `profiles · change own password (own) · any role`
  Acceptance: each of the four accounts opens Change Password, enters its current and new
  password, and saves; a wrong current password shows an inline error and nothing changes;
  no account can reach or change another account's password from this screen.

---

## Stories that are refusals (collected)

The screen test list for this access stage. One line per `no` (or self-scoped `own`) in the
matrix.

| # | Who | Tries | Result | Cell |
|---|---|---|---|---|
| 1 | Procurement Manager | open the action area on Supplier Detail | nothing renders, not disabled buttons | `submissions · change state · Procurement` |
| 2 | Procurement Manager | call `resolve_submission` directly, bypassing the UI | `not_authorized`, writes nothing | `submissions · change state · Procurement` |
| 3 | Procurement Manager | call `send_company_to_review` directly | `not_authorized`, writes nothing | `submissions · change state · Procurement` |
| 4 | EHS Manager | open or navigate to User Management | no nav link, no route reachable | `profiles · create/update · EHS` |
| 5 | Procurement Manager | open or navigate to User Management | no nav link, no route reachable | `profiles · create/update · Procurement` |
| 6 | EHS Manager or Procurement Manager | call the admin Netlify Function's endpoints directly | HTTP 403, no data changed | `profiles · create/update · EHS/Procurement` |
| 7 | ESG Lead (Admin) | change their own `role` via `set_user_role` | `not_authorized`, writes nothing | `profiles · update (role) · admin` |
| 8 | ESG Lead (Admin) | drop their own `is_admin` via the panel or `set_user_role` directly | `not_authorized`, writes nothing | `profiles · update (is_admin) · admin` |
| 9 | ESG Lead (Admin) | deactivate their own account via the panel or the Netlify Function directly | `not_authorized`, writes nothing | `profiles · update (is_active) · admin` |
| 10 | anyone | delete a `submissions` row | no delete anywhere | `submissions · delete · everyone` |
| 11 | anyone | delete a `profiles` row (hard delete) | not exposed anywhere; deactivate only | `profiles · delete · everyone` |
| 12 | any signed-in user | change another user's password from Change Password | not possible; only their own account | `profiles · change own password · everyone` |
| 13 | a logged-out visitor | read `submissions` or `profiles` from the browser | permission error, not an empty list | `submissions/profiles · read · anon` |

---

## Later list (not this version)

- A history table on `profiles` recording every role/admin/active change, not just the
  most recent (`updated_by`/`updated_at` show only the last change today).
- A safeguard for the sole Admin being deactivated or losing its role with nobody else to
  recover it in-app — deferred per spec Section 15; the only recovery path today is the
  platform owner in the Supabase dashboard, per Hard Rule 2.
- An audit log of who invited whom and who changed a role, separate from the history table
  above if it ever needs to cover the Netlify Function's actions too.
