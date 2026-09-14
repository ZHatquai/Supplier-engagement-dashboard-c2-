import { useState } from 'react'
import Modal from './Modal'
import { formatDate, routeLabel } from '../lib/format'

// Stops a confirm that would leave one company with two active submissions.
// No note field appears on this prompt.
// The single Acid Lime use on the page that renders it: a 2px lime left border on
// the one genuinely critical callout (brand Pattern B).
export default function BlockedConfirmPrompt({ companyName, result, onAccept, onCancel }) {
  const [busy, setBusy] = useState(false)
  const conflicts = Array.isArray(result?.conflicts) ? result.conflicts : []
  const count = result?.conflicting_count ?? conflicts.length

  return (
    <Modal title="This company already has an active submission" onClose={busy ? () => {} : onCancel}>
      <div style={{ borderLeft: '2px solid #C8F135', paddingLeft: 16, marginBottom: 20 }}>
        <p className="tc-body" style={{ margin: 0 }}>
          {companyName} already holds {count} active {count === 1 ? 'submission' : 'submissions'}.
          Confirming this one would leave the company with two, which is the state the portal's status
          logic exists to prevent. Nothing has been written.
        </p>
      </div>

      <p className="tc-label" style={{ marginBottom: 8 }}>Conflicting submissions</p>
      <ul className="m-0" style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
        {conflicts.map((c) => (
          <li
            key={c.id}
            className="tc-body"
            style={{ fontSize: 14, borderTop: '0.5px solid rgba(182,176,159,0.35)', padding: '10px 0' }}
          >
            {routeLabel(c.route)} — submitted {formatDate(c.created_at)}
          </li>
        ))}
      </ul>

      <p className="tc-body" style={{ fontSize: 14, color: '#4A453B', marginTop: 0, marginBottom: 24 }}>
        Accepting sends this submission and every conflicting active submission to review together, so
        they can be compared and resolved in one decision. No note is required at this step.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="tc-btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onAccept()
            setBusy(false)
          }}
        >
          {busy ? 'Sending' : 'Send all to review'}
        </button>
        <button type="button" className="tc-btn-secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
