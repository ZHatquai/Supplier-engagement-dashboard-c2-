import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../lib/profiles'

const BASE_TABS = [
  { to: '/', label: 'Overview and Risk Flags' },
  { to: '/register', label: 'Supplier Register' },
]

const ADMIN_TAB = { to: '/users', label: 'User Management' }

// Preserves v1.0's behaviour: a submission or review page keeps the Overview tab
// marked, because both are reached from it.
function activeTab(pathname) {
  if (pathname.startsWith('/register')) return '/register'
  if (pathname.startsWith('/users')) return '/users'
  if (pathname.startsWith('/account')) return null
  return '/'
}

export default function AppShell({ children }) {
  const { email, role, isAdmin, profile, profileError, signOut, reloadProfile } = useAuth()
  const location = useLocation()
  const current = activeTab(location.pathname)

  // Role and admin state are read fresh on every navigation, so a change Admin
  // makes mid-session reaches this account on its very next move. The database
  // does the enforcing either way; this only keeps the screen honest.
  useEffect(() => {
    reloadProfile()
  }, [location.pathname, reloadProfile])

  // The User Management link is not rendered at all for a non-admin account —
  // not a disabled link, nothing in that space. Same principle as Procurement's
  // missing action area.
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS

  return (
    <div className="min-h-full flex flex-col">
      <header style={{ background: '#FFFFFF', borderBottom: '0.5px solid #B6B09F' }}>
        <div
          className="mx-auto flex flex-wrap items-center justify-between gap-4"
          style={{ maxWidth: 1120, padding: '16px 24px', width: '100%' }}
        >
          <Logo />
          <div className="flex items-center gap-4 flex-wrap">
            <span className="tc-label" style={{ letterSpacing: '0.08em', textTransform: 'none', fontSize: 12 }}>
              {email}
              {profile ? ` · ${roleLabel(role)}${isAdmin ? ' · Admin' : ''}` : ''}
            </span>
            <NavLink
              to="/account"
              className="tc-btn-secondary"
              style={{ padding: '7px 16px', fontSize: 11, textDecoration: 'none' }}
            >
              Change password
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              className="tc-btn-secondary"
              style={{ padding: '7px 16px', fontSize: 11 }}
            >
              Sign out
            </button>
          </div>
        </div>

        <nav
          className="mx-auto flex gap-0 overflow-x-auto"
          style={{ maxWidth: 1120, padding: '0 24px', width: '100%' }}
          aria-label="Sections"
        >
          {tabs.map((tab) => {
            const active = current === tab.to
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '12px 0',
                  marginRight: 32,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: active ? '#000000' : '#4A453B',
                  borderBottom: active ? '2px solid #000000' : '2px solid transparent',
                }}
              >
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      {profileError && (
        <div
          className="mx-auto w-full"
          style={{ maxWidth: 1120, padding: '16px 24px 0' }}
        >
          <p
            className="tc-body"
            style={{ fontSize: 14, color: '#C0392B', margin: 0, border: '0.5px solid #C0392B', padding: 12, background: '#FFFFFF' }}
          >
            Your role could not be read: {profileError}. Review actions and admin actions are refused
            until it can be.
          </p>
        </div>
      )}

      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1120, padding: '40px 24px 96px' }}>
        {children}
      </main>
    </div>
  )
}
