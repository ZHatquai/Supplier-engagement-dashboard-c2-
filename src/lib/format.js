// Dates render as DD Month YYYY, no ordinals, per the brand voice rules.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(value)} at ${hh}:${mm}`
}

export const ROUTE_LABELS = {
  ecovadis: 'EcoVadis',
  questionnaire: 'Questionnaire',
}

export const STATUS_LABELS = {
  active: 'Active',
  needs_review: 'Needs review',
  superseded: 'Superseded',
}

export function routeLabel(route) {
  return ROUTE_LABELS[route] || route || '—'
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—'
}

// The same normalisation Tool A uses for duplicate matching: case-insensitive and
// whitespace-insensitive on company_name.
export function companyKey(name) {
  return String(name || '').trim().toLowerCase()
}

export function plural(n, singular, pluralForm) {
  return n === 1 ? singular : pluralForm || `${singular}s`
}
