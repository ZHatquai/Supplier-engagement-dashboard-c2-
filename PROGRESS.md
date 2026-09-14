# PROGRESS — The Corporate Supplier Review Dashboard 2026

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content, do not append. History lives in git.

**Session:** 0 — build not started
**Last updated:** 14 September 2026 — by Project Governor, pre-build
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
Nothing built for this tool. Repo contains CLAUDE.md, PROGRESS.md, product-spec.md, supabase-setup.md, and the-corporate-brand SKILL.md (brand skill, installed in session 1).
The GitHub repo exists and is connected to a Netlify site. Both VITE_ environment variables are set in Netlify. The first deploy failed with a missing package.json, which is expected on an empty repo and is not a fault.
Tool A (the Supplier Sustainability Portal) is live and writing real submissions, and the live table holds at least one questionnaire-route row.
[Rule: this section describes what exists and works right now, never what is planned. Completed checklist items get absorbed here in compressed form.]

## Last session
None — the first build session has not happened yet.
[Rule: 3 to 5 lines maximum. Replace each session: what was built, changed, or fixed.]

## Remaining work
- [ ] First Session Setup: create docs/, move product-spec.md and supabase-setup.md into it, install the the-corporate-brand skill, add .env.local to .gitignore, commit (see CLAUDE.md Session Protocol)
- [ ] Builder: create the three accounts in Supabase Authentication and disable public signup
- [ ] Builder: set the Netlify publish directory to `dist` and confirm SECRETS_SCAN_OMIT_KEYS is saved alongside both VITE_ variables
- [ ] Builder: create a gitignored .env.local with the same two variables, for local testing
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard (manual billing step) before the three colleagues start using it
- [ ] Connect to Supabase project "The corporate live build (New)" using the ref the builder supplies, and read docs/supabase-setup.md before any database work
- [ ] Read one real questionnaire-route row via MCP and record the seven actual answer keys, mapped to the criteria in spec Section 9 by question text
- [ ] Add the three nullable resolution columns, then update docs/supabase-setup.md
- [ ] Configure Supabase Auth: email and password, public signup disabled, no other provider
- [ ] Add the authenticated select policy and re-issue the select grant; leave anon at zero policies and zero grants
- [ ] Build resolve_submission and send_company_to_review per spec Section 6, then verify in-database that anon holds no privilege and authenticated holds select only
- [ ] Build the Login screen — keep everything behind an authenticated session
- [ ] Build Tab 1, Overview block — active-only totals, route pie chart, needs review and superseded counters
- [ ] Build Tab 1, Risk Flag Board — seven flags per active questionnaire row, with the filter interlock
- [ ] Build Tab 2, Supplier Register — sort, company search, status and route filters
- [ ] Build Supplier Detail — identity, answers by section, risk summary, resolution trail, same-company history
- [ ] Build the Review Page — paired and single needs_review cases, one mandatory note per row
- [ ] Build the blocked-confirm prompt — accept or cancel, no note field
- [ ] Wire the CSV export: register columns only, honouring the status and route filters, triggered by the button
- [ ] Local test pass — every view, every status transition, the block, the paired resolution, and the concurrency case
- [ ] Acceptance criteria pass — verify all 25 criteria in spec Section 13 before deploy
- [ ] Push to main, Netlify auto-deploys, then confirm live: sign in and take one real decision
- [ ] Builder: copy the updated docs/supabase-setup.md back into Tool A's repo so the two tools do not drift on schema truth
[Rule: completed items leave this list and are absorbed into Current state. This list only shrinks.]

## Build decisions
None yet.
[Rule: one line per decision made during the build that is not in the spec — prompt structures, field formats, naming choices, library picks. Future sessions depend on these to stay consistent.]

## Known issues
- Spec Section 9 contains a contradiction. The prose sentence below the flag table says three flags raise on No and four on Yes; the per-question table says the opposite. The table is authoritative and CLAUDE.md encodes it: four raise on No, three raise on Yes. Correct the sentence at the next spec revision.
- The three login email addresses are held only in Supabase Authentication, by the builder's decision. They are not recorded in this repo. The builder supplies one to Claude Code for the local test pass.
- Standing GDPR note: the CSV export moves supplier contact names outside the controlled system, outside RLS, and outside any deletion process. Recorded as a known limit of the tool, not a defect. No build action.
- Standing GDPR note: deletion requests arrive at sustainability@thecorporate.com and are actioned manually in the Supabase table editor. This tool builds no deletion capability and authenticated has no delete grant. Deleting a row also destroys its resolution trail, which is accepted.
- Expected and not a bug: if a reviewer flags a company's only active row down to needs_review and a new submission then arrives, Tool A matches only against active rows, finds none, and writes the new row as active. The company then holds one active row and one under review.
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Notes for next session
None.
[Rule: the builder writes here between sessions. Claude Code reads these aloud at session start, acts on them, then clears this section.]
