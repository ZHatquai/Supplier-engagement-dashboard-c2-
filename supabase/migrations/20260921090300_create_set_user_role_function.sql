-- The Corporate Supplier Review Dashboard 2026 — v2.1, migration 4 of 4.
--
-- set_user_role is the only path by which profiles.role and profiles.is_admin
-- ever change. Changing them is an ordinary table write, so it needs no service
-- role key and no server function: it follows the pattern resolve_submission
-- already uses. docs/access-matrix.md Section 6 lines 11, 12, and 15.
--
-- The two refusals, in order:
--   1. caller's profiles.is_admin is not true  -> not_authorized, nothing written
--   2. the target is the caller's own row      -> not_authorized, nothing written
-- The second has no exception, not even for the sole Admin. If an Admin's own
-- role or flag has to change, the platform owner does it in the Supabase
-- dashboard — the backstop every role, admin, and active change ultimately has.
--
-- The self-target check sits before p_role is validated, so an Admin naming
-- their own user_id is refused with not_authorized whatever role they asked for.

create or replace function public.set_user_role(
  p_user_id  uuid,
  p_role     text,
  p_is_admin boolean
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_caller   uuid    := auth.uid();
  v_email    text    := nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '');
  v_is_admin boolean;
  v_role     text    := lower(btrim(coalesce(p_role, '')));
  v_row      public.profiles;
begin
  -- updated_by is read from the session, never supplied by the client.
  if v_caller is null or v_email is null then
    return jsonb_build_object('ok', false, 'error', 'no_session',
      'message', 'No signed-in user. Sign in again and retry.');
  end if;

  -- Read fresh on every call, never cached: a flag dropped a moment ago is
  -- already gone by the time the next action arrives.
  select p.is_admin into v_is_admin
    from public.profiles p
   where p.user_id = v_caller;

  if not coalesce(v_is_admin, false) then
    return jsonb_build_object('ok', false, 'error', 'not_authorized',
      'message', 'Only an admin can change a role or the admin flag.');
  end if;

  if p_user_id is null or p_user_id = v_caller then
    return jsonb_build_object('ok', false, 'error', 'not_authorized',
      'message', 'You cannot change your own role, admin flag, or access. That change is made in the Supabase dashboard by the platform owner.');
  end if;

  if v_role not in ('ehs', 'esg', 'procurement') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role',
      'message', 'Role must be ehs, esg, or procurement.');
  end if;

  update public.profiles
     set role       = v_role::public.user_role,
         is_admin   = coalesce(p_is_admin, false),
         updated_at = now(),
         updated_by = v_email
   where user_id = p_user_id
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found',
      'message', 'That account no longer has a profile. The panel will refresh.');
  end if;

  return jsonb_build_object('ok', true, 'row', to_jsonb(v_row));
end;
$function$;

revoke all on function public.set_user_role(uuid, text, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, text, boolean) to authenticated;
