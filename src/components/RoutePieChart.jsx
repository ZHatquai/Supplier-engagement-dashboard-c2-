// Two segments, neutral palette only: Ink for EcoVadis, Stone for Questionnaire.
// Labelled, with counts. No accent, no gradient, no shadow.
function arcPath(cx, cy, r, startAngle, endAngle) {
  const toPoint = (angle) => [
    cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  ]
  const [x1, y1] = toPoint(startAngle)
  const [x2, y2] = toPoint(endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const SEGMENT_STYLES = {
  ecovadis: { fill: '#000000', stroke: '#000000' },
  questionnaire: { fill: '#B6B09F', stroke: '#000000' },
}

export default function RoutePieChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return <p className="tc-body" style={{ color: '#4A453B' }}>No submissions yet.</p>
  }

  const size = 168
  const r = 78
  const cx = size / 2
  const cy = size / 2

  let cursor = 0
  const wedges = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const sweep = (s.value / total) * 360
      const start = cursor
      cursor += sweep
      return { ...s, start, end: cursor }
    })

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join('. ')}
        style={{ flexShrink: 0 }}
      >
        {wedges.length === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={SEGMENT_STYLES[wedges[0].id].fill}
            stroke="#000000"
            strokeWidth="0.5"
          />
        ) : (
          wedges.map((w) => (
            <path
              key={w.id}
              d={arcPath(cx, cy, r, w.start, w.end)}
              fill={SEGMENT_STYLES[w.id].fill}
              stroke="#000000"
              strokeWidth="0.5"
            />
          ))
        )}
      </svg>

      <ul className="m-0 p-0" style={{ listStyle: 'none' }}>
        {segments.map((s) => (
          <li key={s.id} className="flex items-center gap-3" style={{ marginBottom: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                display: 'inline-block',
                background: SEGMENT_STYLES[s.id].fill,
                border: '0.5px solid #000000',
                flexShrink: 0,
              }}
            />
            <span className="tc-body" style={{ fontSize: 14 }}>
              {s.label}
              <span style={{ color: '#4A453B' }}> — {s.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
