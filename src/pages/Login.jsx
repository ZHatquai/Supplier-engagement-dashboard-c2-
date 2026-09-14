import { useState } from 'react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

// Nothing else on this screen. No signup link, no create-account path, no
// password-reset self-service, no supplier-facing content. Accounts are created
// by the builder in the Supabase dashboard and public signup is disabled there.
export default function Login() {
  const { signIn, configError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await signIn(email.trim(), password)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <main className="min-h-full flex items-center justify-center" style={{ padding: '40px 16px' }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <Logo />
        </div>

        <h1 className="tc-h2" style={{ marginBottom: 8 }}>Supplier Review</h1>
        <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 32 }}>
          Internal access only. Sign in to continue.
        </p>

        {configError ? (
          <div
            className="tc-body"
            style={{ background: '#FFFFFF', border: '0.5px solid #C0392B', color: '#C0392B', padding: 16, fontSize: 14 }}
          >
            {configError}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <label className="tc-label block" htmlFor="email" style={{ marginBottom: 6 }}>
              Email
            </label>
            <input
              id="email"
              className="tc-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 20 }}
            />

            <label className="tc-label block" htmlFor="password" style={{ marginBottom: 6 }}>
              Password
            </label>
            <input
              id="password"
              className="tc-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginBottom: 24 }}
            />

            <div aria-live="polite" style={{ minHeight: 24, marginBottom: 8 }}>
              {error && (
                <p className="tc-body" style={{ color: '#C0392B', fontSize: 14, margin: 0 }}>
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="tc-btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
