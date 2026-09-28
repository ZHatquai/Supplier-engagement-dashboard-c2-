# PROGRESS — The Corporate Supplier Review Dashboard 2026

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content, do not append. History lives in git.

**Session:** 4 — v2.1 deploy and closeout
**Last updated:** 28 September 2026
**Live URL:** deployed — builder to confirm the URL for this line [Rule: fill in after the first successful deploy]

## Current state

v2.1 is built, deployed, and closed out. The access model moved from A2 to A3 in session 3: three
functional roles, an Admin flag, a User Management panel, and a Change Password screen. All
Remaining work from session 3, carried v1.0 items included, is now closed per the builder's
confirmation this session — see Last session and Refusal test record below.

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

**Refusal test half A (session 3) and half B (session 4) are both done — see Refusal test record
below.** All 74 half-A assertions plus the half-B screen walk against the four named accounts pass.
Deploy gate is clear.

## Last session

Session 4. Builder closed out every item session 3 left in Remaining work and confirmed completion
directly rather than through a Claude Code-run check. Claude Code independently verified only what
the local repo can show: `origin/main` carries the merge commit for `claude/brave-feynman-1glm48`
(session 3's feature branch), closing that item, and the builder's Netlify screenshots confirmed
`SUPABASE_SERVICE_ROLE_KEY` and `SECRETS_SCAN_OMIT_KEYS` are set with the correct build settings.
Everything else below — Supabase dashboard settings, the Tool A doc copy, refusal test half B, and
the live pass — is recorded on the builder's word, not on a Claude Code-run test against the live
site; see Known issues for the one item this adds.

Session 3, prior: built the whole v2.1 upgrade — four migrations applied to the live project and
saved as files, the admin Netlify Function, the Change Password screen, the User Management panel,
the role-conditional action area, and the two route guards. Ran refusal test half A — 74 assertions,
all passing — and updated `docs/supabase-setup.md` to match.

One real bug was found and fixed by the screen harness rather than by reading: on a deep link or a
refresh, `AuthContext` briefly reported "profile resolved" for a session whose profile had not been
fetched yet, so the role-conditional routes rendered against a role nobody had read. An Admin
opening `/users` directly was bounced to the Overview. The resolved flag is now derived from which
account the loaded profile belongs to, so it cannot be true for the wrong session.

## Remaining work

All items carried from v1.0 and all v2.1 items are closed as of session 4, per the builder's
confirmation:

- [x] Rotate the three temporary account passwords.
- [x] Disable public signup in Supabase → Authentication → Providers.
- [x] Netlify publish directory `dist`, build command `npm run build`, `SECRETS_SCAN_OMIT_KEYS` set
      alongside both `VITE_` variables — verified by builder screenshot of the Netlify build
      settings and environment variables list.
- [x] Upgrade the Supabase project to Pro.
- [x] Copy the updated `docs/supabase-setup.md` back into Tool A's repo.
- [x] Merge `claude/brave-feynman-1glm48` into `main` — verified independently: `origin/main`
      carries the merge commit (`e386ff5`).
- [x] Add `SUPABASE_SERVICE_ROLE_KEY` as a Netlify environment variable — verified by builder
      screenshot; scoped to Builds, Functions, Runtime, not `VITE_`-prefixed.
- [x] Refusal test half B — the four named people, on the real deployed screens. Procurement: no
      action area at any status, no User Management link, `/users` redirects. EHS: same absence of
      User Management, action area renders correctly by status. ESG Lead (Admin): own row's role
      dropdown, Admin-flag toggle, and Deactivate toggle disabled with the inline note; Reset
      password still works on their own row; all controls enabled on other rows.
- [x] Live test pass after deploy: all four accounts sign in and see the correct rights; invite,
      deactivate/reactivate, and password reset each work end to end against the real admin Netlify
      Function.
- [x] Spec Section 13 items 28–31 and the deployed-bundle half of 33.
- [x] Walked the five by-hand scenarios in `docs/test-data/TEST-DATA-README.md` on the deployed
      site.
- [x] Ran `docs/test-data/teardown-test-submissions.sql` — the register now holds only real
      suppliers.
- [x] Leaked-password protection turned on in Supabase → Authentication.

Open, not gating:

- [ ] Optional: replace the 19 non-flag question labels in `src/lib/questionnaireSchema.js` with
      Tool A's exact strings — see Known issues.

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

**Half B — reported by the builder, 28 September 2026, against the four named accounts on the real
deployed screens.** Not run or observed by Claude Code — this session has no way to reach the live
site or sign in as any account. Recorded on the builder's confirmation:

- Procurement: no action area at any status on Supplier Detail; no User Management link.
- EHS: same absence of User Management; action area renders correctly by status.
- ESG Lead (Admin): own row's role dropdown, Admin-flag toggle, and Deactivate toggle disabled with
  the inline note; Reset password still works on their own row; all controls enabled on other rows.

Live pass (invite, deactivate/reactivate, reset password against the real admin Netlify Function;
all four accounts signing in with correct rights) is likewise recorded on the builder's confirmation
only — see Known issues.

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
- **Session 4's closeout (deploy, both refusal-test halves, the live pass, all Supabase-dashboard
  and Netlify settings) is recorded on the builder's confirmation, not on a check Claude Code ran
  itself.** This environment cannot reach the live site or the Supabase dashboard directly; of the
  items closed this session, only two were independently verified — the `main` merge commit
  (git) and the two Netlify settings shown in the builder's screenshots
  (`SUPABASE_SERVICE_ROLE_KEY`, `SECRETS_SCAN_OMIT_KEYS`, build command, publish directory).
  Everything else in Remaining work's closed list — password rotation, public signup disabled, the
  Supabase Pro upgrade, the `docs/supabase-setup.md` copy into Tool A's repo, refusal test half B,
  and the live pass — rests on the builder's word. Not a defect, just the honest provenance of this
  save point.
- **The 32 seeded test rows were removed via `docs/test-data/teardown-test-submissions.sql` this
  session, per the builder.** Not independently verified — see the note above.
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

Fill in the Live URL line at the top of this file — it's still a placeholder pending the builder
confirming the deployed address.
