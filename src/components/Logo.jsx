export default function Logo({ inverted = false }) {
  const boxFill = inverted ? '#F2F2F2' : '#000000'
  const monogram = inverted ? '#000000' : '#F2F2F2'
  const wordmark = inverted ? '#F2F2F2' : '#000000'

  return (
    <span className="inline-flex items-center gap-3 select-none">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center"
        style={{ width: 28, height: 28, background: boxFill, color: monogram, fontWeight: 500, fontSize: 16, lineHeight: 1 }}
      >
        C
      </span>
      <span
        style={{
          color: wordmark,
          fontWeight: 300,
          fontSize: 14,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        The Corporate
      </span>
    </span>
  )
}
