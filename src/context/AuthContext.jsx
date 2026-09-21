import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { canReview, fetchOwnProfile, isAdmin } from '../lib/profiles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // Kept as one value, tagged with the account it belongs to. A separate
  // "resolved" boolean would read true for a moment after a new session arrives
  // but before its profile is fetched, and the role-conditional routes would
  // render — and redirect — against a role nobody has read yet.
  const [loadedProfile, setLoadedProfile] = useState({ forUser: null, row: null, error: null })

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false)
      return undefined
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setSessionLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  // The screen mirrors the role; the database enforces it. This is re-read on
  // every navigation (see AppShell) so a role change made by Admin mid-session
  // shows up on this account's very next action, with no re-login.
  const reloadProfile = useCallback(async () => {
    if (!userId) {
      setLoadedProfile({ forUser: null, row: null, error: null })
      return null
    }
    const { profile: row, error } = await fetchOwnProfile(userId)
    setLoadedProfile({ forUser: userId, row, error })
    return row
  }, [userId])

  useEffect(() => {
    reloadProfile()
  }, [reloadProfile])

  const profileResolved = loadedProfile.forUser === userId
  const profile = profileResolved ? loadedProfile.row : null
  const profileError = profileResolved ? loadedProfile.error : null

  const value = useMemo(
    () => ({
      session,
      // Nothing role-conditional renders until the profile has resolved, so the
      // action area never flashes into view for an account that cannot act.
      loading: sessionLoading || (Boolean(session) && !profileResolved),
      configError,
      email: session?.user?.email ?? null,
      userId,
      profile,
      profileError,
      role: profile?.role ?? null,
      isAdmin: isAdmin(profile),
      canReview: canReview(profile),
      reloadProfile,
      async signIn(email, password) {
        if (!supabase) return { error: configError }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        // A single generic message, so the form never reveals whether an account
        // exists for that address.
        if (error) return { error: 'Sign-in failed. Check the email address and password.' }
        return { error: null }
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
      },
      // The signed-in user's own password, and nobody else's. An ordinary
      // client-side updateUser call: no new key, no function, no admin action.
      // Supabase does not ask for the current password, so it is checked by
      // re-authenticating first — a wrong one fails here and nothing changes.
      async changePassword(currentPassword, newPassword) {
        if (!supabase) return { error: configError }
        const address = session?.user?.email
        if (!address) return { error: 'No signed-in user. Sign in again and retry.' }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: address,
          password: currentPassword,
        })
        if (reauthError) return { error: 'That current password is not correct.' }

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        if (updateError) return { error: updateError.message }
        return { error: null }
      },
    }),
    [session, sessionLoading, profile, profileResolved, profileError, userId, reloadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
