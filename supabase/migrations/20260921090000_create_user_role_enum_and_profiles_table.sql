-- The Corporate Supplier Review Dashboard 2026 — v2.1, migration 1 of 4.
-- Project: "The corporate live build (New)".
--
-- Creates the user_role enum and the profiles table, and locks the table down to
-- exactly what docs/access-matrix.md Section 6 line 8 allows.
--
-- Protected objects not touched here: the submissions table and its twelve
-- original columns, the submission_route and submission_status enums, the
-- submissions_route_payload_check constraint, the three existing indexes, and
-- Tool A's submit_submission and check_submission_duplicate functions.

create type public.user_role as enum ('ehs', 'esg', 'procurement');

create table public.profiles (
  user_id    uuid        primary key references auth.users (id),
  email      text        not null,
  role       public.user_role not null,
  is_admin   boolean     not null default false,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

comment on table public.profiles is
  'Tool B. One row per dashboard user, holding the role and admin state the app enforces. No created_by: a profile is created by invite, not by a submitter. No history table this version. The foreign key to auth.users deliberately has no ON DELETE action, so no profile row is ever removed as a side effect.';

comment on column public.profiles.email is
  'Copied from auth.users at invite time and kept in sync by every admin action. Duplicated here because an ordinary authenticated client cannot read auth.users.';

comment on column public.profiles.is_active is
  'Mirrors the Supabase Auth ban state, so the User Management panel renders a roster without a second call to the Auth admin API. Changed only through the admin Netlify Function.';

comment on column public.profiles.updated_by is
  'Email of the admin who made the last change, read from the caller session. Null until the first change.';

-- This project's default privileges grant ALL on a new public table to anon,
-- authenticated, and service_role. Take it all back before granting anything.
revoke all on public.profiles from anon, authenticated;

-- Policy plan line 8: every signed-in role reads every row. The two review
-- functions read the caller's own row to check role, and the User Management
-- panel renders the roster from it. Nothing else is granted: role and is_admin
-- change only through set_user_role, is_active and email only through the admin
-- Netlify Function. anon gets no policy and no grant, as on submissions.
grant select on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy authenticated_read_all_profiles
  on public.profiles
  for select
  to authenticated
  using (true);
