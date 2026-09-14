import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Register from './pages/Register'
import SupplierDetail from './pages/SupplierDetail'
import ReviewPage from './pages/ReviewPage'

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
          <Route path="/review/:id" element={<ReviewPage />} />
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
