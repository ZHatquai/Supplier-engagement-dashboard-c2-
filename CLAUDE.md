# The Corporate Supplier Review Dashboard 2026

## Identity
An internal, login-protected dashboard where EHS and ESG review supplier submissions (confirm/decline/flag, each with a note) against seven computed risk flags; Procurement reads and exports the same data but cannot act on it; one account additionally carries an Admin flag and manages other users' access in-app.
Tier: 3 — persisted Supabase data behind Supabase Auth, with different roles holding different permissions (D3+A3)
Spec version governed: v2.1 — the version of docs/product-spec.md these rules were derived from.
Position: Tool B of 2 in the "The corporate live build (New)" stack — shares the Supabase project with the Supplier Sustainability Portal (Tool A, live at v3.0, unaffected by this build).

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line above, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it."
3. Read PROGRESS.md in the project root — it is the current state of this build. If missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. This is not session 1 — skip First Session Setup below.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, grant, or function), update docs/supabase-setup.md in the same save point, and tell the builder to copy it back into Tool A's repo so the two tools do not drift.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only, already complete for this build): create docs/ and move product-spec.md, supabase-setup.md, access-matrix.md and user-stories.md into it; install the brand skill at .claude/skills/the-corporate-brand/.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session, Remaining work, Build decisions, Known issues, Backlog, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS (plain components with `.tc-*` brand primitives, no shadcn/ui — see PROGRESS.md Build decisions) · Netlify · Supabase
Deployment: GitHub push to main, then Netlify auto-deploys. Claude Code is connected to GitHub and pushes to main; it does not connect to Netlify — no Netlify connector or MCP in this workflow. The one new Netlify Function this build adds is served from the same site as the existing static build.

## Arms
Export — browser only, no server function — CSV of the Supplier Register's own five columns (company_name, contact_name, route, status, created_at). Available identically to all four roles (EHS, ESG, Procurement, Admin) — export follows read, not the review restriction.

## Environment Variables
VITE_SUPABASE_URL — the project URL — Netlify env var, browser-facing. Unchanged from v1.0.
VITE_SUPABASE_PUBLISHABLE_KEY — the project's publishable (anon) key — Netlify env var, browser-facing. Unchanged from v1.0.
SUPABASE_SERVICE_ROLE_KEY — new in v2.0. The project's service role key — Netlify env var, NOT `VITE_`-prefixed, read only inside the one admin Netlify Function. Never referenced anywhere in src/, never sent to the browser.
SECRETS_SCAN_OMIT_KEYS — Netlify env var only, listing both VITE_ variables, so Netlify's secrets scanner does not fail the build on values that belong in the bundle by design.
At session start, confirm these exist before first use; prompt the builder for any missing. The service role key exists on the project but had not yet been added to this tool's Netlify environment as of v2.1 — see PROGRESS.md.

## Supabase
Project: "The corporate live build (New)" — already exists, created by Tool A's build on 7 September 2026. Region eu-central-1 (Frankfurt). Postgres 17. Plan: Pro.
The project ref and URL are deliberately recorded in no file in this repo, or any committed file. Refer to the project by name only, in every document and commit message.
docs/supabase-setup.md is the schema source of truth. Read it before any database work. Never recreate, rename, retype, or drop anything that already exists.

Tables this tool uses:
- submissions (existing, unchanged this build) — id, company_name, contact_name, contact_email, contact_phone, job_title, department, route, ecovadis_link, questionnaire_answers, status, created_at, resolved_by, resolved_at, resolution_note. All twelve original columns plus the three v1.0 resolution columns; none is touched by this build.
- profiles (new this build) — user_id (uuid, PK, references auth.users(id)), email (text, kept in sync by every admin action), role (user_role enum: ehs/esg/procurement), is_admin (boolean, default false), is_active (boolean, default true), created_at, updated_at, updated_by (text — acting admin's email). No created_by (a profile is created by invite, not a submitter) and no history table this version.
- New enum: user_role — ehs, esg, procurement.

RLS — enabled and forced on both tables, never disabled. Every rule below is lifted from docs/access-matrix.md; build each one with the mechanism its Section 6 policy plan names, and never loosen a table to make a screen work.
- anon: zero policies, zero grants on submissions and on profiles. Tool A's submit_submission remains the only write path for anon, unchanged.
- authenticated, submissions: SELECT all rows (the v1.0 policy and grant, untouched). No direct INSERT/UPDATE/DELETE — status and the resolution trail change only through resolve_submission and send_company_to_review, both now role-gated.
- authenticated, profiles: SELECT all rows — every signed-in role, Procurement included, can read the full roster through the API (this is a screen refusal in the panel's nav link and route, not a row restriction — see docs/access-matrix.md Section 4). No direct INSERT/UPDATE/DELETE. role/is_admin change only through set_user_role; is_active/email change only through the one admin Netlify Function.
- service_role: unchanged, used by Tool A's submission function, and now also by the one admin Netlify Function for the three auth.users operations RLS cannot express.

Four SECURITY DEFINER functions, all pinning search_path to public, pg_temp, all with EXECUTE revoked from public/anon and granted to authenticated only:
- resolve_submission(p_id, p_action, p_note) — carried over from v1.0, new check: refuses not_authorized, writing nothing, unless caller's profiles.role is ehs or esg. Everything else (three actions, mandatory note, wrong-status refusal, blocked confirm, advisory lock) is unchanged — see docs/supabase-setup.md.
- send_company_to_review(p_id) — carried over, same role check, same refusal.
- set_user_role(p_user_id, p_role, p_is_admin) — new. Refuses not_authorized unless caller's profiles.is_admin is true. Refuses not_authorized, writing nothing, if p_user_id matches the caller's own profile — no exception, even for the sole Admin. Validates p_role against ehs/esg/procurement. Writes role, is_admin, updated_at, updated_by (caller's email from auth.jwt()).
- The one admin Netlify Function (not a Postgres function) — holds SUPABASE_SERVICE_ROLE_KEY server-side only. Exposes invite / set_active / reset_password behind one endpoint. Checks the caller's session and profiles.is_admin before anything. set_active additionally refuses when the target is the caller's own row. One-time passwords are generated server-side, returned once, never logged or stored beyond the Auth hash.

At every save point that touches the database, update docs/supabase-setup.md (the new enum, the new table, the new RLS policy and grant on profiles, the two changed functions plus the new one, the new env var, the last-updated line) and copy it back into Tool A's repo — unchanged practice from v1.0.

## Hard Rules
1. Refusal happens in the database, or in a server function that holds the secret key and checks every request itself — never only in the screen. RLS is on for submissions and profiles and is never disabled to make something work. anon has no policy and no table grant on either table; Tool A's public form writes only through submit_submission. The admin Netlify Function holds the service role key and bypasses RLS, so for its three operations the function is the rule: it checks the caller's session and profiles.is_admin every time, regardless of what the UI shows.
2. Nobody changes their own role, is_admin, or is_active through the app — Admin included. set_user_role and the Netlify Function's set_active both refuse a caller acting on their own profile row and write nothing. If the sole Admin's own access ever needs to change, that is the platform owner in the Supabase dashboard — the same backstop every role/admin/active change ultimately has.
3. submissions' business content is frozen for everyone from the moment Tool A creates the row; nothing here ever edits a supplier-provided value. status moves between active/superseded/needs_review only through resolve_submission and send_company_to_review, both gated on role being ehs or esg.
4. Nothing is deleted through the app. No submissions row is ever deleted; no profiles row is ever hard-deleted — deactivate (is_active = false) and reactivate only. Supplier deletion requests are still actioned by hand in the Supabase table editor.
5. profiles carries created_at/updated_at/updated_by only — no created_by, no history table this version. submissions carries no new audit columns; its v1.0 resolved_by/resolved_at/resolution_note are unchanged.
6. Migrations: every schema, policy, trigger, or function change is a named migration saved as a file in supabase/migrations/, committed with the save point.
7. API keys never in any frontend file or GitHub commit. The publishable key is browser-safe by design; the service role key is the one narrow exception (see Environment Variables), stored only as a Netlify Function env var, never in src/, never in the built bundle — verify this explicitly at the save point that adds the function, and again at the acceptance-criteria pass (spec item 33).
8. Netlify Identity: never. Supabase Auth is the only authentication system in this stack.
9. This tool shares a Supabase project with Tool A. Protected objects, never modified, dropped, or recreated: the submissions table and its twelve original columns, the submission_route and submission_status enums, the submissions_route_payload_check constraint, the three existing indexes, and Tool A's submit_submission and check_submission_duplicate functions.
10. Every access rule lives in docs/access-matrix.md; build each line of its policy plan with the mechanism it names, and never invent one it does not state.
11. Password reset routes: the Change Password screen for a signed-in user's own password (a plain client-side updateUser call, no new key or function), or Admin's reset_password action via the Netlify Function for someone else's. No dashboard reset path is offered in this tool.
12. Build no rate limit, queue, retry, scan, monitor, or test suite. If a spec line wants one, put it on PROGRESS.md Backlog as "not in place; what it would take."

## Project Structure
```
/                     ← root: CLAUDE.md, PROGRESS.md only
/src
  /components
  /lib                ← Supabase client, utilities, questionnaireSchema.js
/netlify/functions    ← the one admin function (invite / set_active / reset_password)
/docs                 ← product-spec.md, supabase-setup.md, access-matrix.md, user-stories.md
/supabase/migrations  ← one .sql file per applied migration
/.claude/skills/the-corporate-brand/
```

## Brand
Brand is governed by the the-corporate-brand skill at .claude/skills/the-corporate-brand/SKILL.md. Invoke it for any UI or visual work, including the new Change Password screen and User Management panel.
Hard rules that hold even if the skill is not loaded:
- Background: #F2F2F2 (Chalk) for pages, #EAE4D5 (Linen) for surfaces. Never white, never Tailwind gray defaults.
- Accent: #C8F135 (Acid Lime), maximum two uses per page, always against #000000, never directly on a light background.
- Font: Playfair Display for headlines, DM Sans 300 for body.
- No border-radius anywhere. No drop shadows — 0.5px Stone (#B6B09F) hairline borders instead.
- The pie chart, the three status badges, and the seven flag indicators stay neutral-palette only; the User Management panel and Change Password screen follow the same restraint — no new lime surface.

## Business Rules
- Seven unweighted risk flags. Four raise on No: SBTi validated target, human rights and labour rights policy, human rights due diligence in the last 24 months, conflict minerals policy. Three raise on Yes: PFAS, high-water-stress region, protected area or biodiversity hotspot. Never normalise these to one direction.
- Flags are computed in the browser at render time, only for rows that are route = questionnaire and status = active, and are never written to the database.
- EcoVadis rows read "not assessable via questionnaire" — never a zero, a count, or an empty indicator set — and sort to the end of the flag board regardless of sort direction.
- A missing, blank, or unexpected answer raises no flag and shows as unanswered on the detail page. Matching is case-insensitive and ignores surrounding whitespace.
- Overview totals count active rows only. Needs-review and superseded are separate counters, each opening the register filtered to that status.
- Selecting any flag filter pins status to active and route to questionnaire and disables both controls. Clearing every flag filter restores the previous selections.
- The register defaults to status = active on arrival, sorted by date submitted, newest first.
- The CSV carries the five register columns only. It honours the status and route filters and ignores the search box and the sort.
- A non-blank note is mandatory on confirm, decline, and flag, enforced inside the function and not only by the form.
- A confirm that would leave a company with two active rows is refused outright and writes nothing, returning blocked with the conflicting row IDs. Accepting the prompt sends the row and every conflicting active row to needs_review, with no note required at that step.
- resolved_by is read from auth.jwt(); the client never supplies it. The resolution trail is write-once — the next decision on a row overwrites all three columns together.
- New in v2.0: role and admin authorization are read fresh from profiles on every call, never cached — a role change mid-session takes effect on that account's very next action, no re-login required.
- New in v2.0: the Supplier Detail action area is role-conditional. EHS or ESG at needs_review see Confirm and Decline; EHS or ESG at active or superseded see Flag. Procurement sees no action area at any status — not disabled buttons, nothing rendered in that space.
- New in v2.0: the User Management panel and its nav link render only when the signed-in account's profiles.is_admin is true.
- New in v2.1: on the signed-in Admin's own row in the panel, the role dropdown and the Admin-flag and Deactivate/Reactivate toggles are disabled, with a short inline note pointing to the Supabase dashboard.

Out of scope — do not build:
- Any change whatsoever to the Supplier Sustainability Portal.
- Editing any supplier-provided value.
- Automatic invite emails — manual handoff by design; would need the Email arm, a verified sending domain, and Resend.
- Self-service password reset (a forgotten-password link).
- An audit log of admin actions beyond the current updated_by/updated_at (a new table, not a redesign, if it matters later).
- An in-app recovery path for the sole Admin's own account — by design, per v2.1; the only recovery is the platform owner in the Supabase dashboard.
- Email alerts on a new needs_review row.
- AI reading, summarising, or classifying the S2–S7 open-ended answers.
- Scheduled jobs, digests, or automated recalculation.
- Undoing or editing a resolution note once written.
- A separate rejected status.
- Supplier roster, non-responder tracking, or submission chasing.
- Weighting, scoring, or grading the seven flags.
- Flag columns or questionnaire answers in the CSV.
- PDF export of a supplier submission.
- Automated EcoVadis scorecard validation.
- Deleting submissions from the dashboard.
- Permanently deleting a user account — deactivate only, reversible; no hard delete anywhere.

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full view specs, the seven flag definitions, the status transition table, acceptance criteria
- docs/supabase-setup.md — schema source of truth, read first
- docs/access-matrix.md — read before writing any RLS or touching a policy; every policy is built from its Section 6 policy plan
- docs/user-stories.md — read before changing a screen or a role; every acceptance line is a screen test
- .claude/skills/the-corporate-brand/SKILL.md — full brand system
PROGRESS.md in the root is read at every session start per the Session Protocol.
