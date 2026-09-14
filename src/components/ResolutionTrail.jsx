import { formatDateTime } from '../lib/format'

// Write-once. There is no edit, no delete, and no undo anywhere in this tool: the
// only change is the next decision on that row overwriting all three columns
// together. This information appears here and nowhere else; it is never a
// register column.
export default function ResolutionTrail({ submission, compact = false }) {
  if (!submission.resolved_by) {
    return (
      <p className="tc-body" style={{ fontSize: compact ? 13 : 15, color: '#4A453B', margin: 0, fontStyle: 'italic' }}>
        No review decision has been recorded.
      </p>
    )
  }

  return (
    <div>
      <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', margin: 0, marginBottom: 4 }}>
        {submission.resolved_by} — {formatDateTime(submission.resolved_at)}
      </p>
      {submission.resolution_note ? (
        <p
          className="tc-body"
          style={{ margin: 0, fontSize: compact ? 14 : 15, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {submission.resolution_note}
        </p>
      ) : (
        <p className="tc-body" style={{ margin: 0, fontSize: 14, color: '#4A453B', fontStyle: 'italic' }}>
          Sent to review alongside a conflicting submission. No note is recorded at that step.
        </p>
      )}
    </div>
  )
}
