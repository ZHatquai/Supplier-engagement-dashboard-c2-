// The one admin function for The Corporate Supplier Review Dashboard 2026.
//
// It exists because three operations touch auth.users directly and Row-Level
// Security governs table rows, not Supabase's own user-management API: invite,
// set_active (the deactivate/reactivate toggle), and reset_password.
//
// Because it holds the service role key it bypasses RLS entirely, so for these
// three operations THIS FUNCTION IS THE RULE. It verifies the caller's Supabase
// session and re-reads their profiles.is_admin on every single request, before
// doing anything at all, regardless of what the panel chose to render. A caller
// who reaches this endpoint directly with curl gets exactly the same refusals.
//
// SUPABASE_SERVICE_ROLE_KEY is read here and nowhere else. It is not VITE_-
// prefixed, so Vite never bakes it into the browser bundle, and it is referenced
// in no file under src/.
//
// One-time passwords are generated here, returned once in the response, and
// never logged, never written to a column, and never stored anywhere but the
// hash Supabase Auth already keeps.

import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'node:crypto'

const ROLES = ['ehs', 'esg', 'procurement']

// Unambiguous alphabet: no 0/O, no 1/l/I. These passwords are read aloud or
// copied by hand during the manual handoff.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function generatePassword() {
  const groups = []
  for (let g = 0; g < 4; g += 1) {
    let group = ''
    for (let i = 0; i < 4; i += 1) group += ALPHABET[randomInt(ALPHABET.length)]
    groups.push(group)
  }
  return groups.join('-')
}

function reply(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(body),
  }
}

function refuse(statusCode, error, message) {
  return reply(statusCode, { ok: false, error, message })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return refuse(405, 'method_not_allowed', 'This endpoint accepts POST only.')
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return refuse(
      500,
      'not_configured',
      'This function is not configured. SUPABASE_SERVICE_ROLE_KEY must be set as a Netlify environment variable, without a VITE_ prefix.',
    )
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return refuse(400, 'bad_request', 'The request body must be JSON.')
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1. Is there a session at all?
  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return refuse(401, 'no_session', 'No signed-in user. Sign in again and retry.')
  }

  const { data: caller, error: callerError } = await admin.auth.getUser(token)

  if (callerError || !caller?.user) {
    return refuse(401, 'no_session', 'That session is no longer valid. Sign in again and retry.')
  }

  // 2. Is that session an admin? Read fresh from profiles, every request. A flag
  //    dropped a moment ago is already gone by the time this call arrives.
  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('user_id, email, is_admin')
    .eq('user_id', caller.user.id)
    .maybeSingle()

  if (profileError) {
    return refuse(500, 'profile_read_failed', profileError.message)
  }

  if (!callerProfile?.is_admin) {
    return refuse(403, 'not_authorized', 'Only an admin can manage user access.')
  }

  const actingEmail = callerProfile.email || caller.user.email || null
  const action = String(payload.action || '').trim()

  try {
    if (action === 'invite') return await invite(admin, payload, actingEmail)
    if (action === 'set_active') return await setActive(admin, payload, actingEmail, caller.user.id)
    if (action === 'reset_password') return await resetPassword(admin, payload, actingEmail)
    return refuse(400, 'invalid_action', 'Action must be invite, set_active, or reset_password.')
  } catch (err) {
    return refuse(500, 'unexpected', err?.message || 'The action could not be completed.')
  }
}

// invite -----------------------------------------------------------------
// Creates the auth.users row and the matching profiles row, and returns a
// one-time starter password once. No email is sent: the handoff is manual, by
// design. There is no target-is-caller case to guard — an invite always creates
// a new account.
async function invite(admin, payload, actingEmail) {
  const email = String(payload.email || '').trim().toLowerCase()
  const role = String(payload.role || '').trim().toLowerCase()
  const isAdmin = payload.is_admin === true

  if (!email || !email.includes('@')) {
    return refuse(400, 'invalid_email', 'Enter a valid email address.')
  }
  if (!ROLES.includes(role)) {
    return refuse(400, 'invalid_role', 'Role must be EHS, ESG, or Procurement.')
  }

  const { data: existing, error: existingError } = await admin
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  if (existingError) return refuse(500, 'profile_read_failed', existingError.message)
  if (existing) {
    return refuse(409, 'already_exists', 'That email already has an account. Reset its password instead.')
  }

  const password = generatePassword()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    return refuse(400, 'create_failed', createError?.message || 'The account could not be created.')
  }

  const { error: insertError } = await admin.from('profiles').insert({
    user_id: created.user.id,
    email: created.user.email,
    role,
    is_admin: isAdmin,
    is_active: true,
    updated_by: actingEmail,
  })

  if (insertError) {
    // The account exists but has no profile, so it can sign in and reach
    // nothing. Say so plainly rather than deleting anything: nothing is ever
    // deleted through this tool.
    return refuse(
      500,
      'profile_not_created',
      `The account was created but its profile row was not: ${insertError.message}. Add the profile row in the Supabase dashboard, or ask the platform owner to.`,
    )
  }

  return reply(200, { ok: true, action: 'invite', email: created.user.email, password })
}

// set_active -------------------------------------------------------------
// The deactivate/reactivate toggle. Bans or unbans the account in Supabase Auth
// and mirrors the result onto profiles.is_active, so the panel renders a roster
// without a second call to the Auth admin API.
//
// Refuses when the target is the caller's own row, with no exception for the
// sole Admin. That recovery path is the platform owner in the Supabase
// dashboard, exactly as it is for role and the admin flag.
async function setActive(admin, payload, actingEmail, callerId) {
  const userId = String(payload.user_id || '').trim()
  const isActive = payload.is_active === true

  if (!userId) return refuse(400, 'bad_request', 'A user_id is required.')

  if (userId === callerId) {
    return refuse(
      403,
      'not_authorized',
      'You cannot deactivate or reactivate your own account. That change is made in the Supabase dashboard by the platform owner.',
    )
  }

  const { data: updated, error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : '876000h',
  })

  if (banError || !updated?.user) {
    return refuse(400, 'auth_update_failed', banError?.message || 'The account could not be updated.')
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      is_active: isActive,
      email: updated.user.email,
      updated_at: new Date().toISOString(),
      updated_by: actingEmail,
    })
    .eq('user_id', userId)

  if (profileError) return refuse(500, 'profile_update_failed', profileError.message)

  return reply(200, { ok: true, action: 'set_active', user_id: userId, is_active: isActive })
}

// reset_password ---------------------------------------------------------
// Sets a new one-time starter password and returns it once. Nothing stops an
// admin resetting their own password this way, though the Change Password
// screen is the normal route for that.
async function resetPassword(admin, payload, actingEmail) {
  const userId = String(payload.user_id || '').trim()
  if (!userId) return refuse(400, 'bad_request', 'A user_id is required.')

  const password = generatePassword()

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password,
  })

  if (updateError || !updated?.user) {
    return refuse(400, 'auth_update_failed', updateError?.message || 'The password could not be reset.')
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      email: updated.user.email,
      updated_at: new Date().toISOString(),
      updated_by: actingEmail,
    })
    .eq('user_id', userId)

  if (profileError) return refuse(500, 'profile_update_failed', profileError.message)

  return reply(200, { ok: true, action: 'reset_password', email: updated.user.email, password })
}
