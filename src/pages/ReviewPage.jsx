import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import StatusBadge from '../components/StatusBadge'
import SubmissionAnswers from '../components/SubmissionAnswers'
import BlockedConfirmPrompt from '../components/BlockedConfirmPrompt'
import { NOT_ASSESSABLE, flagSummary } from '../lib/flags'
import { formatDate, routeLabel } from '../lib/format'
import { isBlocked, resolveSubmission, sendCompanyToReview } from '../lib/review'

const IDENTITY_FIELDS = [
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_phone', label: 'Contact phone' },
  { key: 'job_title', label: 'Job title' },
  { key: 'department', label: 'Department' },
]

function SubmissionPanel({ submission, children }) {
  const summary = flagSummary(submission)
  return (
    <div className="tc-card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 12 }}>
        <StatusBadge status={submission.status} />
        <span className="tc-body" style={{ fontSize: 14, color: '#4A453B' }}>
          {routeLabel(submission.route)} — submitted {formatDate(submission.created_at)}
        </span>
      </div>

      {children}

      <dl className="m-0" style={{ marginBottom: 20 }}>
        {IDENTITY_FIELDS.map((field) => (
          <div key={field.key} style={{ marginBottom: 8 }}>
            <dt className="tc-label" style={{ margin: 0 }}>{field.label}</dt>
            <dd className="tc-body" style={{ margin: 0, fontSize: 14, wordBreak: 'break-word' }}>
              {submission[field.key] || '—'}
            </dd>
          </div>
        ))}
      </dl>

      <p className="tc-body" style={{ fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        {summary.assessable ? (
          <>
            <strong style={{ fontWeight: 500 }}>{summary.count} of 7</strong>
            <span style={{ color: '#4A453B' }}> flags raised. Flags are not counted towards the board while a submission is under review.</span>
          </>
        ) : (
          <span style={{ color: '#4A453B', fontStyle: 'italic' }}>{NOT_ASSESSABLE}</span>
        )}
      </p>

      {submission.route === 'ecovadis' ? (
        submission.ecovadis_link ? (
          <a
            href={submission.ecovadis_link}
            target="_blank"
            rel="noopener noreferrer"
            className="tc-body"
            style={{ fontSize: 14, color: '#000000', wordBreak: 'break-all' }}
          >
            {submission.ecovadis_link}
          </a>
        ) : (
          <p className="tc-body" style={{ fontSize: 14, color: '#4A453B', fontStyle: 'italic' }}>No link recorded.</p>
        )
      ) : (
        <details>
          <summary className="tc-label" style={{ cursor: 'pointer', marginBottom: 12 }}>
            Show the full questionnaire answers
          </summary>
          <div style={{ marginTop: 16 }}>
            <SubmissionAnswers answers={submission.questionnaire_answers} />
          </div>
        </details>
      )}

      <p style={{ marginTop: 'auto', paddingTop: 16, marginBottom: 0 }}>
        <Link to={`/submission/${submission.id}`} className="tc-body" style={{ fontSize: 13, color: '#000000' }}>
          Open the full detail page
        </Link>
      </p>
    </div>
  )
}

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, companyRows, loading, refresh } = useData()

  const [confirmId, setConfirmId] = useState(null)
  const [notes, setNotes] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [blocked, setBlocked] = useState(null)

  const origin = getById(id)
  const pending = useMemo(() => {
    if (!origin) return []
    return companyRows(origin.company_name)
      .filter((r) => r.status === 'needs_review')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [origin, companyRows])

  if (loading) return <p className="tc-body">Loading review.</p>

  if (!origin) {
    return (
      <div>
        <p className="tc-body">This submission could not be found. It may have been deleted.</p>
        <Link to="/register" className="tc-btn-secondary inline-block" style={{ textDecoration: 'none' }}>
          Back to the register
        </Link>
      </div>
    )
  }

  if (pending.length === 0) {
    return (
      <div>
        <h1 className="tc-h1" style={{ marginBottom: 12 }}>{origin.company_name}</h1>
        <p className="tc-body">
          Nothing from this company is awaiting review. A colleague may have resolved it already.
        </p>
        <Link to={`/submission/${origin.id}`} className="tc-btn-secondary inline-block" style={{ textDecoration: 'none' }}>
          Open the submission
        </Link>
      </div>
    )
  }

  const paired = pending.length > 1
  const chosen = paired ? confirmId : pending[0].id
  const noteFor = (rowId) => notes[rowId] ?? ''
  const setNote = (rowId, value) => setNotes((n) => ({ ...n, [rowId]: value }))

  // Every note is mandatory and must be non-blank. The decision cannot be
  // submitted until all of them are filled.
  const pairedReady = Boolean(chosen) && pending.every((r) => noteFor(r.id).trim() !== '')

  async function afterWrite(targetId, text) {
    await refresh()
    if (targetId) navigate(`/submission/${targetId}`)
    else setMessage(text)
  }

  async function runConfirm(rowId, note) {
    const result = await resolveSubmission(rowId, 'confirm', note)
    if (isBlocked(result)) {
      setBlocked({ ...result, targetId: rowId })
      return { halted: true }
    }
    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The confirm could not be completed.' })
      await refresh()
      return { halted: true }
    }
    return { halted: false }
  }

  async function onSubmitPaired() {
    setBusy(true)
    setMessage(null)

    // Confirm first: a blocked confirm writes nothing at all, so the declines are
    // never issued against a decision that did not happen.
    const outcome = await runConfirm(chosen, noteFor(chosen))
    if (outcome.halted) {
      setBusy(false)
      return
    }

    const failures = []
    for (const row of pending) {
      if (row.id === chosen) continue
      const result = await resolveSubmission(row.id, 'decline', noteFor(row.id))
      if (!result?.ok) failures.push(`${routeLabel(row.route)} of ${formatDate(row.created_at)}: ${result?.message || 'failed'}`)
    }

    setBusy(false)

    if (failures.length > 0) {
      await refresh()
      setMessage({
        kind: 'error',
        text: `The confirmation was written, but ${failures.length} decline could not be: ${failures.join('; ')}`,
      })
      return
    }

    await afterWrite(chosen)
  }

  async function onSingle(action) {
    const row = pending[0]
    const note = noteFor(row.id)
    if (note.trim() === '') {
      setMessage({ kind: 'error', text: 'A note is required. Record why this decision was taken.' })
      return
    }

    setBusy(true)
    setMessage(null)

    if (action === 'confirm') {
      const outcome = await runConfirm(row.id, note)
      setBusy(false)
      if (outcome.halted) return
      await afterWrite(row.id)
      return
    }

    const result = await resolveSubmission(row.id, 'decline', note)
    setBusy(false)
    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The decline could not be completed.' })
      await refresh()
      return
    }
    await afterWrite(row.id)
  }

  async function onAcceptBlocked() {
    const target = blocked?.targetId || chosen
    const result = await sendCompanyToReview(target)
    if (!result?.ok) {
      setMessage({ kind: 'error', text: result?.message || 'The submissions could not be sent to review.' })
    } else {
      setMessage({
        kind: 'ok',
        text: `${result.affected_count} submissions are now awaiting review together. Choose which one to confirm.`,
      })
      setConfirmId(null)
    }
    setBlocked(null)
    await refresh()
  }

  return (
    <article>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ all: 'unset', cursor: 'pointer', marginBottom: 24, display: 'inline-block' }}
        className="tc-label"
      >
        ← Back
      </button>

      <h1 className="tc-h1" style={{ marginBottom: 8, wordBreak: 'break-word' }}>
        {origin.company_name}
      </h1>
      <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 32 }}>
        {paired
          ? `${pending.length} submissions from this company await review. Choose the one to confirm. The others are declined and become superseded.`
          : 'One submission from this company awaits review. Confirm it or decline it, with a note.'}
      </p>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: paired ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', marginBottom: 32 }}
      >
        {pending.map((row) => (
          <SubmissionPanel key={row.id} submission={row}>
            {paired && (
              <label
                className="flex items-start gap-3"
                style={{
                  cursor: 'pointer',
                  marginBottom: 16,
                  padding: 12,
                  border: chosen === row.id ? '1px solid #000000' : '0.5px solid #B6B09F',
                  background: chosen === row.id ? '#EAE4D5' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="confirm-choice"
                  checked={chosen === row.id}
                  onChange={() => setConfirmId(row.id)}
                  style={{ marginTop: 5 }}
                />
                <span className="tc-body" style={{ fontSize: 14 }}>
                  {chosen === row.id
                    ? 'Confirm this submission. It becomes the active one.'
                    : chosen
                      ? 'Confirm this submission instead'
                      : 'Confirm this submission'}
                </span>
              </label>
            )}

            <label className="tc-label block" htmlFor={`note-${row.id}`} style={{ marginBottom: 6 }}>
              {!paired
                ? 'Note — why this decision was taken'
                : !chosen
                  ? 'Note — required for this submission'
                  : chosen === row.id
                    ? 'Note — why this one is confirmed'
                    : 'Note — why this one is declined'}
            </label>
            <textarea
              id={`note-${row.id}`}
              className="tc-textarea"
              rows={3}
              value={noteFor(row.id)}
              onChange={(e) => setNote(row.id, e.target.value)}
              style={{ marginBottom: 20 }}
            />
          </SubmissionPanel>
        ))}
      </div>

      <section className="tc-card">
        <p className="tc-body" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
          Every note is mandatory and is kept as part of the resolution trail. There is no edit and no
          undo: reversing a decision means taking a new one, which overwrites the trail.
        </p>

        {paired ? (
          <div>
            <button type="button" className="tc-btn-primary" disabled={busy || !pairedReady} onClick={onSubmitPaired}>
              {busy ? 'Working' : 'Submit decision'}
            </button>
            {!pairedReady && (
              <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', marginTop: 12, marginBottom: 0 }}>
                {!chosen
                  ? 'Choose which submission to confirm, then write a note for every submission.'
                  : 'Write a note for every submission before submitting.'}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="tc-btn-primary"
              disabled={busy || noteFor(pending[0].id).trim() === ''}
              onClick={() => onSingle('confirm')}
            >
              {busy ? 'Working' : 'Confirm'}
            </button>
            <button
              type="button"
              className="tc-btn-secondary"
              disabled={busy || noteFor(pending[0].id).trim() === ''}
              onClick={() => onSingle('decline')}
            >
              Decline
            </button>
          </div>
        )}

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
      </section>

      {blocked && (
        <BlockedConfirmPrompt
          companyName={origin.company_name}
          result={blocked}
          onAccept={onAcceptBlocked}
          onCancel={() => setBlocked(null)}
        />
      )}
    </article>
  )
}
