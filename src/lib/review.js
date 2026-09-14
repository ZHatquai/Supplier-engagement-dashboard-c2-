import { supabase } from './supabase'

// Status changes never go through a direct update. authenticated holds SELECT
// only; both writes below are SECURITY DEFINER Postgres functions that take an
// advisory lock on the normalised company name before reading.

function asFailure(message) {
  return { ok: false, error: 'rpc_failed', message }
}

// p_action is 'confirm', 'decline', or 'flag'. A non-blank note is mandatory for
// all three and is enforced inside the function, not only by the form.
export async function resolveSubmission(id, action, note) {
  if (!supabase) return asFailure('Supabase is not configured.')
  const { data, error } = await supabase.rpc('resolve_submission', {
    p_id: id,
    p_action: action,
    p_note: note,
  })
  if (error) return asFailure(error.message)
  return data
}

// The accept action on the blocked-confirm prompt. No note is required here; the
// note comes with the decision that follows.
export async function sendCompanyToReview(id) {
  if (!supabase) return asFailure('Supabase is not configured.')
  const { data, error } = await supabase.rpc('send_company_to_review', { p_id: id })
  if (error) return asFailure(error.message)
  return data
}

export function isBlocked(result) {
  return Boolean(result && result.blocked === true)
}
