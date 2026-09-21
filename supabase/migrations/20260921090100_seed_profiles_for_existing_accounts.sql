-- The Corporate Supplier Review Dashboard 2026 — v2.1, migration 2 of 4.
--
-- Seeds profiles for the three accounts that already existed at v1.0. Roles are
-- taken from docs/access-matrix.md Section 3; is_admin is true on the confirmed
-- ESG Lead account only.
--
-- Matched on email rather than a hardcoded uuid, so this file carries no
-- generated identifier and can be re-run safely.

insert into public.profiles (user_id, email, role, is_admin, is_active, updated_by)
select u.id, u.email, seed.role, seed.is_admin, true, null
from (values
  ('sustaintrend@gmail.com', 'ehs'::public.user_role,         false),  -- EHS Manager
  ('z.hatquai@sustainos.io', 'esg'::public.user_role,         true),   -- ESG Lead, holds the Admin flag
  ('z.hatquai@gmail.com',    'procurement'::public.user_role, false)   -- Procurement Manager
) as seed (email, role, is_admin)
join auth.users u on lower(btrim(u.email)) = seed.email
on conflict (user_id) do nothing;
