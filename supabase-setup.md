# Supabase Setup — The Corporate Supplier Sustainability Portal 2026

> Schema source of truth from v3.0 onward. Update this file at every save point that touches the
> database (CLAUDE.md, Supabase section).

**Last updated:** 7 September 2026 — session 2, v3.0 build.

## Project

| Detail | Value |
|--------|-------|
| Project name | The corporate live build (New) |
| Project ID / ref | Not recorded here — see the Supabase dashboard |
| Project URL | Not recorded here — held only in the `SUPABASE_URL` Netlify environment variable |
| Region | eu-central-1 (Frankfurt) — GDPR |
| Plan | Free — pauses after roughly a week without traffic |
| Postgres | 17 |
| Created | 7 September 2026, by the builder in the Supabase dashboard |

The project was created before this build session, not via MCP. Everything below was applied by
Claude Code via the Supabase MCP during session 2.

## Access model

The browser never talks to Supabase. Every read and write goes through the server-side Netlify
Function at `netlify/functions/submissions.js`, using the service role key.

| Env var | Where it is set | Used by |
|---------|-----------------|---------|
| `SUPABASE_URL` | Netlify environment variable | the submission function only |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify environment variable | the submission function only |

No anon or publishable key is used anywhere in this tool.

**Neither value may appear in any committed file or in the client bundle — and neither may the
project URL or project ref.** This repository is public. The project's identity lives in two places
only: the Supabase dashboard, and the Netlify environment variables. Refer to it by name in
documentation, never by ref or URL.

## Table — `submissions`

One row per completed submission, either route.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | no | primary key, `gen_random_uuid()` |
| `company_name` | text | no | non-blank; duplicate matching key |
| `contact_name` | text | no | non-blank |
| `contact_email` | text | no | non-blank; format validated in the function |
| `contact_phone` | text | no | non-blank; no format validation, by design |
| `job_title` | text | no | non-blank |
| `department` | text | no | non-blank, free text |
| `route` | `submission_route` | no | enum: `ecovadis` \| `questionnaire`; set by the system |
| `ecovadis_link` | text | yes | required on the EcoVadis route, null on the Questionnaire route |
| `questionnaire_answers` | jsonb | yes | required on the Questionnaire route, null on the EcoVadis route |
| `status` | `submission_status` | no | enum: `active` \| `superseded` \| `needs_review`; computed server-side |
| `created_at` | timestamptz | no | `now()` |

Constraint `submissions_route_payload_check` enforces the route/payload pairing: an `ecovadis` row
carries a link and no answers; a `questionnaire` row carries answers and no link.

Indexes: `lower(btrim(company_name))` (duplicate matching), `status`, `created_at desc`.

## RLS

RLS is **enabled and forced** on `submissions`, with **zero policies** — every anon and
authenticated request is denied. `GRANT`s were additionally revoked from `anon` and
`authenticated`, so the table stays unreachable from the browser even if a policy is ever added by
mistake. The service role bypasses RLS.

| Table | Role | Read | Insert | Update | Delete |
|-------|------|------|--------|--------|--------|
| submissions | anon | no | no | no | no |
| submissions | authenticated | no | no | no | no |
| submissions | service_role | yes | yes | yes | yes |

Verified in-database on 7 September 2026 with `has_table_privilege` and `has_function_privilege`:
`anon` and `authenticated` return false for every privilege on the table and both functions.

The Supabase security advisor reports `rls_enabled_no_policy` (INFO) for this table. That is the
intended design here, not a defect — deny-all is the policy.

## Functions

Both are `SECURITY DEFINER`, `search_path` pinned to `public, pg_temp`, `EXECUTE` revoked from
`public`, `anon`, and `authenticated`, and granted only to `service_role`.

### `check_submission_duplicate(p_company_name text, p_route submission_route) → jsonb`

Advisory only, used to show the "warn but allow" message before submitting. Returns
`{"duplicate": bool, "kind": "none" | "same_route" | "cross_route"}` by matching `company_name`
case-insensitively and whitespace-insensitively against rows with `status = 'active'`.

### `submit_submission(...) → submissions`

The duplicate check, the status computation, any status update to existing rows, and the insert all
happen inside this one call — a single transaction, never two round-trips from the browser
(product-spec v3.0 §9 rule 4). It takes `pg_advisory_xact_lock` on the normalised company name
first, so two suppliers submitting for the same company at once cannot both be written as `active`.

Status rules, matched against existing `active` rows for the same company:

| Situation | New row | Existing rows |
|-----------|---------|---------------|
| No active row | `active` | — |
| Active row, same route | `needs_review` | same-route active rows → `needs_review` |
| Active row, other route, new is `ecovadis` | `active` | questionnaire active rows → `superseded` |
| Active row, other route, new is `questionnaire` | `superseded` | unchanged (`ecovadis` stays `active`) |

Verified against the live database on 7 September 2026: first submission active; EcoVadis after
Questionnaire flipped the questionnaire row to superseded; Questionnaire after EcoVadis wrote
superseded and left the EcoVadis row active; a second EcoVadis set both EcoVadis rows to
`needs_review`. Test rows were deleted afterwards — the table is empty.

## Resolving `needs_review`

No automated resolution exists in this build. The EHS manager opens the Supabase table editor and
changes `status` to `active` or `superseded` by hand. This is temporary and will be replaced by the
internal review dashboard (product-spec v3.0 §12).

## GDPR

Personal data: `company_name`, `contact_name`, `contact_email`, `contact_phone`, `job_title`,
`department`. Stored in eu-central-1 (Frankfurt). Retained indefinitely unless deletion is
requested. Deletion requests arrive at the Contact EHS address on the landing page
(`sustainability@thecorporate.com`) and are actioned by deleting the row(s) in the Supabase table
editor.

## Pre-existing objects not created by this build

`public.rls_auto_enable()` is an event-trigger function already present in the project. It enables
RLS automatically on any new table created in `public`. It is a safety guard, it touches no
application data, and it was left in place. The security advisor lists it as anon-executable; being
an event-trigger function it cannot meaningfully be invoked over the REST API.

## Future stack member

The planned internal review dashboard will share this project and add Supabase Auth plus per-role
RLS policies. Nothing in this build should be structured to prevent that: reads for the dashboard
should be added as policies for authenticated roles, never by loosening the anon deny-all above.
