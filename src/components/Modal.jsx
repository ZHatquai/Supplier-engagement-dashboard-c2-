import { useEffect, useRef } from 'react'

export default function Modal({ title, children, onClose, labelledBy = 'tc-modal-title' }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.55)', padding: '24px 16px' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full"
        style={{
          maxWidth: 620,
          background: '#FFFFFF',
          border: '0.5px solid #000000',
          padding: 24,
          marginTop: 48,
          outline: 'none',
        }}
      >
        <h2 id={labelledBy} className="tc-h2" style={{ fontSize: 26, marginBottom: 16 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
