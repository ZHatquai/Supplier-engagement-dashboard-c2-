-- The Corporate Supplier Review Dashboard 2026 — v2.1, migration 3 of 4.
--
-- Adds the role check from docs/access-matrix.md Section 6 lines 4 and 5 to the
-- two review functions. Everything else in both bodies is byte-for-byte the v1.0
-- behaviour: the three actions, the mandatory note, the wrong-status refusal, the
-- blocked confirm, the advisory lock, and resolved_by read from the session.
--
-- Order of the refusals, deliberately: no_session first, so v1.0's error taxonomy
-- is unchanged for a caller with no session at all; then the role check, before
-- any argument is validated and before any row is read. A refused caller learns
-- nothing about the row it named and writes nothing.
--
-- The role is read fresh from profiles on every call and never cached, so a role
-- change mid-session takes effect on that account's very next action.

create or replace function public.resolve_submission(p_id uuid, p_action text, p_note text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_action    text := lower(btrim(coalesce(p_action, '')));
  v_note      text := btrim(coalesce(p_note, ''));
  v_email     text := nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '');
  v_role      public.user_role;
  v_key       text;
  v_row       public.submissions;
  v_target    public.submission_status;
  v_conflicts jsonb;
  v_count     int;
begin
  -- resolved_by is read from the session, never supplied by the client.
  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'no_session',
      'message', 'No signed-in user. Sign in again and retry.');
  end if;

  -- v2.1: only ehs and esg may take a review decision. Procurement is refused
  -- here, not in the screen, so bypassing the UI changes nothing.
  select p.role into v_role from public.profiles p where p.user_id = auth.uid();

  if v_role is null or v_role not in ('ehs', 'esg') then
    return jsonb_build_object('ok', false, 'error', 'not_authorized',
      'message', 'Your role cannot take review actions.');
  end if;

  if v_action not in ('confirm', 'decline', 'flag') then
    return jsonb_build_object('ok', false, 'error', 'invalid_action',
      'message', 'Action must be confirm, decline, or flag.');
  end if;

  -- Mandatory note, enforced here and not only by the form.
  if v_note = '' then
    return jsonb_build_object('ok', false, 'error', 'note_required',
      'message', 'A note is required. Record why this decision was taken.');
  end if;

  select lower(btrim(company_name)) into v_key
    from public.submissions where id = p_id;

  if v_key is null then
    return jsonb_build_object('ok', false, 'error', 'not_found',
      'message', 'This submission no longer exists. The view will refresh.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

  -- Re-read under the lock: a colleague may have acted first.
  select * into v_row from public.submissions where id = p_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found',
      'message', 'This submission no longer exists. The view will refresh.');
  end if;

  if v_action = 'confirm' then
    v_target := 'active';
    if v_row.status <> 'needs_review' then
      return jsonb_build_object('ok', false, 'error', 'wrong_status',
        'current_status', v_row.status,
        'message', 'This submission is no longer awaiting review. The view will refresh.');
    end if;

    -- The block: a confirm that would leave the company with two active rows is
    -- refused outright and writes nothing.
    select jsonb_agg(jsonb_build_object('id', id, 'route', route, 'created_at', created_at)
                     order by created_at desc),
           count(*)
      into v_conflicts, v_count
      from public.submissions
     where lower(btrim(company_name)) = v_key
       and status = 'active'
       and id <> p_id;

    if coalesce(v_count, 0) > 0 then
      return jsonb_build_object(
        'ok', false,
        'blocked', true,
        'conflicting_count', v_count,
        'conflicting_ids', (select jsonb_agg(c ->> 'id') from jsonb_array_elements(v_conflicts) c),
        'conflicts', v_conflicts,
        'message', 'This company already has an active submission.');
    end if;

  elsif v_action = 'decline' then
    v_target := 'superseded';
    if v_row.status <> 'needs_review' then
      return jsonb_build_object('ok', false, 'error', 'wrong_status',
        'current_status', v_row.status,
        'message', 'This submission is no longer awaiting review. The view will refresh.');
    end if;

  else -- flag
    v_target := 'needs_review';
    if v_row.status not in ('active', 'superseded') then
      return jsonb_build_object('ok', false, 'error', 'wrong_status',
        'current_status', v_row.status,
        'message', 'This submission is already awaiting review. The view will refresh.');
    end if;
  end if;

  update public.submissions
     set status          = v_target,
         resolved_by     = v_email,
         resolved_at     = now(),
         resolution_note = v_note
   where id = p_id
  returning * into v_row;

  return jsonb_build_object('ok', true, 'action', v_action, 'row', to_jsonb(v_row));
end;
$function$;

revoke all on function public.resolve_submission(uuid, text, text) from public, anon;
grant execute on function public.resolve_submission(uuid, text, text) to authenticated;


create or replace function public.send_company_to_review(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_email text := nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '');
  v_role  public.user_role;
  v_key   text;
  v_row   public.submissions;
  v_ids   jsonb;
  v_count int;
begin
  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'no_session',
      'message', 'No signed-in user. Sign in again and retry.');
  end if;

  -- v2.1: the accept action on the blocked-confirm prompt is a review decision
  -- like any other. Procurement is refused before anything is read.
  select p.role into v_role from public.profiles p where p.user_id = auth.uid();

  if v_role is null or v_role not in ('ehs', 'esg') then
    return jsonb_build_object('ok', false, 'error', 'not_authorized',
      'message', 'Your role cannot take review actions.');
  end if;

  select lower(btrim(company_name)) into v_key
    from public.submissions where id = p_id;

  if v_key is null then
    return jsonb_build_object('ok', false, 'error', 'not_found',
      'message', 'This submission no longer exists. The view will refresh.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

  select * into v_row from public.submissions where id = p_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found',
      'message', 'This submission no longer exists. The view will refresh.');
  end if;

  if v_row.status <> 'needs_review' then
    return jsonb_build_object('ok', false, 'error', 'wrong_status',
      'current_status', v_row.status,
      'message', 'This submission is no longer awaiting review. The view will refresh.');
  end if;

  select count(*) into v_count
    from public.submissions
   where lower(btrim(company_name)) = v_key
     and status = 'active'
     and id <> p_id;

  if v_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'no_conflict',
      'message', 'This company no longer has a conflicting active submission. The view will refresh.');
  end if;

  -- The row being confirmed plus every conflicting active row all go to review.
  -- resolution_note is deliberately left untouched: no note is required at this
  -- step, the note comes with the decision that follows.
  with moved as (
    update public.submissions
       set status      = 'needs_review',
           resolved_by = v_email,
           resolved_at = now()
     where lower(btrim(company_name)) = v_key
       and (id = p_id or status = 'active')
    returning id
  )
  select jsonb_agg(id), count(*) into v_ids, v_count from moved;

  return jsonb_build_object('ok', true, 'company_key', v_key,
    'affected_count', v_count, 'affected_ids', coalesce(v_ids, '[]'::jsonb));
end;
$function$;

revoke all on function public.send_company_to_review(uuid) from public, anon;
grant execute on function public.send_company_to_review(uuid) to authenticated;
