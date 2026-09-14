import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { companyKey } from '../lib/format'

const DataContext = createContext(null)

// Every number on screen is computed at page load from the current state of the
// table. Nothing runs on a timer.
export function DataProvider({ children }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setRows([])
    } else {
      setError(null)
      setRows(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const byId = useMemo(() => {
    const map = new Map()
    for (const row of rows) map.set(row.id, row)
    return map
  }, [rows])

  const byCompany = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      const key = companyKey(row.company_name)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)
    }
    return map
  }, [rows])

  const value = useMemo(
    () => ({
      rows,
      loading,
      error,
      refresh: load,
      getById: (id) => byId.get(id) ?? null,
      // Every submission from the same company, matched case-insensitively and
      // whitespace-insensitively, newest first.
      companyRows: (name) => (byCompany.get(companyKey(name)) ?? []),
    }),
    [rows, loading, error, load, byId, byCompany],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
