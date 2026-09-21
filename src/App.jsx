import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Register from './pages/Register'
import SupplierDetail from './pages/SupplierDetail'
import ReviewPage from './pages/ReviewPage'
import ChangePassword from './pages/ChangePassword'
import UserManagement from './pages/UserManagement'

// The review page is reached only from an action area, and Procurement never
// sees one. Typing the URL lands on the submission instead of a workflow that
// account cannot act in. Both review functions refuse it too, whatever the
// route does.
function ReviewRoute() {
  const { canReview } = useAuth()
  const { id } = useParams()
  if (!canReview) return <Navigate to={`/submission/${id}`} replace />
  return <ReviewPage />
}

// The panel and its nav link exist only for an account whose profiles.is_admin
// is true. This is the screen half of the refusal; set_user_role and the admin
// Netlify Function are the half that actually holds.
function AdminRoute() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <UserManagement />
}

// No route renders any data before a session exists. An unauthenticated visit to
// any URL lands on the login screen.
function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <main style={{ padding: 64 }}>
        <p className="tc-body">Loading.</p>
      </main>
    )
  }

  if (!session) return <Login />

  return (
    <DataProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/register" element={<Register />} />
          <Route path="/submission/:id" element={<SupplierDetail />} />
          <Route path="/review/:id" element={<ReviewRoute />} />
          <Route path="/account" element={<ChangePassword />} />
          <Route path="/users" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  )
}
