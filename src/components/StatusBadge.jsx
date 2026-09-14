import { statusLabel } from '../lib/format'

// Three states, built from the neutral palette only. A dashboard has far more
// colour surfaces than the portal did, and the two-use Acid Lime cap is easy to
// breach here, so no status badge ever uses the accent.
const STYLES = {
  active: { background: '#000000', color: '#F2F2F2', border: '0.5px solid #000000' },
  needs_review: { background: '#FFFFFF', color: '#000000', border: '1px solid #000000' },
  superseded: { background: 'transparent', color: '#4A453B', border: '0.5px solid #B6B09F' },
}

export default function StatusBadge({ status, className = '' }) {
  const style = STYLES[status] || STYLES.superseded
  return (
    <span
      className={`inline-block whitespace-nowrap ${className}`}
      style={{
        ...style,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        lineHeight: 1.6,
      }}
    >
      {statusLabel(status)}
    </span>
  )
}
