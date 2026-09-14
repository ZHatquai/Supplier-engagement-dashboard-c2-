import { createClient } from '@supabase/supabase-js'

// Both values are VITE_-prefixed and therefore reach the browser. That is correct
// here and is the opposite of Tool A, where the equivalents are server-side only:
// the publishable key opens nothing on its own, because anon holds zero policies
// and zero grants on submissions. The service role key is never used by this tool.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configError =
  !url || !publishableKey
    ? 'Supabase is not configured. VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set as environment variables before the build runs. Vite reads them in at build time, so setting them after a build does not fix an existing bundle.'
    : null

export const supabase = configError
  ? null
  : createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // No signup UI exists in this tool, and public signup is disabled in
        // Supabase. Accounts are created by the builder in the dashboard.
        detectSessionInUrl: false,
      },
    })
