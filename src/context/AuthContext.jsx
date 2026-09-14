import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, configError } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      configError,
      email: session?.user?.email ?? null,
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
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
