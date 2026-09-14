import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import RoutePieChart from '../components/RoutePieChart'
import FlagIndicators, { FlagLegend } from '../components/FlagIndicators'
import { FLAGS, NOT_ASSESSABLE, flagSummary } from '../lib/flags'
import { routeLabel } from '../lib/format'

function SummaryNumber({ label, value }) {
  return (
    <div className="tc-card" style={{ padding: 24 }}>
      <p className="tc-label" style={{ margin: 0, marginBottom: 8 }}>{label}</p>
      <p
        className="tc-h1"
        style={{ fontSize: 44, lineHeight: 1.05, margin: 0 }}
      >
        {value}
      </p>
    </div>
  )
}

export default function Overview() {
  const { rows, loading, error } = useData()
  const navigate = useNavigate()

  // Sole Acid Lime use on this page: the needs-review counter, lime text inside a
  // black container (brand Pattern A). The flag board below uses none.
  const [sortDir, setSortDir] = useState('desc')
  const [selectedFlags, setSelectedFlags] = useState([])
  const [boardRoute, setBoardRoute] = useState('all')
  const [routeBeforeInterlock, setRouteBeforeInterlock] = useState('all')

  const interlocked = selectedFlags.length > 0
  const effectiveRoute = interlocked ? 'questionnaire' : boardRoute

  const totals = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active')
    return {
      total: active.length,
      ecovadis: active.filter((r) => r.route === 'ecovadis').length,
      questionnaire: active.filter((r) => r.route === 'questionnaire').length,
      needsReview: rows.filter((r) => r.status === 'needs_review').length,
      superseded: rows.filter((r) => r.status === 'superseded').length,
    }
  }, [rows])

  // The board covers active submissions only. Flags are computed only for rows
  // that are both route = questionnaire and status = active.
  const boardRows = useMemo(() => {
    const base = rows
      .filter(isActiveOnly)
      .filter((r) => effectiveRoute === 'all' || r.route === effectiveRoute)
      .map((r) => ({ row: r, summary: flagSummary(r) }))

    const filtered = interlocked
      ? base.filter(
          (entry) =>
            entry.summary.assessable &&
            // Several flags selected means a row must raise all of them.
            selectedFlags.every((id) => entry.summary.raisedIds.includes(id)),
        )
      : base

    // EcoVadis rows sort to the end regardless of sort direction, because they
    // carry no count to sort by.
    return filtered.sort((a, b) => {
      if (a.summary.assessable !== b.summary.assessable) return a.summary.assessable ? -1 : 1
      if (!a.summary.assessable) return a.row.company_name.localeCompare(b.row.company_name)
      if (a.summary.count !== b.summary.count) {
        return sortDir === 'desc' ? b.summary.count - a.summary.count : a.summary.count - b.summary.count
      }
      return a.row.company_name.localeCompare(b.row.company_name)
    })
  }, [rows, effectiveRoute, interlocked, selectedFlags, sortDir])

  function toggleFlag(id) {
    setSelectedFlags((current) => {
      const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
      if (current.length === 0 && next.length > 0) {
        // Entering the interlock: remember what to restore.
        setRouteBeforeInterlock(boardRoute)
      }
      if (next.length === 0) {
        setBoardRoute(routeBeforeInterlock)
      }
      return next
    })
  }

  function clearFlags() {
    setSelectedFlags([])
    setBoardRoute(routeBeforeInterlock)
  }

  if (loading) return <p className="tc-body">Loading submissions.</p>
  if (error) {
    return (
      <p className="tc-body" style={{ color: '#C0392B' }}>
        Could not load submissions. {error}
      </p>
    )
  }

  const empty = rows.length === 0

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Block 1 — Overview                                               */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="overview-heading">
        <h1 id="overview-heading" className="tc-h1" style={{ marginBottom: 8 }}>
          Overview
        </h1>
        <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 32 }}>
          Totals count active submissions only. Needs review and superseded are counted separately.
        </p>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <SummaryNumber label="Total submissions" value={totals.total} />
          <SummaryNumber label="EcoVadis" value={totals.ecovadis} />
          <SummaryNumber label="Questionnaire" value={totals.questionnaire} />
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 24 }}>
          <div className="tc-card-elevated">
            <p className="tc-label" style={{ margin: 0, marginBottom: 16 }}>Active submissions by route</p>
            <RoutePieChart
              segments={[
                { id: 'ecovadis', label: 'EcoVadis', value: totals.ecovadis },
                { id: 'questionnaire', label: 'Questionnaire', value: totals.questionnaire },
              ]}
            />
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <button
              type="button"
              disabled={totals.needsReview === 0}
              onClick={() => navigate('/register?status=needs_review')}
              className="text-left w-full"
              style={{
                background: '#000000',
                border: '0.5px solid #000000',
                padding: '18px 20px',
                cursor: totals.needsReview === 0 ? 'default' : 'pointer',
              }}
            >
              <span
                className="block"
                style={{ color: '#C8F135', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Needs review
              </span>
              <span className="block" style={{ color: '#F2F2F2', fontFamily: '"Playfair Display", Georgia, serif', fontSize: 34, lineHeight: 1.1 }}>
                {totals.needsReview}
              </span>
            </button>

            <button
              type="button"
              disabled={totals.superseded === 0}
              onClick={() => navigate('/register?status=superseded')}
              className="text-left w-full"
              style={{
                background: 'transparent',
                border: '0.5px solid #B6B09F',
                padding: '18px 20px',
                cursor: totals.superseded === 0 ? 'default' : 'pointer',
              }}
            >
              <span className="tc-label block" style={{ margin: 0 }}>Superseded</span>
              <span className="block" style={{ color: '#000000', fontFamily: '"Playfair Display", Georgia, serif', fontSize: 34, lineHeight: 1.1 }}>
                {totals.superseded}
              </span>
            </button>
          </div>
        </div>
      </section>

      <hr className="tc-divider-strong" />

      {/* ---------------------------------------------------------------- */}
      {/* Block 2 — Risk Flag Board                                        */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="board-heading">
        <h2 id="board-heading" className="tc-h2" style={{ marginBottom: 8 }}>
          Risk Flag Board
        </h2>
        <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 24 }}>
          Seven unweighted flags per active questionnaire submission. The output is a count out of 7,
          not a score or a grade.
        </p>

        <div className="tc-card" style={{ marginBottom: 24 }}>
          <p className="tc-label" style={{ margin: 0, marginBottom: 12 }}>Filter by flag</p>
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>
            {FLAGS.map((flag, i) => {
              const on = selectedFlags.includes(flag.id)
              return (
                <button
                  key={flag.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFlag(flag.id)}
                  title={flag.description}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    background: on ? '#000000' : 'transparent',
                    color: on ? '#F2F2F2' : '#000000',
                    border: on ? '0.5px solid #000000' : '0.5px solid #B6B09F',
                  }}
                >
                  {i + 1}. {flag.short}
                </button>
              )
            })}
            {interlocked && (
              <button type="button" onClick={clearFlags} className="tc-btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                Clear flags
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-6 items-end">
            <div style={{ minWidth: 180 }}>
              <label className="tc-label block" htmlFor="board-status" style={{ marginBottom: 6 }}>Status</label>
              <select id="board-status" className="tc-select" value="active" disabled>
                <option value="active">Active</option>
              </select>
            </div>
            <div style={{ minWidth: 180 }}>
              <label className="tc-label block" htmlFor="board-route" style={{ marginBottom: 6 }}>Route</label>
              <select
                id="board-route"
                className="tc-select"
                value={effectiveRoute}
                disabled={interlocked}
                onChange={(e) => setBoardRoute(e.target.value)}
              >
                <option value="all">All routes</option>
                <option value="ecovadis">EcoVadis</option>
                <option value="questionnaire">Questionnaire</option>
              </select>
            </div>
          </div>

          <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', marginTop: 16, marginBottom: 0 }}>
            {interlocked
              ? 'Only active questionnaire submissions carry flags, so status and route are fixed while a flag filter is selected.'
              : 'The flag board covers active submissions only. Use the register to reach every other status.'}
          </p>
        </div>

        {empty ? (
          <p className="tc-body" style={{ color: '#4A453B' }}>No submissions yet.</p>
        ) : boardRows.length === 0 ? (
          <div>
            <p className="tc-body" style={{ color: '#4A453B' }}>No submissions match these filters.</p>
            <button type="button" onClick={clearFlags} className="tc-btn-secondary">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: 12 }}>
              <FlagLegend />
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="tc-btn-secondary"
                style={{ padding: '8px 16px', fontSize: 11 }}
              >
                Flags {sortDir === 'desc' ? 'high to low' : 'low to high'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="tc-table">
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Route</th>
                    <th scope="col">Flags raised</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {boardRows.map(({ row, summary }) => (
                    <tr
                      key={row.id}
                      className="tc-row-clickable"
                      tabIndex={0}
                      onClick={() => navigate(`/submission/${row.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/submission/${row.id}`)
                        }
                      }}
                    >
                      <td style={{ fontWeight: 400 }}>{row.company_name}</td>
                      <td style={{ color: '#4A453B' }}>{routeLabel(row.route)}</td>
                      <td>
                        {summary.assessable ? (
                          <FlagIndicators flags={summary.flags} />
                        ) : (
                          <span className="tc-body" style={{ fontSize: 13, color: '#4A453B', fontStyle: 'italic' }}>
                            {NOT_ASSESSABLE}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {summary.assessable ? `${summary.count} of 7` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}

function isActiveOnly(row) {
  return row.status === 'active'
}
