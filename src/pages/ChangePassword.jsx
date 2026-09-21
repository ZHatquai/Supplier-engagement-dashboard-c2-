import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../lib/profiles'

// Every signed-in account reaches this screen, whatever its role, and it changes
// that account's own password and nobody else's. There is no admin action here
// and no new key: Supabase Auth's own updateUser call does the work.
export default function ChangePassword() {
  const navigate = useNavigate()
  const { email, role, isAdmin, changePassword } = useAuth()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && next !== confirm
  const ready = current !== '' && next.length >= 8 && next === confirm

  async function onSubmit(event) {
    event.preventDefault()
    if (!ready) return

    setBusy(true)
    setMessage(null)
    const { error } = await changePassword(current, next)
    setBusy(false)

    if (error) {
      setMessage({ kind: 'error', text: error })
      return
    }

    setCurrent('')
    setNext('')
    setConfirm('')
    setMessage({ kind: 'ok', text: 'Password changed. Use the new one the next time you sign in.' })
  }

  return (
    <article style={{ maxWidth: 520 }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ all: 'unset', cursor: 'pointer', marginBottom: 24, display: 'inline-block' }}
        className="tc-label"
      >
        ← Back
      </button>

      <h1 className="tc-h1" style={{ marginBottom: 12 }}>Your account</h1>
      <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 32 }}>
        Change your own password. This screen reaches no other account.
      </p>

      <section className="tc-card-elevated" style={{ marginBottom: 32 }}>
        <dl className="m-0">
          <div style={{ marginBottom: 12 }}>
            <dt className="tc-label" style={{ margin: 0 }}>Signed in as</dt>
            <dd className="tc-body" style={{ margin: 0, fontSize: 14, wordBreak: 'break-word' }}>{email}</dd>
          </div>
          <div style={{ margin: 0 }}>
            <dt className="tc-label" style={{ margin: 0 }}>Role</dt>
            <dd className="tc-body" style={{ margin: 0, fontSize: 14 }}>
              {roleLabel(role)}
              {isAdmin ? ' · Admin' : ''}
            </dd>
          </div>
        </dl>
      </section>

      <section className="tc-card">
        <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 16 }}>Change password</h2>

        <form onSubmit={onSubmit} noValidate>
          <label className="tc-label block" htmlFor="current-password" style={{ marginBottom: 6 }}>
            Current password
          </label>
          <input
            id="current-password"
            className="tc-input"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            style={{ marginBottom: 20 }}
          />

          <label className="tc-label block" htmlFor="new-password" style={{ marginBottom: 6 }}>
            New password
          </label>
          <input
            id="new-password"
            className="tc-input"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            aria-describedby="new-password-help"
            style={{ marginBottom: 6 }}
          />
          <p
            id="new-password-help"
            className="tc-body"
            style={{ fontSize: 13, color: tooShort ? '#C0392B' : '#4A453B', marginTop: 0, marginBottom: 20 }}
          >
            At least 8 characters.
          </p>

          <label className="tc-label block" htmlFor="confirm-password" style={{ marginBottom: 6 }}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            className="tc-input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            style={{ marginBottom: 6 }}
          />
          <p className="tc-body" style={{ fontSize: 13, color: '#C0392B', marginTop: 0, marginBottom: 20, minHeight: 20 }}>
            {mismatch ? 'The two new passwords do not match.' : ''}
          </p>

          <button type="submit" className="tc-btn-primary" disabled={busy || !ready}>
            {busy ? 'Saving' : 'Save new password'}
          </button>

          <div aria-live="polite" style={{ marginTop: 16 }}>
            {message && (
              <p
                className="tc-body"
                style={{ fontSize: 14, margin: 0, color: message.kind === 'error' ? '#C0392B' : '#2E7D32' }}
              >
                {message.text}
              </p>
            )}
          </div>
        </form>
      </section>
    </article>
  )
}
