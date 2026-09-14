# The Corporate Supplier Review Dashboard 2026

## Identity
An internal, login-protected dashboard where three named colleagues at The Corporate read every supplier submission, see seven sustainability risk flags computed from the questionnaire answers, and confirm, decline, or flag submissions for review.
Tier: 3 — data persists in Supabase and a login sits on top of it, with every signed-in user holding exactly the same permissions (D3+A2: persisted data, authentication without authorization, so no roles and no per-role policy set).
Spec version governed: v1.0 — the version of docs/product-spec.md these rules were derived from.
Position: Tool B of 2 in the "The corporate live build (New)" stack. Shares the Supabase project with The Corporate Supplier Sustainability Portal 2026 (Tool A, Tier 2, live). Tool A owns and created the schema; this tool builds on the existing schema and adds only what the Supabase section below describes.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root. It is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, column, policy, grant, function, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one. An ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md and supabase-setup.md into it.
2. Install the brand skill: create .claude/skills/the-corporate-brand/ and place the provided brand file there as SKILL.md.
3. Create .gitignore in the root containing `.env.local` before the first commit. The builder's local env file carries the project URL, which must never enter git history.
4. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3 to 5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · shadcn/ui · Netlify · Supabase
Deployment: GitHub push to main, then Netlify auto-deploys from main. Claude Code is connected to GitHub and pushes to main. It does NOT connect to Netlify and there is no Netlify connector. The builder connects the repo to a Netlify site once in the Netlify dashboard and sets the environment variables there before the first functional build, because Vite reads them in at build time and setting them afterwards does not fix an already-built bundle. Netlify build command: `npm run build`. Publish directory: `dist`.

## Arms
Export — browser only, no server function — CSV of the Supplier Register's own five columns.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var, mirrored in a gitignored .env.local for local testing
VITE_SUPABASE_PUBLISHABLE_KEY — Supabase: Project Settings → API → publishable (anon) key — Netlify env var, mirrored in a gitignored .env.local
SECRETS_SCAN_OMIT_KEYS — Netlify env var only, set by the builder, listing both VITE_ variables. Netlify's secrets scanner otherwise fails the build when it finds them in the bundle, which is where they belong by design.

Both VITE_ variables are read by the browser, which is correct here and is the opposite of Tool A, where the equivalent variables are server-side only and unprefixed. At session start, confirm these exist before first use and prompt the builder for any that are missing. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "The corporate live build (New)" — already exists, created by Tool A's build on 7 September 2026. Region eu-central-1 (Frankfurt). Postgres 17.
The project ref and URL are deliberately recorded in no file in this repo. The builder supplies them directly at the start of the session. Refer to the project by name in every document and commit message.
docs/supabase-setup.md is the schema source of truth. Read it before any database work. Never recreate anything that already exists. Update it at every save point that touches the database.
Plan: Pro. The upgrade is a manual billing step in the Supabase dashboard. Flag to the builder until it is done.

Table this tool uses:
submissions — id, company_name, contact_name, contact_email, contact_phone, job_title, department, route, ecovadis_link, questionnaire_answers, status, created_at. All existing. Do not recreate, rename, retype, or drop any of them.

The only database changes this build makes:
- Three nullable columns on submissions: resolved_by (text), resolved_at (timestamptz), resolution_note (text). No default, no NOT NULL, no check constraint. Tool A's submit_submission inserts a fixed column list and any of those three would break it.
- One SELECT policy for `authenticated` on submissions, plus re-issuing the SELECT grant to `authenticated`. Grants were revoked from both roles in Tool A's build, so a policy alone does nothing.
- Two SECURITY DEFINER functions: resolve_submission(p_id uuid, p_action text, p_note text) and send_company_to_review(p_id uuid). Both pin search_path to public, pg_temp, both revoke EXECUTE from public and anon, both grant EXECUTE to authenticated only, and both take pg_advisory_xact_lock on the normalised company name before reading.

Auth: email and password via Supabase Auth, invite-only. The builder creates the three accounts in the dashboard and disables public signup. No signup UI, no password reset self-service, no account creation path anywhere in this tool.

RLS on submissions after this build:
anon — no read, no insert, no update, no delete. Zero policies, zero grants. Unchanged.
authenticated — read all rows. No insert, no update, no delete. Status and the three resolution columns change only through the two functions above.
service_role — unchanged, used by Tool A's submission function.

Before finishing any database save point, verify in-database that anon still holds no privilege on the table or on any function, and that authenticated holds select and nothing else.

## Hard Rules
- API keys never in any frontend file or GitHub commit. The Supabase publishable key is browser-facing by design and is safe here only because anon has zero policies and zero grants.
- The service role key is not used by this tool and must never be added to it: not to the code, not to its Netlify environment variables, not to .env.local. It bypasses all RLS. Tool A uses it server-side; that is Tool A's concern and does not cross over.
- The project ref and project URL never appear in any committed file, including CLAUDE.md, PROGRESS.md, docs, and commit messages.
- Netlify Identity: never. Supabase Auth is the only authentication system in this stack.
- RLS is never disabled or unforced on submissions. If a query fails, fix the policy or the query.
- The anon deny-all stays exactly as it is. Never add a policy for anon, never re-grant anything to anon. Tool A's public portal depends on that lock and breaking it exposes every supplier's contact data to the open internet.
- This tool shares a Supabase project with Tool A. Protected objects that must not be modified, dropped, or recreated: the submissions table and all twelve existing columns, the submission_route and submission_status enums, the submissions_route_payload_check constraint, the three existing indexes, and Tool A's two functions submit_submission and check_submission_duplicate. Query and read them as documented in docs/supabase-setup.md.
- Tool B never inserts a row, never deletes a row, and never changes a supplier-provided value.
- Do not guess the questionnaire answer keys. At the start of the build session, read one real questionnaire-route row from the live table via the Supabase MCP, record the actual keys, and map them to the seven criteria by question text.

## Brand
Brand is governed by the the-corporate-brand skill at .claude/skills/the-corporate-brand/SKILL.md (installed in First Session Setup). Invoke it for any UI or visual work.
Hard rules that hold even if the skill is not loaded:
- Background: #F2F2F2 (Chalk) for pages, #EAE4D5 (Linen) for surfaces. Never white, never Tailwind gray defaults.
- Accent: #C8F135 (Acid Lime), maximum two uses per page, always against #000000, never directly on a light background.
- Font: Playfair Display for headlines, DM Sans 300 for body.
- No border-radius anywhere. Square corners only.
- No drop shadows. 0.5px Stone (#B6B09F) hairline borders instead.
- Build the pie chart, the three status badges, and the seven flag indicators from the neutral palette only. A dashboard has far more colour surfaces than the portal did and the two-use lime cap is easy to breach here. Flag indicators must never default to lime.

## Business Rules
- Seven unweighted risk flags. Four raise on an answer of No: SBTi validated target, human rights and labour rights policy, human rights due diligence in the last 24 months, conflict minerals policy. Three raise on an answer of Yes: PFAS, high-water-stress region, protected area or biodiversity hotspot. Never normalise these to one direction.
- Flags are computed in the browser at render time and are never written to the database.
- Flags are computed only for rows that are both route = questionnaire and status = active.
- EcoVadis rows read "not assessable via questionnaire". Never a zero, never a count, never an empty indicator set. They sort to the end of the flag board regardless of sort direction.
- A missing, blank, or unexpected answer raises no flag and is shown as unanswered on the detail page. Matching is case-insensitive and ignores surrounding whitespace.
- The output is a count from 0 to 7. Never a score, a grade, or a percentage, anywhere in the UI.
- Overview totals count active rows only. Needs review and superseded are separate counters, set apart from the totals, each opening the register filtered to that status.
- Selecting any flag filter pins status to active and route to questionnaire and disables both controls. Clearing every flag filter restores the previous selections. Several flags selected means a row must raise all of them.
- The register defaults to status = active on arrival, sorted by date submitted, newest first.
- The CSV carries the five register columns only (company_name, contact_name, route, status, created_at). It honours the status and route filters and ignores the search box and the sort.
- Status changes only through resolve_submission and send_company_to_review. Confirm runs needs_review to active, decline runs needs_review to superseded, flag runs active or superseded to needs_review. An action against the wrong starting status is refused by the function.
- A non-blank note is mandatory on confirm, decline, and flag, enforced inside the function and not only by the form.
- A confirm that would leave a company with two active rows is refused outright and writes nothing, returning blocked with the conflicting row IDs. Accepting the prompt sends the row and every conflicting active row to needs_review, with no note required at that step.
- resolved_by is read from the session token via auth.jwt(). The client never supplies it.
- The resolution trail is write-once. No edit, no delete, no undo. The next decision on that row overwrites all three columns together.
- The submission_status enum keeps exactly its three values and is never extended. Decline maps to superseded; there is no rejected state.

Out of scope — do not build:
- Any change whatsoever to the Supplier Sustainability Portal: no new fields, no new routes, no change to the submission flow, the workbook, the capture screens, or the submit-time status logic.
- Editing any supplier-provided value.
- Roles or differentiated permissions between the three users.
- Email alerts on a new needs_review row.
- AI reading, summarising, or classifying the open-ended answers.
- Scheduled jobs, digests, or automated recalculation.
- Undoing or editing a resolution note once written.
- A separate rejected status.
- Supplier roster, non-responder tracking, or submission chasing.
- Weighting, scoring, or grading the seven flags.
- Flag columns or questionnaire answers in the CSV.
- PDF export of a supplier submission.
- Automated EcoVadis scorecard validation.
- Deleting submissions from the dashboard.

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full view specs, the seven flag definitions with question text, the status transition table, acceptance criteria
- docs/supabase-setup.md — schema source of truth, exists already, read first
- .claude/skills/the-corporate-brand/SKILL.md — full brand system
PROGRESS.md in the root is read at every session start per the Session Protocol.
