# Product Spec — The Corporate Supplier Review Dashboard 2026

**Version:** 1.0
**Date:** 14 September 2026
**Author:** Zyad Hatquai
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Review Dashboard 2026

**What it does:** An internal, login-protected dashboard that displays the supplier submissions already stored in The Corporate's `submissions` table, scores every active questionnaire submission against seven sustainability risk criteria, and lets the review team confirm, decline, or re-open submissions for review. It reads existing data and writes nothing new except the outcome of a review decision.

**Who uses it:** Three named colleagues at The Corporate: the ESG lead, an EHS representative, and a procurement representative. All three have identical access. Accounts are created by the builder in the Supabase dashboard; there is no public signup.

**Why it exists:** The Supplier Sustainability Portal (v3.0, live) writes every supplier submission to Supabase, but nothing surfaces that data. Today the ESG lead has to open the Supabase table editor to see a submission at all, to read questionnaire answers buried in a JSON column, and to resolve a `needs_review` row by hand-editing an enum value. That was explicitly recorded as temporary in the portal's v3.0 spec (Section 12) and in `docs/supabase-setup.md`. This tool replaces the table editor with a purpose-built review surface and adds the risk screening the raw table cannot provide.

**Build status:** First build of this tool. It is the second tool in an existing stack. The Supplier Sustainability Portal is Tool A, already live at v3.0, and **nothing in it changes as part of this build**: no new fields, no new routes, no change to the submission flow, the workbook, the capture screens, or the status computation at submit time.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** The tool reads an existing database table written by another tool, and its own review decisions (status changes plus the resolution trail) are written back and must survive the session.

**D3 is triggered if any of the following are true — check all that apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [x] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A2

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | No |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | Yes |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** Three named internal colleagues log in and every one of them sees and can do exactly the same thing. This was tested explicitly during the interview: the builder confirmed that EHS and procurement have the same permission set as the ESG lead, including confirm, decline, and flag. There are no roles, so there is no per-role permissions grid, no Access Architect step, and no row-level differentiation between users.

> **Promotion rule:** Not applicable as a promotion. D3 here is triggered independently by the persistence requirements above. A2 would have forced D3 in any case.

---

### If Access Model is A2 — complete both questions

**Auth reason:** Controlled access. Only a specific, defined list of three people may use this tool. The data it displays is every supplier's commercial and contact information, and the actions it exposes change the authoritative status of a supplier submission.

**Signup model:** Invite-only. The builder creates the three accounts through the Supabase dashboard. Public signup is switched off in Supabase Auth. There is no signup link, no password reset self-service flow, and no account creation path anywhere in the UI.

---

### If Access Model is A3 — define all roles

Not applicable. This tool is A2. All authenticated users are equivalent.

---

### Tier

**Tier:** 3

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

Tier 3 because login sits on top of a database. It is the simpler end of Tier 3: authentication without authorization, so there are no roles to model and no per-role policy set to design.

---

### Standalone or Stack

**This tool is:** Part of a stack. See Section 4.

It is Tool B in a two-tool stack sharing one Supabase project. Tool A, the public Supplier Sustainability Portal, created the schema and is already live. This tool joins the same project, reads the same table, and adds three nullable columns plus its own auth and policies. Each tool keeps its own spec, its own GitHub repo, its own CLAUDE.md, its own PROGRESS.md, and its own Netlify site.

---

## Section 3 — Arms

> Document search and AI knowledge bases are outside this framework version. Not applicable to this tool.

---

### AI API Arm

**Active:** No

Nothing in this tool is summarised, explained, classified, or generated by an AI model. The risk flags are a deterministic read of seven Yes/No dropdown answers. The open-ended S2 to S7 answers are displayed verbatim on the supplier detail page and are never processed. This was offered during the interview and declined.

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | CSV |
| What is exported | The Supplier Register rows, and only the register's own columns: `company_name`, `contact_name`, `route`, `status`, `created_at`. Nothing else. The export never includes the seven flags, the flag count, the `questionnaire_answers` payload, the EcoVadis link, the remaining identity fields, or the resolution trail. The export honours whatever **status** and **route** filters are active on the register at the moment the button is clicked, and ignores the free-text company search and the column sort. |
| PDF design intent | N/A — CSV only |

> **Standing note on the export:** this CSV carries supplier contact names out of the controlled system and onto a laptop. It is legitimate and falls inside the purpose the supplier already consented to under the portal's data statement, which covers processing and reviewing their submission. It is recorded here as a known limit of the tool, not as a defect. See Section 7.

---

### Email Arm

**Active:** No

No email is sent by this tool under any circumstance. In particular, no alert fires when a new `needs_review` row appears. The `needs_review` counter on the Overview is the only signal, and it is checked by a person opening the dashboard. This was offered during the interview and declined.

---

### Scheduled Automation Arm

**Active:** No

Nothing runs on a timer. No digest, no periodic recalculation, no scheduled job of any kind. Every number on screen is computed at page load from the current state of the table.

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind CSS. Matches Tool A's stack, and the tool is interactive enough (tabs, sorting, filtering, search, modals, charts) that plain HTML/CSS/JS is not a fit. |
| Deployment target | Netlify |
| Deployment | GitHub push to main, then Netlify auto-deploys. Claude Code is connected to GitHub and pushes to main. The new repo is connected to a new Netlify site once, by the builder, in the Netlify dashboard. Netlify is NOT connected to Claude and there is no Netlify connector to enable. One-time builder steps in the Netlify dashboard: connect the repo to a site, and add the two environment variables **before the first functional build**, because Vite reads them in at build time and setting them afterwards does not fix an already-built bundle. |

**GitHub — pre-build requirement:**
The builder creates a **new** GitHub repo for this tool, separate from the portal's repo. `product-spec.md`, `CLAUDE.md`, and `PROGRESS.md` go in the repo root before Claude Code opens. Claude Code assumes the repo exists, commits regularly, and pushes to main. It does not create or configure the repo.

---

### CONDITIONAL: Supabase project — Tier 3

**Supabase project status:** Existing. The project was created by Tool A's build on 7 September 2026. Claude Code must not create a project and must not create the `submissions` table, its enums, its constraint, its indexes, or Tool A's two functions.

**Supabase plan:** Pro. Confirmed during the interview. The Free plan pauses a project after roughly a week of no traffic, and a dashboard that three colleagues open intermittently is exactly the usage pattern that gets caught by that. The portal's `docs/supabase-setup.md` currently records the plan as Free; the updated copy this build produces must record Pro.

| Detail | Answer |
|--------|--------|
| Project name | **The corporate live build (New)** |
| Project ID / ref | **Deliberately not recorded in this spec, in this repo, or in any committed file.** The builder supplies the project ref and URL directly to Claude Code at the start of the build session. This mirrors the rule already in force on Tool A, whose repo is public. |
| Region | eu-central-1 (Frankfurt) |
| Postgres | 17 |
| supabase-setup.md location | `docs/supabase-setup.md`. The builder copies the current file from Tool A's repo into this repo's root before the build session. Claude Code moves it into `docs/` during First Session Setup and updates it at every save point that touches the database. |

> Claude Code reads `docs/supabase-setup.md` before making any schema change, connects to the existing project, and reviews the current schema first. It adds only what Section 5 of this spec describes.

**After the build:** the builder copies the updated `docs/supabase-setup.md` back into Tool A's repo, so the two tools do not drift on schema truth. This is a manual step and it is listed in Section 14.

---

### CONDITIONAL: Stack

**Stack name / Supabase project name:** The corporate live build (New)

**This tool's role in the stack:** Tool B — internal review dashboard

**Other tools in this stack:**

| Tool | Tier | Role in the stack |
|------|------|------------------|
| The Corporate Supplier Sustainability Portal 2026 (v3.0) | Tier 2 | Tool A — public supplier-facing submission portal. Creates every row in `submissions`. Already built and live. Owns the schema. Not modified by this build. |
| The Corporate Supplier Review Dashboard 2026 (v1.0) | Tier 3 | Tool B — internal login-protected review dashboard. Reads every row, updates status and the resolution trail only. This spec. |

> **Build order:** Tool A created the schema and is complete, so this build is unblocked. `docs/supabase-setup.md` exists and is a required input. Each tool keeps its own spec, repo, CLAUDE.md, PROGRESS.md, and Netlify site. The shared Supabase project is the only thing connecting them.

**Division of ownership on the shared table — a hard rule for this build:**

| Concern | Owned by |
|---------|----------|
| Inserting rows into `submissions` | Tool A only |
| Computing status at submission time | Tool A only, via `submit_submission` |
| The duplicate check shown to suppliers | Tool A only, via `check_submission_duplicate` |
| Changing status after submission | Tool B only, via the two functions in Section 6 |
| The resolution trail columns | Tool B only |
| Reading rows for internal review | Tool B only |

Tool B never inserts and never deletes. Tool A never reads for review purposes and never touches the three new columns.

---

## Section 5 — Data Architecture

### Existing table — `submissions` — read by this tool, not created by it

Every column below already exists. Claude Code must not recreate, rename, retype, or drop any of them.

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

### Schema delta — the only database change this build makes

Three new columns on `submissions`, all nullable:

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| resolved_by | Who made the last review decision | Text — the email address of the signed-in user | Tool B, automatically from the session | No, null until a decision is made |
| resolved_at | When that decision was made | timestamptz | Tool B, automatically | No, null until a decision is made |
| resolution_note | Why that decision was made | Text | Tool B, typed by the signed-in user | No, null until a decision is made |

**Why all three are nullable, and why that matters:** Tool A's `submit_submission` function inserts a fixed column list. A nullable column added beside it does not break that insert and does not require any change to Tool A. A `NOT NULL` column would break it immediately. Claude Code must not add a default, a `NOT NULL`, or a check constraint that could make Tool A's insert fail.

**Existing constraint to leave alone:** `submissions_route_payload_check` enforces that an `ecovadis` row carries a link and no answers, and a `questionnaire` row carries answers and no link. Nothing in this tool changes `route`, `ecovadis_link`, or `questionnaire_answers`, so the constraint is never at risk. It must not be dropped or altered.

**Existing indexes to leave alone:** `lower(btrim(company_name))`, `status`, `created_at desc`. The first two are exactly what this dashboard's grouping and filtering need, so no new index is required unless Claude Code measures a real problem.

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| submissions | Existing. One row per completed supplier submission. Extended with three nullable resolution columns. | company_name, contact_name, route, status, created_at, questionnaire_answers, resolved_by, resolved_at, resolution_note |

No new table is created by this build. User accounts live in Supabase Auth's own `auth.users`, which is managed by Supabase.

**File storage:** No.

**Derived or calculated data:** Yes. The seven risk flags and the flag count are computed in the browser at render time from `questionnaire_answers`. They are never stored in the database. See Section 9.

### Reading the questionnaire answer keys — a required pre-build input

The flag board depends on reading seven specific keys inside the `questionnaire_answers` JSON. Those keys are defined in Tool A's `src/lib/questionnaireSchema.js`, which lives in Tool A's repo and will not be present in this one. Per Tool A's PROGRESS.md the key format is `s2_` through `s7_` prefixed, and the submission function rejects any key not matching `^s[2-7]_`.

**Claude Code must not guess the key names.** At the start of the build session it reads one real questionnaire-route row from the live table via the Supabase MCP, inspects the actual keys in `questionnaire_answers`, and maps them to the seven criteria in Section 9 by their question text.

> **Risk, and the pre-build task it creates.** Per Tool A's PROGRESS.md the test rows were deleted and the table was left empty, and the two Netlify environment variables were still outstanding, so there may be no questionnaire row in the table at all. If there is none, there is nothing to read the keys from and the flag board cannot be wired. Before the build session the builder must either submit one real questionnaire through the live portal so a row exists, or copy `src/lib/questionnaireSchema.js` from Tool A's repo into this repo as a fallback. One of the two must be true. This is a blocking item in Section 15.

---

## Section 6 — Access and Permissions

**Auth configuration:**

| Detail | Answer |
|--------|--------|
| Authentication method | **Email and password**, via Supabase Auth. Confirmed by the builder. The framework default for an internal tool is OAuth against the company's own Google or Microsoft accounts, and that recommendation was made during the interview and overridden. Note that Supabase Auth has no concept of a username; the login identifier is an email address. |
| Signup model | **Invite-only.** The builder creates the three accounts through the Supabase dashboard. Public signup is disabled in Supabase Auth settings. No signup UI exists anywhere in this tool. |

> **Privacy note — standing for every A2/A3 spec:** user accounts store email addresses. For internal and client tools this falls under the organization's existing privacy framework rather than a consent flow.

**Handover request:** if this tool ever leaves the teaching context and runs against a real corporate identity estate, move authentication to The Corporate's single sign-on. Recorded here so the decision is visible rather than inherited by accident.

**Roles and access:**

| Role | What they broadly see and do |
|------|------------------------------|
| Authenticated user (the ESG lead, EHS, procurement) | Sees every submission and every submission's full detail. Can confirm, decline, and flag. Cannot create, edit, or delete a submission, and cannot change any supplier-provided value. |

There is one permission set. Because this is A2 and not A3, there is **no Access Architect step and no `access-matrix.md`**, and the row-level rules are written directly below rather than deferred.

### How the browser reaches the database

The dashboard talks to Supabase directly from the browser using the publishable (anon) key, with Supabase Auth handling login and RLS doing the enforcing. It does **not** use a Netlify Function, and it does **not** use the service role key anywhere. The service role key must never appear in this tool's code, its environment variables, or its repo.

This is a deliberate departure from Tool A's pattern, and the reasoning is on the record: Tool A is a public form where anonymous visitors must be kept away from the table entirely, so every operation is proxied server-side. Tool B's users are three authenticated colleagues, so RLS keyed on `authenticated` gives the same guarantee natively, with less code and no token verification to hand-roll.

**Current state of the table, which this build modifies:** RLS is enabled and forced on `submissions` with zero policies, and `GRANT`s were revoked from both `anon` and `authenticated`. A policy alone will therefore not work. The grants have to be re-issued for `authenticated` as well.

**RLS rules — who can read and write what:**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|-----------|
| submissions | anon (not signed in) | No | No | No | No |
| submissions | authenticated | Yes — all rows | No | No direct update. Status and the three resolution columns change only through the two functions below. | No |
| submissions | service_role | Yes | Yes | Yes | Yes — unchanged, used by Tool A's submission function |

**The anon deny-all stays exactly as it is.** `anon` keeps zero policies and zero grants. Claude Code must not add a policy for `anon`, must not re-grant anything to `anon`, and must never disable or unforce RLS on this table. Tool A's public portal depends on that lock, and breaking it would expose every supplier's contact data to the open internet.

**Why the status change goes through a function rather than a direct update.** The confirm rule has to check whether the company already has another active row and then write, and those two steps must be atomic for the same reason Tool A's submit is atomic: two people reviewing at once must not both succeed. RLS `WITH CHECK` cannot express a rule about other rows. So `authenticated` gets `SELECT` only, and the writes happen inside two `SECURITY DEFINER` Postgres functions, following the pattern Tool A already established with `submit_submission`.

**Two new Postgres functions, both owned by this build:**

Both are `SECURITY DEFINER`, both pin `search_path` to `public, pg_temp`, both have `EXECUTE` revoked from `public` and `anon`, and both are granted to `authenticated` only. Both take `pg_advisory_xact_lock` on the normalised company name before reading, exactly as Tool A's `submit_submission` does, so two reviewers acting on the same company at once serialise instead of racing.

Both functions read the caller's email from the session (`auth.jwt()`) and write it to `resolved_by`. The client never supplies that value, so a user cannot attribute a decision to someone else.

**`resolve_submission(p_id uuid, p_action text, p_note text) → jsonb`**

Handles the three single-row actions. `p_action` is one of `confirm`, `decline`, `flag`.

| Action | Allowed when the row's status is | Result |
|--------|----------------------------------|--------|
| `confirm` | `needs_review` | Row becomes `active` |
| `decline` | `needs_review` | Row becomes `superseded` |
| `flag` | `active` or `superseded` | Row becomes `needs_review` |

Rules enforced inside the function, not in the browser:
- A non-blank `p_note` is **required for all three actions**. A blank or whitespace-only note is rejected.
- An action attempted against a row in the wrong status is rejected. Confirm and decline are refused on any row that is not `needs_review`; flag is refused on a row that is already `needs_review`.
- **The blocked confirm.** On `confirm`, the function first counts other rows for the same company (matched case-insensitively and whitespace-insensitively, the same normalisation Tool A uses) whose status is `active`. If any exist, **the confirm is refused and nothing is written.** The function returns `{"blocked": true, "conflicting_ids": [...], "conflicting_count": n}` and the UI shows the prompt described in Section 8.
- On success the function writes `status`, `resolved_by`, `resolved_at`, and `resolution_note` on that row, and returns the updated row.
- `flag` and `decline` never trigger the block. Only `confirm` can produce a second active row.

**`send_company_to_review(p_id uuid) → jsonb`**

The action behind the accept button on the blocked-confirm prompt. Takes the row the user was trying to confirm, and every other `active` row for that company, and sets all of them to `needs_review`. It writes `resolved_by` and `resolved_at` on every row it touches and leaves `resolution_note` untouched, because no note is required for this step; the note comes with the actual decision that follows. It returns the affected row IDs so the UI can open the review page for that company.

**What `authenticated` explicitly cannot do, enforced by having no grant at all:**
- Insert a submission
- Delete a submission
- Change `company_name`, `contact_name`, `contact_email`, `contact_phone`, `job_title`, `department`, `route`, `ecovadis_link`, `questionnaire_answers`, or `created_at`
- Write `status` directly, bypassing the transition rules
- Edit or erase a `resolution_note` once written

**The resolution trail is write-once.** A note cannot be edited or deleted. The only way it changes is when the next review decision on that row overwrites all three columns together. There is no undo. Confirmed by the builder.

> The Supabase security advisor will continue to report `rls_enabled_no_policy` on this table until the `authenticated` select policy is added, and will stop afterwards. Either state is expected; deny-all for `anon` remains the design.

---

## Section 7 — GDPR

**GDPR outcome:** **Not applicable** — confirmed during the interview.

**Reasoning, on the record:**

This tool collects no personal data. It has no supplier-facing form, no upload, and no field a data subject fills in. Every personal field it displays (`company_name`, `contact_name`, `contact_email`, `contact_phone`, `job_title`, `department`) was collected by Tool A, under Tool A's consent checkbox and data statement, which covers storing the data and using it to process and review that company's sustainability assessment submission. Displaying it to the three internal reviewers is that exact purpose being carried out, not a new one.

The only new personal data introduced here is the three login email addresses held by Supabase Auth. On an invite-only internal tool those fall under The Corporate's existing privacy framework rather than a consent flow, per the scope rule and the Section 6 privacy note.

**Two standing notes carried into this spec, neither requiring a build action:**

1. **The CSV export moves personal data out of the controlled system.** It contains contact names alongside company names and lands on someone's laptop, outside RLS, outside the audit trail, and outside any deletion process. It stays inside the consented purpose, and it is recorded here as a known limit.
2. **Deletion requests are unchanged.** They still arrive at `sustainability@thecorporate.com`, the Contact EHS address on the portal's landing page, and are still actioned by deleting the row by hand in the Supabase table editor. This tool builds no deletion capability, and `authenticated` has no delete grant. Note that deleting a row also destroys its resolution trail, which is accepted.

Data continues to be stored in eu-central-1 (Frankfurt) and retained indefinitely unless deletion is requested.

---

## Section 8 — Screen and UI Structure

### Login Screen

- **Purpose:** Keep everything behind an authenticated session.
- **What is visible:** The Corporate wordmark, an email field, a password field, a sign-in button, and an inline error area. Nothing else. No signup link, no "create account", no marketing copy, no supplier-facing content.
- **User actions:** Enter email and password, sign in.
- **What happens next:** On success, the Overview tab. On failure, a single generic message that does not reveal whether the email exists. No route in the app renders any data before a session exists; an unauthenticated visit to any URL lands here.

---

### Tab 1 — Overview and Risk Flag Board

The default view after sign-in. Two stacked blocks on one tab.

#### Block 1 — Overview

- **Purpose:** Answer "what is in the system right now" in one glance.
- **What is visible:**
  - A row of three summary numbers, **counting `active` rows only**: total submissions, EcoVadis submissions, questionnaire submissions. The second and third add up to the first.
  - A pie chart splitting those same active submissions by route, `ecovadis` against `questionnaire`. Two segments, labelled, with counts.
  - Two side counters, set apart from the three summary numbers so they read as a work queue rather than as part of the totals: **Needs review — n** and **Superseded — n**. Each counts rows in that status across all routes.
- **User actions:** Click either counter.
- **What happens next:** Clicking a counter opens Tab 2 with the status filter pre-set to that status and every other filter cleared. This is the only route to a `needs_review` row, since the register defaults to `active` only.
- **Empty state:** with zero rows in the table, the numbers read 0, the pie chart is replaced by a single line saying no submissions yet, and both counters read 0 and are not clickable.

#### Block 2 — Risk Flag Board

- **Purpose:** Show which active suppliers raise which sustainability risks, and how many.
- **What is visible:**
  - One line per **active** submission. Superseded and needs_review rows never appear here.
  - Questionnaire rows show the company name, an indicator for each of the seven flags showing raised or not raised, and a flag count from 0 to 7.
  - EcoVadis rows show the company name and the text **"not assessable via questionnaire"** in place of the indicators and the count. They must never display a zero, a count, or an empty set of indicators, because zero would read as a clean supplier when in fact nothing was assessed. They sort to the end of the list regardless of sort direction.
  - Above the board: a filter control for each of the seven flags, plus the shared status and route filters.
- **User actions:** Sort by flag count ascending or descending. Filter by any individual flag, or by several at once, in which case a row must raise **all** selected flags to appear. Click a row to open its Supplier Detail page.
- **Filter interlock — a hard rule:** selecting any flag filter automatically sets status to `active` and route to `questionnaire`, and disables both of those controls while any flag filter is active. Clearing every flag filter re-enables them. The reason is stated in the UI in one line: only active questionnaire submissions carry flags. Deselecting the last flag restores the previous status and route selections.
- **Empty state:** if a filter combination matches nothing, a line saying no submissions match these filters, with a clear-filters action.

---

### Tab 2 — Supplier Register

- **Purpose:** Find any submission and open it.
- **What is visible:**
  - A table with five columns: company, contact name, route, status, date submitted.
  - A search box above the table, matching on company name.
  - Two filters: status and route.
  - An **Export CSV** button.
  - A row count showing how many rows are currently displayed.
- **User actions:**
  - Sort on any of the five columns, ascending or descending. Default sort is date submitted, newest first.
  - Search by company name. The match is case-insensitive and partial, so typing part of a name is enough.
  - Filter by status (`active`, `superseded`, `needs_review`, or all) and by route (`ecovadis`, `questionnaire`, or all). **Default on arrival is status = active.** Arriving from a counter click pre-sets the status filter accordingly.
  - Click Export CSV, which downloads the register columns for every row matching the current **status and route filters**, ignoring the search box and the sort.
  - Click any row.
- **What happens next:** clicking a row opens that submission's Supplier Detail page.
- **Empty state:** a line saying no submissions match, with a clear-filters action.

---

### Supplier Detail

Reached by clicking a row on either the register or the flag board. Shows one submission in full, with the company's other submissions beneath it.

- **Purpose:** Everything known about one submission, and the point from which a review decision is taken.
- **What is visible:**
  - **Header:** company name, status, route, date submitted, and a back path to wherever the user came from.
  - **Identity block:** all six fields — `contact_name`, `contact_email`, `contact_phone`, `job_title`, `department`, and `company_name`.
  - **EcoVadis block, EcoVadis route only:** the `ecovadis_link`, rendered as a link that opens in a new tab.
  - **Questionnaire block, questionnaire route only:** every S2 to S7 answer, laid out by section, in workbook order, under the section headings the workbook uses — S2 Climate and Decarbonisation, S3 Pollution and PFAS, S4 Water and Marine Resources, S5 Circular Economy and Waste, S6 Biodiversity and Ecosystems, S7 Social, Labour and Governance. Each answer is shown with its question text, not with a raw JSON key. Quantitative, dropdown, and open-ended answers all render as given, with no truncation of the open-ended text. Any of the seven flag-bearing answers that is raised is marked visibly in place.
  - **Risk summary, active questionnaire rows only:** the flag count and which of the seven are raised. On an EcoVadis row this block is replaced by the "not assessable via questionnaire" line. On a non-active questionnaire row the flags are shown but labelled as not counted towards the board.
  - **Resolution trail, if the row has one:** who resolved it, when, and the full note. If `resolved_by` is null the block reads that no review decision has been recorded. This information appears here and nowhere else; it is never a register column.
  - **History block:** every other submission from the same company, matched case-insensitively and whitespace-insensitively on company name, whatever its status. Each entry shows route, status, date submitted, and its resolution trail if it has one, and links to its own detail page. If the company has only this one submission, the block says so.
  - **Action area**, which depends on the row's status:
    - Status is `needs_review` → **Confirm** and **Decline**, both requiring a note.
    - Status is `active` or `superseded` → **Flag for review**, requiring a note.
    - There is never an action that changes a supplier-provided value.
- **User actions:** read, follow a history link, take one of the available actions, go back.
- **What happens next:** see the Review Page and the blocked-confirm prompt below.

---

### Review Page

Opened when a review decision is taken, and directly from the blocked-confirm prompt. It handles the paired case and the single case, which look different because they are.

**Paired case — a company has two or more `needs_review` rows.** This is what Tool A produces on a same-route duplicate, and it is the normal case for a pair.

- **What is visible:** all of that company's `needs_review` submissions side by side, each showing route, date submitted, the identity block, and its answers or EcoVadis link, so the reviewer can compare them directly rather than from memory. One is selected as the one to confirm; the others are then implicitly declined. Below, one note field for the confirmed submission and one note field for each declined submission.
- **User actions:** pick which submission to confirm, write the note explaining the confirmation, write a note for each decline, submit the decision.
- **Rules:** every note is mandatory and must be non-blank. The confirmation cannot be submitted until all of them are filled. The normal case is exactly two submissions, one confirmed and one declined; three or more behaves identically, with one note per declined row.
- **What happens next:** the confirmed row becomes `active`, every other selected row becomes `superseded`, and all touched rows get `resolved_by`, `resolved_at`, and their own `resolution_note`. If the confirm is blocked because the company also holds an `active` row elsewhere, the prompt below appears instead and nothing is written.

**Single case — one `needs_review` row.** This is what the reviewer's own Flag action produces.

- **What is visible:** that submission in full, a Confirm action and a Decline action, and one mandatory note field.
- **User actions:** confirm or decline, with a note.
- **What happens next:** confirm sets the row to `active`, decline sets it to `superseded`, and the trail is written. Confirm is subject to the same block.

---

### Blocked-confirm prompt

- **Purpose:** stop a confirm that would leave one company with two `active` submissions, which is the exact state the portal's status logic exists to prevent.
- **When it appears:** any confirm action, paired or single, where the company already has at least one other `active` row.
- **What is visible:** a modal reading, in substance, that this company already has an active submission and that both will go to review. It names the conflicting submission by route and date so the reviewer knows what is about to move. Two actions: accept and cancel.
- **User actions:** accept or cancel.
- **What happens next:**
  - **Cancel** — nothing is written at all. The reviewer returns to where they were, with their notes intact.
  - **Accept** — the row being confirmed and every conflicting `active` row for that company are all set to `needs_review`, and the review page for that company opens with all of them shown together. No note is required at this step; the notes come with the decision that follows.
- **No note field appears on this prompt.** Confirmed by the builder.

---

### A consequence of the flag action, recorded so it is not read as a bug

If a reviewer flags a company's only `active` row down to `needs_review` and a new submission then arrives from that company, Tool A matches only against `active` rows, finds none, and writes the new row as `active`. The company then holds one `active` row and one under review. This is Tool A behaving exactly as specified and is not a defect in either tool. No build action follows from it. It is written down because it will look surprising the first time it happens.

---

## Section 9 — Logic and Calculations

**What is calculated or scored:** two things, and only two. The risk flags, computed in the browser for display. The status transitions, computed in the database when a review decision is taken.

---

### A. The seven risk flags

**Inputs:** the seven Yes/No dropdown answers inside `questionnaire_answers`. These are the only seven Yes/No dropdowns in the 2026 workbook; verified directly against the file, whose data validation lists `"Yes,No"` on exactly those seven cells. The one other dropdown in the workbook, the Scope 2 verification method on row 7, offers Verified by Third Party / Internally Calculated / Estimated / Not Tracked, is not Yes/No, and is not a flag.

**Formula or rules:** a flag is raised when the answer matches the value in the last column. No weighting, no thresholds, no bands.

| # | Section | Workbook row | ESRS | Question | Flag raised when |
|---|---------|-------------|------|----------|------------------|
| 1 | S2 | 9 | E1-3 | Does your organisation have a Science-Based Target (SBTi) validated decarbonisation target? | **No** |
| 2 | S3 | 14 | E2-3 | Do any of your products or production processes contain or utilise PFAS compounds ("Forever Chemicals")? | **Yes** |
| 3 | S4 | 19 | E3-1 | Is your primary production facility located in a high-water-stress region (WRI Aqueduct score ≥3)? | **Yes** |
| 4 | S6 | 28 | E4-2 | Are any of your production sites located within or adjacent to (within 1 km) a protected area or biodiversity hotspot? | **Yes** |
| 5 | S7 | 32 | S2-1 | Does your organisation have a formal Human Rights and Labour Rights Policy, aligned with the UN Guiding Principles on Business and Human Rights? | **No** |
| 6 | S7 | 33 | S2-2 | Have you conducted a human rights due diligence assessment of your Tier 1 and Tier 2 supply chains in the last 24 months? | **No** |
| 7 | S7 | 35 | G1-1 | Does your organisation have a verified conflict minerals policy (3TG — tin, tantalum, tungsten, gold) in place, including OECD Due Diligence guidance compliance? | **No** |

Note that three of the seven flag on **No** and four flag on **Yes**. Claude Code must not normalise these to a single direction.

**Output:** a flag count from 0 to 7 per submission, plus which individual flags are raised. It is a count, never a score, never a grade, never a percentage, and nothing in the UI may present it as one.

**Scope:** computed only for submissions that are both `route = questionnaire` **and** `status = active`. Those are the only rows the flag board shows.

**Edge cases:**
- **EcoVadis rows** carry `questionnaire_answers = null` by constraint, so no flag can be computed. They display "not assessable via questionnaire", never a count and never a zero.
- **A missing, null, or blank answer** to one of the seven does not raise a flag and does not count. It is shown as unanswered on the detail page. This is an intentional choice: the flag board says what suppliers have told us, and inventing a flag from silence would misstate that. Tool A requires all fields before submit, so this should be rare, but a Door 2 upload could in principle produce it.
- **An unexpected value**, anything that is neither Yes nor No, is treated the same as a missing answer: no flag, shown as given on the detail page. Matching is case-insensitive and ignores surrounding whitespace.
- **A company with several active submissions**, which is possible after the flag-then-submit sequence described in Section 8, appears once per submission on the board, not once per company.

---

### B. Status transitions

**Inputs:** the target row's current status, the action taken, the note, the signed-in user's email, and the set of other rows for the same company. Company matching uses the same normalisation Tool A uses: case-insensitive and whitespace-insensitive on `company_name`.

**Formula or rules:**

| Action | Valid starting status | Ending status | Note required | Other rows touched |
|--------|----------------------|---------------|---------------|--------------------|
| Confirm | `needs_review` | `active` | Yes | None, unless blocked |
| Decline | `needs_review` | `superseded` | Yes | None |
| Flag for review | `active` or `superseded` | `needs_review` | Yes | None |
| Paired resolution | two or more rows at `needs_review` for one company | one becomes `active`, the rest become `superseded` | Yes, one per row | All rows in the pair or set |
| Accept blocked confirm | the row being confirmed, plus every `active` row for that company | all become `needs_review` | No | Every conflicting active row |

**The block:** a confirm is refused whenever it would leave the company with more than one `active` row. Refused means nothing is written, not even partially. The reviewer is offered the accept-or-cancel prompt described in Section 8.

**No new status values.** The enum `submission_status` keeps exactly its three values, `active` / `superseded` / `needs_review`, and Claude Code must not extend it. Decline means superseded; there is no separate rejected state, and none is to be invented.

**Output:** the updated row or rows, each carrying `status`, `resolved_by`, `resolved_at`, and `resolution_note`.

**Edge cases:**
- **Two reviewers acting at once on the same company.** Serialised by the advisory lock on the normalised company name, so the second one sees the first one's result and, if it now conflicts, is blocked.
- **A blank or whitespace-only note** is rejected by the function, not merely by the form. The browser is never the only thing enforcing it.
- **An action against a row whose status changed underneath the reviewer**, because a colleague acted first, is rejected by the function with a message saying the row is no longer in the expected state, and the view refreshes.
- **A row deleted underneath the reviewer**, which can only happen through a manual GDPR deletion in the table editor, produces a not-found result and a refresh.
- **The resolution trail cannot be undone.** Reversing a decision means taking a new one, which overwrites all three columns together. There is no history of prior notes on a row.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** the `the-corporate-brand` skill file. The builder copies it from Tool A's repo (`.claude/skills/the-corporate-brand/SKILL.md`) flat into this repo's root before the build; Claude Code installs it to `.claude/skills/the-corporate-brand/SKILL.md` during First Session Setup. It is invoked for every UI decision in this tool.

Hard rules that hold even if the skill is not loaded:

- Background: `#F2F2F2` (Chalk) for pages, `#EAE4D5` (Linen) for surfaces. Never white, never Tailwind's default grays.
- Accent: `#C8F135` (Acid Lime), **maximum two uses per page**, always against `#000000`, never directly on a light background.
- Type: Playfair Display for headlines, DM Sans 300 for body.
- No border-radius anywhere. Square corners only.
- No drop shadows. 0.5px Stone hairline borders instead.

**Visual feel:** professional and corporate, consistent with the portal.

> **The constraint to watch on this build.** A dashboard wants colour: a pie chart, status badges in three states, seven flag indicators, two counters. The two-uses-per-page Acid Lime cap is far easier to breach here than it was on the portal, where it is already breached three times on the landing page. Claude Code must build the chart and every status and flag indicator from the neutral palette (Chalk, Linen, Stone, black) plus whatever additional non-accent tones the brand skill permits, and spend the two Acid Lime uses deliberately. Flag indicators in particular must not default to lime.

**Reference or inspiration:** the existing portal, same brand, same site family, different audience.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database reads, the two review functions, and Auth | Publishable (anon) key, browser-safe. **The service role key is not used by this tool and must not be added to it.** | Netlify environment variable |

**Environment variables — exactly two, both set in the Netlify dashboard before the first functional build:**

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | The project URL for "The corporate live build (New)" | Supplied by the builder directly to Claude Code at the build session. Never committed. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (anon) key | Browser-safe by design. `anon` has zero access to `submissions`, so this key opens nothing on its own. |

Both are `VITE_`-prefixed because Vite exposes only prefixed variables to the client bundle, and both are read by the browser. That is correct and intended here, and it is the opposite of Tool A, where both variables are server-side only and neither is prefixed.

> **Security rule — no exceptions.** No API key, token, password, or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub. The project URL and ref are treated the same way: they are supplied to Claude Code at the session and set as Netlify environment variables, never written into the spec, the repo, `CLAUDE.md`, `PROGRESS.md`, or any commit message. Documentation refers to the project by name only. The service role key has no place in this tool at all.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase project URL and ref | Available — exists from Tool A's build | Supabase dashboard. Builder supplies directly to Claude Code at the session. |
| Supabase publishable (anon) key | Available — exists from Tool A's build | Supabase dashboard → Project Settings → API |
| The three user accounts | Needs creating | Supabase dashboard → Authentication → Users. Create before the build session, and disable public signup at the same time. |

Nothing else. No AI provider, no Resend, no third-party service of any kind.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Any change whatsoever to the Supplier Sustainability Portal | Explicitly ruled out by the builder at the start of the interview. No new fields, no new routes, no change to the submission flow, the workbook, the capture screens, or the submit-time status logic. The only thing this build changes in shared territory is adding three nullable columns and the policies and functions in Section 6. |
| Editing any supplier-provided value | Only `status` and the three resolution columns are writable, and only through the two functions. A reviewer can never alter what a supplier submitted. |
| Roles or differentiated permissions between ESG, EHS and procurement | Confirmed in the interview: one permission set. Adding roles later would mean an Access Architect run and a policy rewrite. |
| Email alerts on a new `needs_review` row | Declined. The counter on the Overview is the signal. |
| AI reading, summarising, or classifying the open-ended S2 to S7 answers | Declined. The free text is displayed verbatim and never processed. |
| Scheduled jobs, digests, or automated recalculation | Declined. Everything computes at page load. |
| Undoing or editing a resolution note once written | Confirmed write-once. Reversing a decision means taking a new one, which overwrites the trail. |
| A separate `rejected` status | Decline maps to `superseded`. Adding a fourth enum value would change a type Tool A writes into. |
| Supplier roster, non-responder tracking, submission chasing | No roster table exists and none is planned. Carried forward from Tool A's out-of-scope list. |
| Weighting, scoring, or grading the seven flags | It is a count, not a score. Stated explicitly by the builder. |
| Flag columns or questionnaire answers in the CSV | Register columns only. Confirmed. |
| PDF export of a supplier submission | Not requested. CSV only. |
| Automated EcoVadis scorecard validation | Requires EcoVadis API access. Carried forward from Tool A. |
| Deleting submissions from the dashboard | GDPR deletions stay manual in the Supabase table editor. `authenticated` has no delete grant. |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Nothing renders before sign-in | Visiting any URL without a session shows the login screen only. No submission data reaches the browser. No signup link exists anywhere. | [ ] |
| 2 | The three accounts sign in and are equivalent | All three accounts sign in with email and password, and each can reach every view and take every action. Public signup is disabled in Supabase. | [ ] |
| 3 | anon is still locked out | With no session, a direct PostgREST call to `submissions` returns no rows and no data. RLS is enabled and forced; `anon` has zero policies and zero grants, unchanged from Tool A's build. | [ ] |
| 4 | authenticated can read but not write directly | A signed-in session can select every row. A direct insert, update, or delete against `submissions` from the browser is refused. Status changes succeed only through the two functions. | [ ] |
| 5 | The schema delta is additive only | `resolved_by`, `resolved_at`, `resolution_note` exist and are nullable. No existing column, enum, constraint, index, or Tool A function was altered or dropped. | [ ] |
| 6 | Tool A still works after the schema change | A real submission through the live portal, either route, still writes successfully and gets the correct status. | [ ] |
| 7 | Overview counts active rows only | The three summary numbers and the pie chart count `active` rows. EcoVadis plus questionnaire equals the total. Superseded and needs_review rows are excluded. | [ ] |
| 8 | The two counters are correct and clickable | Needs review and superseded counters show the right counts and each opens the register filtered to exactly those rows. | [ ] |
| 9 | Flags compute correctly in both directions | A submission answering No to SBTi, human rights policy, due diligence, or conflict minerals raises those flags. A submission answering Yes to PFAS, water stress, or protected area raises those. A fully clean submission shows 0. All seven raised shows 7. | [ ] |
| 10 | EcoVadis rows are never shown as zero-flag | Every EcoVadis row on the flag board reads "not assessable via questionnaire" and shows no count and no indicators. | [ ] |
| 11 | The flag filter interlock works | Selecting any flag sets status to active and route to questionnaire and disables both controls. Clearing all flags re-enables them. Selecting several flags requires a row to raise all of them. | [ ] |
| 12 | The register sorts, searches and filters | All five columns sort both ways. Partial, case-insensitive company search works. Status and route filters work. Default view on arrival is active only. | [ ] |
| 13 | The CSV matches its spec | Downloads exactly company, contact name, route, status, date submitted. Honours the status and route filters. Ignores the search box and the sort. Contains no flags, no flag count, no questionnaire answers, no resolution trail. | [ ] |
| 14 | Supplier detail is complete | Shows all six identity fields; the EcoVadis link on EcoVadis rows; every S2 to S7 answer grouped by section under its question text on questionnaire rows, with no truncation; the resolution trail when present; and every other submission from the same company as history. | [ ] |
| 15 | Confirm, decline and flag write correctly | Confirm takes needs_review to active. Decline takes needs_review to superseded. Flag takes active or superseded to needs_review. Each writes `resolved_by` as the signed-in user's email, `resolved_at`, and the note. | [ ] |
| 16 | Notes are mandatory and enforced server-side | A blank or whitespace-only note is rejected by the Postgres function, not only by the form. Verified by calling the function directly. | [ ] |
| 17 | Invalid transitions are refused | Confirm and decline are refused on a row that is not needs_review. Flag is refused on a row already at needs_review. | [ ] |
| 18 | The blocked confirm behaves exactly as specified | Confirming a row while the company holds another active row writes nothing and returns blocked. Cancel writes nothing. Accept sets the confirmed row and every conflicting active row to needs_review, requires no note, and opens the review page for that company. | [ ] |
| 19 | The paired resolution writes both rows with separate notes | Two needs_review rows for one company resolve in one action: one becomes active, the other becomes superseded, each carrying its own note. Neither can be submitted with a note missing. | [ ] |
| 20 | Concurrent review is safe | Two sessions confirming rows for the same company at the same time do not both succeed in producing an active row. The advisory lock serialises them and the second is blocked. | [ ] |
| 21 | The resolution trail is write-once | No UI path edits or deletes an existing note. The only change is a subsequent decision overwriting all three columns together. | [ ] |
| 22 | Brand compliance | Chalk and Linen backgrounds, Playfair headlines, DM Sans 300 body, square corners, no shadows, hairline borders. Acid Lime appears at most twice on any page, including the chart, the status badges and the flag indicators. | [ ] |
| 23 | Responsive | Every view is usable below 768px with no horizontal overflow, including the register table and the paired review page. | [ ] |
| 24 | Deploys and runs live | The Netlify site loads, sign-in works against the live project, and a real review decision is visible in the Supabase table editor afterwards. | [ ] |
| 25 | No credential or project identifier in the repo | No service role key anywhere. No project ref or URL in any committed file, including CLAUDE.md, PROGRESS.md, docs, and commit messages. | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 3

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec written and confirmed
- [ ] Project Governor skill — `CLAUDE.md` and `PROGRESS.md` produced from this spec. **The Governor requires `docs/supabase-setup.md` from Tool A as an input, because this build targets an existing project.**
- [ ] **New** GitHub repo created by the builder, separate from the portal's repo
- [ ] `product-spec.md` uploaded to the repo root
- [ ] `CLAUDE.md` uploaded to the repo root
- [ ] `PROGRESS.md` uploaded to the repo root
- [ ] `supabase-setup.md` copied from Tool A's repo (`docs/supabase-setup.md`) into this repo root
- [ ] `the-corporate-brand` skill file copied from Tool A's repo into this repo root
- [ ] **Tool A's two Netlify environment variables set**, which is still open on Tool A's PROGRESS.md. Until that is done the portal cannot write, so no real submission can exist to read the answer keys from.
- [ ] **At least one real questionnaire-route submission exists in the live table**, so Claude Code can read the actual `questionnaire_answers` keys. Fallback if not: copy `src/lib/questionnaireSchema.js` from Tool A's repo into this repo. One of the two is required.
- [ ] Three user accounts created in Supabase → Authentication → Users, and public signup disabled
- [ ] Netlify site created and connected to the new GitHub repo, one-time, in the Netlify dashboard
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` added as Netlify environment variables **before the first functional build**
- [ ] Supabase project moved to the Pro plan
- [ ] Project ref and URL to hand, to give to Claude Code at the session. Not written into any file.

> Claude Code organizes these files into the correct folders (`docs/`, `.claude/skills/`) automatically during First Session Setup.

---

### Tier 3 — build session

- [ ] Open Claude Code in the project folder
- [ ] First Session Setup: create `docs/`, move `product-spec.md` and `supabase-setup.md` into it, install the brand skill to `.claude/skills/the-corporate-brand/SKILL.md`, commit and push
- [ ] Claude Code reads `product-spec.md`, `CLAUDE.md`, `PROGRESS.md`, and `docs/supabase-setup.md`
- [ ] **Supabase — existing project.** Claude Code takes the project ref from the builder, connects, and reviews the current schema before changing anything. It does not create a project and does not recreate the table, enums, constraint, indexes, or Tool A's two functions.
- [ ] Claude Code reads one real questionnaire row and records the seven actual answer keys, mapping them to the criteria in Section 9 by question text
- [ ] Claude Code adds the three nullable columns
- [ ] Claude Code configures Supabase Auth: email and password enabled, public signup disabled, no other provider
- [ ] Claude Code adds the `authenticated` select policy and re-issues the select grant to `authenticated` only. `anon` stays at zero policies and zero grants.
- [ ] Claude Code builds `resolve_submission` and `send_company_to_review` per Section 6, both SECURITY DEFINER with `search_path` pinned, EXECUTE revoked from `public` and `anon`, granted to `authenticated`
- [ ] Claude Code verifies in-database that `anon` still has no privilege on the table or on any function, and that `authenticated` has select but no insert, update, or delete
- [ ] Claude Code updates `docs/supabase-setup.md`: the three new columns, the new policy and grants, the two new functions, the Pro plan, the auth configuration, the stack-member note, and the last-updated line. Project name only, never ref or URL.
- [ ] Claude Code builds the frontend: login, Tab 1 (Overview and flag board), Tab 2 (register), supplier detail, review page, blocked-confirm prompt
- [ ] Test locally against the live project, including every status transition, the block, the paired resolution, and the concurrency case
- [ ] Push to main, Netlify auto-deploys
- [ ] Confirm live: sign in, take one real decision, verify the row in the Supabase table editor
- [ ] Optional post-build: run the Supabase QA skill to verify schema, RLS, and auth configuration

---

### Post-build — one manual step, easy to forget

- [ ] Copy the updated `docs/supabase-setup.md` back into Tool A's repo, replacing the old one, so both tools read the same schema truth. Without this, the next portal session will be working from a file that no longer describes the database.

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Is there at least one real questionnaire-route submission in the live table? Tool A's PROGRESS.md says the test rows were deleted and the table was left empty, and its two Netlify environment variables were still outstanding. Without a real row, Claude Code cannot read the `questionnaire_answers` keys and the flag board cannot be wired. Fallback: copy `src/lib/questionnaireSchema.js` across. | Builder | **Yes — must be resolved before the build session** |
| Confirm the browser-direct design in Section 6: the dashboard uses the publishable key with RLS and the two SECURITY DEFINER functions, rather than copying Tool A's server-side Netlify Function pattern. Recommended and confirmed in the interview; recorded here so it is a visible decision rather than an assumption. | Builder | No — Claude Code proceeds with this unless told otherwise before the session |
| Tool A's two Netlify environment variables are still unset per its PROGRESS.md, so the portal has never completed a live submission. This blocks the row above and should be closed first. | Builder | **Yes — blocks the row above** |
| Should the workbook's STATUS column dropdown still offering "EcoVadis Bypass" be cleaned up? Known cosmetic issue on Tool A, unrelated to this build and harmless to it. | Builder | No — out of scope here |
| Deployed URL for this tool | Builder | No — confirmed after deployment |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 14 September 2026 | Initial build. Internal login-protected review dashboard joining the existing "The corporate live build (New)" Supabase project as Tool B in a two-tool stack. Supabase Auth with email and password, invite-only, three accounts, one permission set (A2, Tier 3). Browser-direct database access using the publishable key, with a select policy and grant for `authenticated` and the `anon` deny-all left untouched. Three nullable columns added to `submissions` for the resolution trail. Two SECURITY DEFINER functions added for status transitions, with an advisory lock on the normalised company name and a blocked confirm that prevents a second active row per company. Overview with active-only totals, a route pie chart, and clickable needs_review and superseded counters. Risk flag board computing seven unweighted flags from the workbook's seven Yes/No dropdowns, with EcoVadis rows shown as not assessable rather than zero-flag, and a filter interlock pinning status to active and route to questionnaire. Supplier register with sort, company search, status and route filters, and a CSV export of register columns only. Supplier detail with full S2 to S7 answers by section, the resolution trail, and same-company history. Review page handling both the paired and single needs_review cases with a mandatory note per row. GDPR confirmed not applicable. Supabase project moved to the Pro plan. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
