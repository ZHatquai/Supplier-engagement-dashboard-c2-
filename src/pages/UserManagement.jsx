import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS, fetchRoster, roleLabel, setUserRole } from '../lib/profiles'
import { inviteUser, resetUserPassword, setUserActive } from '../lib/admin'
import { formatDate } from '../lib/format'

const MONO = "'JetBrains Mono', 'Courier New', monospace"

// Reached only when the signed-in account's profiles.is_admin is true — the nav
// link is not rendered otherwise and the route redirects. That is a screen
// refusal; the refusal that matters is server-side, in set_user_role and in the
// admin Netlify Function, both of which re-read is_admin on every call.
export default function UserManagement() {
  const { userId, reloadProfile } = useAuth()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [drafts, setDrafts] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [message, setMessage] = useState(null)

  // Shown once, never again, and never written anywhere.
  const [secret, setSecret] = useState(null)
  const [copied, setCopied] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('procurement')
  const [inviteAdmin, setInviteAdmin] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { rows: next, error } = await fetchRoster()
    setRows(next)
    setLoadError(error)
    setDrafts(
      Object.fromEntries(next.map((row) => [row.user_id, { role: row.role, is_admin: row.is_admin }])),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // The panel reads profiles after every action, and the header re-reads the
  // signed-in account's own row with it.
  const afterAction = useCallback(async () => {
    await load()
    await reloadProfile()
  }, [load, reloadProfile])

  const counts = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.is_active).length,
      admins: rows.filter((row) => row.is_admin).length,
    }),
    [rows],
  )

  function draftFor(row) {
    return drafts[row.user_id] ?? { role: row.role, is_admin: row.is_admin }
  }

  function setDraft(row, patch) {
    setDrafts((current) => ({
      ...current,
      [row.user_id]: { ...(current[row.user_id] ?? { role: row.role, is_admin: row.is_admin }), ...patch },
    }))
  }

  function isDirty(row) {
    const draft = draftFor(row)
    return draft.role !== row.role || draft.is_admin !== row.is_admin
  }

  async function onSaveRole(row) {
    const draft = draftFor(row)
    setBusyId(row.user_id)
    setMessage(null)
    const result = await setUserRole(row.user_id, draft.role, draft.is_admin)
    setBusyId(null)

    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The change could not be saved.' })
      await afterAction()
      return
    }

    setMessage({
      kind: 'ok',
      text: `${row.email} is now ${roleLabel(draft.role)}${draft.is_admin ? ' with the Admin flag' : ''}. It applies to their very next action.`,
    })
    await afterAction()
  }

  async function onSetActive(row, isActive) {
    setBusyId(row.user_id)
    setConfirming(null)
    setMessage(null)
    const result = await setUserActive(row.user_id, isActive)
    setBusyId(null)

    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The account could not be updated.' })
      await afterAction()
      return
    }

    setMessage({
      kind: 'ok',
      text: isActive
        ? `${row.email} can sign in again with the same password.`
        : `${row.email} is deactivated and cannot sign in until reactivated. Their submissions are untouched.`,
    })
    await afterAction()
  }

  async function onReset(row) {
    setBusyId(row.user_id)
    setConfirming(null)
    setMessage(null)
    const result = await resetUserPassword(row.user_id)
    setBusyId(null)

    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The password could not be reset.' })
      return
    }

    setCopied(false)
    setSecret({ email: result.email, password: result.password, kind: 'reset' })
    await afterAction()
  }

  async function onInvite(event) {
    event.preventDefault()
    setInviteBusy(true)
    setInviteError(null)
    const result = await inviteUser({ email: inviteEmail.trim(), role: inviteRole, adminFlag: inviteAdmin })
    setInviteBusy(false)

    if (!result?.ok) {
      setInviteError(result?.message || 'The invite could not be completed.')
      return
    }

    setInviteOpen(false)
    setInviteEmail('')
    setInviteRole('procurement')
    setInviteAdmin(false)
    setCopied(false)
    setSecret({ email: result.email, password: result.password, kind: 'invite' })
    await afterAction()
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(secret.password)
      setCopied(true)
    } catch {
      setCopied(false)
      setMessage({ kind: 'error', text: 'The password could not be copied. Select it and copy it by hand before closing.' })
    }
  }

  if (loading) return <p className="tc-body">Loading the roster.</p>

  return (
    <article>
      <header style={{ marginBottom: 32 }}>
        <h1 className="tc-h1" style={{ marginBottom: 12 }}>User management</h1>
        <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 24, maxWidth: 720 }}>
          Who can sign in, and what each account may do. Accounts are never deleted here, only
          deactivated and reactivated. Nobody changes their own role, Admin flag, or access from this
          panel, Admin included.
        </p>

        <div className="flex flex-wrap items-center gap-6" style={{ marginBottom: 24 }}>
          <span className="tc-body" style={{ fontSize: 14, color: '#4A453B' }}>
            {counts.total} accounts · {counts.active} active · {counts.admins} with the Admin flag
          </span>
        </div>

        <button type="button" className="tc-btn-primary" onClick={() => { setInviteError(null); setInviteOpen(true) }}>
          Invite user
        </button>
      </header>

      {loadError && (
        <p className="tc-body" style={{ color: '#C0392B', fontSize: 14 }}>{loadError}</p>
      )}

      <div aria-live="polite" style={{ marginBottom: 16, minHeight: 24 }}>
        {message && (
          <p
            className="tc-body"
            style={{ fontSize: 14, margin: 0, color: message.kind === 'error' ? '#C0392B' : '#2E7D32' }}
          >
            {message.text}
          </p>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '0.5px solid #B6B09F', background: '#FFFFFF' }}>
        <table className="tc-table">
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Role</th>
              <th scope="col">Admin</th>
              <th scope="col">Access</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const self = row.user_id === userId
              const draft = draftFor(row)
              const busy = busyId === row.user_id
              const pending = confirming?.userId === row.user_id ? confirming.kind : null

              return (
                <tr key={row.user_id}>
                  <td style={{ verticalAlign: 'top', minWidth: 220 }}>
                    <span style={{ wordBreak: 'break-word' }}>{row.email}</span>
                    {self && (
                      <span className="tc-label" style={{ display: 'block', marginTop: 4 }}>
                        You — change your own access from the Supabase dashboard
                      </span>
                    )}
                    {row.updated_by && (
                      <span className="tc-label" style={{ display: 'block', marginTop: 4, textTransform: 'none', letterSpacing: 0 }}>
                        Last changed {formatDate(row.updated_at)} by {row.updated_by}
                      </span>
                    )}
                  </td>

                  <td style={{ verticalAlign: 'top', minWidth: 150 }}>
                    <label className="tc-label block" htmlFor={`role-${row.user_id}`} style={{ position: 'absolute', left: -9999 }}>
                      Role for {row.email}
                    </label>
                    <select
                      id={`role-${row.user_id}`}
                      className="tc-select"
                      value={draft.role}
                      disabled={self || busy}
                      onChange={(event) => setDraft(row, { role: event.target.value })}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>

                  <td style={{ verticalAlign: 'top' }}>
                    <label className="flex items-center gap-2" style={{ cursor: self ? 'not-allowed' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={draft.is_admin}
                        disabled={self || busy}
                        onChange={(event) => setDraft(row, { is_admin: event.target.checked })}
                        aria-label={`Admin flag for ${row.email}`}
                      />
                      <span className="tc-body" style={{ fontSize: 13, color: self ? '#8C8674' : '#000000' }}>
                        {draft.is_admin ? 'Admin' : 'No'}
                      </span>
                    </label>
                  </td>

                  <td style={{ verticalAlign: 'top' }}>
                    <span className="tc-body" style={{ fontSize: 14 }}>
                      {row.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>

                  <td style={{ verticalAlign: 'top', minWidth: 260 }}>
                    {pending ? (
                      <div style={{ borderLeft: '0.5px solid #B6B09F', paddingLeft: 12 }}>
                        <p className="tc-body" style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>
                          {pending === 'deactivate'
                            ? 'Deactivate this account? They will be signed out and unable to log in until reactivated.'
                            : pending === 'reactivate'
                              ? 'Reactivate this account? They can sign in again with the same password.'
                              : 'Reset this password? The current password stops working immediately and the new one is shown once.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="tc-btn-primary"
                            style={{ padding: '7px 14px', fontSize: 11 }}
                            disabled={busy}
                            onClick={() => {
                              if (pending === 'reset') return onReset(row)
                              return onSetActive(row, pending === 'reactivate')
                            }}
                          >
                            {busy ? 'Working' : 'Yes, continue'}
                          </button>
                          <button
                            type="button"
                            className="tc-btn-secondary"
                            style={{ padding: '7px 14px', fontSize: 11 }}
                            disabled={busy}
                            onClick={() => setConfirming(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="tc-btn-primary"
                          style={{ padding: '7px 14px', fontSize: 11 }}
                          disabled={self || busy || !isDirty(row)}
                          onClick={() => onSaveRole(row)}
                        >
                          {busy ? 'Working' : 'Save role'}
                        </button>
                        <button
                          type="button"
                          className="tc-btn-secondary"
                          style={{ padding: '7px 14px', fontSize: 11 }}
                          disabled={self || busy}
                          onClick={() =>
                            setConfirming({
                              userId: row.user_id,
                              kind: row.is_active ? 'deactivate' : 'reactivate',
                            })
                          }
                        >
                          {row.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button
                          type="button"
                          className="tc-btn-secondary"
                          style={{ padding: '7px 14px', fontSize: 11 }}
                          disabled={busy}
                          onClick={() => setConfirming({ userId: row.user_id, kind: 'reset' })}
                        >
                          Reset password
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', marginTop: 16, maxWidth: 720 }}>
        A role or Admin-flag change applies on that account's very next action. There is no re-login
        and no waiting: every check reads this table fresh.
      </p>

      {/* Invite ----------------------------------------------------------- */}
      {inviteOpen && (
        <Modal title="Invite a user" onClose={() => setInviteOpen(false)} labelledBy="invite-title">
          <form onSubmit={onInvite} noValidate>
            <p className="tc-body" style={{ fontSize: 14, marginTop: 0, marginBottom: 20 }}>
              The account is created at once and a one-time starter password is shown here once. No
              email is sent: hand the password over yourself, on Teams or in person.
            </p>

            <label className="tc-label block" htmlFor="invite-email" style={{ marginBottom: 6 }}>
              Email
            </label>
            <input
              id="invite-email"
              className="tc-input"
              type="email"
              autoComplete="off"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              style={{ marginBottom: 20 }}
            />

            <label className="tc-label block" htmlFor="invite-role" style={{ marginBottom: 6 }}>
              Role
            </label>
            <select
              id="invite-role"
              className="tc-select"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              style={{ marginBottom: 20 }}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2" style={{ cursor: 'pointer', marginBottom: 24 }}>
              <input
                type="checkbox"
                checked={inviteAdmin}
                onChange={(event) => setInviteAdmin(event.target.checked)}
              />
              <span className="tc-body" style={{ fontSize: 14 }}>
                Give this account the Admin flag
              </span>
            </label>

            {inviteError && (
              <p className="tc-body" style={{ fontSize: 14, color: '#C0392B', marginTop: 0, marginBottom: 16 }}>
                {inviteError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="tc-btn-primary" disabled={inviteBusy || inviteEmail.trim() === ''}>
                {inviteBusy ? 'Working' : 'Create account'}
              </button>
              <button type="button" className="tc-btn-secondary" disabled={inviteBusy} onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* One-time password ------------------------------------------------ */}
      {secret && (
        <Modal
          title={secret.kind === 'invite' ? 'Account created' : 'Password reset'}
          onClose={() => setSecret(null)}
          labelledBy="secret-title"
        >
          <p className="tc-body" style={{ fontSize: 14, marginTop: 0, marginBottom: 8 }}>
            {secret.email}
          </p>
          <p className="tc-body" style={{ fontSize: 14, marginTop: 0, marginBottom: 20 }}>
            This password is shown once and is stored nowhere. Copy it now and hand it over yourself.
            If it is lost, reset the password again.
          </p>

          <p
            style={{
              fontFamily: MONO,
              fontSize: 18,
              letterSpacing: '0.04em',
              background: '#EAE4D5',
              border: '0.5px solid #B6B09F',
              padding: 16,
              margin: 0,
              marginBottom: 20,
              wordBreak: 'break-all',
            }}
          >
            {secret.password}
          </p>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="tc-btn-primary" onClick={onCopy}>
              {copied ? 'Copied' : 'Copy password'}
            </button>
            <button type="button" className="tc-btn-secondary" onClick={() => setSecret(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </article>
  )
}
