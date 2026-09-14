import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import StatusBadge from '../components/StatusBadge'
import { formatDate, routeLabel } from '../lib/format'
import { csvFilename, downloadCsv } from '../lib/csv'

const COLUMNS = [
  { id: 'company_name', label: 'Company' },
  { id: 'contact_name', label: 'Contact name' },
  { id: 'route', label: 'Route' },
  { id: 'status', label: 'Status' },
  { id: 'created_at', label: 'Date submitted' },
]

export default function Register() {
  const { rows, loading, error } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // Default on arrival is status = active. A counter click on the Overview arrives
  // with ?status=... and every other filter cleared.
  const status = params.get('status') || 'active'
  const route = params.get('route') || 'all'
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ column: 'created_at', dir: 'desc' })

  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value === 'active' && name === 'status') next.delete(name)
    else if (value === 'all' && name === 'route') next.delete(name)
    else next.set(name, value)
    setParams(next, { replace: true })
  }

  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true })
    setSearch('')
  }

  // The CSV honours the status and route filters and ignores the search box and
  // the sort, so it is computed from this list rather than from what is on screen.
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (status === 'all' || r.status === status) && (route === 'all' || r.route === route),
      ),
    [rows, status, route],
  )

  const displayed = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const searched = needle
      ? filtered.filter((r) => String(r.company_name || '').toLowerCase().includes(needle))
      : filtered

    const dir = sort.dir === 'asc' ? 1 : -1
    return [...searched].sort((a, b) => {
      const av = a[sort.column]
      const bv = b[sort.column]
      if (sort.column === 'created_at') {
        return (new Date(av).getTime() - new Date(bv).getTime()) * dir
      }
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { sensitivity: 'base' }) * dir
    })
  }, [filtered, search, sort])

  function toggleSort(column) {
    setSort((s) =>
      s.column === column
        ? { column, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { column, dir: column === 'created_at' ? 'desc' : 'asc' },
    )
  }

  if (loading) return <p className="tc-body">Loading submissions.</p>
  if (error) {
    return (
      <p className="tc-body" style={{ color: '#C0392B' }}>
        Could not load submissions. {error}
      </p>
    )
  }

  return (
    <section aria-labelledby="register-heading">
      <h1 id="register-heading" className="tc-h1" style={{ marginBottom: 8 }}>
        Supplier Register
      </h1>
      <p className="tc-body" style={{ color: '#4A453B', marginTop: 0, marginBottom: 32 }}>
        Every submission, at every status. Select a row to open it.
      </p>

      <div className="tc-card" style={{ marginBottom: 24 }}>
        <div className="flex flex-wrap gap-6 items-end">
          <div style={{ flex: '1 1 240px', minWidth: 200 }}>
            <label className="tc-label block" htmlFor="reg-search" style={{ marginBottom: 6 }}>
              Search company
            </label>
            <input
              id="reg-search"
              className="tc-input"
              type="search"
              value={search}
              placeholder="Part of a company name"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 170 }}>
            <label className="tc-label block" htmlFor="reg-status" style={{ marginBottom: 6 }}>Status</label>
            <select id="reg-status" className="tc-select" value={status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="needs_review">Needs review</option>
              <option value="superseded">Superseded</option>
            </select>
          </div>

          <div style={{ minWidth: 170 }}>
            <label className="tc-label block" htmlFor="reg-route" style={{ marginBottom: 6 }}>Route</label>
            <select id="reg-route" className="tc-select" value={route} onChange={(e) => setFilter('route', e.target.value)}>
              <option value="all">All routes</option>
              <option value="ecovadis">EcoVadis</option>
              <option value="questionnaire">Questionnaire</option>
            </select>
          </div>

          <button
            type="button"
            className="tc-btn-primary"
            disabled={filtered.length === 0}
            onClick={() => downloadCsv(filtered, csvFilename(status, route))}
          >
            Export CSV
          </button>
        </div>

        <p className="tc-body" style={{ fontSize: 13, color: '#4A453B', marginTop: 16, marginBottom: 0 }}>
          The export carries the five register columns for the {filtered.length}{' '}
          {filtered.length === 1 ? 'submission' : 'submissions'} matching the status and route filters.
          It ignores the search box and the sort.
        </p>
      </div>

      <p className="tc-label" style={{ marginBottom: 8 }}>
        Showing {displayed.length} of {rows.length} submissions
      </p>

      {displayed.length === 0 ? (
        <div>
          <p className="tc-body" style={{ color: '#4A453B' }}>No submissions match.</p>
          <button type="button" className="tc-btn-secondary" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tc-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const on = sort.column === col.id
                  return (
                    <th key={col.id} scope="col" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: on ? '#000000' : '#4A453B',
                        }}
                      >
                        {col.label}
                        <span aria-hidden="true" style={{ marginLeft: 6 }}>
                          {on ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => (
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
                  <td>{row.contact_name}</td>
                  <td style={{ color: '#4A453B' }}>{routeLabel(row.route)}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
