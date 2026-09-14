# PROGRESS — The Corporate Supplier Review Dashboard 2026

> Claude Code: read this file at the start of every session, before touching anything. Update it at every save point. Replace content, do not append. History lives in git.

**Session:** 2 — test pass against the live project
**Last updated:** 14 September 2026
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state

The dashboard is built, the database work is done, and the whole tool has now been tested against
the live project with a 32-row seeded dataset. Nothing is deployed yet.

**Test data is currently loaded in the shared live table.** 32 rows across 25 companies, seeded from
`docs/test-data/seed-test-submissions.sql`. Every contact identity is fabricated and every email uses
the reserved `.example` TLD. This table is shared with Tool A, so these names also take part in Tool
A's duplicate matching. Run `docs/test-data/teardown-test-submissions.sql` as `service_role` before
the three colleagues start using the tool for real.

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

**Verified against the seeded dataset — 281 assertions, all passing.**
- 150 against the shipped `src/lib` modules: the seven flag directions, the flag scope, the four
  baked-in edge cases (blank, `Maybe`, case and whitespace variants, absent key), the EcoVadis
  non-assessable case and its sort position in both directions, the AND semantics of the flag filter,
  and the CSV column set.
- 107 driving the real React app in Chromium against the seeded rows: the login gate, overview totals
  and counters, the flag board, the filter interlock and its restore behaviour, the register with
  search, filters, sort and export, the detail page including the four edge cases, the paired review,
  the blocked-confirm prompt and its accept path, the brand rules (no radius, no shadows, Acid Lime
  within its cap, Chalk ground) and no horizontal page overflow at 1280px or 390px.
- 24 against the live database, calling both functions as `authenticated` with a real JWT: every
  refusal (blank note, null note, unknown action, wrong status, unknown id, no session), the blocked
  confirm writing nothing, the accept path, the clean confirm, decline, flag on a superseded row, the
  second flag refused, and the privilege model (`authenticated` holds no insert, update or delete;
  `anon` holds no select and no execute on either function).

All four of the seed's own verification queries match `docs/test-data/TEST-DATA-README.md` exactly:
the 22/6/4 status mix, the 12-row flag board with counts 0,1,2,2,2,3,3,3,4,5,6,7, the six companies
holding more than one row, and the 25-key row against 26 keys everywhere else.

## Last session

Session 2. Seeded the 32-row test dataset into the live table and ran a full test pass: 281
assertions, all passing. 150 against the shipped `src/lib` modules, 107 driving the real React app in
Chromium, and 24 against the live database calling both review functions as `authenticated` with a
real JWT. All four of the seed's own verification queries match the README exactly. Both functions
and the privilege model were verified in-database, then the five rows the write tests moved were
restored to their seeded values, so the dataset is pristine again. `npm run build` succeeds. No code
and no schema was changed this session. The browser still cannot reach the Supabase host from this
container, so the browser-to-Supabase network seam is the one thing still untested.

## Remaining work

- [ ] **Builder: merge `claude/cool-albattani-fa32k2` into `main`.** Sessions are pinned to a feature
      branch, so Netlify only sees this code once main moves. The session-1 branch is already merged.
- [ ] **Builder: rotate the three temporary account passwords** in Supabase → Authentication → Users.
- [ ] **Builder: disable public signup** in Supabase → Authentication → Providers. Not yet confirmed.
- [ ] Builder: confirm the Netlify publish directory is `dist`, the build command is `npm run build`,
      and `SECRETS_SCAN_OMIT_KEYS` is saved alongside both `VITE_` variables
- [ ] Builder: upgrade the Supabase project to Pro (manual billing step) before the three colleagues
      start using it. `docs/supabase-setup.md` already records Pro as the intended plan.
- [ ] Live test pass after deploy: sign in as each of the three accounts, take one real decision, and
      verify the row in the Supabase table editor. This closes the one seam the session-2 test pass
      could not reach: the browser-to-Supabase network call, the real auth session, and RLS under a
      genuine JWT.
- [ ] Walk the five by-hand scenarios in `docs/test-data/TEST-DATA-README.md` on the deployed site.
      Their logic is already verified; what is left is the live round trip.
- [ ] **Run `docs/test-data/teardown-test-submissions.sql` before the three colleagues use the tool
      for real**, so the register they see holds only real suppliers. The seeded contact data is
      fabricated but personal-shaped, sits under the same RLS, and lands in the CSV export.
- [ ] Optional: replace the 19 non-flag question labels in `src/lib/questionnaireSchema.js` with
      Tool A's exact strings from `src/lib/questionnaireSchema.js` — see Known issues
- [ ] Builder: copy the updated `docs/supabase-setup.md` back into Tool A's repo so the two tools do
      not drift on schema truth
- [ ] Optional: keep the session-2 test harness. It lived in a scratch directory and was not
      committed, so re-running it means rebuilding it. Say the word if it should become part of the
      repo; it would add Playwright as a dev dependency.

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

- **The 32 seeded test rows are live in the shared table right now.** See Current state. They are
  fabricated, but they are visible to Tool B users, count in Tool A's duplicate matching, and export
  to CSV like any other row. The teardown script removes them and nothing else.
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
- Confirmed correct, not a defect: `send_company_to_review` writes `resolved_by` and `resolved_at`
  but leaves `resolution_note` as it was, so a row can briefly show an older note beside a newer
  timestamp. Spec Section 6 requires exactly this, because no note is taken at that step; the note
  arrives with the decision that follows. Checked during the session-2 test pass.
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
