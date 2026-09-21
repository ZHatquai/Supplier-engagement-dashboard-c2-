import { supabase } from './supabase'

// The three operations that touch auth.users directly: invite, deactivate or
// reactivate, and reset a password. They cannot be expressed as RLS, because RLS
// governs table rows and these govern Supabase's own user-management API.
//
// Every one of them goes to the same endpoint, which holds the service role key
// server-side and re-checks the caller's session and profiles.is_admin before
// doing anything. Nothing here carries a key: the browser sends only its own
// Supabase access token, which is what the function checks.

const ENDPOINT = '/.netlify/functions/admin-users'

async function callAdmin(body) {
  if (!supabase) {
    return { ok: false, error: 'not_configured', message: 'Supabase is not configured.' }
  }

  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  if (!token) {
    return { ok: false, error: 'no_session', message: 'No signed-in user. Sign in again and retry.' }
  }

  let response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    return {
      ok: false,
      error: 'network',
      message: 'The admin function could not be reached. It runs on Netlify, so it is unavailable when the site is served from a local dev server without Netlify Dev.',
    }
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!payload) {
    return {
      ok: false,
      error: 'bad_response',
      message: `The admin function returned ${response.status} with no readable body.`,
    }
  }

  return payload
}

export function inviteUser({ email, role, adminFlag }) {
  return callAdmin({ action: 'invite', email, role, is_admin: adminFlag === true })
}

export function setUserActive(userId, isActive) {
  return callAdmin({ action: 'set_active', user_id: userId, is_active: isActive === true })
}

export function resetUserPassword(userId) {
  return callAdmin({ action: 'reset_password', user_id: userId })
}
