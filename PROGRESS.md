# PROGRESS — The Corporate Supplier Review Dashboard 2026

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content, do not append. History lives in git.

**Session:** 1 — first build session
**Last updated:** 14 September 2026
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state

The dashboard is built and the database work is done. Nothing is deployed yet.

**Database — "The corporate live build (New)", complete and verified.** The three nullable resolution
columns (`resolved_by`, `resolved_at`, `resolution_note`) are on `submissions`, with no default, no
`NOT NULL`, and no check constraint. Both review functions exist: `resolve_submission(uuid, text, text)`
and `send_company_to_review(uuid)`, SECURITY DEFINER, `search_path` pinned to `public, pg_temp`,
EXECUTE revoked from `public` and `anon` and granted to `authenticated` only, both taking the same
advisory lock on the normalised company name that Tool A's `submit_submission` takes. The
`authenticated` SELECT policy and grant were already in place before this session and were left
alone. `anon` still holds zero policies and zero grants, verified in-database on the table and on all
four functions. Tool A still submits correctly on both routes after the column addition.

**The seven answer keys are read from live data, not guessed.** All 26 questionnaire keys were read
from a real questionnaire-route row and are recorded in `docs/supabase-setup.md` and
`src/lib/questionnaireSchema.js`.

**Frontend — every view in the spec is built.** Login, Tab 1 (Overview totals, route pie chart, the
two counters, the Risk Flag Board with the filter interlock), Tab 2 (Supplier Register with sort,
search, filters and CSV export), Supplier Detail (identity, answers by section, risk summary,
resolution trail, same-company history, action area), the Review Page (paired and single cases), and
the blocked-confirm prompt. `npm run build` succeeds.

**Three Supabase Auth accounts exist** for the ESG lead, EHS, and procurement, email and password,
email confirmed. They were created with temporary passwords that the builder must rotate — see Known
issues.

**Verification done this session.** Every status transition, the blocked confirm, the accept path,
and the paired resolution were exercised against the live database through the two functions and
behaved exactly as specified. 43 logic assertions on the flag rules, the flag scope, the EcoVadis
non-assessable case, and the CSV column set all pass. The filter interlock was driven in a real
browser. The register, overview, detail and review pages were rendered and checked at 1280px and
390px with no horizontal page overflow.

## Last session

Session 1. Ran First Session Setup, then built the whole tool. Applied the schema delta and both
review functions via MCP and verified the privilege model in-database. Read the 26 real answer keys
from a live row. Built the React frontend end to end and rewrote `docs/supabase-setup.md` as the
shared source of truth for both tools. Created the three auth accounts. Could not test the browser
against the live project: this container's network policy blocks the Supabase host, so the UI was
verified against fixture data instead.

## Remaining work

- [ ] **Builder: merge `claude/dazzling-ptolemy-lsix9p` into `main`.** The session was pinned to a
      feature branch, so Netlify has not seen this code. Nothing deploys until main moves.
- [ ] **Builder: rotate the three temporary account passwords** in Supabase → Authentication → Users.
- [ ] **Builder: disable public signup** in Supabase → Authentication → Providers. Not yet confirmed.
- [ ] Builder: confirm the Netlify publish directory is `dist`, the build command is `npm run build`,
      and `SECRETS_SCAN_OMIT_KEYS` is saved alongside both `VITE_` variables
- [ ] Builder: upgrade the Supabase project to Pro (manual billing step) before the three colleagues
      start using it. `docs/supabase-setup.md` already records Pro as the intended plan.
- [ ] Live test pass after deploy: sign in as each of the three accounts, take one real decision, and
      verify the row in the Supabase table editor
- [ ] Verify acceptance criteria 1, 2, 3, 6, 20, 24 against the deployed site — these need a live
      browser and a second session and could not be closed from this container
- [ ] Delete the `ZZ Blocked Test` rows once the live test pass is done, if they are not wanted as
      demo data
- [ ] Optional: replace the 19 non-flag question labels in `src/lib/questionnaireSchema.js` with
      Tool A's exact strings from `src/lib/questionnaireSchema.js` — see Known issues
- [ ] Builder: copy the updated `docs/supabase-setup.md` back into Tool A's repo so the two tools do
      not drift on schema truth

## Build decisions

- Plain Tailwind components with `.tc-*` brand primitives instead of shadcn/ui. shadcn ships rounded
  corners and shadows by default, and the brand forbids both; overriding every component was more
  work than writing the handful of primitives the tool needs.
- `border-radius` and `box-shadow` are disabled at the Tailwind core-plugin level and forced off in
  CSS, so the brand rule cannot be broken by a stray utility class.
- Acid Lime is used once per page, never twice: the needs-review counter on Tab 1 (lime text in a
  black container) and the blocked-confirm callout (2px lime left border). The pie chart, all three
  status badges, and all seven flag indicators are neutral-palette only.
- Flag indicators are a filled Ink square when raised and a Stone hairline outline when not. No
  colour carries meaning anywhere in the tool.
- The flag board's status control is fixed at Active and disabled. The spec says both that the board
  shows active rows only and that the interlock "sets status to active"; pinning the control satisfies
  both without ever rendering a needs_review or superseded row on the board. The route control is
  free until a flag filter is selected.
- Register filter state lives in the URL query string, so the Overview counters can link straight to
  a pre-filtered register and a reviewer can share a filtered view.
- The paired resolution issues the confirm first and the declines after. A blocked confirm writes
  nothing at all, so the declines are never issued against a decision that did not happen.
- Both functions return a structured `jsonb` result (`ok`, `error`, `message`) rather than raising,
  so the browser handles a refusal and the blocked confirm through one code path.
- `resolve_submission` also returns a `conflicts` array with each conflicting row's route and
  `created_at`, on top of the `conflicting_ids` and `conflicting_count` the spec requires, so the
  prompt can name the conflicting submission without a second query.
- CSV cells beginning `=`, `+`, `-`, or `@` are prefixed with an apostrophe, so a company name cannot
  execute as a formula when the export is opened in a spreadsheet.
- `groupAnswers` shows any questionnaire key the schema does not recognise under an "Other answers"
  heading rather than dropping it, so a future workbook revision cannot silently hide a supplier's
  answer.

## Known issues

- **The three account passwords are temporary and were set by Claude Code, not by the builder.** They
  were handed over in the build session chat and are recorded in no file. Rotate all three in the
  Supabase dashboard before the colleagues use the tool. The accounts were created by direct insert
  because the Supabase MCP has no user-creation tool; all three were verified in-database as correctly
  hashed, confirmed, and carrying an email identity row.
- **Public signup has not been confirmed as disabled.** The MCP exposes no auth-settings tool, so this
  could not be checked or changed from the build session. The builder must verify it in the dashboard.
  Nothing in this tool offers a signup path, but the Supabase endpoint is open until that setting is off.
- **19 of the 26 question labels are derived, not verbatim.** Tool A's `src/lib/questionnaireSchema.js`
  is not in this repo, so only the seven flag-bearing questions carry the exact wording from spec
  Section 9. The other nineteen were written from the workbook's section structure and ESRS mapping.
  They are display labels only — nothing is computed from them — and replacing the `question` values
  in `src/lib/questionnaireSchema.js` changes nothing else.
- The live table holds four `ZZ Blocked Test` rows created this session to exercise the blocked
  confirm and the paired resolution through Tool A's own submit path. Two are the ZZ pair; the others
  are the pre-existing `SustainOS test` rows. Delete the ZZ rows when they are no longer wanted.
- Spec Section 9 contains a contradiction. The prose sentence below the flag table says three flags
  raise on No and four on Yes; the per-question table says the opposite. The table is authoritative and
  the build follows it: four raise on No (SBTi, human rights policy, due diligence, conflict minerals)
  and three raise on Yes (PFAS, water stress, protected area). Correct the sentence at the next spec revision.
- Standing GDPR note: the CSV export moves supplier contact names outside the controlled system,
  outside RLS, and outside any deletion process. A known limit of the tool, not a defect. No build action.
- Standing GDPR note: deletion requests arrive at sustainability@thecorporate.com and are actioned
  manually in the Supabase table editor. This tool builds no deletion capability and `authenticated`
  has no delete grant. Deleting a row also destroys its resolution trail, which is accepted.
- Expected and not a bug: if a reviewer flags a company's only active row down to needs_review and a
  new submission then arrives, Tool A matches only against active rows, finds none, and writes the new
  row as active. The company then holds one active row and one under review.

## Notes for next session

None.
