# PROGRESS — The Corporate Supplier Review Dashboard 2026

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content, do not append. History lives in git.

**Session:** 3 — the v2.1 authorization upgrade
**Last updated:** 21 September 2026
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state

v2.1 is built. The access model moved from A2 to A3 this session: three functional roles, an Admin
flag, a User Management panel, and a Change Password screen. Nothing is deployed yet.

**Database — "The corporate live build (New)", complete and verified.** Four named migrations
applied and saved as files in `supabase/migrations/`:

- `user_role` enum (`ehs`, `esg`, `procurement`) and the `profiles` table (`user_id` PK referencing
  `auth.users(id)`, `email`, `role`, `is_admin`, `is_active`, `created_at`, `updated_at`,
  `updated_by`). No `created_by`, no history table, no extra index.
- `profiles` seeded for the three v1.0 accounts, matched on email so no generated id sits in a
  committed file: `sustaintrend@gmail.com` as `ehs`, `z.hatquai@sustainos.io` as `esg` with
  `is_admin = true`, `z.hatquai@gmail.com` as `procurement`.
- RLS enabled **and forced** on `profiles`, one `SELECT` policy and grant for `authenticated`.
  This project's default privileges hand every new public table to `anon` and `authenticated`
  outright, so the migration revokes everything first and grants back only `SELECT`.
- The role check inside `resolve_submission` and `send_company_to_review`: caller's `profiles.role`
  must be `ehs` or `esg`, else `not_authorized` and nothing is written. Placed immediately after the
  `no_session` check so v1.0's error taxonomy is unchanged, and before any argument is validated or
  any row is read.
- `set_user_role`, new, with both refusals: not an admin, or the target is the caller's own row.

**The one admin Netlify Function is built** — `netlify/functions/admin-users.js`, three actions
behind one endpoint (`invite`, `set_active`, `reset_password`). It validates the caller's Supabase
access token and re-reads their `profiles.is_admin` on every request before doing anything, so a
non-admin hitting the endpoint directly gets 403 whatever the panel rendered. `set_active` also
refuses a self-target. One-time passwords are generated with `node:crypto`, returned once, and
written to no log, column, or file.

**The service role key reaches nothing it should not.** `SERVICE_ROLE` and `service_role` appear
nowhere in `src/` or in the built `dist/`, and no JWT-shaped literal appears in either. Verified
after a clean rebuild (spec item 33, local half).

**Frontend — every v2.1 screen is built.** Change Password (any role, own password only, current
password checked by re-authenticating first), User Management (roster, invite, role and Admin-flag
save, deactivate/reactivate, reset password, one-time password panel with a copy button), the
Admin-only nav link, the role-conditional action area on Supplier Detail, and route guards on
`/users` and `/review/:id`. `npm run build` succeeds.

**Refusal test half A is done and recorded below — 74 assertions, all passing: 36 against the live
database and 38 against the screens.** Half B, the four named people on the real screens, is still
outstanding and gates the deploy.

## Last session

Session 3. Built the whole v2.1 upgrade: four migrations applied to the live project and saved as
files, the admin Netlify Function, the Change Password screen, the User Management panel, the
role-conditional action area, and the two route guards. Ran refusal test half A — 74 assertions,
all passing — and updated `docs/supabase-setup.md` to match.

One real bug was found and fixed by the screen harness rather than by reading: on a deep link or a
refresh, `AuthContext` briefly reported "profile resolved" for a session whose profile had not been
fetched yet, so the role-conditional routes rendered against a role nobody had read. An Admin
opening `/users` directly was bounced to the Overview. The resolved flag is now derived from which
account the loaded profile belongs to, so it cannot be true for the wrong session.

## Remaining work

Carried from v1.0, still open:

- [ ] **Builder: rotate the three temporary account passwords.** Easiest route now is the new
      panel's Reset password action, once deployed — see Open questions in spec Section 15.
- [ ] **Builder: disable public signup** in Supabase → Authentication → Providers. Not yet confirmed.
- [ ] Builder: confirm the Netlify publish directory is `dist` and the build command is
      `npm run build`, and that `SECRETS_SCAN_OMIT_KEYS` is saved alongside both `VITE_` variables
- [ ] Builder: upgrade the Supabase project to Pro (manual billing step)
- [ ] Builder: copy the updated `docs/supabase-setup.md` back into Tool A's repo so the two tools do
      not drift on schema truth
- [ ] Optional: replace the 19 non-flag question labels in `src/lib/questionnaireSchema.js` with
      Tool A's exact strings — see Known issues

New for v2.1, in order:

- [ ] **Builder: merge `claude/brave-feynman-1glm48` into `main`.** This session was pinned to a
      feature branch, so Netlify only sees v2.1 once main moves. Sessions 1 and 2's branches are
      already merged.
- [ ] **Builder: add `SUPABASE_SERVICE_ROLE_KEY` as a Netlify environment variable, not
      `VITE_`-prefixed.** The key exists on the project but is not yet in this tool's environment.
      **Until it is, the User Management panel's three actions return "This function is not
      configured" and nothing else in the tool is affected.**
- [ ] **Refusal test half B — the four named people, on the screens.** Do not consider this phase
      done until it passes. Procurement confirms no action area renders on Supplier Detail at any
      status and that User Management is absent from the header; EHS confirms the same absence;
      the ESG Lead confirms their own row's role dropdown and Admin-flag and Deactivate toggles are
      disabled and that Reset password still works on it.
- [ ] Live test pass after deploy: all four accounts sign in and see the correct rights; an invite,
      a deactivate/reactivate, and a password reset each work end to end. This closes the two seams
      no local session can reach — the browser-to-Supabase network call under a genuine JWT, and the
      admin Netlify Function, which cannot run without Netlify and the service role key.
- [ ] Spec Section 13 items that can only be closed live: 28 (a direct call to the admin endpoint as
      a non-admin returns 403), 29 (invite), 30 (deactivate/reactivate), 31 (reset password), and the
      deployed-bundle half of 33.
- [ ] Walk the five by-hand scenarios in `docs/test-data/TEST-DATA-README.md` on the deployed site.
- [ ] **Run `docs/test-data/teardown-test-submissions.sql` before the three colleagues use the tool
      for real**, so the register they see holds only real suppliers.
- [ ] Builder, optional but cheap: turn on leaked-password protection in Supabase → Authentication.
      The security advisor flags it as off, and the tool now issues starter passwords.

## Refusal test record

**Half A — Claude Code, 21 September 2026, against the live project. 74 assertions, all passing:
14 at grant level, 17 at function level, 5 on the write paths, and 38 on the screens.**
Recorded per `docs/access-matrix.md` Section 6. Nothing below wrote anything: the refusals write
nothing by design, and the two write-path checks ran inside a transaction that was rolled back. The
three accounts and the one test row were re-read afterwards and are byte-for-byte as they were.

*Method.* The browser and `curl` in the build container cannot reach the Supabase host — the
environment's network policy refuses the CONNECT — so half A ran in-database through the Supabase
MCP, setting `request.jwt.claims` on the connection exactly as PostgREST sets it for a signed-in
caller, and under `SET LOCAL ROLE` for the grant-level checks. The admin Netlify Function's three
endpoints cannot be exercised at all without Netlify and the service role key; they are listed
under Remaining work and are half B's and the live pass's to close.

**Grant level — attempted, not just inspected.**

| Role | Attempt | Result |
|---|---|---|
| authenticated | `SELECT` on `submissions`, on `profiles` | allowed, both |
| authenticated | `INSERT`, `UPDATE`, `DELETE` on `submissions` | refused, 42501, all three |
| authenticated | `INSERT`, `UPDATE`, `DELETE` on `profiles` | refused, 42501, all three |
| anon | `SELECT` on `submissions`, on `profiles` | refused, 42501, both |
| anon | `EXECUTE` on `resolve_submission`, `send_company_to_review`, `set_user_role`, `submit_submission` | refused, 42501, all four |

**Function level — as each named person's session.**

| # | Who | Tried | Result |
|---|---|---|---|
| R1 | Procurement Manager | `resolve_submission(needs_review row, confirm, note)` | `not_authorized` |
| R2 | Procurement Manager | `resolve_submission(active row, flag, note)` | `not_authorized` |
| R3 | Procurement Manager | `resolve_submission(an id that does not exist, confirm, note)` | `not_authorized` — refused before the row is looked up |
| R4 | logged-out visitor | `resolve_submission(...)` | `no_session` |
| R5 | EHS Manager | `resolve_submission(an id that does not exist, ...)` | `not_found` — control, role gate passed |
| R6 | EHS Manager | `resolve_submission(active row, flag, blank note)` | `note_required` — control |
| R7 | ESG Lead | `resolve_submission(needs_review row, bogus action, note)` | `invalid_action` — control |
| S1 | Procurement Manager | `send_company_to_review(needs_review row)` | `not_authorized` |
| S2 | logged-out visitor | `send_company_to_review(...)` | `no_session` |
| S3 | EHS Manager | `send_company_to_review(an id that does not exist)` | `not_found` — control |
| U1 | EHS Manager | `set_user_role(Procurement Manager, esg, admin=true)` | `not_authorized` |
| U2 | Procurement Manager | `set_user_role(EHS Manager, esg, admin=true)` | `not_authorized` |
| U3 | logged-out visitor | `set_user_role(...)` | `no_session` |
| **U4** | **ESG Lead (Admin)** | **`set_user_role(their OWN row, procurement)` — self role change** | **`not_authorized`, nothing written** |
| **U5** | **ESG Lead (Admin)** | **`set_user_role(their OWN row, esg, admin=false)` — dropping their own Admin flag** | **`not_authorized`, nothing written** |
| U6 | ESG Lead (Admin) | `set_user_role(Procurement Manager, bogus role)` | `invalid_role` — control, admin gate passed |
| U7 | ESG Lead (Admin) | `set_user_role(an id with no profile, ehs)` | `not_found` — control |

**Write paths, inside a rolled-back transaction.**

| # | What | Result |
|---|---|---|
| W1 | EHS flags an active row | `ok`, status `needs_review`, `resolved_by` the EHS Manager's email — v1.0's write path is intact |
| W2a | Admin sets the Procurement Manager's role to `ehs` | `ok`, `updated_by` the ESG Lead's email |
| W2b | that same account confirms on its **very next call**, no re-login | `ok`, status `active` — spec item 32 |
| W2c | Admin sets the role back to `procurement` | `ok` |
| W2d | that account tries again | `not_authorized`, immediately |

**Screen level — 38 assertions, all passing.** The real shipped `App`, `AppShell`, pages, contexts,
and `lib` modules rendered in jsdom with only `src/lib/supabase.js` replaced by a stub, since the
network seam is unreachable here. The harness lived in a scratch directory and was not committed.

- Procurement: no action area on a `needs_review` row and none on an `active` row — not disabled
  buttons, nothing in that space, with the read-only content above it intact; no link into the
  review page; `/users` redirects to the Overview and the panel does not render; `/review/:id`
  redirects to the submission; no User Management link in the header; Change password link present;
  export still available on the register.
- EHS: action area renders at every applicable status, the review page is reachable and renders,
  no User Management link, `/users` still redirects.
- ESG with the Admin flag: the nav link renders, the panel renders with the roster, and on **their
  own row** the role dropdown, the Admin-flag toggle, the Deactivate toggle, and Save role are all
  disabled with the inline note pointing at the Supabase dashboard, while Reset password stays
  available — and the same controls on another row are all enabled.
- Change Password: a wrong current password is refused inline and calls no update; the right one
  saves and calls `updateUser` exactly once.
- No Acid Lime on either new screen, as the brand rule requires.

[Rule: kept, never cleared; the handover package copies it. Any change to a rule re-runs both halves
before the push.]

## Build decisions

Carried from v1.0 and unchanged: plain Tailwind components with `.tc-*` primitives instead of
shadcn/ui; `border-radius` and `box-shadow` disabled at the Tailwind core-plugin level and forced off
in CSS; Acid Lime used once per page, never twice; flag indicators as a filled Ink square or a Stone
hairline outline, no colour carrying meaning; the flag board's status control pinned to Active and
disabled; register filter state in the URL query string; the paired resolution issuing the confirm
first; both functions returning structured `jsonb` rather than raising; `resolve_submission` also
returning a `conflicts` array; CSV cells beginning `=`, `+`, `-`, or `@` prefixed with an apostrophe;
`groupAnswers` showing unrecognised keys under "Other answers".

New this session:

- The role check goes **after** the `no_session` check in both review functions, not strictly first.
  A caller with no session still gets `no_session`, so v1.0's documented error taxonomy is unchanged,
  and the role refusal still lands before any argument is validated and before any row is read.
- `set_user_role`'s self-target check sits **before** `p_role` is validated, so an admin naming their
  own `user_id` is refused with `not_authorized` whatever role they asked for. The refusal never
  leaks which part of the request was wrong.
- The admin function uses the Lambda-compatible `export const handler` signature rather than the
  newer default-export form: it needs no extra dependency and no `Request`/`Response` polyfill.
- The function reads the project URL from `SUPABASE_URL` or `VITE_SUPABASE_URL`, so the build needs
  exactly one new environment variable rather than two.
- One-time passwords are four groups of four from an alphabet with no `0`/`O` and no `1`/`l`/`I`.
  They are read aloud or copied by hand during the manual handoff.
- `netlify.toml` added, declaring only the functions directory and the esbuild bundler. The build
  command and publish directory stay in the Netlify site settings, untouched.
- The panel refreshes the roster **and** the signed-in account's own profile after every action, and
  `AppShell` re-reads the profile on every navigation, so the screen agrees with the database
  without a re-login. The database is still what enforces it.
- Nothing role-conditional renders until the profile has resolved for the current session, so the
  action area never flashes into view for an account that cannot act and a deep link is never
  bounced against a role nobody has read.
- `jsdom` was installed with `--no-save` for the screen harness only. `package.json` and
  `package-lock.json` are unchanged.

## Known issues

- **A deactivated account's existing access token stays valid until it expires.** Supabase's ban
  refuses sign-in and refuses token refresh at once, which is what the panel's copy promises and what
  the matrix's screen test checks, and the Supabase client signs the user out when the refresh fails.
  But an access token already issued is verified by signature alone, so in the worst case a
  deactivated account could still read for the remainder of the token's life (one hour by default).
  Closing that window entirely would mean an `is_active` check inside the review functions, which
  `docs/access-matrix.md` does not name as a mechanism, or a shorter JWT lifetime in the dashboard.
  Recorded rather than built.
- **The 32 seeded test rows are live in the shared table right now.** They are fabricated, but they
  are visible to Tool B users, count in Tool A's duplicate matching, and export to CSV like any other
  row. `docs/test-data/teardown-test-submissions.sql` removes them and nothing else. The four
  `ZZ Blocked Test` rows from session 2 are already gone.
- **The three account passwords are temporary and were set by Claude Code, not by the builder.**
  Rotate all three before the colleagues use the tool. The new panel's Reset password action is the
  easiest route once the tool is deployed and the service role key is in the environment.
- **Public signup has not been confirmed as disabled.** The MCP exposes no auth-settings tool.
  Nothing in this tool offers a signup path, but the Supabase endpoint is open until that setting is
  off.
- **19 of the 26 question labels are derived, not verbatim.** Tool A's `questionnaireSchema.js` is
  not in this repo, so only the seven flag-bearing questions carry the exact wording from spec
  Section 9. They are display labels only — nothing is computed from them.
- The security advisor reports `authenticated_security_definer_function_executable` (WARN) for the
  three Tool B functions. That is the design, not a defect: a narrow `SECURITY DEFINER` function is
  exactly how a signed-in user writes without a table grant. The pre-existing `rls_auto_enable`
  finding is unchanged and belongs to neither tool.
- Confirmed correct, not a defect: `send_company_to_review` writes `resolved_by` and `resolved_at`
  but leaves `resolution_note` as it was, so a row can briefly show an older note beside a newer
  timestamp. Spec Section 6 requires exactly this.
- Spec Section 9 contains a contradiction. The prose sentence below the flag table says three flags
  raise on No and four on Yes; the per-question table says the opposite. The table is authoritative
  and the build follows it: four raise on No (SBTi, human rights policy, due diligence, conflict
  minerals) and three raise on Yes (PFAS, water stress, protected area). Correct the sentence at the
  next spec revision.
- Standing GDPR note: the CSV export moves supplier contact names outside the controlled system,
  outside RLS, and outside any deletion process. A known limit of the tool, not a defect.
- Standing GDPR note: deletion requests arrive at sustainability@thecorporate.com and are actioned
  manually in the Supabase table editor. `authenticated` has no delete grant on either table.
  Deleting a `submissions` row also destroys its resolution trail, which is accepted. A `profiles`
  row must be removed before its `auth.users` row, because the foreign key has no `ON DELETE` action.
- Expected and not a bug: if a reviewer flags a company's only active row down to `needs_review` and
  a new submission then arrives, Tool A matches only against active rows, finds none, and writes the
  new row as active. The company then holds one active row and one under review.

## Backlog

- Automatic invite emails — pending a sender; needs the Email arm, a verified sending domain, and
  Resend. Invite stays manual handoff (starter password shown once, handed over on Teams or in
  person) until then.
- Self-service password reset (a forgotten-password link) — not requested; Admin's reset action
  covers it.
- An audit log of admin actions (who invited whom, who changed a role and when) — not requested.
  `profiles.updated_by`/`updated_at` show only the most recent change; a full log is a new table, not
  a redesign, if it matters later.
- An in-app recovery path for the sole Admin's own account — not a gap to fix. v2.1 deliberately
  refuses every self-change, Admin included, so the only recovery is the platform owner acting
  directly in the Supabase dashboard.
- A committed test suite — not in place. Sessions 2 and 3 both built throwaway harnesses in scratch
  directories. Committing one would mean adding `jsdom` (and Playwright, for the browser half) as dev
  dependencies, a test runner, and a script; CLAUDE.md rule 12 says build no test suite, so it stays
  here rather than in the repo.
- The v1.0 and Tool A migrations as files. The four v2.1 migrations are saved in
  `supabase/migrations/`; the seven before them live only in the project's migration history.
  Backfilling them would mean transcribing already-applied SQL — worth doing only if the project is
  ever rebuilt from files.
- Handover: move authentication to The Corporate's own SSO if this tool ever leaves the teaching
  context and runs against a real corporate identity estate.

## Notes for next session

None.
