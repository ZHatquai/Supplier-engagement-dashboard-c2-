import { formatDate, routeLabel, statusLabel } from './format'

// The register's own five columns and nothing else. No flags, no flag count, no
// questionnaire answers, no EcoVadis link, no identity fields beyond the contact
// name, no resolution trail. product-spec.md Section 3, Export Arm.
const COLUMNS = [
  { header: 'Company', value: (r) => r.company_name },
  { header: 'Contact name', value: (r) => r.contact_name },
  { header: 'Route', value: (r) => routeLabel(r.route) },
  { header: 'Status', value: (r) => statusLabel(r.status) },
  { header: 'Date submitted', value: (r) => formatDate(r.created_at) },
]

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  // A leading =, +, -, or @ is treated as a formula by spreadsheet software.
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

export function buildCsv(rows) {
  const lines = [COLUMNS.map((c) => escapeCell(c.header)).join(',')]
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => escapeCell(c.value(row))).join(','))
  }
  return lines.join('\r\n')
}

export function downloadCsv(rows, filename) {
  // Browser only. There is no server function behind this export.
  const blob = new Blob(['﻿', buildCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function csvFilename(statusFilter, routeFilter) {
  const parts = ['supplier-register']
  if (statusFilter !== 'all') parts.push(statusFilter)
  if (routeFilter !== 'all') parts.push(routeFilter)
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${parts.join('-')}-${stamp}.csv`
}
