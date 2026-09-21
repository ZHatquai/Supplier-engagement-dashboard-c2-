import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import SubmissionAnswers from '../components/SubmissionAnswers'
import ResolutionTrail from '../components/ResolutionTrail'
import FlagIndicators from '../components/FlagIndicators'
import { NOT_ASSESSABLE, flagSummary } from '../lib/flags'
import { formatDate, routeLabel } from '../lib/format'
import { resolveSubmission } from '../lib/review'

const IDENTITY_FIELDS = [
  { key: 'company_name', label: 'Company name' },
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_phone', label: 'Contact phone' },
  { key: 'job_title', label: 'Job title' },
  { key: 'department', label: 'Department' },
]

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, companyRows, loading, refresh } = useData()
  const { canReview } = useAuth()

  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (loading) return <p className="tc-body">Loading submission.</p>

  const submission = getById(id)
  if (!submission) {
    return (
      <div>
        <p className="tc-body">This submission could not be found. It may have been deleted.</p>
        <Link to="/register" className="tc-btn-secondary inline-block" style={{ textDecoration: 'none' }}>
          Back to the register
        </Link>
      </div>
    )
  }

  const summary = flagSummary(submission)
  const history = companyRows(submission.company_name).filter((r) => r.id !== submission.id)
  const canFlag = submission.status === 'active' || submission.status === 'superseded'
  const needsReview = submission.status === 'needs_review'

  async function onFlag() {
    if (note.trim() === '') {
      setMessage({ kind: 'error', text: 'A note is required. Record why this submission is going back to review.' })
      return
    }
    setBusy(true)
    setMessage(null)
    const result = await resolveSubmission(submission.id, 'flag', note)
    setBusy(false)

    if (result?.ok) {
      setNote('')
      setMessage({ kind: 'ok', text: 'Sent to review. The submission now awaits a confirm or decline decision.' })
      await refresh()
    } else {
      setMessage({ kind: 'error', text: result?.message || 'The action could not be completed.' })
      await refresh()
    }
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

      {/* Header ------------------------------------------------------------ */}
      <header style={{ marginBottom: 32 }}>
        <h1 className="tc-h1" style={{ marginBottom: 12, wordBreak: 'break-word' }}>
          {submission.company_name}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={submission.status} />
          <span className="tc-body" style={{ fontSize: 14, color: '#4A453B' }}>
            {routeLabel(submission.route)} route
          </span>
          <span className="tc-body" style={{ fontSize: 14, color: '#4A453B' }}>
            Submitted {formatDate(submission.created_at)}
          </span>
        </div>
      </header>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Identity ------------------------------------------------------- */}
        <section className="tc-card">
          <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 16 }}>Identity</h2>
          <dl className="m-0">
            {IDENTITY_FIELDS.map((field) => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <dt className="tc-label" style={{ margin: 0 }}>{field.label}</dt>
                <dd className="tc-body" style={{ margin: 0, fontSize: 14, wordBreak: 'break-word' }}>
                  {submission[field.key] || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Risk summary --------------------------------------------------- */}
        <section className="tc-card-elevated">
          <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 16 }}>Risk summary</h2>

          {!summary.assessable ? (
            <p className="tc-body" style={{ margin: 0, color: '#4A453B', fontStyle: 'italic' }}>
              {NOT_ASSESSABLE}
            </p>
          ) : (
            <>
              <p className="tc-body" style={{ margin: 0, marginBottom: 4 }}>
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 32, lineHeight: 1.1 }}>
                  {summary.count}
                </span>
                <span style={{ color: '#4A453B' }}> of 7 flags raised</span>
              </p>
              <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', marginTop: 0, marginBottom: 16 }}>
                {summary.counted
                  ? 'Counted towards the risk flag board.'
                  : 'Not counted towards the risk flag board, because the board covers active submissions only.'}
              </p>

              <ul className="m-0 p-0" style={{ listStyle: 'none' }}>
                {summary.flags.map((flag) => (
                  <li
                    key={flag.id}
                    className="flex items-start gap-3"
                    style={{ borderTop: '0.5px solid rgba(182,176,159,0.35)', padding: '8px 0' }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 12, height: 12, marginTop: 6, flexShrink: 0,
                        background: flag.raised ? '#000000' : 'transparent',
                        border: flag.raised ? '0.5px solid #000000' : '0.5px solid #B6B09F',
                      }}
                    />
                    <span className="tc-body" style={{ fontSize: 14 }}>
                      {flag.label}
                      <span style={{ color: '#4A453B' }}>
                        {' '}— {flag.raised ? 'raised' : flag.unanswered ? 'unanswered' : 'not raised'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* EcoVadis --------------------------------------------------------- */}
      {submission.route === 'ecovadis' && (
        <section style={{ marginTop: 40 }}>
          <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 12 }}>EcoVadis scorecard</h2>
          {submission.ecovadis_link ? (
            <a
              href={submission.ecovadis_link}
              target="_blank"
              rel="noopener noreferrer"
              className="tc-body"
              style={{ color: '#000000', wordBreak: 'break-all' }}
            >
              {submission.ecovadis_link}
            </a>
          ) : (
            <p className="tc-body" style={{ color: '#4A453B', fontStyle: 'italic' }}>No link recorded.</p>
          )}
        </section>
      )}

      {/* Questionnaire ---------------------------------------------------- */}
      {submission.route === 'questionnaire' && (
        <section style={{ marginTop: 40 }}>
          <h2 className="tc-h2" style={{ fontSize: 26, marginBottom: 24 }}>Questionnaire answers</h2>
          <SubmissionAnswers answers={submission.questionnaire_answers} />
        </section>
      )}

      <hr className="tc-divider" />

      {/* Resolution trail ------------------------------------------------- */}
      <section>
        <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 12 }}>Resolution trail</h2>
        <ResolutionTrail submission={submission} />
      </section>

      <hr className="tc-divider" />

      {/* History ---------------------------------------------------------- */}
      <section>
        <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 16 }}>
          Other submissions from this company
        </h2>
        {history.length === 0 ? (
          <p className="tc-body" style={{ color: '#4A453B' }}>
            This company has only this one submission.
          </p>
        ) : (
          <ul className="m-0 p-0" style={{ listStyle: 'none' }}>
            {history.map((row) => (
              <li key={row.id} className="tc-card-elevated" style={{ marginBottom: 12 }}>
                <div className="flex flex-wrap items-center gap-4" style={{ marginBottom: 8 }}>
                  <StatusBadge status={row.status} />
                  <span className="tc-body" style={{ fontSize: 14, color: '#4A453B' }}>
                    {routeLabel(row.route)} — submitted {formatDate(row.created_at)}
                  </span>
                  <Link to={`/submission/${row.id}`} className="tc-body" style={{ fontSize: 13, color: '#000000' }}>
                    Open
                  </Link>
                </div>
                <ResolutionTrail submission={row} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Action area ------------------------------------------------------
          Role-conditional from v2.1. EHS and ESG see Confirm and Decline at
          needs_review, and Flag at active or superseded. Procurement sees no
          action area at all — not disabled buttons, nothing in this space: the
          page ends at the history block above. Both review functions refuse a
          Procurement caller too, so nothing rests on this having rendered. */}
      {canReview && (
        <>
          <hr className="tc-divider" />
          <section className="tc-card">
            <h2 className="tc-h3" style={{ fontSize: 14, marginBottom: 16 }}>Review decision</h2>

            {needsReview ? (
              <>
                <p className="tc-body" style={{ marginTop: 0, marginBottom: 16 }}>
                  This submission awaits a decision. Confirm or decline it on the review page, where every
                  submission this company has under review is shown side by side.
                </p>
                <Link
                  to={`/review/${submission.id}`}
                  className="tc-btn-primary inline-block"
                  style={{ textDecoration: 'none' }}
                >
                  Open review page
                </Link>
              </>
            ) : canFlag ? (
              <>
                <p className="tc-body" style={{ marginTop: 0, marginBottom: 16 }}>
                  Send this submission back to review. A note is required and is kept as part of the
                  resolution trail. It cannot be edited afterwards.
                </p>
                <label className="tc-label block" htmlFor="flag-note" style={{ marginBottom: 6 }}>
                  Note — why this goes back to review
                </label>
                <textarea
                  id="flag-note"
                  className="tc-textarea"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ marginBottom: 16, maxWidth: 640 }}
                />
                <div>
                  <button type="button" className="tc-btn-primary" disabled={busy || note.trim() === ''} onClick={onFlag}>
                    {busy ? 'Working' : 'Flag for review'}
                  </button>
                </div>
              </>
            ) : null}

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
        </>
      )}
    </article>
  )
}
