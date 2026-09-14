import { NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/', label: 'Overview and Risk Flags', end: true },
  { to: '/register', label: 'Supplier Register', end: false },
]

export default function AppShell({ children }) {
  const { email, signOut } = useAuth()
  const location = useLocation()
  const onRegister = location.pathname.startsWith('/register')

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
            </span>
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
          {TABS.map((tab) => {
            const active = tab.end ? !onRegister : onRegister
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

      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1120, padding: '40px 24px 96px' }}>
        {children}
      </main>
    </div>
  )
}
