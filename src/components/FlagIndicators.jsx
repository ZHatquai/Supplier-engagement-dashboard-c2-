import { FLAGS } from '../lib/flags'

// Seven indicators, neutral palette only. A raised flag is a filled Ink square;
// a flag that is not raised is a Stone hairline outline. Flag indicators must
// never default to the accent.
export default function FlagIndicators({ flags, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-[5px]" role="list">
      {flags.map((flag) => (
        <span
          key={flag.id}
          role="listitem"
          title={`${flag.label} — ${flag.raised ? 'raised' : flag.unanswered ? 'unanswered' : 'not raised'}`}
          aria-label={`${flag.label}: ${flag.raised ? 'raised' : flag.unanswered ? 'unanswered' : 'not raised'}`}
          style={{
            width: size,
            height: size,
            display: 'inline-block',
            background: flag.raised ? '#000000' : 'transparent',
            border: flag.raised ? '0.5px solid #000000' : '0.5px solid #B6B09F',
          }}
        />
      ))}
    </span>
  )
}

export function FlagLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {FLAGS.map((flag, i) => (
        <span key={flag.id} className="tc-label" style={{ letterSpacing: '0.06em' }}>
          {i + 1}. {flag.short}
        </span>
      ))}
    </div>
  )
}
