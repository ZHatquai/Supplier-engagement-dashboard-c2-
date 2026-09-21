import { supabase } from './supabase'

// profiles carries just enough to render the roster and to decide what a signed-in
// account may do: email, role, admin flag, active state. authenticated holds
// SELECT on every row and nothing else — role and is_admin change only through
// set_user_role, is_active and email only through the admin Netlify Function.

export const ROLE_OPTIONS = [
  { value: 'ehs', label: 'EHS' },
  { value: 'esg', label: 'ESG' },
  { value: 'procurement', label: 'Procurement' },
]

export function roleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? '—'
}

// The two roles that may confirm, decline, and flag. The screen mirrors this;
// the database is what enforces it, inside both review functions.
export function canReview(profile) {
  return profile?.role === 'ehs' || profile?.role === 'esg'
}

export function isAdmin(profile) {
  return profile?.is_admin === true
}

export async function fetchOwnProfile(userId) {
  if (!supabase || !userId) return { profile: null, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role, is_admin, is_active, created_at, updated_at, updated_by')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { profile: null, error: error.message }
  return { profile: data ?? null, error: null }
}

export async function fetchRoster() {
  if (!supabase) return { rows: [], error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role, is_admin, is_active, created_at, updated_at, updated_by')
    .order('email', { ascending: true })

  if (error) return { rows: [], error: error.message }
  return { rows: data ?? [], error: null }
}

// Role and admin-flag reassignment. An ordinary table write, so it needs no
// service role key: it goes through the same SECURITY DEFINER pattern the two
// review functions use. The function refuses a non-admin caller and refuses a
// caller targeting their own row, writing nothing either way.
export async function setUserRole(userId, role, adminFlag) {
  if (!supabase) return { ok: false, error: 'not_configured', message: 'Supabase is not configured.' }
  const { data, error } = await supabase.rpc('set_user_role', {
    p_user_id: userId,
    p_role: role,
    p_is_admin: adminFlag,
  })
  if (error) return { ok: false, error: 'rpc_failed', message: error.message }
  return data
}
